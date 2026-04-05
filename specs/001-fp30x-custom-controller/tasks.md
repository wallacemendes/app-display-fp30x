---
description: "Task list for FP-30X Custom Controller MVP (Phase 1)"
---

# Tasks: FP-30X Custom Controller

**Input**: Design documents from `/specs/001-fp30x-custom-controller/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize React Native project with TypeScript template
- [x] T002 Install core dependencies (`react-native-ble-plx`, `react-native-mmkv`, `@react-navigation/native`, `@react-navigation/bottom-tabs`, `zustand`, etc.)
- [x] T003 Set up ESLint and Prettier with React Native most recommended/strict rules for clean architecture
- [x] T004 Apply iOS specific setup (`pod install`) and configure `ios/Info.plist` for Bluetooth permissions
- [x] T005 Build project directory structure (`src/app`, `src/features`, `src/data`, `src/store`, `src/services`, `src/theme`)
- [x] T006 [P] Implement base system-adaptive high-contrast theme (`colors.ts`, `spacing.ts`, `typography.ts`) in `src/theme/`
- [x] T007 [P] Add raw built-in and GM2 JSON tones static data to `src/data/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational MIDI Layer (TDD)
- [x] T008 [P] Write failing Jest unit tests for `midiEncoder` (CC, PC, SysEx byte construction) and `bleMidiPacket` (BLE MIDI packet wrapping with timestamp headers) to outline expected byte-level outputs.

### Implementation
- [x] T009 [P] Initialize MMKV storage instance in `src/store/storage.ts`
- [x] T010 [P] Setup Zustand base store configuration
- [x] T011 Create basic Bottom Bar TabNavigator in `src/app/TabNavigator.tsx` and integrate it to `src/app/App.tsx`
- [x] T012 Implement low-level MIDI encoder in `src/services/midi/midiEncoder.ts`
- [x] T013 Create BLE MIDI packet wrapping utility in `src/services/midi/bleMidiPacket.ts`
- [x] T014 Define global constants (BLE UUIDs, CC numbers) in `src/services/midi/constants.ts`
- [x] T015 Setup `react-native-keep-awake` activation at the root level (`App.tsx`) to prevent screen dimming

### Validation
- [x] T016 Run MIDI encoder and BLE packet tests. All byte-level outputs must match expected values from the MIDI Implementation doc.

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Connect to Piano (Priority: P1) 🎯 MVP Core

**Goal**: Establish BLE connection with the FP-30X, showing a persistent status indicator that auto-reconnects.

**Independent Test**: Launch the app near a powered-on FP-30X and verify the connection indicator shows "connected."

### Tests for User Story 1 (TDD)
- [x] T017 [US1] Write failing Jest unit tests for `connectionStore`, `BleManager`, and `useConnection` hook to outline expected connection state transitions.

### Implementation for User Story 1

- [x] T018 [US1] Create Connection Zustand store in `src/store/connectionStore.ts`
- [ ] T019 [US1] Implement `BleManager.ts` wrapper for scanning and discovering Roland manufacturer ID (41H) devices in `src/features/connection/services/BleManager.ts`
- [ ] T020 [US1] Implement `MidiService.ts` for sending/receiving BLE MIDI packets in `src/features/connection/services/MidiService.ts`
- [ ] T021 [US1] Create custom hook `useConnection.ts` to manage BLE lifecycle states
- [ ] T022 [US1] Build `ConnectionIndicator.tsx` UI component for displaying the connection status
- [x] T023 [P] [US1] Create basic App Settings store in `src/store/appSettingsStore.ts` to persist theme preference (system/light/dark) and last-used tone category (FR-012b)
- [ ] T024 [US1] Integrate `ConnectionIndicator.tsx` into the main `TabNavigator.tsx` header

### Validation
- [ ] T025 [US1] Run tests and fully guarantee all connection state outcomes pass.

**Checkpoint**: At this point, User Story 1 is functional: app connects to FP-30X and shows status.

---

## Phase 4: User Story 2 - Browse and Select Built-In Tones (Priority: P1)

**Goal**: Present categories of built-in tones and allow instant MIDI selection.

**Independent Test**: Connect to FP-30X, navigate built-in tone categories, tap a tone, and verify piano tone changes immediately.

### Tests for User Story 2 (TDD)
- [x] T026 [P] [US2] Write failing Jest tests for `useTones` filtering logic and `performanceStore` tone state assignment.

