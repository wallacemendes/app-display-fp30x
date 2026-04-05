# Implementation Plan: FP-30X Controller v2

**Branch**: `002-fp30x-controller-v2` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-fp30x-controller-v2/spec.md`

## Summary

Comprehensive rewrite of the FP-30X controller app replacing the non-functional CC/PC MIDI approach with the reverse-engineered Roland DT1 SysEx protocol. The app becomes a bidirectional control surface: it writes parameters via DT1, reads initial state via RQ1, and stays in sync via unsolicited DT1 notifications from the piano's physical controls.

Architecture is restructured from vertical feature slices to a layered design: Presentation → Services → Engine + Transport. The Piano Engine abstraction encapsulates all FP-30X-specific protocol knowledge behind a `PianoEngine` interface, enabling future multi-piano support by adding engine directories without modifying services, transport, or UI.

UI redesigned as a landscape-only hardware synthesizer display with 3 top tabs (PADS | DISPLAY | PRESETS), LCD/display fonts, steel-grey light mode, and NativeWind + React Native Reusables for styling.

## Technical Context

**Language/Version**: TypeScript 5.x on React Native 0.76+
**Primary Dependencies**: react-native-ble-plx, zustand, react-native-mmkv, NativeWind, React Native Reusables, react-native-keep-awake, react-native-haptic-feedback
**Storage**: react-native-mmkv (synchronous key-value; persists favorites, presets, settings)
**Testing**: Jest + React Native Testing Library (unit/component); physical device for BLE
**Target Platform**: iOS 15+ (iPhone primary, iPad adaptive), landscape-only
**Project Type**: mobile-app
**Performance Goals**: Tone selection < 200ms, BLE connection < 5s, 60 FPS, preset batch < 500ms, chord display < 100ms, status bar notification update < 200ms
**Constraints**: Offline-only, DT1 SysEx exclusively (CC/PC ignored over BLE), bidirectional BLE notifications, all MIDI construction in pure TypeScript
**Scale/Scope**: 321 tones (65 SN + 256 GM2), 3 tabs, 5 development phases
**Navigation**: See research.md — top tabs, no bottom tab bar
**Fonts**: LCD/display typeface for numeric displays + tone names — see research.md

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Check (Constitution v2.0.1)

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Offline-First & Protocol-Authoritative | PASS | No network. `roland-sysex-discovery.md` is primary reference. All data bundled. |
| II | Bidirectional Control Surface | PASS | RQ1 on connect, DT1 notification subscription, hardware-authoritative state. Spec aligns exactly. |
| III | Landscape Hardware-Synth UI | PASS | Landscape-only, steel-grey light, black dark, LCD fonts, NativeWind, WCAG AA. |
| IV | DT1 SysEx Protocol Fidelity | PASS | All writes via DT1 at model 0x28. Checksum, BLE framing, debouncing specified. |
| V | Layered Architecture with Engine Abstraction | PASS | Structure follows engine/ + transport/ + services/ + screens/ layers. |
| VI | Phased Delivery | PASS | 5 phases, each independent. No forward dependencies. |
| VII | Simplicity & Justified Complexity | PASS | Only mandated abstractions are engine + transport interfaces. NativeWind for styling. |

**Gate result**: PASS — no violations.

### Post-Design Re-Check

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Offline-First | PASS | No network calls in any design artifact. Tone catalog bundled in engine/fp30x/tones.ts. |
| II | Bidirectional | PASS | Notification flow: transport.subscribe → engine.parse → service.route → store.update. |
| III | UI | PASS | NativeWind classes, LCD font, steel-grey/black themes defined in theme/. |
| IV | Protocol | PASS | DT1/RQ1 builders in engine/fp30x/sysex.ts with checksum. BLE framing in transport/ble/framing.ts. |
| V | Architecture | PASS | All contracts respect layer boundaries. Engine/Transport don't depend on each other. |
| VI | Phases | PASS | Data model uses nullable fields for Phase 2+ parameters. |
| VII | Simplicity | PASS | No additional abstractions beyond engine + transport. |

## Project Structure

### Documentation (this feature)

```text
specs/002-fp30x-controller-v2/
├── plan.md              # This file
├── research.md          # Phase 0: Navigation, fonts, notification patterns
├── data-model.md        # Phase 1: Entity definitions + notification event types
├── quickstart.md        # Phase 1: Getting started with the architecture
├── contracts/           # Phase 1: PianoEngine + Transport interfaces
│   ├── piano-engine.ts
│   └── transport.ts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/                          # App bootstrap & navigation
│   ├── App.tsx
│   └── TabNavigator.tsx          # 3 tabs: PADS | DISPLAY | PRESETS
│
├── screens/                      # PRESENTATION — organized by tab
│   ├── display/                  # DISPLAY tab (landing screen)
│   │   ├── DisplayScreen.tsx
│   │   ├── ToneSelector.tsx      # Two-tier category/tone stepper
│   │   ├── StatusBar.tsx         # Tempo, beat, metronome, volume — interactive
│   │   ├── ChordDisplay.tsx      # Phase 3: real-time chord tracker
│   │   └── QuickToneSlots.tsx    # Phase 2: 3 quick-tone buttons
│   ├── presets/                  # PRESETS tab
│   │   ├── PresetsScreen.tsx
│   │   └── PresetCard.tsx
│   └── pads/                     # PADS tab (Phase 4)
│       └── PadsScreen.tsx
│
├── components/                   # Shared UI components (cross-screen)
│   ├── modals/
│   │   ├── TonePickerModal.tsx   # Two-column picker with search + favorites
│   │   ├── CategoryPickerModal.tsx
│   │   ├── TempoModal.tsx        # +/-1/5/10 + type BPM
│   │   ├── BeatModal.tsx         # Beat + pattern picker
│   │   └── VolumeOverlay.tsx     # Fader overlay
│   ├── ConnectionIndicator.tsx   # BLE icon (green/red/grey)
│   └── StepperControl.tsx        # Reusable +/- stepper
│
├── engine/                       # DOMAIN — piano engine abstraction
│   ├── types.ts                  # PianoEngine interface, ToneCatalog, NotificationEvent
│   ├── registry.ts               # Maps device identity → engine instance
│   └── fp30x/                    # FP-30X engine implementation
│       ├── FP30XEngine.ts        # Implements PianoEngine
│       ├── addresses.ts          # DT1 address map (01 00 02 xx, etc.)
│       ├── sysex.ts              # DT1/RQ1 builders + Roland checksum
│       ├── parser.ts             # Notification parser (DT1, Note On/Off, CC/PC)
│       ├── tones.ts              # SN (65) + GM2 (256) catalog with DT1 indices
│       └── constants.ts          # Model ID (0x28), device ID (0x10)
│
├── transport/                    # INFRASTRUCTURE — communication abstraction
│   ├── types.ts                  # Transport interface
│   └── ble/                      # BLE implementation
│       ├── BleTransport.ts       # Implements Transport via react-native-ble-plx
│       ├── framing.ts            # BLE MIDI packet wrap/unwrap
│       └── scanner.ts            # Device scanning + auto-reconnect
│
├── services/                     # APPLICATION SERVICES — orchestration
│   ├── PianoService.ts           # Core facade: routes to engine via transport
│   ├── ConnectionService.ts      # Scan → identify → select engine → connect
│   ├── PresetService.ts          # Preset CRUD + batch apply
│   └── ChordService.ts           # Phase 3: held-notes + chord identification
│
├── store/                        # STATE — Zustand + MMKV
│   ├── connectionStore.ts        # BLE status, device info, isFirstConnection
│   ├── performanceStore.ts       # Live piano mirror + tone history stack
│   ├── favoritesStore.ts         # Persisted favorite tones
│   ├── presetsStore.ts           # Persisted presets + default flag
│   └── appSettingsStore.ts       # Theme, last category, default preset ID
│
├── hooks/                        # Shared React hooks
│   ├── usePiano.ts               # Facade: PianoService + performanceStore
│   ├── useConnection.ts
│   ├── useTones.ts               # Tone catalog + category navigation
│   ├── useChord.ts               # Phase 3
│   └── useFavorites.ts
│
└── theme/                        # Design system tokens
    ├── colors.ts                 # Steel-grey light / absolute black dark
    ├── spacing.ts
    └── typography.ts             # LCD font config + body font

