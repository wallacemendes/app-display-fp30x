# Data Model: FP-30X Controller v2

**Source**: spec.md entities + roland-sysex-discovery.md protocol

## Entities

### Tone

A selectable piano sound from either the SuperNATURAL or GM2 catalog.

```typescript
interface Tone {
  /** Unique ID: "{category}-{indexHigh}-{indexLow}" e.g. "0-0-0" */
  id: string;
  /** Display name e.g. "Concert Piano" */
  name: string;
  /** DT1 category byte (0x00–0x08). See category table. */
  category: number;
  /** DT1 category display name e.g. "Piano", "E.Piano", "GM2" */
  categoryName: string;
  /** DT1 tone index high byte (0x00 for most; 0x01 for GM2 128+) */
  indexHigh: number;
  /** DT1 tone index low byte (0-based within category) */
  indexLow: number;
  /** Position within category (0-based, for +/- cycling) */
  position: number;
  /** Whether this is a GM2 tone (category === 0x08) */
  isGM2: boolean;
}
```

**Category table** (from discovery doc Section 6):

| category | Name | Count | Type |
|----------|------|-------|------|
| 0x00 | Piano | 12 | SuperNATURAL |
| 0x01 | E.Piano | 7 | SuperNATURAL |
| 0x02 | Organ | 13 | SuperNATURAL |
| 0x03 | Strings | 8 | SuperNATURAL |
| 0x04 | Pad | 7 | SuperNATURAL |
| 0x05 | Synth | 3 | SuperNATURAL |
| 0x06 | Other | 6 | SuperNATURAL |
| 0x07 | Drums | 9 | SuperNATURAL |
| 0x08 | GM2 | 256 | General MIDI 2 |

**Validation**: `category` 0–8, `indexHigh` 0–1, `indexLow` 0–127. GM2 index = `(indexHigh * 128) + indexLow`.

**Note**: The old `tones.json` used CC/PC bank values (bankMSB, bankLSB, programChange). These are **removed** in v2. The DT1 category/index format is the only tone addressing used.

---

### DeviceConnection

BLE MIDI connection session state.

```typescript
type ConnectionStatus =
  | 'idle'        // App launched, no scan attempted
  | 'scanning'    // Actively scanning for BLE devices
  | 'discovered'  // Device found, not yet connected
  | 'connecting'  // Connection in progress
  | 'connected'   // Active connection, notifications subscribed
  | 'disconnected'; // Was connected, lost connection

interface DeviceConnection {
  /** BLE peripheral ID (platform-assigned UUID) */
  deviceId: string | null;
  /** BLE advertised name (e.g. "FP-30X MIDI") */
  deviceName: string | null;
  /** Current connection state */
  status: ConnectionStatus;
  /** Last successful connection timestamp (ISO 8601) */
  lastConnectedAt: string | null;
  /** True until first successful connection this app session.
      Controls whether default preset auto-applies. */
  isFirstConnectionThisSession: boolean;
}
```

**State transitions**:
```
idle → scanning → discovered → connecting → connected
                                              ↓
connected → disconnected → connecting → connected  (auto-reconnect)
                              ↓
                    (max retries) → idle
```

**Persistence**: `deviceId`, `deviceName`, `lastConnectedAt` persisted via MMKV for auto-reconnect. `status` and `isFirstConnectionThisSession` are runtime-only.

---

### PerformanceState

Live mirror of the piano's current state. Updated by both outbound writes (app → piano) and inbound notifications (piano → app).

