# Implementation Plan: FP-30X Custom Controller

**Branch**: `001-fp30x-custom-controller` | **Date**: 2026-03-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fp30x-custom-controller/spec.md`

## Summary

Build a React Native (iOS-first) mobile app that acts as a remote control surface for the Roland FP-30X digital piano via BLE MIDI. The MVP (Phase 1) delivers: BLE MIDI connection with auto-reconnect, a tone browser for 65 built-in SuperNATURAL tones and 256 GM2 voices, favorites with local persistence, and a preset system that batch-sends MIDI commands to restore the piano's state after power-on. The app uses a system-adaptive high-contrast theme (follows device appearance with manual override) and wake lock for performance use.

## Technical Context

**Language/Version**: TypeScript 5.x on React Native 0.76+  
**Primary Dependencies**: react-native-ble-plx (BLE), @react-navigation/bottom-tabs (navigation), zustand (state), react-native-mmkv (persistence), react-native-keep-awake (wake lock), react-native-haptic-feedback (haptics)  
**Storage**: MMKV (key-value, synchronous, local)  
**Testing**: TDD strictly enforced using Jest + React Native Testing Library (unit/component), Detox (E2E on physical device). Tests must be run after implementation to guarantee outcomes.
**Target Platform**: iOS 15+ (iPhone primary, iPad adaptive) — React Native for future Android expansion  
**Project Type**: mobile-app  
**Performance Goals**: <200ms tone selection response (SC-002), <5s BLE connection (SC-003), 60fps UI  
**Constraints**: Offline-capable, system-adaptive high-contrast UI (Constitution III), BLE MIDI requires physical device testing, piano volatile memory (no state readback)  
**Scale/Scope**: Single-user, 321 tone catalog, ~5 screens, ~20 presets max expected

## Constitution Check

*GATE: Constitution v1.1.0 ratified 2026-04-01 — 7 principles verified.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-First & Hardware-Authoritative | ✅ Pass | All data bundled; no network calls; MIDI Implementation doc is sole source |
| II. One-Way State Injector | ✅ Pass | Write-only control surface; PerformanceState mirror; pending-tone queue on disconnect |
| III. System-Adaptive High-Contrast UI | ✅ Pass | Follows device appearance; manual override toggle; WCAG AA in both themes |
| IV. MIDI Protocol Fidelity | ✅ Pass | CC0→CC32→PC sequence; GM2 SysEx + 50ms delay; BLE MIDI timestamp headers |
| V. Phased Delivery | ✅ Pass | 3-phase roadmap; nullable fields for future params; no Phase 2 code in Phase 1 |
| VI. Feature-Module Architecture | ✅ Pass | `src/features/` vertical slices; shared `services/` and `store/` |
| VII. Simplicity & YAGNI | ✅ Pass | Zustand+MMKV only; no generic component library; no unnecessary abstractions |

## Project Structure

### Documentation (this feature)

```text
specs/001-fp30x-custom-controller/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: setup guide
├── contracts/
│   └── midi-service.md  # Phase 1: MIDI protocol contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── app/                          # App bootstrap & navigation
│   ├── App.tsx                   # Root: providers, NavigationContainer, KeepAwake
│   └── TabNavigator.tsx          # Bottom tabs: Tones · GM2 · Favorites · Presets
│
├── features/                     # Feature modules (vertical slices)
│   ├── connection/               # BLE MIDI connection
│   │   ├── hooks/useConnection.ts
│   │   ├── services/BleManager.ts
│   │   ├── services/MidiService.ts
│   │   └── components/ConnectionIndicator.tsx
│   ├── tones/                    # Built-in tone browser (landing screen)
│   │   ├── screens/ToneBrowserScreen.tsx
│   │   ├── components/CategoryPills.tsx
│   │   └── components/ToneCard.tsx
│   ├── gm2/                     # GM2 tone browser
│   │   ├── screens/GM2BrowserScreen.tsx
│   │   └── components/GM2FamilySection.tsx
│   ├── favorites/               # Favorites
│   │   └── screens/FavoritesScreen.tsx
│   └── presets/                  # Preset management
│       ├── screens/PresetsScreen.tsx
│       ├── screens/PresetDetailScreen.tsx
│       └── components/PresetCard.tsx
│
├── store/                        # Zustand stores (+ MMKV persistence)
│   ├── connectionStore.ts        # BLE state machine
│   ├── performanceStore.ts       # Active tone, pending tone, parameter mirror
│   ├── favoritesStore.ts         # Favorite tone IDs (persisted)
│   ├── presetsStore.ts           # Preset CRUD + default management (persisted)
│   └── appSettingsStore.ts       # Last-used category, theme preference (persisted)
│
├── services/midi/                # MIDI protocol layer
│   ├── midiEncoder.ts            # Build CC, PC, SysEx byte arrays
│   ├── bleMidiPacket.ts          # BLE MIDI packet wrapping (header + timestamp + data)
│   └── constants.ts              # UUIDs, CC numbers, SysEx templates
│
├── data/                         # Static tone catalogs
│   ├── tones.json                # 65 built-in tones (MSB/LSB/PC)
│   └── gm2Tones.json            # 256 GM2 tones (MSB/LSB/PC)
│
└── theme/                        # Design system
    ├── colors.ts                 # System-adaptive palette (dark: #000 bg; light: #FFF bg)
    ├── spacing.ts                # Grid spacing constants
    └── typography.ts             # Font system
