# Tasks: FP-30X Controller v2 — Code Review Remediation

**Input**: Design documents from `/specs/002-fp30x-controller-v2/`
**Prerequisites**: plan.md (remediation plan), codereview.md (14 findings), spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: TDD is mandatory per constitution. Test tasks included for pure-logic changes (parser, framing, service wiring).

**Organization**: Tasks grouped by remediation story (RS1–RS6), mapped to code review findings (A1–A14).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which remediation story (RS1–RS6) — Setup/Foundational/Polish have no story label
- **Finding**: Code review finding ID (A1–A14) addressed by each task

---

## Phase 1: Setup (Dependencies)

**Purpose**: Install missing dependencies required by the constitution and remediation plan.

- [ ] T001 [P] Install `react-native-reusables` — constitutional mandate (A5), run `npm install react-native-reusables && cd ios && pod install`
- [ ] T002 [P] Install `react-native-document-picker` for preset import flow (A10) — run `npm install react-native-document-picker && cd ios && pod install`
- [ ] T003 [P] Install `react-native-draggable-flatlist` for preset reorder UI (A11) — run `npm install react-native-draggable-flatlist && cd ios && pod install`

---

## Phase 2: Foundational — Service Bootstrap (A1, A2)

**Purpose**: Create the missing service initialization layer. BLOCKS all runtime functionality.

**⚠️ CRITICAL**: The entire app is non-functional at runtime without this phase. No hook actions work, no notifications flow, no DT1 commands are sent.

- [x] T004 Create `src/app/bootstrap.ts` — instantiate BleTransport, PianoService, ConnectionService. Wire `connectionService.setPianoService(pianoService)`, `connectionService.setNotificationHandler(event => pianoService.handleNotification(event))`, `setConnectionService(connectionService)` (from `useConnection.ts`), `setPianoService(pianoService)` (from `usePiano.ts`). Guard with `initialized` flag for idempotency.
- [x] T005 Update `App.tsx` — call `bootstrap()` at module level (before component definition, not inside useEffect) so services are wired before any React component mounts. Import from `./bootstrap`.
- [x] T006 Wire engine hand-off in `src/services/ConnectionService.ts` — after successful connect and engine selection (`this.engine = getFP30XEngine()`), call `this.pianoServiceRef?.setEngine(this.engine)` so PianoService can build DT1 messages via the engine.
- [x] T007 Fix reconnect monitor interval leak in `src/services/ConnectionService.ts` (A13) — persist the connection monitor `setInterval` handle as a class field (`private monitorIntervalId: ReturnType<typeof setInterval> | null`). Clear it in `disconnect()` and `destroy()` methods. Prevent accumulation on repeated connect cycles.
- [x] T008 Verify bootstrap wiring end-to-end — add temporary `console.log` in `PianoService.handleNotification()` and `usePiano` action wrappers. Confirm they fire (not early-returning on null). Remove logs after verification.

**Checkpoint**: Services instantiated, wired, and hooks have non-null references. Hook actions no longer silently no-op. Notification pipeline connected: BLE → ConnectionService → PianoService → stores → UI.

---

## Phase 3: RS1 — Bidirectional State Sync (A3)

**Goal**: Wire RQ1 response parsing so the initial state read on connect actually populates the UI. Currently, RQ1 requests are sent but responses are not decomposed.

**Independent Test**: Connect to FP-30X. After connection, status bar shows actual piano tempo/volume/metronome. Tone selector shows actual active tone. No stale/default values.

**Finding**: A3 (Bidirectional State Sync — CRITICAL)

### Tests

- [x] T009 [P] [RS1] Write RQ1 response parsing test in `__tests__/engine/fp30x/parser.test.ts` — test `parseStateResponse()` with a mock performance block DT1 response. Verify it decomposes into individual events: tone, volume, voiceMode, metronome params. Test tempo block response → tempo event. Test empty/malformed response → empty array.

### Implementation

