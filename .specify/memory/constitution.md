<!--
  Sync Impact Report
  ─────────────────────────────────────────────────
  Version change: 1.0.0 → 1.1.0 (principle expansion)
  Modified principles:
    - III. Dark-Mode-Only UI → III. System-Adaptive High-Contrast UI
      (now follows device setting with manual toggle; high contrast
      in both light and dark modes)
  Added sections: (none)
  Removed sections: (none)
  Templates checked:
    ✅ .specify/templates/plan-template.md — no conflicts
    ✅ .specify/templates/spec-template.md — no conflicts
    ✅ .specify/templates/tasks-template.md — no conflicts
  Propagated changes:
    ✅ specs/001-fp30x-custom-controller/spec.md — FR-010 updated
    ✅ specs/001-fp30x-custom-controller/quickstart.md — note #5 updated
  Follow-up TODOs: none
-->

# FP-30X Custom Controller Constitution

## Core Principles

### I. Offline-First & Hardware-Authoritative

The app MUST function entirely offline after installation. No
network requests, accounts, or cloud services are permitted for
core functionality. The Roland FP-30X MIDI Implementation document
(v1.00, Aug 2021) is the single authoritative source for all
documented MIDI behavior. Any capability not in that document MUST
be treated as undocumented and isolated to Phase 3 research.

- All tone catalogs, UI assets, and configuration data MUST be
  bundled in the app — no runtime downloads.
- BLE is the sole external I/O channel; it connects only to the
  FP-30X, never to the internet.
- If the piano's observed behavior contradicts the MIDI
  Implementation document, file a research note but do NOT alter
  production message sequences without explicit user approval.

### II. One-Way State Injector

The app operates as a **write-only control surface**. It MUST NOT
assume it can read-back the piano's current state. The app maintains
its own internal state mirror (`PerformanceState`) and pushes MIDI
commands outward.

- Every user action that affects the piano MUST produce an explicit
  MIDI message — no silent state assumptions.
- On initial connection, the app MUST apply the user's default
  preset (if set) to synchronize the piano to a known state.
- On reconnection after a connection drop, the app MUST NOT
  auto-apply any preset — the user decides whether to re-sync.
- Queued tone selections (made while disconnected) MUST be sent
  automatically when the connection is established, and the UI MUST
  show a "pending" state indicator until confirmed.

### III. System-Adaptive High-Contrast UI

The app MUST follow the device's system appearance setting
(light or dark mode) by default. A manual toggle MUST allow the
user to override this and lock to light or dark independently
of the system setting.

- **Dark mode**: Base background MUST be absolute black
  (`#000000`). All UI surfaces derive from this anchor.
- **Light mode**: Base background MUST be pure white (`#FFFFFF`)
  with deep, saturated foreground colors for contrast.
- Text and interactive elements MUST meet WCAG AA contrast ratios
  in both modes. High contrast is non-negotiable regardless of
  the active theme.
- The theme preference (system / light / dark) MUST be persisted
  locally and restored on next launch.
- The device screen MUST NOT auto-lock while the app is in the
  foreground (wake lock required).
- Haptic feedback MUST accompany destructive or significant
  gestures (e.g., long-press to favorite).
- The UI MUST be designed iPhone-first with adaptive layouts that
  scale gracefully to iPad: 2-column card grids on iPhone,
  3–4 columns on iPad.

### IV. MIDI Protocol Fidelity

Every MIDI message the app sends MUST exactly match the sequences
defined in the FP-30X MIDI Implementation document.

- Tone selection MUST send: CC 0 (Bank Select MSB) → CC 32
  (Bank Select LSB) → Program Change, all on MIDI channel 1.
- GM2 mode MUST be activated with GM2 System On SysEx
  (`F0 7E 7F 09 03 F7`) and the app MUST wait ≥ 50 ms before
  sending any subsequent message.
- BLE MIDI packets MUST include proper timestamp headers per the
  BLE MIDI specification.
- FP-30X device-specific SysEx messages (Phase 3) MUST use the
  Roland manufacturer ID (`41H`) with the correct device family
  bytes (`19H 03H`). Universal SysEx messages (Phase 3) MUST use
  the appropriate `7E`/`7F` IDs and formats as defined by the MIDI
  specification and are exempt from the Roland manufacturer ID
  requirement.
- Rapid user input (e.g., fast tone tapping) MUST be debounced so
  only the last selection is sent.

### V. Phased Delivery

The project follows a strict three-phase roadmap. Each phase is
independently deliverable and MUST NOT introduce dependencies on
later phases.

- **Phase 1 (MVP)**: BLE connection + built-in tone browser
  (65 tones) + GM2 browser (256 tones) + favorites + presets.
- **Phase 2**: Live performance controls (Volume CC 7, Reverb
  CC 91, Chorus CC 93, Pan CC 10, Expression CC 11).
