# app-display-fp30x Development Guidelines

Regenerated from Constitution v2.0.1 + v2 spec. Last updated: 2026-04-05

## Constitution

All development decisions MUST comply with the ratified Constitution v2.0.1 at `.specify/memory/constitution.md`. The 7 core principles are:

1. **Offline-First & Protocol-Authoritative** — No network calls. `docs/roland-sysex-discovery.md` is primary protocol reference. MIDI Implementation doc is secondary (GM2 tone list, Universal SysEx only).
2. **Bidirectional Control Surface** — App reads piano state via RQ1, subscribes to DT1 notifications. Hardware state wins on conflict.
3. **Landscape Hardware-Synth UI** — Landscape-only. Steel-grey light mode (brushed metal). Absolute black dark mode. LCD/display fonts for numeric displays and tone names. NativeWind + React Native Reusables. WCAG AA.
4. **DT1 SysEx Protocol Fidelity** — ALL parameter control via Roland DT1 SysEx (model `0x28`). CC/PC does NOT work over BLE. Roland checksum mandatory.
5. **Layered Architecture with Engine Abstraction** — Presentation → Services → Engine + Transport. Engine encapsulates model-specific protocol. Adding a new piano = adding a new engine directory.
6. **Phased Delivery** — 5-phase roadmap. No forward dependencies between phases.
7. **Simplicity & Justified Complexity** — Engine/transport interfaces are the only mandated abstractions. Everything else must be justified.

## Active Technologies

- **Framework**: TypeScript 5.x on React Native 0.76+
- **BLE**: `react-native-ble-plx` (manual MIDI parsing; no production RN BLE MIDI lib exists)
- **State**: `zustand` + MMKV persist middleware (atomic state, selective subscriptions)
- **Persistence**: `react-native-mmkv` (synchronous, fast key-value)
- **Styling**: NativeWind (Tailwind CSS for RN) — utility-first, system-adaptive theming
- **Components**: React Native Reusables — high flexibility and customizability
- **Fonts**: LCD/display typeface (Orbitron, VT323, or Digital-7) for BPM, time sig, tone names. Sans-serif for body text. Bundled as custom assets.
- **Wake Lock**: `react-native-keep-awake`
- **Haptics**: `react-native-haptic-feedback`
- **Protocol**: Roland DT1/RQ1 SysEx (model ID `00 00 00 28`)
- **Target**: iOS 15+ (iPhone primary, iPad adaptive), landscape-only
- **Navigation**: TBD — 3 top tabs (PADS | DISPLAY | PRESETS), no bottom tab bar

## Project Structure

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
│   │   ├── StatusBar.tsx         # Tempo, beat, metronome, volume
│   │   ├── ChordDisplay.tsx      # Phase 3: chord tracker
│   │   └── QuickToneSlots.tsx    # Phase 2: 3 quick-tone buttons
│   ├── presets/                  # PRESETS tab
│   │   ├── PresetsScreen.tsx
│   │   └── PresetCard.tsx
│   └── pads/                     # PADS tab (Phase 4)
│       └── PadsScreen.tsx
│
├── components/                   # Shared UI components
│   ├── modals/                   # TonePickerModal, TempoModal, BeatModal, VolumeOverlay
│   ├── ConnectionIndicator.tsx
│   └── StepperControl.tsx
│
├── engine/                       # DOMAIN — piano engine abstraction
│   ├── types.ts                  # PianoEngine interface, ToneCatalog, PianoCapabilities
│   ├── registry.ts               # Maps device identity → engine instance
│   └── fp30x/                    # FP-30X engine implementation
│       ├── FP30XEngine.ts        # Implements PianoEngine
│       ├── addresses.ts          # DT1 address map (01 00 02 xx, etc.)
│       ├── sysex.ts              # DT1/RQ1 builders + Roland checksum
│       ├── parser.ts             # Notification parser (DT1, Note On/Off)
│       ├── tones.ts              # SN (65) + GM2 (256) catalog, DT1 indices
│       └── constants.ts          # Model ID (0x28), device ID (0x10)
│
├── transport/                    # INFRASTRUCTURE — communication abstraction
│   ├── types.ts                  # Transport interface (send, subscribe, connect)
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
│   ├── connectionStore.ts
│   ├── performanceStore.ts       # Live piano mirror (tone, volume, tempo, etc.)
│   ├── favoritesStore.ts
│   ├── presetsStore.ts
│   └── appSettingsStore.ts
│
├── hooks/                        # Shared React hooks
│   ├── usePiano.ts               # Facade: PianoService + performanceStore
│   ├── useConnection.ts
│   ├── useTones.ts
│   ├── useChord.ts               # Phase 3
│   └── useFavorites.ts
│
└── theme/                        # Design system tokens
    ├── colors.ts                 # Steel-grey light / absolute black dark
    ├── spacing.ts
    └── typography.ts             # LCD font config + body font