### Implementation for User Story 2

- [x] T027 [P] [US2] Create Performance Zustand store in `src/store/performanceStore.ts` to mirror active tone
- [ ] T028 [P] [US2] Implement `useTones.ts` hook for querying static tone data in `src/features/tones/hooks/useTones.ts`
- [ ] T029 [P] [US2] Build `CategoryPills.tsx` UI component in `src/features/tones/components/CategoryPills.tsx`
- [ ] T030 [P] [US2] Build `ToneCard.tsx` UI component in `src/features/tones/components/ToneCard.tsx`
- [ ] T031 [US2] Integrate MIDI message sending (Bank MSB/LSB + PC) on ToneCard tap using `MidiService.ts`
- [ ] T032 [US2] Assemble `ToneBrowserScreen.tsx` using pills, cards (`FlatList` or `FlashList` for performance), and state to render the built-in tone gallery
- [ ] T033 [US2] Implement pending-tone queue: when disconnected, highlight selected tone as "pending" and auto-send via `MidiService` on BLE connect (FR-012c)
- [ ] T034 [US2] Register `ToneBrowserScreen.tsx` as the default initial screen in `TabNavigator.tsx`

### Validation
- [ ] T035 [US2] Run tests and guarantee tone selection and filtering logic pass.

**Checkpoint**: Built-in tone selection is fully functional. The core MVP value is delivered.

---

## Phase 5: User Story 3 - Browse and Select GM2 Sounds (Priority: P1)

**Goal**: Navigate and select from the 256 General MIDI 2 voices.

**Independent Test**: Connect to the FP-30X, navigate to GM2 section, select a sound, and verify GM2 SysEx + tone change occurs.

### Tests for User Story 3 (TDD)
- [ ] T036 [P] [US3] Write failing tests for GM2 grouping logic inside `useGM2.ts` and verify 50ms delay handling for SysEx.

### Implementation for User Story 3

- [ ] T037 [P] [US3] Extract and format GM2 data lists into helper hook in `src/features/gm2/hooks/useGM2.ts`
- [ ] T038 [P] [US3] Build `GM2FamilySection.tsx` component in `src/features/gm2/components/GM2FamilySection.tsx`
- [ ] T039 [US3] Implement GM2 System On SysEx integration (ensure 50ms delay) when switching to GM2 tones in `MidiService.ts`
- [ ] T040 [US3] Assemble `GM2BrowserScreen.tsx` combining sectioned lists of GM2 sounds (`FlashList`)
- [ ] T041 [US3] Register `GM2BrowserScreen.tsx` to the `TabNavigator.tsx`

### Validation
- [ ] T042 [US3] Run tests ensuring grouping/sorting matches correctly and SysEx sequence respects timing.

**Checkpoint**: App has access to the full extent of the piano's internal sound generators.

---

## Phase 6: User Story 4 - Favorite Tones (Priority: P2)

**Goal**: Allow quick, persisted access to frequently used built-in and GM2 tones using long-press haptic gestures.

**Independent Test**: Mark a tone as favorite, close/reopen app, tap favorite and verify proper loading.

### Tests for User Story 4 (TDD)
- [ ] T043 [P] [US4] Write failing unit tests for `favoritesStore` persistence and toggle operations.

### Implementation for User Story 4

- [x] T044 [P] [US4] Create Favorites Zustand store in `src/store/favoritesStore.ts` (MMKV persisted mapped to IDs)
- [ ] T045 [US4] Add gesture handling (long-press) and haptics to `ToneCard.tsx` to toggle favorites state
- [ ] T046 [P] [US4] Create custom hook `useFavorites.ts` to merge static tone data with favorited IDs
- [ ] T047 [US4] Assemble `FavoritesScreen.tsx` to list all favorites
- [ ] T048 [US4] Add `FavoritesScreen.tsx` to `TabNavigator.tsx`

### Validation
- [ ] T049 [US4] Run tests ensuring adding/removing favorites correctly adjusts the state mirror.

**Checkpoint**: Favorites are stored to MMKV and can be applied dynamically.

---

## Phase 7: User Story 5 - Presets (Saved States) (Priority: P2)

**Goal**: Save and restore the full application control state (tone + parameters), including auto-apply on first connect.

**Independent Test**: Save a tone setup to a new preset, reopen the app, connect, verify default preset applies.

