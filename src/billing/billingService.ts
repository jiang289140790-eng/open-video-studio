import type { SqliteDatabase } from "../db/database.js";
import { AuditLog } from "../audit/auditLog.js";
import { CreditLedger } from "../credits/creditLedger.js";
import { AppError } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";

export interface Order {
  id: string;
  accountId: string;
  userId: string;
  providerReference?: string;
  orderType: string;
  status: "completed" | "failed" | "pending";
  currency: string;
  amountCents: number;
  creditsGranted: number;
  creditTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface OrderRow {
  id: string;
  account_id: string;
  user_id: string;
  provider_reference: string | null;
  order_type: string;
  status: Order["status"];
  currency: string;
  amount_cents: number;
  credits_granted: number;
  credit_transaction_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export class BillingService {
  private readonly credits: CreditLedger;
  private readonly audit: AuditLog;

  constructor(private readonly db: SqliteDatabase) {
    this.credits = new CreditLedger(db);
    this.audit = new AuditLog(db);
  }

  purchaseCredits(input: {
    userId: string;
    credits: number;
    amountCents: number;
    currency?: string;
    providerReference?: string;
  }): Order {
    if (input.credits <= 0) {
      throw new AppError("BILLING_INVALID_CREDITS", "Credit purchase must grant a positive amount.");
    }
    if (input.amountCents <= 0) {
      throw new AppError("BILLING_INVALID_AMOUNT", "Order amount must be positive.");
    }

    const timestamp = nowIso();
    const id = createId("order");
    const creditTransaction = this.credits.grant({
      accountId: input.userId,
      userId: input.userId,
      amount: input.credits,
      sourceType: "order",
      sourceId: id,
      reason: "Credit purchase completed",
    });

    this.db.prepare(`
      INSERT INTO orders (
        id, account_id, user_id, provider_reference, order_type, status,
        currency, amount_cents, credits_granted, credit_transaction_id,
        created_at, updated_at, completed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.userId,
      input.userId,
      input.providerReference ?? null,
      "credit_purchase",
      "completed",
      input.currency ?? "USD",
      input.amountCents,
      input.credits,
      creditTransaction.id,
      timestamp,
      timestamp,
      timestamp,
    );

    this.audit.record({
      actorType: "user",
      actorId: input.userId,
      action: "billing.credit_purchase_completed",
      targetType: "order",
      targetId: id,
      outcome: "success",
      riskClassification: "medium",
      metadata: { credits: input.credits, amountCents: input.amountCents },
    });

    return this.getOrder(id, input.userId);
  }

  listOrders(userId: string): Order[] {
    const rows = this.db.prepare(`
      SELECT *
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId) as unknown as OrderRow[];
    return rows.map(mapOrder);
  }

  private getOrder(id: string, userId: string): Order {
    const row = this.db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(id, userId) as OrderRow | undefined;
    if (!row) {
      throw new AppError("ORDER_NOT_FOUND", "Order not found.", 404);
    }
    return mapOrder(row);
  }
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    accountId: row.account_id,
    userId: row.user_id,
    providerReference: row.provider_reference ?? undefined,
    orderType: row.order_type,
    status: row.status,
    currency: row.currency,
    amountCents: row.amount_cents,
    creditsGranted: row.credits_granted,
    creditTransactionId: row.credit_transaction_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
  };
}