- [x] T010 [RS1] Implement RQ1 response routing in `src/services/ConnectionService.ts` — add `private pendingStateRead: boolean = false` flag. After sending RQ1 requests in `readInitialState()`, set `pendingStateRead = true`. In `handleRawNotification()`: if `pendingStateRead` is true AND the incoming DT1 base address matches a requested block (performance `01 00 02 00` or tempo `01 00 03 09`), route through `this.engine.parseStateResponse(bytes)` → get `NotificationEvent[]` → dispatch each via `this.onNotification(event)`. After both blocks are processed, set `pendingStateRead = false`.
- [x] T011 [RS1] Wire initial state events into stores — verify that `PianoService.handleNotification()` correctly routes all event types from `parseStateResponse()` to `performanceStore` setters (tone → `setActiveTone`, volume → `setVolume`, tempo → `setTempo`, metronome → `setMetronomeOn/Beat/Pattern/Volume/Tone`, voiceMode → `setVoiceMode`). No code changes expected if PianoService.handleNotification is already complete — just verify the flow.

**Checkpoint**: On connect, RQ1 responses populate stores. UI shows real piano state. Hardware-authoritative principle (II) is satisfied.

---

## Phase 4: RS2 — Layer Violation Fixes (A4)

**Goal**: Remove all cross-layer import violations to comply with Constitution Principle V.

**Independent Test**: `grep -r "from '../../engine" src/screens/` returns zero results. `grep -r "from '../hooks" src/services/` returns zero results.

**Finding**: A4 (Constitution Layering — CRITICAL)

### Implementation

- [x] T012 [P] [RS2] Fix `src/screens/presets/PresetCard.tsx` (line 17) — remove `import {fp30xToneCatalog} from '../../engine/fp30x/tones'`. Instead, accept `toneName: string` as a prop resolved by the parent `PresetsScreen` via `useTones` hook's tone catalog. Update `PresetsScreen.tsx` to resolve tone name before passing to `PresetCard`.
- [x] T013 [P] [RS2] Fix `src/screens/display/QuickToneSlots.tsx` (line 14) — remove `import {getFP30XEngine} from '../../engine/registry'`. Use `useTones` hook to access the tone catalog and resolve tone objects from IDs stored in `appSettingsStore.quickToneSlots`.
- [x] T014 [RS2] Fix `src/services/PianoService.ts` (line 14) — remove `import {getChordService} from '../hooks/useChord'`. Move `ChordService` lazy singleton pattern from `src/hooks/useChord.ts` into `src/services/ChordService.ts` as a module-level `getChordService()` export. Update `PianoService.ts` to import `getChordService` from `../services/ChordService` (same layer). Update `useChord.ts` to import from `../services/ChordService` instead of defining the singleton locally.
- [x] T015 [RS2] Verify no cross-layer imports remain — run `grep -r "from '../../engine" src/screens/` and `grep -r "from '../hooks" src/services/`. Both must return zero results. Also check `grep -r "from '../../transport" src/screens/`.

**Checkpoint**: All layer boundaries clean. Presentation → Services (via hooks) → Engine + Transport. No violations.

---

## Phase 5: RS3 — Protocol Fidelity (A6, A7)

**Goal**: Add BLE characteristic validation, MIDI running status reconstruction, and CC/PC echo handling.

**Independent Test**: Connect to FP-30X. Play rapid staccato notes (running status scenario). Verify all Note On/Off events parse correctly. Check logs for CC/PC echoes when changing tone on piano's physical buttons.

**Finding**: A6 (BLE Characteristic Discovery — HIGH), A7 (Parser Fidelity — HIGH)

### Tests

- [x] T016 [P] [RS3] Write running status framing test in `__tests__/transport/ble/framing.test.ts` — create a BLE MIDI packet with two Note On messages where the second uses running status (omits 0x90 status byte). Verify `stripBleFraming()` reconstructs both messages correctly. Test running status resets at SysEx boundaries (F0). Test running status only applies to channel messages (not system).
- [x] T017 [P] [RS3] Write CC/PC echo parser test in `__tests__/engine/fp30x/parser.test.ts` — test `parseNotification()` with Control Change bytes (`B0 07 64` → controlChange event, channel 0, controller 7, value 100). Test Program Change (`C0 05` → programChange event, channel 0, program 5). Verify these return typed events instead of null.

### Implementation

