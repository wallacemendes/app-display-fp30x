# Implementation Plan: Code Review Remediation (FP-30X Controller v2)

**Branch**: `002-fp30x-controller-v2` | **Date**: 2026-04-05 | **Spec**: [spec.md](spec.md)
**Input**: Code review findings from [codereview.md](codereview.md) — 5 CRITICAL, 7 HIGH, 1 MEDIUM, 1 LOW issue across 14 findings.

## Summary

The v2 implementation has 89 tasks marked complete, but a static code review revealed that the app has **no service bootstrap wiring** — ConnectionService, PianoService, and their notification pipelines are never instantiated or connected. The entire bidirectional control surface is non-functional at runtime. Additionally, there are constitution layer violations (screens importing engine directly), unused NativeWind/Reusables mandates, protocol fidelity gaps (running status, CC/PC echoes), and incomplete feature implementations (import stub, missing reorder, tone selector drift).

This plan remediates all 14 findings in dependency order. Phase A (bootstrap) unblocks everything. Phases B–D are partially parallelizable. Phase E covers feature gaps. Phase F verifies quality.

## Technical Context

**Language/Version**: TypeScript 5.x on React Native 0.76+
**Primary Dependencies**: react-native-ble-plx, zustand, react-native-mmkv, nativewind (installed, unused), @react-navigation/material-top-tabs
**Storage**: MMKV (synchronous key-value)
**Testing**: Jest + React Native Testing Library
**Target Platform**: iOS 15+ (iPhone primary, iPad adaptive), landscape-only
**Project Type**: Mobile app (BLE MIDI controller)
**Performance Goals**: 60 FPS, < 200ms tone selection, < 500ms preset apply, < 5s BLE connect
**Constraints**: Offline-only, DT1 SysEx protocol, Roland model 0x28
**Scale/Scope**: 321 tones, ~30 source files, 5-phase roadmap

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-First & Protocol-Authoritative | PASS | No network calls. DT1/RQ1 protocol used throughout. |
| II. Bidirectional Control Surface | **FAIL — A1, A2, A3** | Service bootstrap missing. Engine never set on PianoService. RQ1 response parsing dead code. Notification pipeline disconnected. |
| III. Landscape Hardware-Synth UI | **FAIL — A5** | NativeWind installed but every screen uses inline StyleSheet.create. react-native-reusables not installed. LCD font (Orbitron) is bundled. |
| IV. DT1 SysEx Protocol Fidelity | **FAIL — A7** | Running status not reconstructed in framing.ts. CC/PC echoes ignored by parser. |
| V. Layered Architecture | **FAIL — A4** | PresetCard imports engine/fp30x/tones directly. QuickToneSlots imports engine/registry directly. PianoService imports from hooks/useChord. |
| VI. Phased Delivery | PASS | Phases are independent. No forward dependencies. |
| VII. Simplicity & Justified Complexity | PASS | No over-engineering detected. |

**Gate result**: FAIL — 4 principle violations. All addressed in remediation phases below.

### Post-Design Gate (re-check after Phase 1)

| Principle | Resolution |
|-----------|------------|
| II. Bidirectional Control Surface | Phase A wires bootstrap + engine + notifications + RQ1 response parsing. |
| III. Landscape Hardware-Synth UI | Phase C-1 migrates to NativeWind className props. Phase C-2 installs react-native-reusables. See Complexity Tracking for scope decision. |
| IV. DT1 SysEx Protocol Fidelity | Phase D adds running status reconstruction + CC/PC echo handling. |
| V. Layered Architecture | Phase B removes all cross-layer violations. |

**Gate result**: PASS (contingent on implementation of Phases A–D).

## Project Structure

### Documentation (this feature)

