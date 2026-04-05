# Research: FP-30X Controller v2

**Phase 0 output** — resolves all NEEDS CLARIFICATION from plan.md.

---

## Original Research (v2 Planning)

### 1. Navigation: Top Tabs in Landscape

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

### 2. LCD / Display Font Selection

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

### 3. BLE Notification Subscription Pattern

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

### 4. Tone Data Format Migration

**Decision**: Replace `data/tones.json` and `data/gm2Tones.json` (CC/PC format) with `engine/fp30x/tones.ts` (DT1 category/index format).

**Rationale**: The old JSON files store `bankMSB`, `bankLSB`, `programChange` values — these are CC/PC addressing that doesn't work over BLE. The DT1 protocol uses `category` (0–8), `indexHigh`, `indexLow`. The discovery doc provides the complete mapping (Sections 7–8). Storing tones as a TypeScript module (not JSON) enables type safety and tree-shaking.

**Migration**:
- Old: `{"id": "0-68-0", "name": "Concert Piano", "category": "piano", "bankMSB": 0, "bankLSB": 68, "programChange": 0}`
- New: `{ id: '0-0-0', name: 'Concert Piano', category: 0, categoryName: 'Piano', indexHigh: 0, indexLow: 0, position: 0, isGM2: false }`

The old `category` string field becomes a numeric DT1 byte. The old bank/PC fields are removed entirely.

### 5. Chord Detection Algorithm (Phase 3)

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

---

## Remediation Research (Code Review Findings)

### 6. Service Bootstrap Pattern for React Native

**Decision**: Module-level initialization function in `src/app/bootstrap.ts`, called from `App.tsx` before first render.

**Rationale**: The current codebase uses nullable module-level singletons with setter functions (`let connectionService: ConnectionService | null = null` + `setConnectionService()`). This pattern is valid but requires an explicit initialization step that was never implemented. The bootstrap function creates all service instances and calls every setter.

**Alternatives considered**:
- **React Context + Provider**: Wrap services in a Context provider. Rejected because services are not React-specific — they manage BLE connections and MIDI parsing independently of the component tree. Context would couple services to React lifecycle unnecessarily.
- **Dependency Injection container**: e.g., `tsyringe` or `inversify`. Rejected per Constitution Principle VII (Simplicity). The app has exactly 3 services — a DI container is unjustified complexity.
- **useEffect in App.tsx**: Initialize services in a top-level effect. Rejected because useEffect runs after first render, creating a window where hooks return null. Module-level init runs before any component mounts.

**Implementation**:
```typescript
// src/app/bootstrap.ts
import { BleTransport } from '../transport/ble/BleTransport';
import { ConnectionService } from '../services/ConnectionService';
import { PianoService } from '../services/PianoService';
import { setConnectionService } from '../hooks/useConnection';
import { setPianoService } from '../hooks/usePiano';

let initialized = false;

export function bootstrap(): void {
  if (initialized) return;
  
  const transport = new BleTransport();
  const pianoService = new PianoService();
  const connectionService = new ConnectionService(transport);
  
  // Wire services together
  connectionService.setPianoService(pianoService);
  connectionService.setNotificationHandler(
    (event) => pianoService.handleNotification(event)
  );
  
  // Wire hooks
  setConnectionService(connectionService);
  setPianoService(pianoService);
  
  initialized = true;
}
```

**Call site**: Top of `App.tsx` before component definition: `bootstrap()`.

### 7. RQ1 Response Routing Strategy

**Decision**: Route RQ1 DT1 responses through `engine.parseStateResponse()` and dispatch each event via `pianoService.handleNotification()`.

**Rationale**: The engine already implements `parseStateResponse()` which decomposes bulk RQ1 response blocks into individual `NotificationEvent[]`. The method exists but was never called. Two routing strategies were evaluated:

**Option A — Detect in ConnectionService** (chosen):
After sending RQ1, the next DT1 notification(s) on the subscribed characteristic are the RQ1 responses. ConnectionService can temporarily switch its notification handler to use `parseStateResponse()` instead of `parseNotification()` for the expected response window.

**Option B — Detect in parser**:
Modify `parseNotification()` to detect multi-byte DT1 payloads (bulk response) and automatically delegate to `parseStateResponse()`. Simpler but mixes concerns.

**Decision**: Option A. ConnectionService knows when it sent an RQ1 and can expect the response. This keeps the parser stateless.

**Implementation detail**: After sending the two RQ1 requests (performance block + tempo/metronome), ConnectionService sets a `pendingStateRead = true` flag. The next DT1 notifications with matching base addresses are routed through `parseStateResponse()`. After both responses are processed, `pendingStateRead = false` and normal `parseNotification()` routing resumes.

### 8. NativeWind Migration Strategy

**Decision**: Incremental migration, starting with theme tokens and shared components, then screens one at a time.

**Rationale**: NativeWind v4 is already installed (`^4.2.3` in package.json) but never used — all screens use inline `StyleSheet.create` patterns. A big-bang migration of ~15 files risks regressions and is hard to review. Incremental migration allows each screen to be verified independently.

