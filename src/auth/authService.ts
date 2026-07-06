import { createHash, randomBytes } from "node:crypto";
import type { SqliteDatabase } from "../db/database.js";
import { AuditLog } from "../audit/auditLog.js";
import { UserRepository, type User } from "../users/userRepository.js";
import { AppError } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { addSecondsIso, nowIso } from "../shared/time.js";
import { hashPassword, verifyPassword } from "./password.js";

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: Omit<User, "passwordHash">;
}

export class AuthService {
  private readonly users: UserRepository;
  private readonly audit: AuditLog;

  constructor(
    private readonly db: SqliteDatabase,
    private readonly sessionTtlSeconds = 60 * 60 * 24 * 7,
  ) {
    this.users = new UserRepository(db);
    this.audit = new AuditLog(db);
  }

  signUp(input: { email: string; password: string; displayName: string }): AuthSession {
    const user = this.users.create({
      email: input.email,
      passwordHash: hashPassword(input.password),
      displayName: input.displayName,
    });
    this.audit.record({
      actorType: "user",
      actorId: user.id,
      action: "auth.signup",
      targetType: "user",
      targetId: user.id,
      outcome: "success",
      riskClassification: "medium",
    });
    return this.createSession(user);
  }

  login(input: { email: string; password: string }): AuthSession {
    const user = this.users.findByEmail(input.email);
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      this.audit.record({
        actorType: "system",
        action: "auth.login",
        targetType: "user",
        outcome: "failure",
        riskClassification: "medium",
        metadata: { email: input.email.toLowerCase() },
      });
      throw new AppError("AUTH_INVALID_CREDENTIALS", "Invalid credentials.", 401);
    }
    if (user.accountStatus !== "active") {
      throw new AppError("AUTH_ACCOUNT_DISABLED", "Account is not active.", 403);
    }
    this.users.touchLastActive(user.id);
    this.audit.record({
      actorType: "user",
      actorId: user.id,
      action: "auth.login",
      targetType: "user",
      targetId: user.id,
      outcome: "success",
      riskClassification: "low",
    });
    return this.createSession(user);
  }

  authenticate(token: string): Omit<User, "passwordHash"> {
    const tokenHash = hashToken(token);
    const row = this.db.prepare(`
      SELECT user_id, expires_at, revoked_at
      FROM sessions
      WHERE token_hash = ?
    `).get(tokenHash) as { user_id: string; expires_at: string; revoked_at: string | null } | undefined;

    if (!row || row.revoked_at || row.expires_at <= nowIso()) {
      throw new AppError("AUTH_SESSION_EXPIRED", "Session is expired or invalid.", 401);
    }
    return stripPasswordHash(this.users.getById(row.user_id));
  }

  logout(token: string): void {
    this.db.prepare("UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL").run(nowIso(), hashToken(token));
  }

  private createSession(user: User): AuthSession {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = addSecondsIso(this.sessionTtlSeconds);
    this.db.prepare(`
      INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(createId("session"), user.id, hashToken(token), expiresAt, nowIso());

    return {
      token,
      expiresAt,
      user: stripPasswordHash(user),
    };
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function stripPasswordHash(user: User): Omit<User, "passwordHash"> {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