```

**Layer dependency rules** (constitutional, Principle V):
- Presentation → Services (via hooks) → Engine + Transport
- Engine and Transport MUST NOT depend on each other
- Screens MUST NOT import from `engine/` or `transport/` directly
- Adding a new piano model = new `engine/<model>/` directory implementing `PianoEngine`

## Code Standards

### Test-Driven Development (TDD) — MANDATORY

- **Write tests FIRST** for every feature.
- **Run tests AFTER** implementation to verify.
- **Test framework**: Jest + React Native Testing Library (unit/component).
- Pure-logic modules (SysEx builders, parsers, checksum, stores) MUST have unit tests with byte-level assertions.
- BLE MIDI features MUST be tested on a physical iOS device connected to a real FP-30X. Simulator-only testing is NOT acceptable.

### Linting & Formatting — MANDATORY

- **ESLint**: Strict React Native rules. Zero warnings policy.
- **Prettier**: Standard settings. Applied globally.
- Run `npm run lint` and `npx prettier --check .` before every commit.

### React Native Architecture Patterns

1. **Atomic State**: Zustand with selective subscriptions. Never subscribe to entire store objects.
2. **Virtualized Lists**: `FlatList` or `FlashList` for tone lists. Never `ScrollView` for dynamic lists.
3. **Deferred Computation**: `useDeferredValue` for heavy filtering to maintain 60 FPS.
4. **View Flattening**: Minimize wrapper `<View>` nesting.
5. **No Barrel Exports**: Import directly from source files, never through `index.ts`.
6. **NativeWind First**: Use className props with Tailwind utilities. Avoid `StyleSheet.create` when NativeWind suffices.

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files (components/screens) | PascalCase | `ToneSelector.tsx`, `DisplayScreen.tsx` |
| Files (hooks) | camelCase with `use` prefix | `useConnection.ts`, `useTones.ts` |
| Files (stores) | camelCase with `Store` suffix | `connectionStore.ts` |
| Files (services) | PascalCase | `PianoService.ts`, `BleTransport.ts` |
| Files (engine) | PascalCase or camelCase | `FP30XEngine.ts`, `addresses.ts` |
| Directories | kebab-case | `src/engine/fp30x/` |
| Constants | UPPER_SNAKE_CASE | `BLE_MIDI_SERVICE_UUID` |
| Types/Interfaces | PascalCase | `Tone`, `Preset`, `PianoEngine` |

### Theme & Styling

- System-adaptive: follows device appearance setting by default.
- Manual override toggle: `system` / `light` / `dark` (persisted in `appSettingsStore`).
- **Dark mode**: Absolute black `#000000` background. Glowing display-style text.
- **Light mode**: Steel-grey background (brushed metal aesthetic). Deep saturated foreground colors.
- **Fonts**: LCD/display typeface (Orbitron, VT323, or Digital-7) for BPM, time signature, tone names. Sans-serif for body/labels.
- WCAG AA contrast ratios MUST be met in both modes.
- NativeWind for all styling. React Native Reusables as component foundation.

### MIDI Protocol Rules

- **ALL parameter control uses DT1 SysEx** (model `00 00 00 28`). CC/PC does NOT work over BLE.
- Tone selection: DT1 write to address `01 00 02 07` with 3 data bytes (category, index high, index low).
- State reads: RQ1 SysEx to read performance block + tempo/metronome block on connect.
- Notifications: subscribe to BLE MIDI characteristic; parse DT1 echoes for state sync and Note On/Off for chord detection.
- Roland checksum MUST be correct on every DT1/RQ1 message.
- BLE MIDI packets MUST include proper timestamp headers. SysEx needs separate timestamp before `F7`.
- Rapid user input MUST be debounced — only the last selection is sent.
- Batch DT1 writes need no inter-write delay (confirmed: 3 writes in ~56ms).
- All MIDI message construction MUST be in pure TypeScript (no native modules).

### Performance Targets

- Tone selection response: < 200ms (SC-002)
- BLE connection: < 5s (SC-003)
- UI frame rate: 60 FPS
- Preset batch apply: < 500ms (SC-008)
- Status bar update from notification: < 200ms (SC-005)
- Chord display update: < 100ms (SC-012)

## Commands

```bash
npm test               # Run Jest unit tests
npm run lint           # Run ESLint
npx prettier --check . # Check formatting
npm run dev            # Start Metro bundler
```

## Commit Discipline

- Commit after each completed task or logical group.
- Each commit message references the task ID (e.g., `T001`, `T017`).
- Spec-driven: No code before the spec is approved.

## Key References

- **SysEx Protocol Discovery**: `docs/roland-sysex-discovery.md` — **PRIMARY** protocol reference. DT1/RQ1 addresses, tone maps, BLE framing, notification parsing, checksum algorithm.
- **MIDI Implementation doc**: `docs/FP-30X_MIDI_Imple_eng01_W.md` — GM2 tone list, Universal SysEx, CC definitions. Secondary to discovery doc for BLE behavior.
- **Constitution**: `.specify/memory/constitution.md` — v2.0.1, 7 principles.
- **V2 Feature spec**: `specs/002-fp30x-controller-v2/spec.md` — active spec (5 phases).
- **V1 spec** (superseded): `specs/001-fp30x-custom-controller/spec.md`

## Implementation Progress

V2 architecture rebuild in progress. V1 code (T001-T059) will be restructured to match the new layered architecture (engine/ + transport/ + services/). The CC/PC MIDI encoder and old feature/ structure are being replaced.

## Recent Changes

- Code review remediation in progress — see `specs/002-fp30x-controller-v2/codereview.md` for findings and `plan.md` for remediation plan.
