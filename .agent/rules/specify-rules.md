---
trigger: always_on
---

# app-display-fp30x Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-01

## Constitution

All development decisions MUST comply with the ratified Constitution v1.1.0 at `.specify/memory/constitution.md`. The 7 core principles are:

1. **Offline-First & Hardware-Authoritative** — No network calls. MIDI Implementation doc is sole source of truth.
2. **One-Way State Injector** — Write-only control surface. No read-back from piano.
3. **System-Adaptive High-Contrast UI** — Follow device appearance (light/dark) with manual override. WCAG AA in both modes.
4. **MIDI Protocol Fidelity** — Exact byte sequences per MIDI Implementation doc.
5. **Phased Delivery** — 3-phase roadmap. No Phase 2 code in Phase 1.
6. **Feature-Module Architecture** — Vertical slices in `src/features/`. No cross-feature internal imports.
7. **Simplicity & YAGNI** — No unnecessary abstractions. Justify complexity in Complexity Tracking.

## Active Technologies

- **Framework**: TypeScript 5.x on React Native 0.76+
- **BLE**: `react-native-ble-plx` (manual MIDI parsing; no production RN BLE MIDI lib exists)
- **Navigation**: `@react-navigation/bottom-tabs`
- **State**: `zustand` + MMKV persist middleware (atomic state to minimize re-renders)
- **Persistence**: `react-native-mmkv` (synchronous, fast key-value)
- **Wake Lock**: `react-native-keep-awake`
- **Haptics**: `react-native-haptic-feedback`
- **Target**: iOS 15+ (iPhone primary, iPad adaptive)

## Project Structure

```text
src/
├── app/                    # App bootstrap & navigation (App.tsx, TabNavigator.tsx)
├── features/               # Feature modules (vertical slices)
│   ├── connection/         # BLE MIDI connection (services/, hooks/, components/)
│   ├── tones/              # Built-in tone browser (screens/, components/, hooks/)
│   ├── gm2/                # GM2 tone browser
│   ├── favorites/          # Favorite tones
│   ├── presets/             # Preset management
│   └── controls/           # Live performance controls (Phase 2)
├── store/                  # Zustand stores (+ MMKV persistence)
│   ├── connectionStore.ts
│   ├── performanceStore.ts
│   ├── favoritesStore.ts
│   ├── presetsStore.ts
│   └── appSettingsStore.ts
├── services/midi/          # MIDI protocol layer (midiEncoder.ts, bleMidiPacket.ts, constants.ts)
├── data/                   # Static tone catalogs (tones.json, gm2Tones.json)
└── theme/                  # Design system (colors.ts, spacing.ts, typography.ts)
```

## Code Standards

### Test-Driven Development (TDD) — MANDATORY

- **Write tests FIRST** for every feature. Tests outline expected outcomes before implementation begins.
- **Run tests AFTER** implementation to fully guarantee functionality.
- **Test framework**: Jest + React Native Testing Library (unit/component), Detox (E2E on physical device).
- Pure-logic modules (`midiEncoder`, `bleMidiPacket`, stores) MUST have unit tests with byte-level assertions.
- BLE MIDI features MUST be tested on a physical iOS device connected to a real FP-30X. Simulator-only testing is NOT acceptable.

### Linting & Formatting — MANDATORY

- **ESLint**: Most recommended/strict React Native rules. Zero warnings policy.
- **Prettier**: Standard recommended settings. Applied globally.
- Run `npm run lint` and `npx prettier --check .` before every commit.
- A final lint+format pass (`T071`) is enforced in the Polish phase.

### React Native Architecture Patterns

Follow `@react-native-best-practices` and `@react-native-architecture` skills:

1. **Atomic State**: Use Zustand with selective subscriptions to minimize re-renders. Never subscribe to entire store objects.
2. **Virtualized Lists**: Use `FlatList` or `FlashList` for all tone grids. Never use `ScrollView` for dynamic lists.
3. **Deferred Computation**: Use `useDeferredValue` for heavy state computations (filtering tones) to maintain 60 FPS.
4. **View Flattening**: Optimize view hierarchies; avoid excessive wrapper `<View>` nesting.
5. **No Barrel Exports**: Import directly from source files, never through `index.ts` barrel files.
6. **Feature Isolation**: Each feature module (`src/features/*`) owns its screens, components, and hooks. Cross-feature imports go through `src/store/` or `src/services/` only.

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files (components/screens) | PascalCase | `ToneCard.tsx`, `ToneBrowserScreen.tsx` |
| Files (hooks) | camelCase with `use` prefix | `useConnection.ts`, `useTones.ts` |
| Files (stores) | camelCase with `Store` suffix | `connectionStore.ts` |
| Files (services) | PascalCase | `BleManager.ts`, `MidiService.ts` |
| Files (data) | camelCase | `tones.json`, `gm2Tones.json` |
| Directories | kebab-case | `src/features/connection/` |
| Constants | UPPER_SNAKE_CASE | `BLE_MIDI_SERVICE_UUID` |
| Types/Interfaces | PascalCase | `Tone`, `Preset`, `DeviceConnection` |

### Theme & Styling

- System-adaptive: follows device appearance setting by default.
- Manual override toggle: `system` / `light` / `dark` (persisted in `appSettingsStore`).
- **Dark mode**: Absolute black `#000000` background. Light foreground text.
- **Light mode**: Pure white `#FFFFFF` background. Deep saturated foreground colors.
- WCAG AA contrast ratios MUST be met in both modes. High contrast is non-negotiable.
- No third-party UI component libraries. Build custom components tailored to the app's design.

### MIDI Protocol Rules

- Tone selection: `CC 0 (MSB) → CC 32 (LSB) → Program Change` on MIDI channel 1.
- GM2 activation: Send `F0 7E 7F 09 03 F7` SysEx, then wait ≥ 50ms before next message.
- BLE MIDI packets MUST include proper timestamp headers.
- Rapid user input MUST be debounced — only the last tone selection is sent.
- All MIDI message construction MUST be in pure TypeScript (no native modules).

### Performance Targets

- Tone selection response: < 200ms (SC-002)
- BLE connection: < 5s (SC-003)
- UI frame rate: 60 FPS
- Preset batch apply: < 500ms (SC-008)

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

## Recent Changes

- 001-fp30x-custom-controller: Full specification, plan, and task breakdown completed. Constitution v1.1.0 ratified. TDD, ESLint, and Prettier mandated. System-adaptive high-contrast theme adopted.

<!-- MANUAL ADDITIONS START -->

1. When uncertain about the MIDI Implementation parameters, always check the documentation file `docs/FP-30X_MIDI_Imple_eng01_W.md` (for easy readiness in markdown format) or `docs/FP-30X_MIDI_Imple_eng01_W.pdf` (for 100% fidelity of the original doc file). 

<!-- MANUAL ADDITIONS END -->