- [x] T018 [RS3] Add BLE characteristic property validation in `src/transport/ble/BleTransport.ts` (A6) — after `discoverAllServicesAndCharacteristics()`, query the MIDI characteristic object for `isWritableWithoutResponse` and `isNotifiable` properties. If either is false or missing, reject the connection with a descriptive error: `"MIDI characteristic does not support required properties (write-without-response + notify)"`. Log the actual properties for diagnostics.
- [x] T019 [RS3] Implement running status reconstruction in `src/transport/ble/framing.ts` `stripBleFraming()` (A7) — add `let lastStatusByte = 0` before the parse loop. When a data byte (< 0x80) appears where a status byte is expected, insert `lastStatusByte` before it and parse as a complete message. Reset `lastStatusByte` on SysEx start (0xF0) and at packet boundaries. Only apply to channel messages (0x80–0xEF).
- [x] T020 [RS3] Add CC and PC echo handling in `src/engine/fp30x/parser.ts` `parseNotification()` (A7) — add cases for Control Change (0xB0–0xBF): extract channel, controller number, value → return `{ type: 'controlChange', channel, controller, value }`. Add case for Program Change (0xC0–0xCF): extract channel, program → return `{ type: 'programChange', channel, program }`. Add these new event types to `NotificationEvent` union in `src/engine/types.ts`.
- [x] T021 [RS3] Update `src/services/PianoService.ts` `handleNotification()` — add cases for `controlChange` and `programChange` event types. Log at debug level: `"CC echo: ch=${e.channel} cc=${e.controller} val=${e.value}"`. Do NOT update stores (CC/PC are informational only for BLE FP-30X).

**Checkpoint**: BLE characteristic validated on connect. Running status messages parse correctly. CC/PC echoes logged instead of silently dropped.

---

## Phase 6: RS4 — Tone Selector & Pending Queue (A8, A9)

**Goal**: Fix tone selector behavior (category +/- applies first tone, cross-category number search, default tone action) and wire the pending tone queue for offline resilience.

**Independent Test**: Press category + → verify piano plays first tone of new category. Open tone picker → type "10" in number search → verify results span all categories. Select a tone while disconnected → verify pending indicator shows → reconnect → tone auto-sends.

**Finding**: A8 (Pending Tone Queue — HIGH), A9 (Tone Selector Requirement Drift — HIGH)

### Implementation

- [x] T022 [RS4] Fix `src/hooks/useTones.ts` `nextCategory()` and `prevCategory()` (A9) — after updating `lastCategoryIndex` in appSettingsStore, get the first tone of the new category via `categories[newIndex].tones[0]` and call `selectTone(firstTone)` to apply it. This sends the DT1 command and pushes to tone history, matching FR-012 behavior: "cycle to the next tone category and the tone selector resets to the first tone in that category."
- [x] T023 [RS4] Fix `src/components/modals/TonePickerModal.tsx` number search (A9) — replace the single-category number search (line 81: `currentCategory.tones[asNumber - 1]`) with the cross-category `searchByNumber(asNumber)` method from the `useTones` hook. This returns tone #N from every category, matching FR-012b: "returns tone N from every category that has one."
- [ ] T024 [RS4] Implement "Set as default tone" action (A9) — in the tone options modal (long-press), replace the placeholder with real logic: persist the selected tone's ID in `appSettingsStore` as `defaultToneId`. On first connect (if no default preset is set), apply this tone via `PianoService.changeTone()`. Add `defaultToneId: string | null` to `appSettingsStore` if not present.
- [ ] T025 [RS4] Wire pending tone queue — send path in `src/hooks/useTones.ts` or `src/services/PianoService.ts` `changeTone()` (A8): check `connectionStore.status`. If not `'connected'`, call `performanceStore.setPendingTone(tone)` instead of sending DT1. Update ToneSelector to show a pending indicator (e.g., pulsing outline or "pending" badge) when `performanceStore.pendingTone` is not null.
- [ ] T026 [RS4] Wire pending tone flush on connect in `src/services/ConnectionService.ts` (A8) — after successful connection and initial state read, check `performanceStore.getState().pendingTone`. If present, send it via `this.pianoServiceRef.changeTone(pendingTone)` and call `performanceStore.getState().clearPendingTone()`.

**Checkpoint**: Category +/- applies first tone. Number search is cross-category. Default tone action works. Pending queue sends on reconnect.

---

## Phase 7: RS5 — Import/Export & Reorder (A10, A11)

**Goal**: Replace the import stub with a real file picker + conflict resolution UI. Add drag-to-reorder for presets.

**Independent Test**: Export presets → import file → conflict dialog appears → choose rename/replace/skip → presets merge correctly. Long-press preset card → drag to reorder → order persists after app restart.

**Finding**: A10 (Import/Export Completion Gap — HIGH), A11 (Preset Reordering Missing — HIGH)