```typescript
interface PerformanceState {
  /** Currently active tone (full Tone object or null) */
  activeTone: Tone | null;
  /** Tone history stack for undo. Most recent at end. */
  toneHistory: Tone[];
  /** Currently applied preset ID (null if none) */
  activePresetId: string | null;
  /** Tone queued while disconnected (sent on connect) */
  pendingTone: Tone | null;
  /** Current volume (0–127). DT1 address: 01 00 02 13 */
  volume: number;
  /** Current tempo (BPM 20–250). DT1 address: 01 00 03 09 (2 bytes) */
  tempo: number;
  /** Metronome on/off. Read from: 01 00 01 0F */
  metronomeOn: boolean;
  /** Metronome beat (0=0/4, 1=2/4, 2=3/4, 3=4/4, 4=5/4, 5=6/4).
      DT1 address: 01 00 02 1F */
  metronomeBeat: number;
  /** Metronome pattern (0=Off, 1–7=rhythm subdivisions).
      DT1 address: 01 00 02 20 */
  metronomePattern: number;
  /** Metronome volume (0–10). DT1 address: 01 00 02 21 */
  metronomeVolume: number;
  /** Metronome tone (0=Click, 1=Electronic, 2=Japanese, 3=English).
      DT1 address: 01 00 02 22 */
  metronomeTone: number;
  /** Voice mode (0=Single, 1=Split, 2=Dual, 3=Twin).
      DT1 address: 01 00 02 00. Phase 3. */
  voiceMode?: number;
  /** Keyboard transpose (center=64, range 58–69 = -6 to +5).
      DT1 address: 01 00 03 07. Phase 3. */
  transpose?: number;
  /** Key touch (0=Fix..5=Super Heavy).
      DT1 address: 01 00 02 1D. Phase 3. */
  keyTouch?: number;
  /** Split point (MIDI note number). Phase 3. */
  splitPoint?: number;
  /** Balance (0–127, center=64). Phase 3. */
  balance?: number;
  /** Left/Tone2 tone. Phase 3. */
  leftTone?: Tone | null;
}
```

**Tone history stack**: Push on every tone change (from app or piano notification). `undo()` pops the last entry and sends DT1 for the previous tone. Clear on app launch.

**Nullable Phase 2+ fields**: `voiceMode`, `transpose`, `keyTouch`, `splitPoint`, `balance`, `leftTone` are optional — not populated until those phases are implemented.

---

### Preset

A saved batch of DT1 commands plus app-local state representing a complete performance setup.

```typescript
interface Preset {
  /** Unique ID (UUID v4) */
  id: string;
  /** User-assigned name */
  name: string;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last modified timestamp (ISO 8601) */
  updatedAt: string;
  /** Whether this is the default preset (auto-apply on first connect) */
  isDefault: boolean;
  /** Display order index (for reordering) */
  sortOrder: number;

  // — Captured parameters (DT1 values) —

  /** Tone to apply */
  tone: {
    category: number;
    indexHigh: number;
    indexLow: number;
  };
  /** Volume (0–127) */
  volume: number;
  /** Tempo (BPM) */
  tempo: number;
  /** Metronome state */
  metronomeOn: boolean;
  /** Metronome beat */
  metronomeBeat?: number;
  /** Metronome pattern */
  metronomePattern?: number;

  // — App-local state (not DT1) —

  /** Quick-tone slot assignments (3 slots). Each is a tone ID or null. */
  quickToneSlots: [string | null, string | null, string | null];

  // — Phase 3+ parameters (nullable) —

  /** Voice mode */
  voiceMode?: number;
  /** Left/Tone2 for Split/Dual */
  leftTone?: { category: number; indexHigh: number; indexLow: number };
  /** Split point */
  splitPoint?: number;
  /** Balance */
  balance?: number;
  /** Keyboard transpose */
  transpose?: number;
  /** Key touch */
  keyTouch?: number;
}
```

**Persistence**: Full preset objects stored in MMKV via Zustand persist. Array of presets with `sortOrder` for user-defined ordering.

**Apply**: Converts preset fields to DT1 messages and sends as a batch via `PianoService.applyPreset(preset)`.

---

### FavoriteTone

A reference to a tone marked as favorite. Stored separately from the tone catalog.

```typescript
interface FavoriteTone {
  /** Tone ID (matches Tone.id) */
  toneId: string;
  /** When favorited (ISO 8601) */
  addedAt: string;
  /** Display order (for reordering) */
  sortOrder: number;
}
```

