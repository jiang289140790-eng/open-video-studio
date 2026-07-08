import type { SqliteDatabase } from "../db/database.js";
import { AuditLog } from "../audit/auditLog.js";
import { AppError } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";

export interface CreditTransaction {
  id: string;
  accountId: string;
  userId?: string;
  sourceType: string;
  sourceId?: string;
  amount: number;
  balanceImpact: number;
  operationCategory: string;
  status: "posted" | "reversed" | "expired";
  reason: string;
  createdAt: string;
}

interface CreditTransactionRow {
  id: string;
  account_id: string;
  user_id: string | null;
  source_type: string;
  source_id: string | null;
  amount: number;
  balance_impact: number;
  operation_category: string;
  status: CreditTransaction["status"];
  reason: string;
  created_at: string;
}

export class CreditLedger {
  private readonly audit: AuditLog;

  constructor(private readonly db: SqliteDatabase) {
    this.audit = new AuditLog(db);
  }

  grant(input: {
    accountId: string;
    userId?: string;
    amount: number;
    sourceType: string;
    sourceId?: string;
    reason: string;
  }): CreditTransaction {
    if (input.amount <= 0) {
      throw new AppError("CREDITS_INVALID_AMOUNT", "Grant amount must be positive.");
    }
    return this.record({
      ...input,
      balanceImpact: input.amount,
      operationCategory: "grant",
    });
  }

  consume(input: {
    accountId: string;
    userId?: string;
    amount: number;
    sourceType: string;
    sourceId?: string;
    operationCategory: string;
    reason: string;
  }): CreditTransaction {
    if (input.amount <= 0) {
      throw new AppError("CREDITS_INVALID_AMOUNT", "Consumption amount must be positive.");
    }
    const balance = this.getBalance(input.accountId);
    if (balance < input.amount) {
      throw new AppError("CREDITS_INSUFFICIENT_BALANCE", "Insufficient credits.", 402);
    }
    return this.record({
      ...input,
      balanceImpact: -input.amount,
    });
  }

  refund(input: {
    accountId: string;
    userId?: string;
    amount: number;
    sourceType: string;
    sourceId?: string;
    reason: string;
  }): CreditTransaction {
    if (input.amount <= 0) {
      throw new AppError("CREDITS_INVALID_AMOUNT", "Refund amount must be positive.");
    }
    if (input.sourceId && this.hasPostedRefund(input.accountId, input.sourceType, input.sourceId)) {
      throw new AppError("CREDITS_REFUND_ALREADY_POSTED", "Credits were already refunded for this source.");
    }
    return this.record({
      ...input,
      balanceImpact: input.amount,
      operationCategory: "refund",
    });
  }

  getBalance(accountId: string): number {
    const row = this.db.prepare(`
      SELECT COALESCE(SUM(balance_impact), 0) AS balance
      FROM credit_transactions
      WHERE account_id = ? AND status = 'posted'
    `).get(accountId) as { balance: number };
    return row.balance;
  }

  list(accountId: string): CreditTransaction[] {
    const rows = this.db.prepare(`
      SELECT *
      FROM credit_transactions
      WHERE account_id = ?
      ORDER BY created_at DESC
    `).all(accountId) as unknown as CreditTransactionRow[];
    return rows.map(mapTransaction);
  }

  hasPostedRefund(accountId: string, sourceType: string, sourceId: string): boolean {
    const row = this.db.prepare(`
      SELECT id
      FROM credit_transactions
      WHERE account_id = ?
        AND source_type = ?
        AND source_id = ?
        AND operation_category = 'refund'
        AND status = 'posted'
      LIMIT 1
    `).get(accountId, sourceType, sourceId) as { id: string } | undefined;
    return Boolean(row);
  }

  private record(input: {
    accountId: string;
    userId?: string;
    amount: number;
    balanceImpact: number;
    sourceType: string;
    sourceId?: string;
    operationCategory: string;
    reason: string;
  }): CreditTransaction {
    const transaction: CreditTransaction = {
      id: createId("credit"),
      accountId: input.accountId,
      userId: input.userId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      amount: input.amount,
      balanceImpact: input.balanceImpact,
      operationCategory: input.operationCategory,
      status: "posted",
      reason: input.reason,
      createdAt: nowIso(),
    };

    this.db.prepare(`
      INSERT INTO credit_transactions (
        id, account_id, user_id, source_type, source_id, amount,
        balance_impact, operation_category, status, reason, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      transaction.id,
      transaction.accountId,
      transaction.userId ?? null,
      transaction.sourceType,
      transaction.sourceId ?? null,
      transaction.amount,
      transaction.balanceImpact,
      transaction.operationCategory,
      transaction.status,
      transaction.reason,
      transaction.createdAt,
    );

    this.audit.record({
      actorType: input.userId ? "user" : "system",
      actorId: input.userId,
      action: input.balanceImpact > 0 ? "credits.grant" : "credits.consume",
      targetType: "credit_transaction",
      targetId: transaction.id,
      outcome: "success",
      riskClassification: "medium",
      metadata: { accountId: input.accountId, balanceImpact: input.balanceImpact },
    });

    return transaction;
  }
}

function mapTransaction(row: CreditTransactionRow): CreditTransaction {
  return {
    id: row.id,
    accountId: row.account_id,
    userId: row.user_id ?? undefined,
    sourceType: row.source_type,
    sourceId: row.source_id ?? undefined,
    amount: row.amount,
    balanceImpact: row.balance_impact,
    operationCategory: row.operation_category,
    status: row.status,
    reason: row.reason,
    createdAt: row.created_at,
  };
}
