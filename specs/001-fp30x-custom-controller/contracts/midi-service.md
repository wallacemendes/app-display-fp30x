# MIDI Service Contract: FP-30X Custom Controller

**Branch**: `001-fp30x-custom-controller` | **Date**: 2026-03-31

This document defines the interface contract between the app and the Roland FP-30X digital piano via BLE MIDI.

## BLE MIDI Connection

### Service Discovery

| Item | Value |
|------|-------|
| MIDI Service UUID | `03B80E5A-EDE8-4B33-A751-6CE34EC4C700` |
| MIDI Characteristic UUID | `7772E5DB-3868-4112-A1A9-F2669D10959A` |
| Characteristic properties | Write Without Response, Notify |

### Device Identification

The FP-30X is identified via MIDI Identity Reply (SysEx):
```
F0 7E 10 06 02 41 19 03 00 00 00 00 01 00 00 F7
   │        │  │  │──┘
   │        │  │  └─ Device Family (FP-30X)
   │        │  └──── Manufacturer ID (Roland = 41H)
   │        └─────── Identity Reply sub-ID
   └──────────────── Universal Non-Realtime
```

## MIDI Messages — Phase 1 (MVP)

### Tone Selection

Sequence: Bank Select MSB → Bank Select LSB → Program Change (all on channel 1).

```
CC 0  [value: bankMSB]    # Bank Select MSB (status: 0xB0, data1: 0x00)
CC 32 [value: bankLSB]    # Bank Select LSB (status: 0xB0, data1: 0x20)
PC    [value: programChange]  # Program Change (status: 0xC0)
```

**Timing**: No delay required between messages in the sequence.

### GM2 System On (required before GM2 tone selection)

```
F0 7E 7F 09 03 F7    # Universal Non-Realtime: GM2 System On
```

**Timing**: 50ms delay MUST be observed after this message before sending any subsequent MIDI messages. The piano needs time to reconfigure its sound engine.

### Preset Batch Apply

When applying a preset, messages are sent in this order:
1. GM2 System On (if preset tone is GM2) + 50ms delay
2. Bank Select MSB (CC 0)
3. Bank Select LSB (CC 32)
4. Program Change

Phase 2 extends this with CC 7, CC 10, CC 11, CC 91, CC 93 after the tone selection.

## MIDI Messages — Phase 2 (Parameter Controls)

### Control Change Messages

| Parameter | CC# | Status Byte | Range | Default |
|-----------|-----|-------------|-------|---------|
| Volume | 7 | 0xB0 | 0–127 | 100 |
| Pan | 10 | 0xB0 | 0–127 (64=center) | 64 |
| Expression | 11 | 0xB0 | 0–127 | 127 |
| Reverb Send | 91 | 0xB0 | 0–127 | 40 |
| Chorus Send | 93 | 0xB0 | 0–127 | 0 |

All sent on MIDI channel 1 (status byte lower nibble = 0x0).

## MIDI Messages — Phase 3 (SysEx — Future)

### Master Volume (Universal Realtime SysEx)

```
F0 7F 7F 04 01 [LSB] [MSB] F7
```

### Master Fine Tuning (Universal Realtime SysEx)

```
F0 7F 7F 04 03 [LSB] [MSB] F7
```
Range: 0x00 0x00 (-100 cents) to 0x7F 0x7F (+100 cents). Center = 0x00 0x40.

### Master Coarse Tuning (Universal Realtime SysEx)

```
F0 7F 7F 04 04 00 [semitones] F7
```
Range: 0x28 (-24 semitones) to 0x58 (+24 semitones). Center = 0x40.

### Sound Shaping CCs (Phase 3)

| Parameter | CC# | Range |
|-----------|-----|-------|
| Portamento Time | 5 | 0–127 |
| Portamento On/Off | 65 | 0=Off, 127=On |
| Resonance | 71 | 0–127 (64=default) |
| Release Time | 72 | 0–127 (64=default) |
| Attack Time | 73 | 0–127 (64=default) |
| Cutoff/Brightness | 74 | 0–127 (64=default) |
| Decay Time | 75 | 0–127 (64=default) |
| Vibrato Rate | 76 | 0–127 (64=default) |
| Vibrato Depth | 77 | 0–127 (64=default) |
| Vibrato Delay | 78 | 0–127 (64=default) |

### Global Parameter Control — Reverb (Phase 3)

```
F0 7F 7F 04 05 01 01 01 01 [type_or_time] [value] F7
```
Reverb types: 0=Small Room, 1=Medium Room, 2=Large Room, 3=Medium Hall, 4=Large Hall, 5=Plate

### Global Parameter Control — Chorus (Phase 3)

```
F0 7F 7F 04 05 01 01 01 02 [param] [value] F7
```
Parameters: 0=type, 1=mod rate, 2=mod depth, 3=feedback, 4=send-to-reverb

### Panic / Utility Messages

| Message | CC# | Value | Purpose |
|---------|-----|-------|---------|
| All Sounds Off | 120 | 0 | Emergency silence |
| Reset All Controllers | 121 | 0 | Reset all CCs to defaults |
| All Notes Off | 123 | 0 | Stop all sounding notes |

## BLE MIDI Packet Format

All MIDI messages must be wrapped in the BLE MIDI packet format:

```
[Header] [Timestamp] [MIDI Status] [Data...]
```

- **Header byte**: Bit 7 = 1, Bit 6 = timestamp high bit, Bits 5–0 = timestamp bits 12–7
- **Timestamp byte**: Bit 7 = 1, Bits 6–0 = timestamp bits 6–0
- Multiple MIDI messages can be packed into a single BLE packet (running status applies)
- Maximum BLE packet size: typically 20 bytes (may negotiate larger MTU)

For SysEx messages spanning multiple BLE packets, the continuation format applies (no header/timestamp between F0 and F7).
