# Tasks: FP-30X Controller v2

**Input**: Design documents from `/specs/002-fp30x-controller-v2/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: TDD is mandatory per constitution. Test tasks included for pure-logic modules (SysEx, parser, framing, stores).

**Organization**: Tasks grouped by user story (12 stories across 5 spec phases).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US12)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project restructure from v1 feature-based to v2 layered architecture. Install new dependencies.

- [x] T001 Create v2 directory structure: `src/engine/`, `src/engine/fp30x/`, `src/transport/`, `src/transport/ble/`, `src/services/`, `src/screens/display/`, `src/screens/presets/`, `src/screens/pads/`, `src/components/modals/`, `src/hooks/`, `__tests__/engine/fp30x/`, `__tests__/transport/ble/`, `__tests__/services/`, `__tests__/store/`
- [x] T002 [P] Install new dependencies: `@react-navigation/material-top-tabs`, `react-native-pager-view`, `nativewind`, `tailwindcss`, `react-native-reusables`
- [x] T003 [P] Configure NativeWind: `tailwind.config.js`, `babel.config.js` plugin, `global.css`, `metro.config.js` adjustments
- [x] T004 [P] Bundle Orbitron font: download Regular + Bold weights, add to `ios/` fonts directory, configure `react-native.config.js` for custom font linking
- [x] T005 [P] Configure landscape-only orientation in `ios/Info.plist` (remove portrait orientations)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Engine core, transport core, stores, and theme. MUST complete before ANY user story.

**CRITICAL**: No user story work can begin until this phase is complete.

### Engine Core

- [x] T006 [P] Implement engine types interface in `src/engine/types.ts` — PianoEngine, ToneCatalog, ToneCategory, Tone, NotificationEvent, DeviceIdentity types per contracts/piano-engine.ts
- [x] T007 [P] Implement FP-30X constants in `src/engine/fp30x/constants.ts` — model ID (`00 00 00 28`), device ID (`0x10`), Roland manufacturer ID (`0x41`), BLE MIDI service/characteristic UUIDs
- [x] T008 [P] Implement DT1 address map in `src/engine/fp30x/addresses.ts` — all known DT1 addresses from discovery doc Section 6 (tone, volume, tempo, metronome, voice mode, transpose, key touch, split, balance)
- [x] T009 Implement SysEx builders in `src/engine/fp30x/sysex.ts` — `buildDT1()`, `buildRQ1()`, `rolandChecksum()`, `buildIdentityRequest()`. All byte construction per discovery doc Section 4 + Appendix A
- [x] T010 [P] Write SysEx builder tests in `__tests__/engine/fp30x/sysex.test.ts` — byte-level assertions for DT1 tone change (Concert Piano = `F0 41 10 00 00 00 28 12 01 00 02 07 00 00 00 76 F7`), RQ1, checksum, tempo encoding (2-byte 7-bit), volume, metronome toggle
- [x] T011 Implement tone catalog in `src/engine/fp30x/tones.ts` — complete SN (65 tones, 8 categories) + GM2 (256 tones) with DT1 category/index format per discovery doc Sections 7-8. ToneCatalog with findByDT1(), findById(), searchByName(), getToneAtPosition()
- [x] T012 [P] Write tone catalog tests in `__tests__/engine/fp30x/tones.test.ts` — verify 321 total tones, category counts (Piano=12, E.Piano=7, ..., GM2=256), findByDT1 for Concert Piano (0,0,0), GM2 Organ 1 (8,0,36), search by name "Piano", boundary tones per category
- [x] T013 Implement notification parser in `src/engine/fp30x/parser.ts` — parse DT1 echoes (volume, tone, tempo, metronome state/beat/pattern/volume/tone, voice mode, transpose, key touch), Note On/Off, handle running status, return typed NotificationEvent
- [x] T014 [P] Write parser tests in `__tests__/engine/fp30x/parser.test.ts` — DT1 volume echo (`01 00 02 13 34` → volume 52), tone echo, tempo echo (2-byte decode), Note On (`90 3C 64` → noteOn C4 vel 100), Note Off, metronome state (`01 00 01 0F 01` → on), unknown address → unknown event
- [x] T015 Implement FP30XEngine in `src/engine/fp30x/FP30XEngine.ts` — implements PianoEngine interface, wires sysex builders + parser + tone catalog. Methods: buildToneChange, buildVolumeChange, buildTempoChange, buildMetronomeToggle, buildMetronomeParam, buildInitialStateRequest, parseNotification, parseStateResponse, supportsDevice
- [x] T016 Implement engine registry in `src/engine/registry.ts` — maps DeviceIdentity to PianoEngine instance. Register FP30XEngine for model ID 0x28.

### Transport Core

- [x] T017 [P] Implement transport types in `src/transport/types.ts` — Transport interface, DiscoveredDevice, TransportStatus, NotificationListener, Unsubscribe per contracts/transport.ts
- [x] T018 Implement BLE MIDI framing in `src/transport/ble/framing.ts` — `wrapInBleMidiPacket()`, `wrapMultipleInBleMidiPacket()`, `stripBleFraming()` (new: extract raw MIDI from notification bytes, skip header/timestamps), `base64ToBytes()`, `bytesToBase64()`
- [x] T019 [P] Write framing tests in `__tests__/transport/ble/framing.test.ts` — wrap SysEx with F7 timestamp, wrap standard message, strip BLE framing from notification bytes (verify header/timestamp removal), roundtrip wrap→strip

### Stores

- [x] T020 [P] Implement MMKV storage adapter in `src/store/storage.ts` (keep existing or rewrite for NativeWind compatibility)
- [x] T021 [P] Implement connectionStore in `src/store/connectionStore.ts` — DeviceConnection state per data-model.md. Persist deviceId/deviceName/lastConnectedAt. Runtime: status, isFirstConnectionThisSession
- [x] T022 [P] Implement performanceStore in `src/store/performanceStore.ts` — PerformanceState per data-model.md. Runtime-only (not persisted). Fields: activeTone, toneHistory (stack), pendingTone, volume, tempo, metronomeOn, metronomeBeat, metronomePattern, metronomeVolume, metronomeTone. Actions: setActiveTone (push to history), undo (pop history, return previous), setVolume, setTempo, etc.
- [x] T023 [P] Implement appSettingsStore in `src/store/appSettingsStore.ts` — theme (system/light/dark), lastCategoryIndex, defaultPresetId. Persisted via MMKV.
- [x] T024 [P] Write store tests in `__tests__/store/performanceStore.test.ts` — tone history push/undo, undo with empty history, setActiveTone clears pendingTone, volume/tempo set

### Theme

- [x] T025 [P] Implement color tokens in `src/theme/colors.ts` — steel-grey light mode palette, absolute black dark mode palette, WCAG AA validated accent colors (cyan for category, orange for tone name, green/red/grey for BLE status)
- [x] T026 [P] Implement typography in `src/theme/typography.ts` — Orbitron font family config for LCD displays (BPM, time sig, tone names), Inter/system font for body/labels. NativeWind custom font class mappings
- [x] T027 [P] Implement spacing tokens in `src/theme/spacing.ts` — landscape-optimized spacing scale

### App Shell

- [x] T028 Implement TabNavigator in `src/app/TabNavigator.tsx` — `@react-navigation/material-top-tabs` with 3 tabs (PADS | DISPLAY | PRESETS). DISPLAY as initial route. Custom tabBar styled as hardware segment buttons with NativeWind. Landscape-optimized.
- [x] T029 Update App.tsx in `src/app/App.tsx` — NativeWind provider, navigation container, theme provider (system-adaptive with manual override from appSettingsStore), wake lock (`react-native-keep-awake`)

**Checkpoint**: Foundation ready — engine can build/parse DT1, transport can frame BLE packets, stores are wired, theme configured, tab shell renders. User story implementation can begin.

---

## Phase 3: User Story 1 — Connect to Piano (P1, Phase 1)

**Goal**: BLE scan, connect, auto-reconnect, initial state read via RQ1, bidirectional DT1 notification sync.

**Independent Test**: Launch app near powered-on FP-30X. BLE icon turns green. Tone selector shows piano's current tone. Status bar shows tempo/volume. Change volume on piano knob → app updates.

### Tests

- [x] T030 [P] [US1] Write BLE transport mock + ConnectionService tests in `__tests__/services/ConnectionService.test.ts` — scan timeout, connect flow, disconnect cleanup, auto-reconnect logic

### Implementation

- [x] T031 [US1] Implement BLE scanner in `src/transport/ble/scanner.ts` — scan for BLE MIDI service UUID, filter by device name, scan timeout (10s), stop on discovery
- [x] T032 [US1] Implement BleTransport in `src/transport/ble/BleTransport.ts` — implements Transport interface. scan(), connect() (discover services + verify MIDI char), disconnect(), send() (wrap in BLE framing + writeWithoutResponse), subscribe() (monitorCharacteristicForDevice + strip framing + dispatch to listeners), destroy()
- [x] T033 [US1] Implement ConnectionService in `src/services/ConnectionService.ts` — orchestrates: scan → connect → send identity request → select engine from registry → subscribe to notifications → send RQ1 initial state requests → parse responses → populate stores. Auto-reconnect on disconnect (max 5 retries, 2s delay). Track isFirstConnectionThisSession.
- [x] T034 [US1] Implement PianoService core in `src/services/PianoService.ts` — setEngine(), handleNotification() (routes parsed events to stores), changeTone() (build DT1 via engine + send via transport + debounce), changeVolume(), changeTempo(), toggleMetronome(). Debounce rapid input (only last selection sent).
- [x] T035 [US1] Implement useConnection hook in `src/hooks/useConnection.ts` — exposes connectionStore state + scan/connect/disconnect actions from ConnectionService
- [x] T036 [US1] Implement ConnectionIndicator in `src/components/ConnectionIndicator.tsx` — BLE icon (green=connected, red=disconnected, grey=idle). Tap opens connection info panel (device name + disconnect button). NativeWind styled.
- [x] T037 [US1] Wire connection flow into DisplayScreen in `src/screens/display/DisplayScreen.tsx` — basic screen shell with ConnectionIndicator in top-right. Auto-scan on mount if previously paired device exists.

**Checkpoint**: App connects to FP-30X, reads initial state, stays in sync via notifications. BLE icon shows status.

---

## Phase 4: User Story 2 — Browse and Select Tones (P1, Phase 1)

**Goal**: Two-tier tone selector with +/- cycling, category picker modal, tone picker modal with search + favorites tab, long-press options, undo history.

**Independent Test**: Connect to FP-30X. Press + to cycle tones. Tap category name → picker. Tap tone name → list with search. Piano changes tone in each case. Undo reverts.

### Implementation

- [x] T038 [US2] Implement useTones hook in `src/hooks/useTones.ts` — exposes engine tone catalog, current category/tone from performanceStore, nextTone(), prevTone(), nextCategory(), prevCategory(), selectTone() (calls PianoService.changeTone + pushes history), undo(), searchByName(), searchByNumber()
- [x] T039 [US2] Implement StepperControl in `src/components/StepperControl.tsx` — reusable +/- button pair with NativeWind styling (hardware button aesthetic). Accepts onIncrement, onDecrement, label display area (tappable + long-pressable)
- [x] T040 [US2] Implement ToneSelector in `src/screens/display/ToneSelector.tsx` — two-tier: category row (cyan text, +/- stepper, tap name → CategoryPickerModal) + tone row (orange text, +/- stepper, tap name → TonePickerModal, long-press → options modal). Undo button (↩) visible when toneHistory.length > 0
- [x] T041 [US2] Implement CategoryPickerModal in `src/components/modals/CategoryPickerModal.tsx` — two-column layout: left = all categories, right = tones of selected category. Tap tone → select + close. NativeWind + RN Reusables modal pattern.
- [x] T042 [US2] Implement TonePickerModal in `src/components/modals/TonePickerModal.tsx` — two-column: left toggles "Favorites"/"Category", right shows corresponding tone list. Search bar at top (by name or by number). Tap tone → select + send DT1 + close.
- [x] T043 [US2] Implement tone options modal (inline or separate component) — long-press tone name opens: "Add to favorites", "Set as default tone". Uses haptic feedback.
- [x] T044 [US2] Integrate ToneSelector into DisplayScreen — place on left side of landscape layout. Wire to useTones hook. Verify tone changes send DT1 and piano responds.

**Checkpoint**: Full tone browsing with 3 interaction modes. Undo works. Piano changes tone on every selection.

---

## Phase 5: User Story 3 — Live Status Bar (P1, Phase 1)

**Goal**: Interactive bottom bar showing tempo, beat, metronome, volume. Each tappable. Piano notifications update values live.

**Independent Test**: Connect. Verify status values match piano. Tap tempo → change it. Tap metronome → toggle. Change tempo on piano → display updates.

### Implementation

- [ ] T045 [US3] Implement usePiano hook in `src/hooks/usePiano.ts` — facade combining performanceStore state + PianoService actions. Selective subscriptions for volume, tempo, metronomeOn, metronomeBeat.
- [ ] T046 [US3] Implement TempoModal in `src/components/modals/TempoModal.tsx` — +1/-1, +5/-5, +10/-10 buttons + "Set BPM" text input. Sends DT1 tempo change on each action. LCD font for BPM display.
- [ ] T047 [US3] Implement BeatModal in `src/components/modals/BeatModal.tsx` — beat picker (0/4 through 6/4) + rhythm pattern picker (Off + 7 options). Sends DT1 on selection.
- [ ] T048 [US3] Implement VolumeOverlay in `src/components/modals/VolumeOverlay.tsx` — vertical fader. Sends DT1 volume commands during drag. Debounced.
- [ ] T049 [US3] Implement StatusBar in `src/screens/display/StatusBar.tsx` — horizontal bar: tempo (tap → TempoModal), beat (tap → BeatModal), metronome (tap → toggle DT1), volume (tap → VolumeOverlay). LCD font for values. NativeWind.
- [ ] T050 [US3] Integrate StatusBar into DisplayScreen — place at bottom of landscape layout. Wire to usePiano hook. Verify all status items are interactive and update from piano notifications.

**Checkpoint**: Phase 1 (Core Display) complete. App connects, browses tones, shows live status, stays in sync bidirectionally.

---

## Phase 6: User Story 4 — Favorite Tones (P1, Phase 2)

**Goal**: Mark any tone (SN or GM2) as favorite. Persist across sessions. Mixed list.

**Independent Test**: Mark "Concert Piano" + "Organ 1" as favorites. Close app. Reopen. Both present. Tap each — piano changes.

### Implementation

- [ ] T051 [P] [US4] Implement favoritesStore in `src/store/favoritesStore.ts` — array of FavoriteTone (toneId, addedAt, sortOrder). Persisted via MMKV. Actions: addFavorite, removeFavorite, isFavorite, reorder.
- [ ] T052 [P] [US4] Write favorites store tests in `__tests__/store/favoritesStore.test.ts` — add/remove, persistence simulation, mixed SN+GM2, duplicate prevention
- [ ] T053 [US4] Implement useFavorites hook in `src/hooks/useFavorites.ts` — exposes favorites list (resolved to full Tone objects via engine catalog), toggleFavorite, isFavorite
- [ ] T054 [US4] Wire favorites into TonePickerModal — "Favorites" tab shows favorites list from useFavorites. Tap applies tone via DT1.
- [ ] T055 [US4] Wire "Add to favorites" in tone options modal (long-press) — calls toggleFavorite. Haptic feedback.

**Checkpoint**: Favorites work across SN and GM2. Persist. Show in tone picker.

---

## Phase 7: User Story 5 — Quick Tone Slots (P1, Phase 2)

**Goal**: 3 always-visible quick-tone buttons on DISPLAY screen.

**Independent Test**: Assign 3 favorites. Tap a slot → piano changes tone instantly.

### Implementation

- [ ] T056 [US5] Add quickToneSlots state to appSettingsStore — `quickToneSlots: [string | null, string | null, string | null]`. Persisted.
- [ ] T057 [US5] Implement QuickToneSlots in `src/screens/display/QuickToneSlots.tsx` — 3 buttons showing tone name + star icon. Tap → apply tone via PianoService. Long-press → assign from favorites list. NativeWind.
- [ ] T058 [US5] Integrate QuickToneSlots into DisplayScreen — place on right side of landscape layout.

**Checkpoint**: One-tap tone access from main display.

---

## Phase 8: User Story 6 — Presets (P1, Phase 2)

**Goal**: Save/load named presets (tone + volume + tempo + metronome + quick-tone slots). Default preset auto-applies on first connect.

**Independent Test**: Save preset (Strings, vol=80, tempo=90). Close app. Reopen. Connect. Default preset auto-applies.

### Implementation

- [ ] T059 [P] [US6] Implement presetsStore in `src/store/presetsStore.ts` — array of Preset per data-model.md. Persisted via MMKV. Actions: createPreset (capture current performanceStore + quickToneSlots), updatePreset, deletePreset, reorder, setDefault, clearDefault. Ensure only one default.
- [ ] T060 [P] [US6] Write presets store tests in `__tests__/store/presetsStore.test.ts` — create, update, delete, reorder, single-default enforcement, quick-tone slot capture
- [ ] T061 [US6] Implement PresetService in `src/services/PresetService.ts` — applyPreset(): converts preset fields to DT1 messages via engine, sends batch via PianoService, restores quickToneSlots in appSettingsStore. captureCurrentState(): reads performanceStore + appSettingsStore → Preset object.
- [ ] T062 [US6] Implement usePresets hook in `src/hooks/usePresets.ts` — exposes presets list, createPreset, applyPreset, deletePreset, renamePreset, setDefault
- [ ] T063 [US6] Implement PresetCard in `src/screens/presets/PresetCard.tsx` — shows preset name, default badge, tone name. Tap → apply. Swipe/long-press → rename/delete/set default. NativeWind.
- [ ] T064 [US6] Implement PresetsScreen in `src/screens/presets/PresetsScreen.tsx` — list of PresetCards with reordering. "New Preset" button captures current state. Default preset badge.
- [ ] T065 [US6] Wire default preset auto-apply into ConnectionService — on first connection (isFirstConnectionThisSession), check for default preset, apply via PresetService, then mark isFirstConnectionThisSession = false. Skip on reconnection.

**Checkpoint**: Phase 2 complete. Favorites, quick-tone slots, and presets all working. Default preset auto-applies.

---

## Phase 9: User Story 7 — Real-Time Chord Tracker (P1, Phase 3)

**Goal**: Display chords from Note On/Off. Held-notes set model.

**Independent Test**: Connect, play C-E-G → shows "C". Release E → updates. Play C-Eb-G → shows "Cm".

### Implementation

- [ ] T066 [P] [US7] Implement ChordService in `src/services/ChordService.ts` — held-notes Set, addNote/removeNote, analyzeChord() (pitch class intervals, match templates for major/minor/dim/aug/7th chords), getChordName(). Subscribe to noteOn/noteOff from PianoService notifications.
- [ ] T067 [P] [US7] Write chord detection tests in `__tests__/services/ChordService.test.ts` — C major (60,64,67), C minor (60,63,67), dim, aug, 7th chords, single note → note name, 2 notes → interval, non-chord → individual notes, empty → clear
- [ ] T068 [US7] Implement useChord hook in `src/hooks/useChord.ts` — subscribes to ChordService, exposes current chord name + held notes
- [ ] T069 [US7] Implement ChordDisplay in `src/screens/display/ChordDisplay.tsx` — large chord name display area. LCD font. Updates in real time. Shows note names when no chord recognized.
- [ ] T070 [US7] Integrate ChordDisplay into DisplayScreen — place in center/right area of landscape layout.

**Checkpoint**: Live chord detection working on physical piano.

---

## Phase 10: User Story 8 — Split and Dual Mode Control (P2, Phase 3)

**Goal**: Set voice mode (Single/Split/Dual), per-voice tones, split point, balance.

**Independent Test**: Set Split mode, Piano right + Bass left, split at F#3. Verify piano responds.

### Implementation

- [ ] T071 [US8] Add Split/Dual DT1 builders to FP30XEngine — buildVoiceModeChange(), buildLeftToneChange(), buildSplitPointChange(), buildBalanceChange(), per discovery doc addresses (01 00 02 00–06, 0A–0C, 16–17)
- [ ] T072 [US8] Add voice mode controls to DisplayScreen — mode selector (Single/Split/Dual), secondary tone selector for left/Tone2, split point setter, balance slider
- [ ] T073 [US8] Wire Split/Dual configuration into PresetService — presets capture and restore voice mode parameters

**Checkpoint**: Split/Dual modes functional.

---

## Phase 11: User Story 9 — Keyboard Transpose and Key Touch (P3, Phase 3)

**Goal**: Transpose control (-6 to +5), key touch sensitivity (6 levels).

### Implementation

- [ ] T074 [US9] Add transpose + key touch DT1 builders to FP30XEngine — buildTransposeChange(value), buildKeyTouchChange(level), per addresses 01 00 03 07 and 01 00 02 1D
- [ ] T075 [US9] Add transpose display to StatusBar — shows current transpose value, tap opens transpose control
- [ ] T076 [US9] Add Key Touch selector to a settings panel — 6 levels (Fix through Super Heavy)

**Checkpoint**: Phase 3 complete.

---

## Phase 12: User Story 10 — Assignable Performance Pads (P1, Phase 4)

**Goal**: Grid of macro buttons that send configured command sequences.

### Implementation

- [ ] T077 [US10] Design pad data model — PadConfig (id, label, commands: DT1Command[]). Store in padConfigStore.
- [ ] T078 [US10] Implement PadsScreen in `src/screens/pads/PadsScreen.tsx` — grid of pad buttons. Tap → execute commands. Long-press → configure.
- [ ] T079 [US10] Implement pad configuration dialog — assign DT1 command sequences (volume, tone, mode, metronome toggle, etc.)

**Checkpoint**: Pads functional.

---

## Phase 13: User Story 11 — Full Metronome Control (P2, Phase 4)

**Goal**: Complete metronome parameter control (beat, pattern, volume, tone).

### Implementation

- [ ] T080 [US11] Extend BeatModal to include pattern, volume (0–10), and tone (Click/Electronic/Japanese/English) selectors
- [ ] T081 [US11] Wire all metronome params through PianoService → engine buildMetronomeParam() → transport send

**Checkpoint**: Phase 4 complete.

---

## Phase 14: User Story 12 — Export and Import Presets (P1, Phase 5)

**Goal**: Export presets to shareable file. Import with conflict resolution.

### Implementation

- [ ] T082 [US12] Define preset file format (JSON with version header + array of Preset objects)
- [ ] T083 [US12] Implement export: serialize presets → JSON → share via system share sheet (`react-native-share` or Share API)
- [ ] T084 [US12] Implement import: receive file → parse JSON → conflict detection (same name) → prompt rename/replace/skip → merge into presetsStore
- [ ] T085 [US12] Add export/import buttons to PresetsScreen

**Checkpoint**: Phase 5 complete.

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Quality, performance, accessibility.

- [ ] T086 [P] Run ESLint + Prettier across entire codebase — zero warnings
- [ ] T087 [P] WCAG AA contrast audit — verify all text meets contrast ratios in both light and dark themes
- [ ] T088 Physical device test session — full end-to-end: connect, browse tones, change via all 3 modes, verify undo, status bar interactions, presets, favorites, disconnect/reconnect
- [ ] T089 Performance profiling — verify 60 FPS during tone browsing, < 200ms tone selection, < 500ms preset apply

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 Connect (Phase 3)**: Depends on Foundational — first story to implement
- **US2 Tones (Phase 4)**: Depends on US1 (needs connection to send DT1)
- **US3 Status Bar (Phase 5)**: Depends on US1 (needs connection + notifications)
- **US4 Favorites (Phase 6)**: Depends on US2 (needs tone selection working)
- **US5 Quick Tones (Phase 7)**: Depends on US4 (needs favorites)
- **US6 Presets (Phase 8)**: Depends on US1 + US5 (needs connection + quick-tone slots)
- **US7 Chord (Phase 9)**: Depends on US1 (needs Note On/Off notifications)
- **US8 Split/Dual (Phase 10)**: Depends on US2 (needs tone selection)
- **US9 Transpose (Phase 11)**: Depends on US1 (needs DT1 send)
- **US10-12**: Depend on earlier phases as noted
- **Polish (Phase 15)**: Depends on all desired stories complete

### User Story Dependencies

```
Setup → Foundational → US1 (Connect) ──→ US2 (Tones) ──→ US4 (Favorites) → US5 (Quick Tones) → US6 (Presets)
                          │                    │
                          ├──→ US3 (Status Bar) │
                          ├──→ US7 (Chord)      │
                          └──→ US9 (Transpose)  │
                                                └──→ US8 (Split/Dual)
