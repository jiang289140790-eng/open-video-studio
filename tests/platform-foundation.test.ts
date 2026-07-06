import test from "node:test";
import assert from "node:assert/strict";
import {
  AppError,
  AuthService,
  PlatformService,
  createMigratedDatabase,
} from "../src/index.js";

test("platform foundation creates workspace, membership, projects, and enforces access", () => {
  const db = createMigratedDatabase();
  const auth = new AuthService(db);
  const platform = new PlatformService(db);

  const owner = auth.signUp({
    email: "owner-platform@example.com",
    password: "correct horse battery staple",
    displayName: "Owner",
  });
  const editor = auth.signUp({
    email: "editor-platform@example.com",
    password: "correct horse battery staple",
    displayName: "Editor",
  });
  const outsider = auth.signUp({
    email: "outsider-platform@example.com",
    password: "correct horse battery staple",
    displayName: "Outsider",
  });

  const workspace = platform.createWorkspace({
    ownerUserId: owner.user.id,
    name: "Studio Workspace",
    slug: "studio-workspace",
  });
  assert.equal(workspace.ownerUserId, owner.user.id);
  assert.equal(workspace.slug, "studio-workspace");

  platform.addMember({
    workspaceId: workspace.id,
    actorUserId: owner.user.id,
    userId: editor.user.id,
    role: "editor",
  });

  const project = platform.createProject({
    workspaceId: workspace.id,
    ownerUserId: editor.user.id,
    name: "Launch Campaign",
    description: "Reusable campaign content workflow.",
  });
  assert.equal(project.workspaceId, workspace.id);
  assert.equal(project.ownerUserId, editor.user.id);

  const ownerProjects = platform.listProjects(workspace.id, owner.user.id);
  assert.equal(ownerProjects.length, 1);
  assert.equal(ownerProjects[0].id, project.id);

  const readableProject = platform.assertProjectAccess(project.id, owner.user.id);
  assert.equal(readableProject.name, "Launch Campaign");

  const writableProject = platform.assertProjectAccess(project.id, editor.user.id, true);
  assert.equal(writableProject.id, project.id);

  assert.throws(
    () => platform.getProject(project.id, outsider.user.id),
    (error) => error instanceof AppError && error.code === "WORKSPACE_FORBIDDEN",
  );
});

test("workspace viewers can read projects but cannot create projects", () => {
  const db = createMigratedDatabase();
  const auth = new AuthService(db);
  const platform = new PlatformService(db);

  const owner = auth.signUp({
    email: "viewer-owner@example.com",
    password: "correct horse battery staple",
    displayName: "Owner",
  });
  const viewer = auth.signUp({
    email: "viewer@example.com",
    password: "correct horse battery staple",
    displayName: "Viewer",
  });

  const workspace = platform.createWorkspace({
    ownerUserId: owner.user.id,
    name: "Viewer Workspace",
  });
  const project = platform.createProject({
    workspaceId: workspace.id,
    ownerUserId: owner.user.id,
    name: "Readable Project",
  });

  platform.addMember({
    workspaceId: workspace.id,
    actorUserId: owner.user.id,
    userId: viewer.user.id,
    role: "viewer",
  });

  assert.equal(platform.getProject(project.id, viewer.user.id).id, project.id);

  assert.throws(
    () => platform.createProject({
      workspaceId: workspace.id,
      ownerUserId: viewer.user.id,
      name: "Forbidden Project",
    }),
    (error) => error instanceof AppError && error.code === "WORKSPACE_FORBIDDEN",
  );
});