### Tests for User Story 5 (TDD)
- [ ] T050 [P] [US5] Write failing tests for `presetsStore` CRUD operations and default auto-apply logic.

### Implementation for User Story 5

- [x] T051 [P] [US5] Create Presets Zustand store in `src/store/presetsStore.ts` (MMKV persisted)
- [ ] T052 [US5] Implement `usePresets.ts` hook for CRUD operations of presets
- [ ] T053 [P] [US5] Build `PresetCard.tsx` UI component in `src/features/presets/components/PresetCard.tsx`
- [ ] T054 [US5] Build `PresetDetailScreen.tsx` for editing/renaming/deleting in `src/features/presets/screens/PresetDetailScreen.tsx`
- [ ] T055 [US5] Assemble `PresetsScreen.tsx` to show all presets and default-preset management
- [ ] T056 [US5] Implement Batch Apply logic to send all required MIDI messages correctly sequenced from a Preset
- [ ] T057 [US5] Hook up first-connection auto-apply behavior inside `BleManager.ts` connection lifecycle
- [ ] T058 [US5] Add Presets navigation stack to `TabNavigator.tsx`

### Validation
- [ ] T059 [US5] Run tests ensuring preset default applications triggers and batch sequences are correct.

**Checkpoint**: State injection MVP feature complete! Users can save setups and recall across sessions.

---

## Phase 8: User Story 6 - Live Performance Controls (Priority: P1 · Phase 2)

**Goal**: Expose real-time parameter tweaking acting directly upon CC values.

**Independent Test**: Slide an on-screen Reverb/Chorus knob and hear real-time effect amount changes.

### Tests for User Story 6 (TDD)
- [ ] T060 [P] [US6] Write failing tests to assert that modifying CC maps updates the `performanceStore` and correctly calls `MidiService.sendControlChange`.

### Implementation for User Story 6

- [ ] T061 [P] [US6] Add CC values (Vol, Pan, Expr, Rev, Cho) to `PerformanceState` mirror inside `src/store/performanceStore.ts`
- [ ] T062 [US6] Create universal Rotary Knob/Slider UI component in `src/features/controls/components/ControlKnob.tsx`
- [ ] T063 [US6] Implement event binding inside the `ControlKnob.tsx` to dispatch CC changes via `MidiService.ts`
- [ ] T064 [US6] Assemble `PerformanceControlsScreen.tsx` with all 5 Phase-2 parameters
- [ ] T065 [US6] Add the Controls tab to `TabNavigator.tsx`
- [ ] T066 [US6] Expand `presetsStore.ts` types and apply-logic to include recording/applying the Phase 2 parameter states

### Validation
- [ ] T067 [US6] Run tests ensuring CC value dispatches are encoded and routed correctly through the stack.

**Checkpoint**: The app acts as a live, real-time control surface.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T068 Refine system-adaptive theme toggle in settings panel
- [ ] T069 Cleanup error handling cases (BLE drops) to ensure UI reflects disconnections cleanly
- [ ] T070 Polish animations (Tone Card selection highlights)
- [ ] T071 Ensure Prettier and ESLint pass without warnings. Run a final format-all command across the codebase.
- [ ] T072 Document undocumented BLE behaviors discovered during development

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup tasks. Blocker for everything else.
- **US1**: Depends on Base Foundation.
- **US2, US3**: Depend heavily on US1 (BLE connected config).
- **US4 (Favorites), US5 (Presets)**: Depend on US2 & US3 being stable.
- **US6 (Controls)**: Depend on US1.

### Parallel Opportunities

- The UI layer components `ToneCard`, `CategoryPills`, and `ControlKnob` can be built entirely independent of BLE MIDI logic.
- Zustand `store` layout operations (MMKV implementation wrappers) can be built in parallel.
- Data layer formatting of JSON dictionaries `tones.json` and `gm2Tones.json` can be performed separately from feature business logic.

## Implementation Strategy

### MVP First (Core Scope)
1. Complete Setup and Foundational Tasks up to T016.
2. Complete US1 (BLE Connect) utilizing strict TDD.
3. Complete US2 (Browse Base Tones) utilizing strict TDD.
4. **STOP and VALIDATE**: Verify connections, and single tone selection on device. Ensure tests pass.
5. Incrementally deliver US3, US4, US5. Run checks continuously.
6. Once MVP is stable and field-tested, proceed to Phase 2 (US6 - Performance Controls).