**Persistence**: Array of `FavoriteTone` in MMKV. Supports both SN and GM2 tones in the same list.

---

### NotificationEvent

Typed event produced by the engine's notification parser. Consumed by PianoService to update stores.

```typescript
type NotificationEvent =
  | { type: 'tone'; category: number; indexHigh: number; indexLow: number }
  | { type: 'volume'; value: number }
  | { type: 'tempo'; bpm: number }
  | { type: 'metronomeState'; on: boolean }
  | { type: 'metronomeBeat'; value: number }
  | { type: 'metronomePattern'; value: number }
  | { type: 'metronomeVolume'; value: number }
  | { type: 'metronomeTone'; value: number }
  | { type: 'voiceMode'; value: number }
  | { type: 'transpose'; value: number }
  | { type: 'keyTouch'; value: number }
  | { type: 'splitPoint'; value: number }
  | { type: 'balance'; value: number }
  | { type: 'leftTone'; category: number; indexHigh: number; indexLow: number }
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'noteOff'; note: number }
  | { type: 'unknown'; address: number[]; data: number[] };
```

**Parser routing**: The engine maps DT1 address → event type:
- `01 00 02 13` → `volume`
- `01 00 02 07` + 3 bytes → `tone`
- `01 00 03 09` + 2 bytes → `tempo`
- `01 00 01 0F` → `metronomeState`
- `01 00 02 1F` → `metronomeBeat`
- MIDI `0x90` → `noteOn`, `0x80` → `noteOff`
- Unrecognized address → `unknown` (logged, not crashed)

---

### DeviceIdentity

Returned by the transport after an Identity Request. Used by the engine registry to select the correct engine.

```typescript
interface DeviceIdentity {
  /** Roland manufacturer ID (0x41) */
  manufacturerId: number;
  /** Device ID (0x10 for FP-30X) */
  deviceId: number;
  /** Family code bytes [0x19, 0x03] */
  familyCode: [number, number];
  /** DT1/RQ1 model ID (discovered via RQ1 scan) */
  modelId: number[];
  /** Firmware string (e.g. "CP005_0001_GL") */
  firmware?: string;
}
```

---

### HeldNotes (Phase 3)

Transient set of currently pressed MIDI note numbers for chord detection.

```typescript
interface HeldNotes {
  /** Set of currently held MIDI note numbers */
  notes: Set<number>;
}
```

**State transitions**:
- Note On (velocity > 0) → add note to set → re-analyze chord
- Note Off (or Note On velocity 0) → remove note from set → re-analyze chord
- 0 notes → clear display
- 1 note → show note name
- 2 notes → show interval
- 3+ notes → attempt chord identification

**Not persisted**. Runtime-only. Managed by `ChordService`.

---

### AppSettings

User preferences persisted across sessions.

```typescript
interface AppSettings {
  /** Theme preference */
  theme: 'system' | 'light' | 'dark';
  /** Last-used tone category index (restored on launch) */
  lastCategoryIndex: number;
  /** Default preset ID (auto-apply on first connect) */
  defaultPresetId: string | null;
}
```

## Relationships

```
DeviceConnection ──connects──→ DeviceIdentity ──selects──→ PianoEngine
                                                              │
PianoEngine ──owns──→ ToneCatalog (array of Tone)             │
PianoEngine ──builds──→ DT1/RQ1 SysEx messages                │
PianoEngine ──parses──→ NotificationEvent                     │
                                                              │
PianoService ──uses──→ PianoEngine + Transport                │
PianoService ──updates──→ PerformanceState (store)            │
                                                              │
PerformanceState.activeTone ──references──→ Tone              │
PerformanceState.toneHistory ──array of──→ Tone               │
FavoriteTone.toneId ──references──→ Tone.id                   │
Preset.tone ──DT1 bytes matching──→ Tone (category+index)     │
Preset.isDefault ──read by──→ ConnectionService (auto-apply)  │
HeldNotes ──analyzed by──→ ChordService → chord display       │
```