**Migration steps per file**:
1. Replace `StyleSheet.create({...})` with NativeWind `className` props
2. Replace dynamic style objects with NativeWind conditional classes (e.g., `className={isDark ? 'bg-black' : 'bg-steel-100'}`)
3. Replace theme hook color lookups with NativeWind CSS variables (`var(--color-primary)`)
4. Replace `...typography.lcdDisplay` spreads with NativeWind font classes (`className="font-orbitron text-2xl"`)

**Theme token conversion**:
- `colors.ts`: Convert palette to CSS custom properties in `global.css`, extend `tailwind.config.js` with custom color names
- `typography.ts`: Convert font families to Tailwind `fontFamily` extension, remove TextStyle exports

**Verification**: Each migrated file should have zero `StyleSheet.create` usage and pass visual regression on device.

**Risk**: NativeWind v4 has known issues with certain RN 0.76 patterns. If blockers are found during migration, document in Complexity Tracking and consider deferring to a constitution amendment.

### 9. MIDI Running Status Reconstruction

**Decision**: Track last status byte in `stripBleFraming()` and reconstruct running status messages.

**Rationale**: MIDI running status allows senders to omit the status byte when it's the same as the previous message. The FP-30X may use running status for rapid Note On/Off sequences (e.g., chord releases). Current code skips these bytes entirely.

**Algorithm**:
```
let lastStatusByte = 0;
for each byte in payload:
  if byte >= 0x80:
    lastStatusByte = byte  // new status
    // parse message using this status byte
  else:
    // data byte where status expected = running status
    // reconstruct: [lastStatusByte, byte, nextByte]
```

**Special cases**:
- System messages (0xF0-0xFF) do NOT participate in running status
- Running status resets at start of each BLE MIDI packet (per BLE MIDI spec section 3)
- Running status is only valid for channel messages (0x80-0xEF)

**Testing**: Create test with two Note On messages where the second omits the status byte. Verify both parse correctly.

### 10. CC/PC Echo Handling

**Decision**: Parse CC (0xB0) and PC (0xC0) messages in `parseNotification()` and emit them as diagnostic events.

**Rationale**: Constitution Principle IV says "CC/PC does NOT work over BLE" for parameter *control*, but the piano may still *echo* CC/PC messages in response to DT1 writes or physical control changes. Silently discarding them (current behavior) makes debugging harder. Parsing them into typed events allows logging and future use.

**New event types**:
```typescript
| { type: 'controlChange'; channel: number; controller: number; value: number }
| { type: 'programChange'; channel: number; program: number }
```

**Handling in PianoService**: Log at debug level. Do not update stores (CC/PC are informational only for the FP-30X BLE context).

### 11. File Picker for Preset Import (React Native)

**Decision**: Use `react-native-document-picker` for file import.

**Rationale**: The import stub mentions "file picking requires an additional native module." `react-native-document-picker` is the standard solution for React Native file picking on iOS — it wraps `UIDocumentPickerViewController`, supports filtering by file type (UTI), and works offline.

**Alternatives considered**:
- `expo-document-picker` — requires Expo runtime, which this project doesn't use.
- `react-native-fs` + custom UI — lower-level, requires building the entire picker UI manually. Over-engineering.
- `Share` API for receiving files — works for "Open with" flows but doesn't provide an in-app file browser.

**Integration**:
```bash
npm install react-native-document-picker
cd ios && pod install
```

**Import flow**:
1. User taps "Import" button
2. `DocumentPicker.pick({ type: ['public.json'] })` opens iOS file picker
3. Read selected file contents via `react-native-fs` or `fetch(fileUri)`
4. Parse JSON → validate schema → detect conflicts → show conflict modal → merge

**File format**: JSON with `{ version: 1, presets: Preset[] }` (already defined in `PresetService.ts`).

### 12. Preset Reorder UI Library

**Decision**: Use `react-native-draggable-flatlist` for drag-to-reorder in PresetsScreen.

**Rationale**: React Native's FlatList doesn't support drag-to-reorder natively. `react-native-draggable-flatlist` is the standard community solution — it wraps `react-native-gesture-handler` and `react-native-reanimated` (both likely already installed for navigation), provides a `DraggableFlatList` component with `onDragEnd` callback, and handles all gesture/animation complexity.

**Alternatives considered**:
- Manual implementation with PanResponder — complex, error-prone, poor accessibility.
- Simple "move up / move down" buttons — works but feels dated; drag is the expected mobile UX for reordering.
- `@shopify/flash-list` with reorder — FlashList doesn't natively support drag-to-reorder.

**Integration**:
```bash
npm install react-native-draggable-flatlist
```

**Usage in PresetsScreen**:
```tsx
<DraggableFlatList
  data={presets}
  keyExtractor={(item) => item.id}
  renderItem={({ item, drag }) => (
    <PresetCard preset={item} onLongPress={drag} />
  )}
  onDragEnd={({ data }) => reorderPresets(data)}
/>
```
