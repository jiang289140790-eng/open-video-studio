# Prompts

| Field | Value |
|---|---|
| Unique ID | PROMPT-README-001 |
| Version | 0.1.0 |
| Status | Active |
| Owner | AI Engineering Lead |
| Dependencies | OVSB-001, DOC-STD-001, AI-INDEX-001 |
| Referenced By | AI-INDEX-001 |

## Purpose

Store reusable prompts, prompt templates, prompt evaluations, and prompt version notes used by the AI engine.

## Requirements

- Production prompts must reference an AI engine document.
- Prompt files must include intended inputs, outputs, constraints, and evaluation criteria.
- Prompt changes that affect product behavior require updated documentation.

## Acceptance Criteria

- AI behavior can be reviewed without searching implementation code.
- Prompt versions can be traced to product and AI engine requirements.

## Future Plan

- Add prompt registry.
- Add prompt evaluation template.
- Add safety and refusal pattern references.

## AI Context

Do not introduce production AI behavior through prompts alone. Reference the owning AI and product documents.