```text
specs/002-fp30x-controller-v2/
├── plan.md              # This file (remediation plan)
├── codereview.md        # Code review findings (14 issues)
├── research.md          # Phase 0 research (updated for remediation)
├── data-model.md        # Data model (updated with ServiceRegistry)
├── quickstart.md        # Quickstart (updated with bootstrap wiring)
├── contracts/           # Existing interface contracts
│   ├── piano-engine.ts
│   └── transport.ts
├── spec.md              # Feature specification (unchanged)
└── tasks.md             # Task breakdown (to be regenerated via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── App.tsx              # MODIFY: Add service bootstrap
│   ├── TabNavigator.tsx
│   └── bootstrap.ts         # NEW: Service initialization + wiring
│
├── screens/
│   ├── display/
│   │   ├── DisplayScreen.tsx # MODIFY: NativeWind migration
│   │   ├── ToneSelector.tsx  # MODIFY: Category +/- behavior fix
│   │   ├── StatusBar.tsx     # MODIFY: NativeWind migration
│   │   ├── ChordDisplay.tsx
│   │   └── QuickToneSlots.tsx # MODIFY: Remove engine import
│   ├── presets/
│   │   ├── PresetsScreen.tsx  # MODIFY: Add reorder UI + real import
│   │   └── PresetCard.tsx     # MODIFY: Remove engine import
│   └── pads/
│       └── PadsScreen.tsx
│
├── engine/fp30x/
│   ├── parser.ts            # MODIFY: Running status + CC/PC echoes
│   └── FP30XEngine.ts       # (parseStateResponse already implemented)
│
├── transport/ble/
│   ├── BleTransport.ts      # MODIFY: Characteristic property validation
│   └── framing.ts           # MODIFY: Running status reconstruction
│
├── services/
│   ├── PianoService.ts      # MODIFY: Remove hook import, fix ChordService access
│   ├── ConnectionService.ts  # MODIFY: Wire PianoService + notifications + RQ1 parsing + interval cleanup
│   └── PresetService.ts     # MODIFY: Real import flow + conflict UI support
│
├── hooks/
│   ├── usePiano.ts          # (wiring fixed by bootstrap)
│   ├── useConnection.ts     # (wiring fixed by bootstrap)
│   ├── useTones.ts          # MODIFY: Category +/- applies first tone
│   ├── useChord.ts          # MODIFY: Export ChordService directly (not via hook)
│   └── usePresets.ts        # MODIFY: Add reorder action
│
├── store/
│   └── performanceStore.ts  # (pendingTone wiring fixed in Phase E)
│
└── theme/                   # MODIFY: NativeWind-compatible tokens
```

**Structure Decision**: Existing v2 layered architecture is correct. Remediation adds `src/app/bootstrap.ts` for service initialization. No structural changes.

## Remediation Phases

### Phase A: Service Bootstrap & Wiring (CRITICAL — A1, A2, A13)

**Rationale**: The entire app is non-functional at runtime because services are never instantiated. This unblocks every other fix.

**Scope**:
1. Create `src/app/bootstrap.ts` — instantiates BleTransport, ConnectionService, PianoService. Wires:
   - `connectionService.setPianoService(pianoService)`
   - `connectionService.setNotificationHandler(event => pianoService.handleNotification(event))`
   - Hook setters: `setConnectionService(connectionService)`, `setPianoService(pianoService)`
2. Update `App.tsx` — call `bootstrap()` before rendering (in a `useEffect` or module-level init).
3. Wire RQ1 response parsing in `ConnectionService.readInitialState()`:
   - After receiving RQ1 response bytes, call `engine.parseStateResponse(bytes)` → get `NotificationEvent[]`
   - Dispatch each event to `pianoService.handleNotification(event)` to populate stores
4. Fix `ConnectionService` reconnect monitor lifecycle (A13):
   - Persist interval handle as class field
   - Clear in `disconnect()` and `destroy()` paths
   - Prevent accumulation of intervals on repeated connect cycles

**Dependencies**: None — first phase.

**Verification**: After Phase A, the hook actions (usePiano, useConnection) should no longer early-return. Services are wired. Notifications flow from BLE → parser → stores → UI.

---

### Phase B: Layer Violation Fixes (CRITICAL — A4)

**Rationale**: Constitutional Principle V mandates strict layer boundaries. Three violations exist.

**Scope**:
1. **PresetCard.tsx** (line 17): Replace `import {fp30xToneCatalog} from '../../engine/fp30x/tones'` with a hook or service call. Options:
   - Add a `resolveToneName(category, indexHigh, indexLow)` helper to `useTones` hook
   - Pass resolved tone name as prop from parent (PresetsScreen already has access via hook)
