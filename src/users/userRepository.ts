import type { SqliteDatabase } from "../db/database.js";
import { AppError, assertNonEmpty } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  accountStatus: "active" | "disabled" | "deleted";
  role: "user" | "admin";
  locale: string;
  timezone: string;
  onboardingState: string;
  createdAt: string;
  updatedAt: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url: string | null;
  account_status: User["accountStatus"];
  role: User["role"];
  locale: string;
  timezone: string;
  onboarding_state: string;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  constructor(private readonly db: SqliteDatabase) {}

  create(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    locale?: string;
    timezone?: string;
  }): User {
    assertNonEmpty(input.email, "USER_EMAIL_REQUIRED", "Email is required.");
    assertNonEmpty(input.passwordHash, "USER_PASSWORD_HASH_REQUIRED", "Password hash is required.");
    assertNonEmpty(input.displayName, "USER_DISPLAY_NAME_REQUIRED", "Display name is required.");

    const timestamp = nowIso();
    const id = createId("user");
    try {
      this.db.prepare(`
        INSERT INTO users (
          id, email, password_hash, display_name, locale, timezone, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        input.email.toLowerCase(),
        input.passwordHash,
        input.displayName,
        input.locale ?? "en",
        input.timezone ?? "UTC",
        timestamp,
        timestamp,
      );
    } catch (error) {
      if (String(error).includes("UNIQUE")) {
        throw new AppError("USER_EMAIL_TAKEN", "A user already exists for this email.", 409);
      }
      throw error;
    }

    return this.getById(id);
  }

  getById(id: string): User {
    const row = this.db.prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL").get(id) as UserRow | undefined;
    if (!row) {
      throw new AppError("USER_NOT_FOUND", "User not found.", 404);
    }
    return mapUser(row);
  }

  findByEmail(email: string): User | undefined {
    const row = this.db.prepare("SELECT * FROM users WHERE email = ? AND deleted_at IS NULL").get(email.toLowerCase()) as UserRow | undefined;
    return row ? mapUser(row) : undefined;
  }

  touchLastActive(userId: string): void {
    const timestamp = nowIso();
    this.db.prepare("UPDATE users SET last_active_at = ?, updated_at = ? WHERE id = ?").run(timestamp, timestamp, userId);
  }

  updateProfile(userId: string, input: {
    displayName?: string;
    avatarUrl?: string;
    locale?: string;
    timezone?: string;
    onboardingState?: string;
  }): User {
    const current = this.getById(userId);
    const timestamp = nowIso();
    this.db.prepare(`
      UPDATE users
      SET display_name = ?, avatar_url = ?, locale = ?, timezone = ?, onboarding_state = ?, updated_at = ?
      WHERE id = ?
    `).run(
      input.displayName ?? current.displayName,
      input.avatarUrl ?? current.avatarUrl ?? null,
      input.locale ?? current.locale,
      input.timezone ?? current.timezone,
      input.onboardingState ?? current.onboardingState,
      timestamp,
      userId,
    );
    return this.getById(userId);
  }
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    accountStatus: row.account_status,
    role: row.role,
    locale: row.locale,
    timezone: row.timezone,
    onboardingState: row.onboarding_state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