- **Phase 3**: SysEx deep controls + reverse engineering research.
- Data models MUST use nullable fields for future-phase parameters
  (e.g., `volume: number?` in Preset) — no Phase 2 code in
  Phase 1, but schema extensibility MUST be planned.
- A feature spec, plan, and task breakdown MUST exist before any
  implementation begins for a phase.

### VI. Feature-Module Architecture

Source code MUST be organized by feature domain, not by technical
layer. Each feature module is a self-contained vertical slice.

- Top-level `src/features/` contains one directory per domain:
  `connection/`, `tones/`, `gm2/`, `favorites/`, `presets/`
  (Phase 2 adds `controls/`).
- Each feature module owns its screens, components, and hooks.
- Shared infrastructure lives in `src/services/` (MIDI encoding,
  BLE packet handling) and `src/store/` (Zustand stores).
- Static data (tone catalogs) lives in `src/data/`.
- Theme tokens (colors, spacing, typography) live in `src/theme/`.
- Cross-feature imports MUST go through the shared layer, never
  reach into another feature's internal files.

### VII. Simplicity & YAGNI

Start with the simplest implementation that satisfies the current
phase's requirements. Reject speculative complexity.

- No state management beyond Zustand + MMKV unless a concrete
  scaling problem is demonstrated.
- No generic UI component library — build custom components
  tailored to the app's dark-mode card grid design.
- No abstraction layers (repositories, DAOs, service locators)
  unless justified by a documented complexity violation.
- If a simpler alternative exists, the complex approach MUST be
  justified in the plan's Complexity Tracking table.

## Technology Constraints

The following stack decisions are locked for the project's
lifetime unless a constitution amendment explicitly changes them.

| Layer | Decision | Rationale |
|-------|----------|-----------|
| Framework | React Native (TypeScript) | Cross-platform, iOS-first with future Android |
| BLE | `react-native-ble-plx` + custom MIDI parser | No production-ready RN BLE MIDI lib exists |
| Storage | MMKV (`react-native-mmkv`) | Synchronous, fast, encrypts if needed |
| State | Zustand + MMKV persist middleware | Lightweight, TS-native, no boilerplate |
| Navigation | `@react-navigation/bottom-tabs` | Industry standard, lazy init |
| Wake Lock | `react-native-keep-awake` | Single-purpose, minimal |
| Haptics | `react-native-haptic-feedback` | iOS Taptic Engine support |
| Target | iOS 15+ (iPhone primary, iPad adaptive) | Matches FP-30X user base |

- All MIDI message construction MUST be in pure TypeScript
  (no native modules) unless JS-bridge latency is measured and
  proven unacceptable.
- Third-party dependencies MUST be actively maintained (last
  commit < 6 months or > 1 k GitHub stars).

## Development Workflow

1. **Spec-Driven Development**: Every feature begins with a
   specification (`spec.md`) containing user stories, acceptance
   scenarios, and functional requirements. No code is written
   before the spec is approved.
2. **Plan Before Code**: A technical plan (`plan.md`) with research
   (`research.md`), data model (`data-model.md`), and quickstart
   (`quickstart.md`) MUST be produced and reviewed before
   implementation.
3. **Task Breakdown**: Implementation follows a structured task
   list (`tasks.md`) organized by user story, enabling independent
   delivery of each story.
4. **Constitution Check Gate**: The plan template includes a
   mandatory Constitution Check section. Every plan MUST verify
   compliance with these principles before research begins and
   again after design is complete.
5. **Physical Device Testing**: BLE MIDI features MUST be tested
   on a physical iOS device connected to a real FP-30X. Simulator-
   only testing is NOT acceptable for BLE functionality.
6. **Commit Discipline**: Commit after each completed task or
   logical group. Each commit message references the task ID
   (e.g., `T001`, `T015`).

## Governance

This constitution is the supreme governing document for the
FP-30X Custom Controller project. All development decisions,
code reviews, and architectural choices MUST comply with these
principles.

- **Amendments** require: (1) a documented rationale, (2) user
  approval, and (3) an updated Sync Impact Report at the top of
  this file.
- **Versioning** follows semantic versioning: MAJOR for principle
  removals/redefinitions, MINOR for new principles or expanded
  guidance, PATCH for clarifications and wording fixes.
- **Compliance Review**: Every plan MUST include a Constitution
  Check section verifying alignment. Violations MUST be logged in
  the Complexity Tracking table with explicit justification.
- **Complexity Justification**: Any deviation from the simplicity
  principle (Principle VII) MUST document: (a) the violation,
  (b) why it is needed, and (c) why the simpler alternative was
  rejected.

**Version**: 1.1.0 | **Ratified**: 2026-04-01 | **Last Amended**: 2026-04-01