2. **QuickToneSlots.tsx** (line 14): Replace `import {getFP30XEngine} from '../../engine/registry'` with hook access. Use `useTones` to resolve tone objects from IDs.
3. **PianoService.ts** (line 14): Replace `import {getChordService} from '../hooks/useChord'` with direct import from `services/ChordService`. Move `getChordService()` lazy singleton pattern from `useChord.ts` into `ChordService.ts` itself (as a static factory or module-level singleton).

**Dependencies**: None (can be parallel with Phase A).

**Verification**: `grep -r "from '../../engine" src/screens/` and `grep -r "from '../hooks" src/services/` return zero results.

---

### Phase C: NativeWind & Reusables Migration (CRITICAL — A5)

**Rationale**: Constitution Principle III (NativeWind) and VII (Reusables) mandate these. Current code uses inline StyleSheet.create throughout.

**Decision**: See [research.md](research.md) §1 for migration strategy. This is the largest remediation effort. A phased migration is recommended:

**Phase C-1: Foundation** (blocks C-2)
1. Install `react-native-reusables` (missing from package.json)
2. Verify NativeWind configuration (tailwind.config.js, babel plugin, global.css) is functional
3. Convert theme tokens (`colors.ts`, `typography.ts`) to NativeWind-compatible format (CSS variables + Tailwind extend)
4. Create shared NativeWind utility classes for the hardware synth aesthetic

**Phase C-2: Screen Migration** (incremental)
1. Migrate `StatusBar.tsx` — highest-visibility component, good pilot
2. Migrate `DisplayScreen.tsx` — main screen
3. Migrate `ToneSelector.tsx`, `StepperControl.tsx`
4. Migrate `PresetCard.tsx`, `PresetsScreen.tsx`
5. Migrate modals (TempoModal, BeatModal, VolumeOverlay, TonePickerModal, CategoryPickerModal)
6. Migrate remaining screens (PadsScreen, ChordDisplay, QuickToneSlots)

**Dependencies**: C-1 must complete before C-2. C overall is independent of A/B.

**Verification**: No `StyleSheet.create` in migrated files. All styling uses `className` props. `react-native-reusables` in package.json.

---

### Phase D: Protocol Fidelity (HIGH — A6, A7)

**Rationale**: Constitution Principle IV mandates complete MIDI parsing fidelity.

**Scope**:

**D-1: BLE Characteristic Validation (A6)**
- In `BleTransport.ts` after service/characteristic discovery: validate that the MIDI characteristic has `isWritableWithoutResponse` and `isNotifiable` properties
- If validation fails, reject the connection with a descriptive error
- Note: The BLE MIDI service/characteristic UUIDs are standardized — hardcoding is correct. The issue is only about property validation.

**D-2: Running Status Reconstruction (A7)**
- In `framing.ts` `stripBleFraming()`: track the last status byte. When a data byte (< 0x80) appears where a status byte is expected, reuse the last status byte.
- In `parser.ts` `parseNotification()`: accept messages reconstructed with running status (no parser change needed if framing handles it).

**D-3: CC/PC Echo Handling (A7)**
- In `parser.ts`: add handling for Control Change (0xB0) and Program Change (0xC0) messages.
- CC echoes: Log for diagnostics. Constitution says CC doesn't work for control, but echoes may still arrive — they should be parsed (not ignored) and logged as `unknown` or a new `ccEcho` event type.
- PC echoes: Same approach — parse and surface as events, don't discard silently.

**Dependencies**: Independent of A/B/C.

**Verification**: Unit tests for running status reconstruction (wrap two messages with running status → both parse correctly). CC/PC echo test in parser.test.ts.

---

### Phase E: Feature Completeness (HIGH — A8, A9, A10, A11)

**Rationale**: Multiple features are partially implemented or stubbed.

**E-1: Pending Tone Queue (A8)**
- In `useTones` or `PianoService.changeTone()`: check connection status before sending DT1.
- If disconnected: call `performanceStore.setPendingTone(tone)` instead of sending.
- In `ConnectionService` on successful connect: check `performanceStore.pendingTone`, if present → send via PianoService → clear pending.
- UI: Show pending indicator on ToneSelector when `pendingTone` is not null.

