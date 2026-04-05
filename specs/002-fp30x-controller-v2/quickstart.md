# Quickstart: FP-30X Controller v2

How to navigate the architecture and start working on a feature.

## Architecture at a Glance

```
bootstrap.ts → creates + wires services (runs once before React mounts)
     ↓
screens/ → hooks/ → services/ → engine/ + transport/ → store/
   UI         bridge    orchestration    domain + infra     state
```

**Rule**: Each layer only talks to the layer below it. Screens never import from engine/ or transport/.

## Service Bootstrap (CRITICAL — must understand this first)

Before any React component mounts, `src/app/bootstrap.ts` runs:

```
bootstrap()
  1. new BleTransport()
  2. new PianoService()
  3. new ConnectionService(transport)
  4. connectionService.setPianoService(pianoService)
  5. connectionService.setNotificationHandler(pianoService.handleNotification)
  6. setConnectionService(connectionService)  ← wires useConnection hook
  7. setPianoService(pianoService)             ← wires usePiano hook
```

**Why this matters**: Without bootstrap, every hook action (changeTone, connect, etc.) silently no-ops because the service reference is null. If you see hooks returning but doing nothing, check that bootstrap ran.

**Called from**: Top of `App.tsx`, before the component definition (`bootstrap()` at module level).

## "I want to send a command to the piano"

1. Your screen calls a hook: `const { changeTone } = usePiano()`
2. The hook calls the service: `PianoService.changeTone(tone)`
3. The service asks the engine: `engine.buildToneChange(tone)` → gets SysEx bytes
4. The service sends via transport: `transport.send(sysexBytes)`
5. The transport wraps in BLE framing and writes to the characteristic

## "The piano sent a notification"

1. Transport's BLE monitor fires, strips framing (including running status reconstruction), calls registered listener
2. ConnectionService receives raw bytes via its subscription
3. If `pendingStateRead` is true (waiting for RQ1 response): routes through `engine.parseStateResponse()` → returns `NotificationEvent[]`
4. Otherwise: routes through `engine.parseNotification()` → returns single `NotificationEvent`
5. Each event is dispatched to `pianoService.handleNotification(event)`
6. PianoService routes to the correct store: `performanceStore.setVolume(52)`
7. Screen re-renders via selective Zustand subscription

## "I want to add a new piano model"

1. Create `src/engine/<model>/` directory
2. Implement `PianoEngine` interface (see `contracts/piano-engine.ts`)
3. Fill in: addresses, tone catalog, SysEx builders, notification parser
4. Register in `src/engine/registry.ts`
5. Done. No changes to services, transport, screens, or stores.

## "I want to test if services are wired correctly"

Fastest smoke test after bootstrap changes:
1. Add `console.log('bootstrap complete')` at end of `bootstrap()`
2. In any screen, check: `const { changeTone } = usePiano()` — if `changeTone` does nothing, bootstrap didn't run
3. Check `useConnection()` — if `scan()` does nothing, `setConnectionService` was never called

## Key Files

| File | Purpose |
|------|---------|
| `app/bootstrap.ts` | Service initialization + wiring (runs before React) |
| `engine/types.ts` | PianoEngine interface + shared types |
| `engine/fp30x/FP30XEngine.ts` | FP-30X implementation |
| `engine/fp30x/sysex.ts` | DT1/RQ1 message builders + checksum |
| `engine/fp30x/parser.ts` | Notification parser |
| `engine/fp30x/tones.ts` | Complete tone catalog (321 tones) |
| `engine/fp30x/addresses.ts` | DT1 address map |
| `transport/types.ts` | Transport interface |
| `transport/ble/BleTransport.ts` | BLE implementation |
| `transport/ble/framing.ts` | BLE MIDI packet wrap/unwrap |
| `services/PianoService.ts` | Core facade (engine + transport) |
| `services/ConnectionService.ts` | Connection lifecycle |
| `store/performanceStore.ts` | Live piano state mirror |

## Protocol Reference

- **Primary**: `docs/roland-sysex-discovery.md` — DT1/RQ1 addresses, tone maps, BLE framing, checksum
- **Secondary**: `docs/FP-30X_MIDI_Imple_eng01_W.md` — GM2 tone list, Universal SysEx

## Commands

```bash
npm test               # Run Jest unit tests
npm run lint           # ESLint
npx prettier --check . # Format check
npm run dev            # Start Metro bundler
```

## Testing a DT1 Change

The fastest way to verify the engine works:

```typescript
// In a test file:
import { FP30XEngine } from '../engine/fp30x/FP30XEngine';

const engine = new FP30XEngine();
const sysex = engine.buildToneChange(
  engine.tones.categories[0].tones[0] // Concert Piano
);
// Expected: [0xF0, 0x41, 0x10, 0x00, 0x00, 0x00, 0x28, 0x12,
//            0x01, 0x00, 0x02, 0x07, 0x00, 0x00, 0x00, 0x76, 0xF7]
```

## Phases

| Phase | Focus | Key Deliverables |
|-------|-------|-----------------|
| 1 | Core Display | Engine, transport, connection, tone selector, status bar |
| 2 | Favorites & Presets | Favorites store, preset CRUD, quick-tone slots, auto-apply |
| 3 | Live Performance | Chord detection, Split/Dual, transpose, key touch |
| 4 | Pads & Advanced | Performance pads, full metronome control |
| 5 | Import/Export | Preset file export/import |
