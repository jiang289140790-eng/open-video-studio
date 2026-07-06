import type { SqliteDatabase } from "../db/database.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";

export interface AuditLogEntry {
  actorType: "user" | "system" | "service";
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  outcome: "success" | "failure";
  riskClassification?: "low" | "medium" | "high";
  metadata?: Record<string, unknown>;
}

export class AuditLog {
  constructor(private readonly db: SqliteDatabase) {}

  record(entry: AuditLogEntry): string {
    const id = createId("audit");
    this.db.prepare(`
      INSERT INTO audit_logs (
        id, actor_type, actor_id, action, target_type, target_id,
        outcome, risk_classification, metadata_json, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      entry.actorType,
      entry.actorId ?? null,
      entry.action,
      entry.targetType,
      entry.targetId ?? null,
      entry.outcome,
      entry.riskClassification ?? "low",
      JSON.stringify(entry.metadata ?? {}),
      nowIso(),
    );
    return id;
  }
}
