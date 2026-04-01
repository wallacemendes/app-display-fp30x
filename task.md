# Task Tracker: FP-30X Custom Controller Implementation

**Tests: 42 passing across 5 suites** ✅

## Phase 1: Setup (Shared Infrastructure)
- [x] T001 Initialize React Native project with TypeScript template
- [x] T002 Install core dependencies
- [x] T003 Set up ESLint and Prettier
- [x] T004 Apply iOS specific setup (pod install ✅ 82 pods, Info.plist BLE permissions)
- [x] T005 Build project directory structure
- [x] T006 [P] Implement base system-adaptive high-contrast theme
- [x] T007 [P] Add raw built-in and GM2 JSON tones static data

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE
- [x] T008 [P] Write failing MIDI encoder + BLE packet tests (TDD) — 20 tests
- [x] T009 [P] Initialize MMKV storage instance (v4 API: createMMKV)
- [x] T010 [P] Setup Zustand base store configuration
- [x] T011 Create basic Bottom Bar TabNavigator + App.tsx integration
- [x] T012 Implement low-level MIDI encoder
- [x] T013 Create BLE MIDI packet wrapping utility
- [x] T014 Define global constants (BLE UUIDs, CC numbers)
- [x] T015 Setup react-native-keep-awake activation
- [x] T016 Run MIDI encoder and BLE packet tests — all pass ✅

## Phase 3: User Story 1 — Connect to Piano
- [x] T017 Write failing tests for connectionStore, BleManager, useConnection — 14 tests (incl. auto-reconnect)
- [x] T018 Create Connection Zustand store
- [ ] T019 Implement BleManager.ts for scanning/discovering Roland devices
- [ ] T020 Implement MidiService.ts for sending/receiving BLE MIDI packets
- [ ] T021 Create useConnection.ts hook
- [ ] T022 Build ConnectionIndicator.tsx UI component
- [x] T023 [P] Create AppSettings store
- [ ] T024 Integrate ConnectionIndicator into TabNavigator header
- [ ] T025 Run tests — all connection state outcomes must pass

## Phase 4: User Story 2 — Browse and Select Built-In Tones
- [x] T026 [P] Write failing tests for useTones and performanceStore — 7 tests
- [x] T027 [P] Create Performance Zustand store
- [ ] T028 [P] Implement useTones.ts hook
- [ ] T029 [P] Build CategoryPills.tsx
- [ ] T030 [P] Build ToneCard.tsx
- [ ] T031 Integrate MIDI message sending on ToneCard tap
- [ ] T032 Assemble ToneBrowserScreen.tsx
- [ ] T033 Implement pending-tone queue (FR-012c)
- [ ] T034 Register ToneBrowserScreen as default initial screen
- [ ] T035 Run tests — tone selection and filtering pass

## Phase 5: User Story 3 — Browse and Select GM2 Sounds
- [ ] T036 [P] Write failing tests for GM2 grouping + SysEx delay
- [ ] T037 [P] Implement useGM2.ts hook
- [ ] T038 [P] Build GM2FamilySection.tsx
- [ ] T039 Implement GM2 System On SysEx integration (50ms delay)
- [ ] T040 Assemble GM2BrowserScreen.tsx
- [ ] T041 Register GM2BrowserScreen to TabNavigator
- [ ] T042 Run tests — grouping/sorting and SysEx timing pass

## Phase 6: User Story 4 — Favorite Tones
- [ ] T043 [P] Write failing tests for favoritesStore
- [x] T044 [P] Create Favorites Zustand store
- [ ] T045 Add gesture handling (long-press) + haptics to ToneCard
- [ ] T046 [P] Create useFavorites.ts hook
- [ ] T047 Assemble FavoritesScreen.tsx
- [ ] T048 Add FavoritesScreen to TabNavigator
- [ ] T049 Run tests — favorites add/remove pass

## Phase 7: User Story 5 — Presets
- [ ] T050 [P] Write failing tests for presetsStore CRUD + auto-apply
- [x] T051 [P] Create Presets Zustand store (crypto.randomUUID)
- [ ] T052 Implement usePresets.ts hook
- [ ] T053 [P] Build PresetCard.tsx
- [ ] T054 Build PresetDetailScreen.tsx
- [ ] T055 Assemble PresetsScreen.tsx
- [ ] T056 Implement Batch Apply logic
- [ ] T057 Hook up first-connection auto-apply in BleManager
- [ ] T058 Add Presets navigation stack to TabNavigator
- [ ] T059 Run tests — preset defaults and batch sequences pass

## Phase 8: User Story 6 — Live Performance Controls (Phase 2)
- [ ] T060 [P] Write failing tests for CC map updates
- [ ] T061 [P] Add CC values to PerformanceState
- [ ] T062 Create ControlKnob.tsx UI component
- [ ] T063 Implement CC dispatch binding in ControlKnob
- [ ] T064 Assemble PerformanceControlsScreen.tsx
- [ ] T065 Add Controls tab to TabNavigator
- [ ] T066 Expand presetsStore for Phase 2 parameters
- [ ] T067 Run tests — CC dispatches pass

## Phase 9: Polish & Cross-Cutting
- [ ] T068 Refine system-adaptive theme toggle
- [ ] T069 Cleanup error handling (BLE drops)
- [ ] T070 Polish animations (ToneCard selection highlights)
- [ ] T071 Final ESLint + Prettier pass
- [ ] T072 Document undocumented BLE behaviors

## Notes
- **iOS Build**: `pod install` complete. Use `FP30XController.xcworkspace` to build.
- **Podfile**: NitroModules linked via explicit pod path from `node_modules`.
- **MMKV v4**: Uses `createMMKV()` factory, `remove()` instead of `delete()`.
- **Next up**: T019 (BleManager), T020 (MidiService), T021 (useConnection hook).
