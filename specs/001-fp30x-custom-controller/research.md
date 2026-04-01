# Research: FP-30X Custom Controller

**Branch**: `001-fp30x-custom-controller` | **Date**: 2026-03-31

## 1. BLE MIDI Communication Layer

### Decision: `react-native-ble-plx` + custom MIDI parser

**Rationale**: No production-ready React Native BLE MIDI library exists. `react-native-ble-plx` is the most reliable BLE library for React Native (actively maintained, iOS + Android support). We must implement the BLE MIDI spec manually:
- MIDI Service UUID: `03B80E5A-EDE8-4B33-A751-6CE34EC4C700`
- MIDI Characteristic UUID: `7772E5DB-3868-4112-A1A9-F2669D10959A`
- Parse/construct BLE MIDI packets (timestamp header + MIDI data bytes)

**Alternatives considered**:
- `MIDIVal` — experimental RN adapter, not production-ready
- `react-native-midi` — Web MIDI polyfill, limited BLE support
- Native Swift module — considered for Phase 3 if JS bridge latency is problematic

**Key implementation notes**:
- BLE MIDI packets include timestamp bytes that must be stripped on receive and added on send
- The FP-30X Identity Reply uses Roland Manufacturer ID (41H), Family (19H 03H)
- GM2 System On SysEx requires a 50ms delay before subsequent messages
- All messages sent on MIDI channel 1 (status byte lower nibble = 0x00)

## 2. Local Storage / Persistence

### Decision: MMKV (`react-native-mmkv`)

**Rationale**: MMKV is the current React Native standard for key-value persistence. Synchronous API eliminates async complexity for state management. Handles our data shapes well:
- Favorites: Array of tone IDs (small, frequent reads)
- Presets: Named objects with tone + parameter snapshots (moderate size, infrequent writes)
- Last-used category: Single string value
- Default preset reference: Single ID value

**Alternatives considered**:
- AsyncStorage — legacy, slow, no encryption, removed from core
- SQLite — overkill for our data complexity; no relational queries needed
- Zustand + MMKV persist middleware — good option for integrated state management

**Key implementation notes**:
- Presets stored as JSON-serialized objects keyed by UUID
- Favorites stored as a JSON array of tone IDs
- MMKV built-in encryption available if future privacy requirements arise

## 3. Navigation

### Decision: `@react-navigation/bottom-tabs` + `@react-navigation/native`

**Rationale**: Industry standard for React Native tab navigation. Lazy initialization by default, `freezeOnBlur` for performance, TypeScript support. Perfectly supports our 4-tab MVP structure (Tones · GM2 · Favorites · Presets) with Phase 2 expansion (+Controls tab).

**Alternatives considered**:
- React Native Navigation (Wix) — native-driven, higher performance ceiling but steeper learning curve and more complex setup
- Expo Router — file-based routing, good for Expo projects but may constrain native module usage

**Key implementation notes**:
- Each tab contains its own stack navigator for drill-down (e.g., Presets → Preset Detail)
- `freezeOnBlur: true` to prevent inactive tabs from re-rendering
- Tab bar styled for dark theme (black background, light icons)

## 4. State Management

### Decision: Zustand + MMKV persistence middleware

**Rationale**: Zustand is lightweight, TypeScript-native, and integrates cleanly with MMKV for persistence. It avoids Redux boilerplate while providing the reactivity we need for:
- Connection state (scanning → discovered → connecting → connected → disconnected)
- Active tone tracking
- Preset management
- Performance state mirror

**Alternatives considered**:
- Redux Toolkit — too much boilerplate for our app size
- React Context — insufficient for cross-component state sharing at scale
- Jotai/Recoil — atomic state models, less intuitive for our domain

## 5. UI Component Library

### Decision: Custom components on React Native core primitives

**Rationale**: The app's dark-mode-only, high-contrast design with card grids and pill bars is highly specific. Using a generic UI library (React Native Paper, NativeBase) would require extensive theming overrides and add unnecessary bundle size. Custom components ensure:
- Absolute black (#000000) backgrounds
- Precise card grid layouts (2-col iPhone, 3-4 col iPad)
- Haptic feedback integration for long-press favorites
- Performance-optimized FlatList for tone grids

**Alternatives considered**:
- React Native Paper — Material Design, would need heavy dark-mode customization
- NativeBase — flexible but adds dependency weight
- Tamagui — modern, performant, but learning curve

## 6. Wake Lock

### Decision: `react-native-keep-awake` (or `expo-keep-awake`)

**Rationale**: Lightweight, single-purpose library. Activates on app foreground, deactivates on background. No complex configuration needed.

## 7. Haptic Feedback

### Decision: `react-native-haptic-feedback`

**Rationale**: Provides iOS Taptic Engine feedback for the long-press-to-favorite gesture. Lightweight, well-maintained.