**E-2: Tone Selector Behavior (A9)**
- In `useTones.ts` `nextCategory()`/`prevCategory()`: after updating `lastCategoryIndex`, select and apply the first tone of the new category via `selectTone()`.
- In `TonePickerModal.tsx`: replace single-category number search with cross-category `searchByNumber()` from the hook.
- Implement "Set as default tone" action (currently placeholder): persist selected tone ID in `appSettingsStore` and apply on first connect if no default preset is set.

**E-3: Import/Export Completion (A10)**
- Replace import stub in `PresetsScreen.tsx` with real file picker (see research.md §5 for library choice).
- Update `PresetService.importPresets()` to return conflict list instead of auto-suffixing.
- Add conflict resolution UI: modal with rename/replace/skip options per conflicting preset.
- Align export workflow: currently uses Share API (message-style). Spec says "shareable file" — Share API is acceptable (it can share files). No change needed unless user requests explicit file-save.

**E-4: Preset Reordering (A11)**
- Add `reorderPresets(fromIndex, toIndex)` action to `presetsStore.ts` (update sortOrder values).
- Expose `reorderPresets` in `usePresets.ts` hook.
- Add reorder UI to `PresetsScreen.tsx`: drag handles or long-press-to-reorder via a list library (e.g., `react-native-draggable-flatlist`).

**Dependencies**: E-1 depends on Phase A (bootstrap must be wired). E-2, E-3, E-4 can start in parallel.

**Verification**: Physical device test for pending queue. Unit tests for category +/- behavior. File import round-trip test. Reorder persists after app restart.

---

### Phase F: Quality & Verification (HIGH/LOW — A12, A14)

**F-1: Missing ConnectionService Tests (A12)**
- Create `__tests__/services/ConnectionService.test.ts`
- Test: scan timeout, connect flow (engine selection, notification subscription, RQ1 dispatch), disconnect cleanup, auto-reconnect logic (max retries, delay), interval handle cleanup, first-connection-vs-reconnection distinction.
- Mock: BleTransport (transport.send, transport.subscribe), engine registry.

**F-2: Spec Ambiguity Cleanup (A14)**
- Replace TODO placeholders in `spec.md` Phase 5 wording with concrete acceptance details or explicit "out-of-scope" notes.

**F-3: Task Status Reconciliation**
- Re-verify all 89 tasks against actual implementation state.
- Unmark tasks that were marked complete without corresponding artifacts (T030 ConnectionService test, T084 import, quality tasks T086-T089 per review).
- After remediation phases complete, re-mark as truly complete.

**Dependencies**: F-1 depends on Phase A (bootstrap must exist to test against). F-2 and F-3 are independent.

---

## Execution Order

```
Phase A (Bootstrap)  ──────────────────────→ Phase E-1 (Pending Queue)
       │                                              │
       └──→ Phase F-1 (ConnectionService Tests)       │
                                                      │
Phase B (Layer Violations) ───────────────→ Phase E-2 (Tone Selector)
                                                      │
Phase C-1 (NativeWind Foundation) → C-2 (Migration)   │
                                                      │
Phase D (Protocol Fidelity) ──────────────→ All ──────┘
                                                      │
Phase E-3 (Import/Export) ─────────────────────────────┤
Phase E-4 (Preset Reorder) ────────────────────────────┤
                                                      │
                                           Phase F-2/F-3 (Cleanup)
```

**Parallelism**: Phases A, B, C-1, D can all start simultaneously (different files, no dependencies). Phase E starts after A completes. Phase F is last.

## Complexity Tracking

> Constitution Check violations and their justifications.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `bootstrap.ts` new file | Services need a single initialization point before React renders. Module-level singletons with setter functions create the current null-everywhere problem. | Inline initialization in App.tsx useEffect is simpler but mixes lifecycle concerns with UI. A dedicated bootstrap module is cleaner and testable. |
| NativeWind migration (Phase C) is incremental, not big-bang | Migrating ~15 screen/component files simultaneously risks regression and is hard to review. | Big-bang migration was rejected because it blocks all other work and makes individual changes hard to verify. Incremental is slower but safer. |
| `react-native-draggable-flatlist` new dependency for reorder (Phase E-4) | React Native has no built-in drag-to-reorder. Manual gesture handling with react-native-gesture-handler is complex and error-prone. | Manual implementation rejected because it requires significant gesture math, accessibility support, and animation work — unjustified complexity for a list reorder. |
