# Research: FP-30X Controller v2

**Phase 0 output** — resolves all NEEDS CLARIFICATION from plan.md.

## 1. Navigation: Top Tabs in Landscape

**Decision**: Use `@react-navigation/material-top-tabs` (backed by `react-native-tab-view`).

**Rationale**: The spec mandates "three top tabs, no bottom tab bar" in landscape orientation. `material-top-tabs` natively renders at the top, supports swipe gestures between tabs, and provides a `tabBar` render prop for complete custom styling (hardware synth segment buttons). It uses `react-native-pager-view` under the hood for smooth tab transitions.

**Alternatives considered**:
- `@react-navigation/bottom-tabs` with custom `tabBar` prop repositioned to the top — possible but semantically wrong and requires fighting the library's assumptions about tab positioning and safe areas.
- Custom implementation from scratch — unnecessary complexity; `material-top-tabs` already provides swipe, lazy initialization, and accessibility.

**Integration notes**:
- Install: `@react-navigation/material-top-tabs` + `react-native-pager-view`
- Custom `tabBar` renders as a row of hardware-style segment buttons (NativeWind styled)
- DISPLAY tab is the initial route (spec: "DISPLAY is the landing screen")
- Swipe between tabs is optional — can be disabled if it interferes with fader/slider gestures in Phase 4

## 2. LCD / Display Font Selection

**Decision**: **Orbitron** as the primary display font. **Inter** as the body/label font.

**Rationale**: Orbitron is a geometric sans-serif designed for display use with a strong "digital/futuristic" aesthetic. It reads well at various sizes, supports numbers and uppercase letters cleanly, and is available on Google Fonts under the Open Font License (OFL) — free for bundling. It's more legible than VT323 (which is a pixel font that doesn't scale well to large display sizes) and more "LCD-like" than Digital-7 (which has limited character support and licensing ambiguity).

**Alternatives considered**:
- **VT323** — authentic terminal/pixel aesthetic, but rasterized appearance at non-native sizes. Poor legibility for tone names at small sizes.
- **Digital-7** — very authentic LCD segmented look, but only supports digits and a few characters. Cannot render tone names. Licensing unclear (not on Google Fonts).
- **Share Tech Mono** — monospaced, techy, but too thin for display use.

**Integration notes**:
- Download Orbitron from Google Fonts (Regular + Bold weights)
- Bundle as custom font asset in React Native (`ios/` fonts directory + `react-native.config.js`)
- Configure in `theme/typography.ts` with NativeWind custom font family
- Use Orbitron for: BPM display, time signature, tone name, category name, volume readout
- Use Inter (system or bundled) for: labels, modal text, button text, body copy

## 3. BLE Notification Subscription Pattern

**Decision**: Callback-based subscription via `transport.subscribe(listener)`.

**Rationale**: `react-native-ble-plx`'s `monitorCharacteristicForDevice()` already returns a `Subscription` object (remove-on-cleanup pattern). Wrapping this in a `subscribe(callback): Unsubscribe` pattern on the Transport interface gives a clean, familiar API without introducing an event emitter library.

**Alternatives considered**:
- **EventEmitter** (e.g., `eventemitter3`) — adds a dependency for a pattern we can implement with a simple callback array. Over-engineering for a single event source.
- **RxJS Observable** — powerful but massive dependency, steep learning curve, overkill for this use case.
- **Zustand middleware** — putting notification parsing inside Zustand middleware would violate layer boundaries (store shouldn't know about transport).

**Flow**:
```
transport.subscribe(callback)
  → internally: monitorCharacteristicForDevice(deviceId, serviceUUID, charUUID, (error, char) => {
      const rawBytes = stripBleFraming(base64ToBytes(char.value));
      callback(rawBytes);
    })
  → returns: () => subscription.remove()
```

**Multiple listeners**: The transport maintains an array of listeners. Each notification is dispatched to all registered listeners. PianoService registers one listener on connect; ChordService may register a second for Note On/Off (Phase 3).

## 4. Tone Data Format Migration

**Decision**: Replace `data/tones.json` and `data/gm2Tones.json` (CC/PC format) with `engine/fp30x/tones.ts` (DT1 category/index format).

**Rationale**: The old JSON files store `bankMSB`, `bankLSB`, `programChange` values — these are CC/PC addressing that doesn't work over BLE. The DT1 protocol uses `category` (0–8), `indexHigh`, `indexLow`. The discovery doc provides the complete mapping (Sections 7–8). Storing tones as a TypeScript module (not JSON) enables type safety and tree-shaking.

**Migration**:
- Old: `{"id": "0-68-0", "name": "Concert Piano", "category": "piano", "bankMSB": 0, "bankLSB": 68, "programChange": 0}`
- New: `{ id: '0-0-0', name: 'Concert Piano', category: 0, categoryName: 'Piano', indexHigh: 0, indexLow: 0, position: 0, isGM2: false }`

The old `category` string field becomes a numeric DT1 byte. The old bank/PC fields are removed entirely.

## 5. Chord Detection Algorithm (Phase 3)

**Decision**: Held-notes set model with pitch-class interval analysis.

**Rationale**: Confirmed by the discovery doc (Section 6, "Architecture: Held-Notes Set model"). Each Note On adds to a `Set<number>`, each Note Off removes. On every change, extract pitch classes (note % 12), sort, compute intervals, and match against known chord templates.

**Known chord shapes** (pitch class intervals from root):
- Major: [0, 4, 7]
- Minor: [0, 3, 7]
- Diminished: [0, 3, 6]
- Augmented: [0, 4, 8]
- Major 7th: [0, 4, 7, 11]
- Minor 7th: [0, 3, 7, 10]
- Dominant 7th: [0, 4, 7, 10]
- (extensible with more shapes)

**Algorithm**:
1. Get pitch classes from held notes: `notes.map(n => n % 12)`
2. Remove duplicates (octave equivalence)
3. Try each pitch class as potential root
4. Compute intervals relative to root candidate
5. Match against chord templates
6. Display first match, or individual note names if no match

**Limitation**: Staccato (no note overlap) will never accumulate more than 1 note. This is acceptable per spec.
