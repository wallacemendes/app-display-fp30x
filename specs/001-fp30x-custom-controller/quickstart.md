# Quickstart: FP-30X Custom Controller

**Branch**: `001-fp30x-custom-controller` | **Date**: 2026-03-31

## Prerequisites

- Node.js >= 18
- Xcode >= 15 (iOS development)
- CocoaPods
- Physical iOS device (BLE MIDI cannot be tested in simulator)
- Roland FP-30X with Bluetooth enabled

## Project Setup

```bash
# Initialize the React Native project
npx -y @react-native-community/cli init FP30XController --template react-native-template-typescript

# Install core dependencies
npm install react-native-ble-plx           # BLE communication
npm install react-native-mmkv              # Local storage (presets, favorites)
npm install @react-navigation/native       # Navigation core
npm install @react-navigation/bottom-tabs  # Bottom tab bar
npm install react-native-screens           # Native screen optimization
npm install react-native-safe-area-context # Safe area handling
npm install zustand                        # State management
npm install react-native-keep-awake        # Wake lock
npm install react-native-haptic-feedback   # Haptic for long-press favorites

# iOS-specific setup
cd ios && pod install && cd ..
```

## Project Structure (MVP - Phase 1)

```
src/
├── app/                      # App entry, navigation setup
│   ├── App.tsx               # Root component, NavigationContainer
│   └── TabNavigator.tsx      # Bottom tab bar configuration
├── features/
│   ├── connection/           # BLE MIDI connection management
│   │   ├── hooks/
│   │   │   └── useConnection.ts
│   │   ├── services/
│   │   │   ├── BleManager.ts       # react-native-ble-plx wrapper
│   │   │   └── MidiService.ts      # MIDI message construction & sending
│   │   └── components/
│   │       └── ConnectionIndicator.tsx
│   ├── tones/                # Built-in tone browser
│   │   ├── screens/
│   │   │   └── ToneBrowserScreen.tsx
│   │   ├── components/
│   │   │   ├── CategoryPills.tsx    # Horizontal pill bar
│   │   │   └── ToneCard.tsx         # Individual tone card
│   │   └── hooks/
│   │       └── useTones.ts
│   ├── gm2/                  # GM2 tone browser
│   │   ├── screens/
│   │   │   └── GM2BrowserScreen.tsx
│   │   └── components/
│   │       └── GM2FamilySection.tsx
│   ├── favorites/            # Favorites management
│   │   ├── screens/
│   │   │   └── FavoritesScreen.tsx
│   │   └── hooks/
│   │       └── useFavorites.ts
│   └── presets/              # Preset management
│       ├── screens/
│       │   ├── PresetsScreen.tsx
│       │   └── PresetDetailScreen.tsx
│       ├── components/
│       │   └── PresetCard.tsx
│       └── hooks/
│           └── usePresets.ts
├── data/                     # Static data
│   ├── tones.json            # Built-in tone catalog (65 tones)
│   └── gm2-tones.json       # GM2 catalog (256 tones)
├── store/                    # Zustand stores
│   ├── connectionStore.ts
│   ├── performanceStore.ts
│   ├── favoritesStore.ts
│   └── presetsStore.ts
├── services/                 # Shared services
│   └── midi/
│       ├── midiEncoder.ts    # Construct MIDI bytes (CC, PC, SysEx)
│       ├── bleMidiPacket.ts  # BLE MIDI packet wrapping/unwrapping
│       └── constants.ts      # MIDI UUIDs, CC numbers, SysEx templates
└── theme/                    # Design system
    ├── colors.ts             # Dark theme palette
    ├── spacing.ts            # Layout constants
    └── typography.ts         # Font definitions
```

## First Run

```bash
# Start Metro bundler
npx react-native start

# Run on iOS device (not simulator — BLE required)
npx react-native run-ios --device
```

## Key Development Notes

1. **BLE MIDI requires a physical device** — the iOS simulator does not support Bluetooth
2. **FP-30X must be in Bluetooth pairing mode** — press Function + Bluetooth on the piano
3. **GM2 System On SysEx** — must send `F0 7E 7F 09 03 F7` and wait 50ms before GM2 tone selection
4. **All MIDI on channel 1** — status bytes use lower nibble 0x0
5. **Dark mode only** — no light theme, use `#000000` as base background
6. **Wake lock** — activate `KeepAwake` component in the root App component