__tests__/                        # Test directory (mirrors src/ structure)
├── engine/fp30x/
│   ├── sysex.test.ts             # DT1/RQ1 builder + checksum tests
│   ├── parser.test.ts            # Notification parser tests
│   └── tones.test.ts             # Tone catalog integrity tests
├── transport/ble/
│   └── framing.test.ts           # BLE MIDI packet wrap/unwrap tests
├── services/
│   └── PianoService.test.ts      # Service orchestration tests
└── store/
    ├── performanceStore.test.ts
    ├── favoritesStore.test.ts
    └── presetsStore.test.ts
```

**Structure Decision**: Layered architecture per Constitution Principle V. Presentation organized by screen/tab. Engine and transport are separate domain/infrastructure layers. Services orchestrate. No `features/` directory — the old vertical slices are replaced by horizontal layers with the engine as the domain core.

## Complexity Tracking

> No Constitution Check violations. Engine and transport abstractions are constitutionally mandated (Principle V), not complexity violations.

| Addition | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|-------------------------------------|
| *(none — no violations to justify)* | | |

## Notification Flow Architecture

The bidirectional data flow (piano → app UI) traverses all layers:

```
Piano physical control change
  → BLE notification on MIDI characteristic
  → transport/ble/BleTransport.ts: strips BLE framing, calls listener
  → services/PianoService.ts: calls engine.parseNotification(bytes)
  → engine/fp30x/parser.ts: returns typed NotificationEvent
  → services/PianoService.ts: routes event to correct store
  → store/performanceStore.ts: Zustand state update
  → hooks/usePiano.ts: selective subscription triggers re-render
  → screens/display/StatusBar.tsx: UI shows updated value
```

The listener is wired during connection in `ConnectionService`:
```
transport.subscribe(callback) → wraps monitorCharacteristicForDevice()
```

No separate event emitter library needed. The BLE monitor subscription + Zustand selective subscriptions handle the full reactive chain.
