# Open Video Studio

| Field | Value |
|---|---|
| Unique ID | OVSB-001 |
| Version | 0.5.0 |
| Status | Active |
| Owner | CTO / Lead Software Architect |
| Dependencies | DOC-STD-001, ID-REG-001, TASK-001, TASK-DONE-STD-001, REF-001, DOC-LIFE-001, OWNERS-001, KNOW-001, CHANGELOG-001 |
| Referenced By | All project documents and tasks |

## Purpose

Open Video Studio is a long-term AI SaaS platform for professional video creation, editing, automation, and publishing. This repository starts as the company operating system: the source of truth for product, design, engineering, AI, data, growth, security, operations, and roadmap decisions.

No business feature, UI, API, schema, automation, or infrastructure work should begin before its documentation exists and is linked from the relevant source-of-truth documents.

## Project Vision

Build an AI-native video studio that helps creators, teams, agencies, and businesses produce high-quality video workflows with speed, consistency, and creative control. The product should evolve like durable infrastructure: modular, observable, secure, and designed for years of iteration.

## Architecture

The platform will be documented as a set of coordinated domains:

- Product: requirements, user journeys, pricing, permissions, credits, and lifecycle rules.
- Design: brand, interaction model, design system, accessibility, and UX principles.
- Frontend: application architecture, routes, state, components, editor surfaces, and client performance.
- Backend: services, domain logic, authorization, queues, billing, and integrations.
- AI Engine: model orchestration, prompt systems, generation pipelines, evaluation, and safety controls.
- Database: canonical data model, migrations, retention, auditability, and data contracts.
- API: public and internal contracts, versioning, errors, auth, rate limits, and webhooks.
- SEO and Growth: acquisition systems, content strategy, lifecycle loops, referrals, and conversion measurement.
- Automation: background jobs, internal agents, operational workflows, and scheduled processes.
- DevOps: environments, deployments, observability, incident response, cost control, and reliability.
- Analytics: event taxonomy, funnels, metrics, dashboards, and experimentation.
- Security: threat model, privacy, compliance, secrets, abuse prevention, and access control.
- Roadmap: phases, milestones, decision records, and sequencing.

## Current Production Stack

- Frontend: React, Vite, and the current MVP static product surface under `apps/web/`.
- Backend foundation: TypeScript service layer with Supabase connection foundation.
- Database target: Supabase PostgreSQL.
- Storage target: Supabase Storage.
- Authentication target: Supabase Auth.
- Current AI execution: local fake/stub worker foundations.
- Future AI providers: ComfyUI, OpenAI, Gemini, Fal.ai, RunPod, and local API adapters.

## Local Setup

Install dependencies:

```bash
npm install
```

Run the Vite development server:

```bash
npm run dev
```

Build the TypeScript services and Vite frontend:

```bash
npm run build
```

Run the full test suite:

```bash
npm run test
```

Verify Supabase configuration:

```bash
npm run verify:supabase
```

Verify local and GitHub Pages production auth configuration:

```bash
npm run verify:production-config
```

Validate the MVP Admin backend after applying the Supabase migration and deploying the `admin` Edge Function:

```bash
npm run verify:admin
```

Validate the basic Supabase login loop used for small user testing:

```bash
npm run verify:auth-basic
```

Run the full MVP readiness gate for the four production loops:

```bash
npm run verify:mvp
```

This orchestrates email/password auth, OAuth readiness reporting, demo credit purchase, user generation / asset / history / share, Admin operations, and AI fallback health. Email/password auth is the small-test login gate; social OAuth remains a launch-readiness blocker until providers are configured. Use the cost-bearing real provider probe only when intentionally testing external generation:

```bash
npm run verify:mvp -- --real-ai
```

Probe the real video generation path directly only when intentionally testing cost-bearing external generation:

```bash
npm run verify:real-ai -- --video
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in values from the existing Supabase project. Never commit `.env.local` or any real secret.

Required for live Supabase verification:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Required for GitHub Pages social login build:

- GitHub Variable: `VITE_SUPABASE_URL`
- GitHub Secret: `VITE_SUPABASE_ANON_KEY`
- GitHub Variable: `VITE_TELEGRAM_BOT_USERNAME`
- GitHub Variable: `VITE_TELEGRAM_AUTH_URL`

Production OAuth setup is documented in [Production Auth Configuration](docs/1500-operations/001-production-auth-config.md).

Optional server-only key:

- `SUPABASE_SERVICE_ROLE_KEY`

Future AI provider keys are intentionally empty until provider integrations are enabled.

## GitHub Readiness

This repository is initialized with Git, MIT license, Git-friendly ignores, line-ending rules, environment templates, and production build/test scripts. Generated output, local data, dependencies, and secrets are ignored.

## Rules

1. Documentation comes first.
2. Every document must follow `DOC-STD-001`.
3. Every stable concept must receive a permanent ID from `ID-REG-001`.
4. Do not duplicate canonical logic. Reference the owning document instead using `REF-001`.
5. Every task must reference its Product Spec, API contract, database contract, and acceptance criteria where applicable.
6. Tasks move through `tasks/10-backlog`, `tasks/20-todo`, `tasks/30-doing`, and `tasks/40-done`.
7. Architecture changes require a decision record before implementation.
8. Security, privacy, observability, and analytics are part of the feature definition, not afterthoughts.
9. AI agents must read the relevant documents before proposing or changing implementation.
10. Every completed task must follow `TASK-DONE-STD-001`.
11. Production-impacting work must define testing, deployment, rollback, observability, security, disaster recovery, and cost impact before implementation.
12. Keep the workspace maintainable: small documents, clear ownership, explicit dependencies, portable links, and clear lifecycle state.

## How To Continue Development

Start with [docs/SUMMARY.md](docs/SUMMARY.md), then read the domain index relevant to the work. Create or update the required spec documents before creating a task. Only then move a task into `tasks/20-todo`.

Recommended sequence for new work:

1. Define the product behavior in `docs/0100-product/`.
2. Define required UX in `docs/0200-design/` and `docs/0300-frontend/`.
3. Define backend, AI, database, and API contracts in their domain folders.
4. Define analytics, security, SEO, growth, automation, and DevOps impacts as needed.
5. Define testing, deployment, rollback, observability, disaster recovery, and cost impact where applicable.
6. Create a task from `templates/task-template.md`.
7. Implement only after the task has complete references and acceptance criteria.

## How AI Agents Should Work

AI agents are contributors to the engineering system, not shortcuts around it.

Before doing work, an agent must:

- Read this README.
- Read [docs/SUMMARY.md](docs/SUMMARY.md).
- Read [docs/0000-overview/DOC-STD-001-document-standard.md](docs/0000-overview/DOC-STD-001-document-standard.md).
- Read [docs/0000-overview/ID-REG-001-numbering-system.md](docs/0000-overview/ID-REG-001-numbering-system.md).
- Read [docs/0000-overview/REF-001-cross-reference-standard.md](docs/0000-overview/REF-001-cross-reference-standard.md).
- Read [docs/0000-overview/DOC-LIFE-001-document-lifecycle.md](docs/0000-overview/DOC-LIFE-001-document-lifecycle.md).
- Read [docs/0000-overview/OWNERS-001-ownership-model.md](docs/0000-overview/OWNERS-001-ownership-model.md).
- Read [docs/0000-overview/KNOW-001-knowledge-management.md](docs/0000-overview/KNOW-001-knowledge-management.md).
- Read [docs/0000-overview/TASK-DONE-STD-001-completion-standard.md](docs/0000-overview/TASK-DONE-STD-001-completion-standard.md).
- Read all documents referenced by the current task.

Agents must not create product code without documented requirements. If documentation is missing, the correct output is a document or task update, not implementation.

## Requirements

- Maintain the directory structure defined in `OVSB-001`.
- Keep docs as the source of truth.
- Preserve IDs permanently once assigned.
- Use references instead of copying repeated business logic.
- Keep tasks traceable from idea to implementation to acceptance.
- Update [CHANGELOG.md](CHANGELOG.md) every time a task is completed.
- Run a broken-reference check before calling a task complete.
- Suggest architecture improvements when work reveals a better structure.
- Do not call production-impacting work ready until testing, deployment, observability, security, recovery, and cost impact are addressed.
- Keep paths portable and Git-friendly.
- Keep document ownership and lifecycle status current.
- Never commit API keys, Supabase service role keys, local `.env` files, generated builds, local SQLite files, or private exports.

## AI Asset MCP Server

This repo includes a local MCP server for AI model and workflow asset management. It lets Codex / Claude Code search Civitai and Hugging Face, download model files, install them into ComfyUI, and record the local asset inventory in SQLite.

Build and start it:

```bash
npm run build:server
npm run mcp:ai-assets
```

Local configuration lives in `.env.local` or the MCP client environment:

```env
CIVITAI_API_TOKEN=
HF_TOKEN=
LIBLIB_ACCESS_KEY=
LIBLIB_SECRET_KEY=
COMFYUI_ROOT=D:/ComfyUI
ASSET_STORAGE_DIR=.data/ai-assets/downloads
AI_ASSET_DB_PATH=.data/ai-assets/assets.sqlite
```

Available MCP tools:

- `search_assets`: search Civitai or Hugging Face assets.
- `get_asset_detail`: inspect versions, files, trigger words, tags, license, and download URLs.
- `download_asset`: stream a selected file into local asset storage and record it in SQLite.
- `install_to_comfyui`: copy a downloaded file into the correct ComfyUI directory.
- `list_local_assets`: query the local asset inventory.
- `remove_asset`: delete local files and mark the asset removed.
- `call_liblib_template`: submit a Liblib template generation request and record the run.

Example prompt for Codex / Claude Code:

```text
Search Civitai for high-download, high-rated Flux realistic LoRA models, pick the best one, download it, and install it to ComfyUI/models/loras.
```

The first version treats GitHub as a reserved provider and treats Liblib as a template-generation provider, not a free model-download source.

## Acceptance Criteria

- The workspace contains the required directories.
- The workspace contains document standards, numbering rules, reference rules, lifecycle rules, ownership rules, task workflow rules, and completion rules.
- The README explains vision, architecture, rules, continuation process, and AI agent behavior.
- Every seeded document follows the required metadata and content structure.

## Future Plan

- Add product requirement documents for the initial MVP.
- Add architecture decision records.
- Add canonical data model documents.
- Add API contract templates and examples.
- Add security and analytics checklists for release readiness.

## AI Context

This is the first source-of-truth document for Open Video Studio. Future agents should treat it as binding unless a newer approved architecture decision explicitly changes part of it.
