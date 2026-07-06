import type { SqliteDatabase } from "../db/database.js";
import { AuditLog } from "../audit/auditLog.js";
import { AppError, assertNonEmpty } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export interface Workspace {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: "active" | "removed";
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  ownerUserId: string;
  name: string;
  description: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceRow {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  status: Workspace["status"];
  created_at: string;
  updated_at: string;
}

interface WorkspaceMemberRow {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  status: WorkspaceMember["status"];
  created_at: string;
  updated_at: string;
}

interface ProjectRow {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  name: string;
  description: string;
  status: Project["status"];
  created_at: string;
  updated_at: string;
}

const projectAccessRoles: WorkspaceRole[] = ["owner", "admin", "editor", "viewer"];
const projectWriteRoles: WorkspaceRole[] = ["owner", "admin", "editor"];

export class PlatformService {
  private readonly audit: AuditLog;

  constructor(private readonly db: SqliteDatabase) {
    this.audit = new AuditLog(db);
  }

  createWorkspace(input: { ownerUserId: string; name: string; slug?: string }): Workspace {
    assertNonEmpty(input.name, "WORKSPACE_NAME_REQUIRED", "Workspace name is required.");
    const timestamp = nowIso();
    const id = createId("workspace");
    const slug = input.slug ? slugify(input.slug) : `${slugify(input.name)}-${id.slice(-8)}`;

    try {
      this.db.prepare(`
        INSERT INTO workspaces (id, owner_user_id, name, slug, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, input.ownerUserId, input.name.trim(), slug, timestamp, timestamp);
    } catch (error) {
      if (String(error).includes("UNIQUE")) {
        throw new AppError("WORKSPACE_SLUG_TAKEN", "Workspace slug is already taken.", 409);
      }
      throw error;
    }

    this.addMember({
      workspaceId: id,
      actorUserId: input.ownerUserId,
      userId: input.ownerUserId,
      role: "owner",
    });

    this.audit.record({
      actorType: "user",
      actorId: input.ownerUserId,
      action: "workspace.created",
      targetType: "workspace",
      targetId: id,
      outcome: "success",
      riskClassification: "medium",
    });

    return this.getWorkspace(id, input.ownerUserId);
  }

  addMember(input: { workspaceId: string; actorUserId: string; userId: string; role: WorkspaceRole }): WorkspaceMember {
    if (input.actorUserId !== input.userId) {
      this.assertWorkspaceRole(input.workspaceId, input.actorUserId, ["owner", "admin"]);
    }

    const timestamp = nowIso();
    const id = createId("member");
    this.db.prepare(`
      INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(workspace_id, user_id) DO UPDATE SET
        role = excluded.role,
        status = 'active',
        removed_at = NULL,
        updated_at = excluded.updated_at
    `).run(id, input.workspaceId, input.userId, input.role, timestamp, timestamp);

    this.audit.record({
      actorType: "user",
      actorId: input.actorUserId,
      action: "workspace.member_added",
      targetType: "workspace",
      targetId: input.workspaceId,
      outcome: "success",
      riskClassification: "medium",
      metadata: { userId: input.userId, role: input.role },
    });

    return this.getMember(input.workspaceId, input.userId);
  }

  createProject(input: { workspaceId: string; ownerUserId: string; name: string; description?: string }): Project {
    assertNonEmpty(input.name, "PROJECT_NAME_REQUIRED", "Project name is required.");
    this.assertWorkspaceRole(input.workspaceId, input.ownerUserId, projectWriteRoles);

    const timestamp = nowIso();
    const id = createId("project");
    this.db.prepare(`
      INSERT INTO projects (id, workspace_id, owner_user_id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.workspaceId,
      input.ownerUserId,
      input.name.trim(),
      input.description ?? "",
      timestamp,
      timestamp,
    );

    this.audit.record({
      actorType: "user",
      actorId: input.ownerUserId,
      action: "project.created",
      targetType: "project",
      targetId: id,
      outcome: "success",
      riskClassification: "medium",
      metadata: { workspaceId: input.workspaceId },
    });

    return this.getProject(id, input.ownerUserId);
  }

  getWorkspace(id: string, requesterUserId: string): Workspace {
    this.assertWorkspaceRole(id, requesterUserId, projectAccessRoles);
    const row = this.db.prepare("SELECT * FROM workspaces WHERE id = ? AND archived_at IS NULL").get(id) as WorkspaceRow | undefined;
    if (!row) {
      throw new AppError("WORKSPACE_NOT_FOUND", "Workspace not found.", 404);
    }
    return mapWorkspace(row);
  }

  getProject(id: string, requesterUserId: string): Project {
    const row = this.db.prepare("SELECT * FROM projects WHERE id = ? AND archived_at IS NULL").get(id) as ProjectRow | undefined;
    if (!row) {
      throw new AppError("PROJECT_NOT_FOUND", "Project not found.", 404);
    }
    this.assertWorkspaceRole(row.workspace_id, requesterUserId, projectAccessRoles);
    return mapProject(row);
  }

  listProjects(workspaceId: string, requesterUserId: string): Project[] {
    this.assertWorkspaceRole(workspaceId, requesterUserId, projectAccessRoles);
    const rows = this.db.prepare(`
      SELECT *
      FROM projects
      WHERE workspace_id = ? AND archived_at IS NULL
      ORDER BY updated_at DESC
    `).all(workspaceId) as unknown as ProjectRow[];
    return rows.map(mapProject);
  }

  assertProjectAccess(projectId: string, requesterUserId: string, write = false): Project {
    const project = this.getProject(projectId, requesterUserId);
    this.assertWorkspaceRole(project.workspaceId, requesterUserId, write ? projectWriteRoles : projectAccessRoles);
    return project;
  }

  private getMember(workspaceId: string, userId: string): WorkspaceMember {
    const row = this.db.prepare(`
      SELECT *
      FROM workspace_members
      WHERE workspace_id = ? AND user_id = ? AND status = 'active'
    `).get(workspaceId, userId) as WorkspaceMemberRow | undefined;
    if (!row) {
      throw new AppError("WORKSPACE_MEMBER_NOT_FOUND", "Workspace member not found.", 404);
    }
    return mapMember(row);
  }

  private assertWorkspaceRole(workspaceId: string, userId: string, roles: WorkspaceRole[]): WorkspaceMember {
    const row = this.db.prepare(`
      SELECT *
      FROM workspace_members
      WHERE workspace_id = ? AND user_id = ? AND status = 'active'
    `).get(workspaceId, userId) as WorkspaceMemberRow | undefined;
    if (!row || !roles.includes(row.role)) {
      throw new AppError("WORKSPACE_FORBIDDEN", "You do not have access to this workspace.", 403);
    }
    return mapMember(row);
  }
}

function slugify(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "workspace";
}

function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMember(row: WorkspaceMemberRow): WorkspaceMember {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
