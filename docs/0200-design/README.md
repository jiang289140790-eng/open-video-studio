# 0200 Design

| Field | Value |
|---|---|
| Unique ID | UX-INDEX-001 |
| Version | 0.2.0 |
| Status | Active |
| Owner | Design Lead |
| Dependencies | OVSB-001, DOC-STD-001, PRD-INDEX-001, PB-001, DS-001 |
| Referenced By | DOC-002 |
| Cross References | PB-001, PB-007, PB-008, DS-001, FE-INDEX-001 |

## Purpose

Own the permanent design language, design system rules, interaction standards, accessibility expectations, and future design specifications for Open Video Studio.

## Requirements

- Design decisions must reference product requirements.
- Accessibility requirements must be documented before UI implementation.
- Reusable patterns should be documented once and referenced by pages or features.
- Design system documents use `DS-*` permanent IDs.
- This folder defines design language only; it must not contain CSS, Tailwind, React, or framework implementation.

## Design System

- [DS-001 Design Philosophy](001-design-philosophy.md)
- [DS-002 Design Principles](002-design-principles.md)
- [DS-003 Brand Guidelines](003-brand-guidelines.md)
- [DS-004 Color System](004-color-system.md)
- [DS-005 Typography](005-typography.md)
- [DS-006 Spacing System](006-spacing-system.md)
- [DS-007 Grid System](007-grid-system.md)
- [DS-008 Iconography](008-iconography.md)
- [DS-009 Animation System](009-animation-system.md)
- [DS-010 Component Library](010-component-library.md)
- [DS-011 Responsive System](011-responsive-system.md)
- [DS-012 Accessibility](012-accessibility.md)
- [DS-013 Dark Mode](013-dark-mode.md)
- [DS-014 Design Tokens](014-design-tokens.md)
- [DS-015 Design Checklist](015-design-checklist.md)

## Acceptance Criteria

- Frontend work can identify the correct UX source document.
- User journeys and interface states are clear before implementation.
- Design language decisions are documented before UI implementation.

## Future Plan

- Add detailed page design specs.
- Add editor interaction model.
- Add component-specific behavior specs.
- Add design token implementation contracts after engineering stack decisions.

## AI Context

Use this folder for experience rules, design language, and interaction decisions before creating page or component specs.