### Implementation

- [ ] T027 [RS5] Refactor `src/services/PresetService.ts` import logic (A10) — split `importPresets()` into two methods: `detectConflicts(parsedPresets: Preset[]): ImportConflict[]` (returns list of name-conflicting presets with existing matches) and `resolveImport(conflicts: ImportConflict[]): ImportResult` (applies each conflict's user-chosen resolution: rename appends suffix, replace overwrites existing, skip ignores). Keep the JSON parsing and validation in a `parsePresetFile(json: string): Preset[]` method. Remove the automatic `" (imported)"` suffix behavior.
- [ ] T028 [RS5] Create conflict resolution modal in `src/components/modals/ImportConflictModal.tsx` (A10) — modal that shows each conflicting preset name with three buttons: "Rename" (appends "(2)"), "Replace" (overwrites existing), "Skip" (don't import this one). Iterates through conflicts one at a time. Returns the full `ImportConflict[]` with resolved strategies. NativeWind styled.
- [ ] T029 [RS5] Replace import stub in `src/screens/presets/PresetsScreen.tsx` (A10) — replace the `Alert.alert("Coming soon")` stub with: `DocumentPicker.pick({ type: ['public.json'] })` → read file contents → `presetService.parsePresetFile(json)` → `presetService.detectConflicts(presets)` → if conflicts exist, show `ImportConflictModal` → `presetService.resolveImport(resolvedConflicts)` → show success toast with count.
- [ ] T030 [RS5] Add `reorderPresets` action to `src/store/presetsStore.ts` (A11) — accept `(fromIndex: number, toIndex: number)` or `(reorderedData: Preset[])`. Update `sortOrder` values for all affected presets. Persist immediately via MMKV.
- [ ] T031 [RS5] Expose `reorderPresets` in `src/hooks/usePresets.ts` (A11) — add `reorderPresets` to the hook's returned object, calling through to `presetsStore.getState().reorderPresets()`.
- [ ] T032 [RS5] Replace FlatList with DraggableFlatList in `src/screens/presets/PresetsScreen.tsx` (A11) — import `DraggableFlatList` from `react-native-draggable-flatlist`. Pass `onDragEnd={({ data }) => reorderPresets(data)}`. Add drag handle to `PresetCard` (long-press to initiate drag per research.md §12).

**Checkpoint**: Import picks real files, shows conflict UI, merges correctly. Reorder works via drag-and-drop and persists.

---

## Phase 8: RS6 — NativeWind Migration (A5)

**Goal**: Migrate from inline StyleSheet.create to NativeWind className props. Install React Native Reusables. Constitutional mandate (Principles III, VII).

**Independent Test**: Each migrated screen renders identically to before (visual regression). No `StyleSheet.create` in migrated files. `className` props used throughout.

**Finding**: A5 (Constitution UI Stack — CRITICAL)

### Foundation

- [ ] T033 [RS6] Verify NativeWind v4 configuration is functional — check `tailwind.config.js` content path includes `src/**/*.{ts,tsx}`. Verify `babel.config.js` has NativeWind plugin. Verify `global.css` imports Tailwind layers (`@tailwind base; @tailwind components; @tailwind utilities;`). Verify `metro.config.js` has NativeWind transform. Fix any missing pieces.
- [ ] T034 [RS6] Convert `src/theme/colors.ts` to NativeWind-compatible format — export palette values as CSS custom properties in `global.css` (`:root { --color-steel-100: #...; }` and `.dark { --color-steel-100: #...; }`). Extend `tailwind.config.js` colors with custom names mapping to CSS vars: `steel: { 100: 'var(--color-steel-100)', ... }`. Keep the TypeScript exports for any programmatic use but mark as secondary.
- [ ] T035 [RS6] Convert `src/theme/typography.ts` to NativeWind font families — extend `tailwind.config.js` `fontFamily` with `orbitron: ['Orbitron-Regular']` and `orbitron-bold: ['Orbitron-Bold']`. Create NativeWind utility classes: `font-orbitron`, `font-orbitron-bold`. Remove or deprecate `TextStyle` exports that duplicate NativeWind classes.

### Screen Migration

- [ ] T036 [P] [RS6] Migrate `src/screens/display/StatusBar.tsx` to NativeWind className props — replace all `style={{...}}` with `className="..."`. Replace conditional styles with NativeWind conditional classes. Replace theme color lookups with NativeWind CSS variable classes (e.g., `bg-steel-100 dark:bg-black`). Remove `StyleSheet.create` if present.
- [ ] T037 [P] [RS6] Migrate `src/screens/display/DisplayScreen.tsx` to NativeWind className props — same pattern as T036. Replace inline flex/layout styles with NativeWind utilities (`flex-1`, `flex-row`, `justify-between`, etc.).
- [ ] T038 [P] [RS6] Migrate `src/screens/display/ToneSelector.tsx` to NativeWind className props
- [ ] T039 [P] [RS6] Migrate `src/components/StepperControl.tsx` to NativeWind className props
- [ ] T040 [P] [RS6] Migrate `src/screens/presets/PresetCard.tsx` to NativeWind className props
- [ ] T041 [P] [RS6] Migrate `src/screens/presets/PresetsScreen.tsx` to NativeWind className props
- [ ] T042 [P] [RS6] Migrate modals to NativeWind — `src/components/modals/TempoModal.tsx`, `src/components/modals/BeatModal.tsx`, `src/components/modals/VolumeOverlay.tsx`
- [ ] T043 [P] [RS6] Migrate tone modals to NativeWind — `src/components/modals/TonePickerModal.tsx`, `src/components/modals/CategoryPickerModal.tsx`
- [ ] T044 [P] [RS6] Migrate remaining components to NativeWind — `src/screens/pads/PadsScreen.tsx`, `src/screens/display/ChordDisplay.tsx`, `src/screens/display/QuickToneSlots.tsx`, `src/components/ConnectionIndicator.tsx`, `src/app/TabNavigator.tsx`

**Checkpoint**: All screens use NativeWind className props. No inline StyleSheet patterns remain. React Native Reusables installed and available. WCAG AA contrast preserved.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Missing tests, spec cleanup, task reconciliation, final validation.

### Tests

- [ ] T045 Write `__tests__/services/ConnectionService.test.ts` (A12) — mock BleTransport (send, subscribe, connect) and engine registry. Test: scan triggers transport.scan with timeout, connect flow calls discoverServices + subscribeNotifications + sendRQ1, disconnect cleans up subscriptions + clears interval, auto-reconnect retries up to max (5) with delay (2s), `isFirstConnectionThisSession` distinction (first connect vs reconnect), default preset auto-apply on first connect only.

### Spec & Task Reconciliation

- [ ] T046 [P] Fix spec.md Phase 5 TODO placeholders (A14) — replace "Further refinements TODO" at line 293 with concrete acceptance details for import conflict resolution (rename/replace/skip per A10 remediation) or mark as "covered by acceptance scenarios 1–3 above."
- [ ] T047 Reconcile task completion status — review all 89 original tasks against actual implementation. Unmark tasks that were completed without artifacts: T030 (ConnectionService test — no test file exists), T084 (import — was a stub), T086-T089 (quality tasks — no evidence artifacts). After remediation is complete, re-verify and re-mark.

### Final Validation

- [ ] T048 Run ESLint + TypeScript build validation — `npm run lint && npx tsc --noEmit`. Zero errors required. Fix any issues introduced by remediation changes.
- [ ] T049 Physical device test session on iOS — connect to FP-30X, verify: (1) bootstrap wires services (no null early-returns), (2) RQ1 populates real state, (3) tone changes send DT1, (4) piano notifications update UI, (5) category +/- applies first tone, (6) pending queue works on reconnect, (7) import/export round-trips correctly, (8) preset reorder persists, (9) NativeWind styling renders correctly in both light/dark modes.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: No dependencies — start immediately (parallel with Phase 1)
- **RS1 State Sync (Phase 3)**: Depends on Phase 2 (bootstrap must be wired)
- **RS2 Layer Fixes (Phase 4)**: No dependencies — start immediately (parallel with Phases 1–3)
- **RS3 Protocol (Phase 5)**: No dependencies — start immediately (parallel with Phases 1–4)
- **RS4 Tone/Queue (Phase 6)**: Depends on Phase 2 (needs service bootstrap for PianoService)
- **RS5 Import/Reorder (Phase 7)**: Depends on Phase 1 (needs dependencies installed)
- **RS6 NativeWind (Phase 8)**: No dependencies — start immediately (parallel with all phases)
- **Polish (Phase 9)**: Depends on Phases 2–8 completion

### Remediation Story Dependencies

```
Phase 1 (Deps) ─────────────────────────────→ Phase 7 (Import/Reorder)
                                                      │
Phase 2 (Bootstrap) ──→ Phase 3 (State Sync) ────────┤
       │                                              │
       └──────────→ Phase 6 (Tone/Queue) ─────────────┤
                                                      │
Phase 4 (Layer Fixes) ────────────────────────────────┤  ← all independent
Phase 5 (Protocol) ───────────────────────────────────┤  ← all independent
Phase 8 (NativeWind) ─────────────────────────────────┤  ← independent
                                                      │
                                           Phase 9 (Polish)
```

### Within Each Remediation Story

- Tests FIRST (TDD) for pure-logic tasks (parser, framing, service)
- Fix infrastructure before UI
- Verify after each task (run affected tests, check for regressions)

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 are all [P] — different packages
- **Phase 2**: T004-T007 are sequential (bootstrap → App.tsx → ConnectionService wiring)
- **Phase 4**: T012, T013 are [P] — different screen files
- **Phase 5**: T016, T017 are [P] — different test files
- **Phase 8**: T036-T044 are all [P] — different screen/component files (after T033-T035 complete)
- **Cross-phase**: Phases 1, 2, 4, 5, 8 can all start simultaneously

---

## Parallel Example: Maximum Concurrency

```
# These can ALL run simultaneously (different files, no dependencies):

Phase 1:  T001 (install reusables), T002 (install doc-picker), T003 (install draggable-flatlist)
Phase 2:  T004 (bootstrap.ts) — then T005 (App.tsx) sequentially
Phase 4:  T012 (PresetCard fix), T013 (QuickToneSlots fix)
Phase 5:  T016 (running status test), T017 (CC/PC echo test)
Phase 8:  T033 (NativeWind config verify)

# After Phase 2 checkpoint:
Phase 3:  T010 (RQ1 routing)
Phase 6:  T022 (category +/-)

# After Phase 8 T033-T035 complete:
Phase 8:  T036-T044 all in parallel (each a different file)
```

---

## Implementation Strategy

### Critical Path First (Phases 2 + 3 = App Actually Works)

1. Complete Phase 2: Service Bootstrap (T004–T008) — **CRITICAL GATE**
2. Complete Phase 3: State Sync (T009–T011) — app now reads real piano state
3. **STOP and VALIDATE**: Connect to FP-30X. Verify tone selector shows real tone, status bar shows real tempo/volume. If this fails, everything else is moot.

### Incremental Delivery

1. Phase 2 (Bootstrap) → App can connect and send commands
2. Phase 3 (State Sync) → App reads real piano state on connect
3. Phase 4 (Layer Fixes) → Architecture compliant
4. Phase 5 (Protocol) → Robust MIDI parsing
5. Phase 6 (Tone/Queue) → Feature-complete tone selection
6. Phase 7 (Import/Reorder) → Feature-complete presets
7. Phase 8 (NativeWind) → Constitution-compliant UI stack
8. Phase 9 (Polish) → Quality verified

### Severity-Ordered Priority

| Priority | Phases | Findings | Effort |
|----------|--------|----------|--------|
| 1 — CRITICAL | 2, 3 | A1, A2, A3 | Small (5 tasks) |
| 2 — CRITICAL | 4 | A4 | Small (4 tasks) |
| 3 — HIGH | 5 | A6, A7 | Medium (6 tasks) |
| 4 — HIGH | 6 | A8, A9 | Medium (5 tasks) |
| 5 — HIGH | 7 | A10, A11 | Medium (6 tasks) |
| 6 — CRITICAL (large) | 8 | A5 | Large (12 tasks) |
| 7 — HIGH/LOW | 9 | A12, A13, A14 | Small (5 tasks) |

---

## Notes

- [P] tasks = different files, no dependencies
- [RS*] label maps task to remediation story for traceability
- Finding IDs (A1–A14) reference `codereview.md` entries
- TDD mandatory for pure-logic modules (parser, framing, services)
- Physical device testing required for all BLE features
- Commit after each task or logical group, referencing task ID + finding ID (e.g., `T004 (A1): Create service bootstrap`)
- All remediation changes reference `docs/roland-sysex-discovery.md` for protocol details
- Run `npm run lint && npx tsc --noEmit` after each phase checkpoint