```

### Within Each User Story

- Tests FIRST (TDD) for pure-logic tasks
- Types/interfaces before implementations
- Services before screens
- Core before integration

### Parallel Opportunities

- **Phase 2**: T006–T008, T010, T012, T014, T017, T019, T020–T027 are all [P] — different files
- **Phase 3 (US1)**: T030 test can run in parallel with T031 scanner
- **Phase 4 (US2)**: T038 hook, T039 stepper, T041 category picker, T042 tone picker can overlap
- **Phase 6 (US4)**: T051 store + T052 tests in parallel
- **Phase 8 (US6)**: T059 store + T060 tests in parallel

---

## Parallel Example: Foundational Phase

```
# All these can run simultaneously (different files):
T006: engine/types.ts
T007: engine/fp30x/constants.ts
T008: engine/fp30x/addresses.ts
T017: transport/types.ts
T020: store/storage.ts
T021: store/connectionStore.ts
T022: store/performanceStore.ts
T023: store/appSettingsStore.ts
T025: theme/colors.ts
T026: theme/typography.ts
T027: theme/spacing.ts

# Then sequentially (dependencies):
T009: sysex.ts (depends on T007, T008)
T010: sysex tests
T011: tones.ts (depends on T006)
T013: parser.ts (depends on T007, T008)
T015: FP30XEngine.ts (depends on T009, T011, T013)
T018: framing.ts (depends on T017)
T028: TabNavigator.tsx (depends on T025, T026)
T029: App.tsx (depends on T028)
```

---

## Implementation Strategy

### MVP First (Phase 1 Core Display = US1 + US2 + US3)

1. Complete Setup (T001–T005)
2. Complete Foundational (T006–T029) — CRITICAL GATE
3. Complete US1 Connect (T030–T037) — can now talk to piano
4. Complete US2 Tones (T038–T044) — core value proposition
5. Complete US3 Status Bar (T045–T050) — live feedback
6. **STOP and VALIDATE on physical device**

### Incremental Delivery

- Setup + Foundational → Foundation ready
- US1 → Can connect (validates entire engine/transport stack)
- US2 → Can browse + select tones (core feature, testable)
- US3 → Can see + control status (complete Phase 1)
- US4–US6 → Favorites + presets (Phase 2, the differentiator)
- US7–US9 → Chord + Split/Dual + Transpose (Phase 3, advanced)
- US10–US12 → Pads + Metronome + Import/Export (Phases 4-5)

---

## Notes

- [P] tasks = different files, no dependencies
- [USn] label maps task to specific user story
- TDD mandatory for pure-logic modules (engine, parser, stores)
- Physical device testing required for all BLE features
- Commit after each task or logical group, referencing task ID
- All DT1 byte values reference `docs/roland-sysex-discovery.md`