```

**Structure Decision**: Feature-sliced architecture with shared services and stores. Each feature module is self-contained with its own screens, components, and hooks. Cross-cutting concerns (MIDI, BLE, persistence) live in shared `services/` and `store/` directories.

## Coding Patterns & Architecture

Following `@react-native-best-practices` and `@react-native-architecture` standards:

1. **Test-Driven Development (TDD)**:
   - TDD is strictly enforced. For each feature, write tests outlining the expected outcomes *first*.
   - Run tests immediately after implementation to fully guarantee the functionality.
2. **Code Quality**:
   - Apply rigorous linting and code formatting using **ESLint** and **Prettier** with the most recommended React Native settings.
3. **State Management & Architecture**:
   - Feature-sliced offline-first architecture using atomic state (Zustand + MMKV) to minimize re-renders.
4. **Performance (FPS & Re-renders)**:
   - Use `FlashList` or `FlatList` for tone grids to prevent scroll jank.
   - Use `useDeferredValue` for heavy state computations (like filtering tones) to maintain 60 FPS.
   - Optimize view hierarchies and avoid excessive wrappers (flattening) to optimize TTI (Time to Interactive).

## Complexity Tracking

No complexity violations to track — constitution has no gates defined.

---

## Implementation Phases

### Phase 1: Foundation (BLE + MIDI Core)

**Goal**: Establish BLE connection to FP-30X and send a single tone-change message.

**Deliverables**:
1. React Native project initialized with TypeScript
2. `BleManager` service: scan, connect, auto-reconnect
3. `MidiService`: encode MIDI messages, wrap in BLE packets, send via BLE characteristic
4. `midiEncoder`: CC, PC, SysEx byte construction
5. `bleMidiPacket`: BLE MIDI packet format implementation
6. `connectionStore`: state machine (idle → scanning → connected → disconnected)
7. Basic connection UI (for testing — will be replaced by ConnectionIndicator)

**Verification**: Connect to FP-30X, send a Bank Select + Program Change, hear the tone change.

### Phase 2: Tone Catalog & Browser UI

**Goal**: Full tone browser with categories, card grid, and the system-adaptive high-contrast theme.

**Deliverables**:
1. Static JSON tone catalogs (`tones.json`, `gm2Tones.json`) — extracted from MIDI Implementation doc
2. `ToneBrowserScreen` with `CategoryPills` + card grid
3. `ToneCard` component (high-contrast styling, highlighted active tone)
4. `GM2BrowserScreen` with GM2 family groupings
5. `ConnectionIndicator` (status dot in nav bar)
6. System-adaptive theme system (`colors.ts`, `typography.ts`, `spacing.ts`) — light and dark palettes
7. Bottom tab navigator (Tones · GM2 · Favorites · Presets)
8. Wake lock activation

**Verification**: Browse all 321 tones across categories, tap to select, see active highlight, connection dot shows status.

### Phase 3: Favorites & Long-Press

**Goal**: Mark tones as favorites, persist across sessions.

**Deliverables**:
1. `favoritesStore` with MMKV persistence
2. Long-press gesture on `ToneCard` with haptic feedback + star animation
3. `FavoritesScreen` showing saved favorites as same card grid
4. Visual favorite indicator on cards (subtle star badge)

**Verification**: Long-press a tone → appears in Favorites tab. Restart app → still there. Tap → piano changes sound.

### Phase 4: Presets System

**Goal**: Save/restore complete MIDI states, default preset auto-apply on first connection.

**Deliverables**:
1. `presetsStore` with MMKV persistence
2. Create/rename/delete/reorder presets
3. Default preset flag (at most one)
4. Batch MIDI send on preset apply
5. Auto-apply default preset on first connection (not on reconnection)
6. `PresetsScreen` and `PresetDetailScreen`
7. `appSettingsStore` for last-used category + theme preference

**Verification**: Save preset → restart app → connect → default preset auto-applied → hear correct tone. Disconnect/reconnect → preset NOT re-applied.

### Phase 5: Polish & iPad Adaptive

**Goal**: Production readiness, iPad layouts, edge case handling.

**Deliverables**:
1. Adaptive grid layouts (2-col iPhone, 3-4 col iPad)
2. Edge case handling (disconnection alerts, pending tone queue, rapid-tap debounce, power-cycle detection)
3. Pre-connection browsing with queued tone
4. Empty states (no favorites, no presets)
5. App icon and splash screen (system-adaptive, both light and dark variants)
6. Performance optimization (FlatList, memo, lazy tabs)

**Verification**: Full acceptance scenario testing per spec. SC-001 through SC-010 validated.
