# Roland Digital Piano — SysEx Protocol Discovery

> **Reverse-engineered from the Roland FP-30X (firmware CP005_0001_GL) on 2026-04-03.**
> Protocol captured via Apple PacketLogger from the official Roland Piano App (iOS).
> This document is intended to be reusable for any compatible Roland digital piano.

---

## Table of Contents

1. [Background](#1-background)
2. [Key Discovery: Standard MIDI Does Not Work Over BLE](#2-key-discovery-standard-midi-does-not-work-over-ble)
3. [BLE MIDI Framing](#3-ble-midi-framing) — incl. BLE characteristic layout & Piano→App notifications
4. [Roland SysEx Protocol — General](#4-roland-sysex-protocol--general)
5. [Device Identification](#5-device-identification)
6. [DT1 Tone Selection — The Core Discovery](#6-dt1-tone-selection--the-core-discovery) — incl. Note On/Off & chord detection architecture
7. [Complete SuperNatural Tone Map](#7-complete-supernatural-tone-map)
8. [Complete GM2 Tone Map](#8-complete-gm2-tone-map)
9. [Universal SysEx Messages (Documented)](#9-universal-sysex-messages-documented)
10. [Adapting to Other Roland Pianos](#10-adapting-to-other-roland-pianos)
11. [Methodology — How to Reverse-Engineer a New Model](#11-methodology--how-to-reverse-engineer-a-new-model)
12. [Appendix A: Roland Checksum Algorithm](#appendix-a-roland-checksum-algorithm)
13. [Appendix B: Raw PacketLogger Captures](#appendix-b-raw-packetlogger-captures)

---

## 1. Background

The Roland FP-30X is a digital piano that connects to iOS/Android via Bluetooth Low Energy (BLE) MIDI. Roland provides an official "Piano App" that can change tones, adjust settings, and read the piano's state over BLE.

The FP-30X MIDI Implementation document (`FP-30X_MIDI_Imple_eng01_W.pdf`) describes standard MIDI messages (Note On/Off, CC, Program Change, Bank Select) and a handful of Universal SysEx messages. However, **this document is incomplete** — it does not describe how tone selection actually works over BLE.

This document records our reverse-engineering findings, providing the undocumented protocol needed to build third-party controller apps.

---

## 2. Key Discovery: Standard MIDI Does Not Work Over BLE

### What We Proved

| Method | SysEx (F0...F7) | Channel Messages (CC, PC) |
|--------|:---:|:---:|
| BLE (react-native-ble-plx) | WORKS | IGNORED |
| BLE (iOS CoreMIDI) | WORKS | IGNORED |
| USB (sendmidi from Mac) | Not tested conclusively | IGNORED |

**Standard MIDI channel voice messages (CC 0, CC 32, Program Change) are silently ignored by the FP-30X when received over BLE.** The piano acknowledges the BLE MIDI connection and processes SysEx, but all channel messages have no effect on the internal tone engine.

### What Does Work

Roland's official Piano App uses **Roland-proprietary DT1 (Data Set 1) SysEx messages** to directly write to the piano's internal parameter memory. This is the same protocol used across many Roland instruments but is **not documented** in the FP-30X MIDI Implementation sheet.

### Verification Tests

We confirmed SysEx parameter control with these tests:

| Test | SysEx Message | Result |
|------|--------------|--------|
| GM2 System On | `F0 7E 7F 09 03 F7` | Piano resets to GM2 Piano 1 |
| Master Volume → 0 | `F0 7F 7F 04 01 00 00 F7` | Piano goes silent |
| Master Volume → 127 | `F0 7F 7F 04 01 00 7F F7` | Piano returns to full volume |
| Master Coarse Tuning | `F0 7F 7F 04 04 00 38 F7` | Pitch drops audibly (sound engine only — see note below) |
| DT1 Tone Change | See Section 6 | Piano changes tone |

---

## 3. BLE MIDI Framing

BLE MIDI wraps MIDI messages in a specific packet format before writing to the MIDI characteristic (UUID: `7772E5DB-3868-4112-A1A9-F2669D106BF3`).

### Standard Messages

```
[Header] [Timestamp] [MIDI Status] [MIDI Data...]
```

**Example — Note On (middle C, velocity 100):**
```
BLE packet:  80  80  90  3C  64
             ^^  ^^  ^^  ^^  ^^
             |   |   |   |   Velocity (100)
             |   |   |   Note (60 = middle C)
             |   |   MIDI Note On, channel 1
             |   Timestamp low byte
             Header byte
```

**Example — Program Change (program 16):**
```
BLE packet:  80  80  C0  10
             ^^  ^^  ^^  ^^
             |   |   |   Program number (16)
             |   |   MIDI Program Change, channel 1
             |   Timestamp
             Header
```

### SysEx Messages

SysEx has a special framing — the `F7` end byte gets its own timestamp:

```
[Header] [Timestamp] F0 [SysEx payload...] [Timestamp] F7
```

**Example — GM2 System On:**
```
Raw MIDI:    F0  7E  7F  09  03  F7

BLE packet:  80  80  F0  7E  7F  09  03  80  F7
             ^^  ^^  ^^                  ^^  ^^
             |   |   SysEx start         |   SysEx end
             |   Timestamp               Timestamp (F7 gets its own!)
             Header
```

**Example — Roland DT1 tone change (Concert Piano):**
```
Raw SysEx:   F0  41  10  00  00  00  28  12  01  00  02  07  00  00  00  76  F7

BLE packet:  BF  B2  F0  41  10  00  00  00  28  12  01  00  02  07  00  00  00  76  B2  F7
             ^^  ^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^  ^^
             |   |   SysEx payload (unchanged)                                       |   End
             |   Timestamp                                                           Timestamp
             Header
```

### Header Byte

```
Bit 7: Always 1
Bit 6: Reserved (1)
Bits 5-0: Timestamp high bits

Example: 0xBF = 10_111111 → timestamp high = 0x3F
Example: 0x80 = 10_000000 → timestamp high = 0x00
```

### Timestamp Byte

```
Bit 7: Always 1
Bits 6-0: Timestamp low bits (milliseconds, 0-127)

Example: 0xB2 = 1_0110010 → timestamp low = 0x32 = 50ms
Example: 0x80 = 1_0000000 → timestamp low = 0x00 = 0ms
```

**Important:** When using iOS CoreMIDI (via `MIDISend`), the BLE MIDI framing is handled automatically — you send raw MIDI bytes and CoreMIDI wraps them. When using raw BLE writes (e.g., react-native-ble-plx), you must construct the framing manually.

### BLE Characteristic Layout (FP-30X)

The FP-30X exposes three characteristics under the BLE MIDI service (`03B80E5A-EDE8-4B33-A751-6CE34EC4C700`):

| UUID | Type | R | W | WnR | Notify | Purpose |
|------|------|---|---|-----|--------|---------|
| `7772e5db-3868-4112-a1a9-f2669d106bf3` | BLE MIDI | ✓ | ✓ | ✓ | ✓ | **Use this for everything** |
| `49535343-aca3-481c-91ec-d85e28a60318` | ISSC UART TX | — | ✓ | — | ✓ | Ignore |
| `49535343-8841-43f4-a8d4-ecbe34729bb3` | ISSC UART RX | — | ✓ | — | — | Ignore |

The ISSC UART characteristics are exposed by the BLE chip's default firmware but carry no MIDI data. The BLE MIDI characteristic is the only one that matters.

**Selection strategy (react-native-ble-plx):**
- **Write char**: first characteristic with `isWritableWithoutResponse = true`
- **Notify char**: first characteristic with `isNotifiable = true AND isWritableWithoutResponse = true`

Both resolve to the same UUID: `7772e5db-3868-4112-a1a9-f2669d106bf3`.

---

## 4. Roland SysEx Protocol — General

Roland instruments use a proprietary SysEx protocol with two key commands:

### DT1 — Data Set 1 (Write Parameters)

Writes data to a parameter address on the instrument.

```
F0  41  [DevID]  [Model ID (4 bytes)]  12  [Addr (4 bytes)]  [Data...]  [Checksum]  F7
^^  ^^  ^^^^^^   ^^^^^^^^^^^^^^^^^^^   ^^  ^^^^^^^^^^^^^^^^   ^^^^^^^^   ^^^^^^^^^^
|   |   |        |                     |   |                  |          Roland checksum
|   |   |        |                     |   |                  Data bytes to write
|   |   |        |                     |   4-byte parameter address
|   |   |        |                     DT1 command (0x12)
|   |   |        Model-specific identifier
|   |   Device ID (usually 0x10)
|   Roland manufacturer ID
SysEx start
```

### RQ1 — Request Data 1 (Read Parameters)

Requests data from an address. The instrument responds with a DT1 containing the data.

```
F0  41  [DevID]  [Model ID (4 bytes)]  11  [Addr (4 bytes)]  [Size (4 bytes)]  [Checksum]  F7
                                        ^^                    ^^^^^^^^^^^^^^^^
                                        RQ1 command (0x11)    How many bytes to read
```

### Checksum Calculation

See [Appendix A](#appendix-a-roland-checksum-algorithm).

---

## 5. Device Identification

### Identity Request / Reply

Send the Universal Non-Realtime Identity Request to discover the device:

**Request:**
```
F0 7E 7F 06 01 F7
```

**FP-30X Reply:**
```
F0 7E 10 06 02 41 19 03 00 00 1C 01 00 00 F7
```

| Field | Bytes | Value | Meaning |
|-------|-------|-------|---------|
| Manufacturer | `41` | 65 | Roland Corporation |
| Device ID | `10` | 16 | Default Roland device ID |
| Family Code | `19 03` | 0x0319 | Digital Piano family |
| Family Member | `00 00` | 0x0000 | Base model |
| Firmware Version | `1C 01 00 00` | — | Software revision |

### Two-Tier Model Architecture (`0x28` vs `0x19`)

The FP-30X uses **two separate model IDs** for parameter access, representing different abstraction layers:

| Model ID | Namespace | Granularity | Used by |
|----------|-----------|-------------|---------|
| `00 00 00 28` | **User-facing parameters** | Named presets, logical groupings | Roland Piano App |
| `00 00 00 19` | **Raw DSP parameters** | Fine-grained numeric values | Roland Piano Designer |

**Both model IDs write to the same underlying hardware.** Writing to one automatically syncs the other — the piano echoes the updated value in the other model's namespace.

#### Example: Key Touch sensitivity

- **Model `0x28`**, address `01 00 02 1D`: 6 named presets (0=Fix, 1=Super Light, 2=Light, 3=Medium, 4=Heavy, 5=Super Heavy)
- **Model `0x19`**, address `01 00 00 0B`: 100-level continuous control (0–99)

The named presets map to anchor points in the raw range:

```
0x28 preset    → 0x19 raw value
Fix (0)        →   0
Super Light(1) →  10
Light (2)      →  30
Medium (3)     →  50
Heavy (4)      →  70
Super Heavy(5) →  90
```

Values between anchor points (1–9, 11–29, etc.) provide intermediate sensitivity. Roland Piano Designer sends incremental writes to `0x19` address `01 00 00 0B` (value 1, 2, 3...) for 100-step slider control.

**Sync behavior:**
- Write `0x28` preset 3 (Medium) → piano echoes `0x19` raw 50
- Write `0x19` raw 1 → piano rounds to nearest preset, echoes `0x28` value 1 (Super Light)

**Implication:** any parameter that also exists in the `0x19` namespace can be set with finer precision than the Roland Piano App allows. For our app, the `0x28` namespace is sufficient — but `0x19` is available for advanced/future features.

### Model ID Discovery (via RQ1)

The DT1/RQ1 Model ID is **not the same** as the Identity Reply family code. It must be discovered separately.

**Method:** Send RQ1 to address `01 00 00 00` with size `00 00 00 01` using candidate model IDs. The correct one gets a DT1 response.

**FP-30X confirmed Model ID:** `00 00 00 28`

**Discovery scan result:**
```
Sent:     F0 41 10 00 00 00 28 11 01 00 00 00 00 00 00 01 7E F7
                ^^^^^^^^^^^^^^^^
                Model ID 0x28
Received: F0 41 10 00 00 00 28 12 01 00 00 00 43 3C F7
```

### Firmware Identifier

Reading 16 bytes from address `01 00 00 00` returns the firmware string:

```
Address: 01 00 00 00
Data:    43 50 30 30 35 5F 30 30 30 31 5F 47 4C 20 20 20
ASCII:   C  P  0  0  5  _  0  0  0  1  _  G  L  (spaces)
```

**Firmware: `CP005_0001_GL`** — "CP" likely = Compact Piano, "GL" = Global version.

### FP-30X Summary

| Parameter | Value |
|-----------|-------|
| Manufacturer ID | `41` (Roland) |
| Device ID | `10` |
| DT1/RQ1 Model ID | `00 00 00 28` |
| Family Code | `19 03` |
| Firmware | CP005_0001_GL |
| BLE MIDI Characteristic | `7772e5db-3868-4112-a1a9-f2669d106bf3` |
| BLE MIDI Service | `03b80e5a-ede8-4b33-a751-6ce34ec4c700` |
| ATT Handle (write + notify) | `0x000C` |
| Communication model | **Bidirectional DT1** — piano sends DT1 notifications for all parameter changes |

---

## 6. DT1 Tone Selection — The Core Discovery

### The Protocol

### Known DT1 Parameter Addresses

| Address | Parameter | Data Size | Range | Verified |
|---------|-----------|-----------|-------|----------|
| `01 00 00 00` | Firmware Identifier | 16 bytes | ASCII string (read-only) | RQ1 read |
| `01 00 01 01` | Keyboard Transpose (echo/read) | 1 byte | center=`40`(64), same as write | Piano echo |
| `01 00 01 08` | Tempo (echo/read) | 2 bytes | Same encoding as Tempo below | Piano echo |
| `01 00 01 0A` | Metronome Beat count (echo/read) | 1 byte | Actual beat count: `04`=4/4, `06`=6/4, etc. | Piano echo |
| `01 00 01 0F` | Metronome State (echo/read) | 1 byte | `00` = off, `01` = on | Piano echo |
| `01 00 02 00` | **Voice Mode** | 1 byte | `00`=Single `01`=Split `02`=Dual `03`=Twin | Capture |
| `01 00 02 01` | **Split Point** | 1 byte | MIDI note number (default `36` = F#3) | Capture |
| `01 00 02 02` | **Split — Left Shift** | 1 byte | center=`40`(64), +1semi=`41`, -1=`3F` | Capture |
| `01 00 02 03` | **Balance** (Split + Dual) | 1 byte | center=`40`(64), 0–127 | Capture |
| `01 00 02 04` | **Dual — Tone 2 Shift** | 1 byte | center=`40`(64), ±semitones | Capture |
| `01 00 02 05` | ? | 1 byte | default `3B` (59) — not a center value | Unknown |
| `01 00 02 06` | **Twin Pair/Individual** | 1 byte | `00`=Pair `01`=Individual | Capture |
| `01 00 02 07` | **Tone (Right / Single) — cat** | 1 byte | `00`–`08`, see category table | Capture + RQ1 |
| `01 00 02 08` | **Tone (Right / Single) — idx hi** | 1 byte | tone index high byte | Capture + RQ1 |
| `01 00 02 09` | **Tone (Right / Single) — idx lo** | 1 byte | tone index low byte | Capture + RQ1 |
| `01 00 02 0A` | **Tone (Left / Tone 2) — cat** | 1 byte | `00`–`08`, see category table | Capture |
| `01 00 02 0B` | **Tone (Left / Tone 2) — idx hi** | 1 byte | tone index high byte | Capture |
| `01 00 02 0C` | **Tone (Left / Tone 2) — idx lo** | 1 byte | tone index low byte | Capture |
| `01 00 02 13` | **Volume** | 1 byte | `00`–`7F` (0–127) | Capture + RQ1 |
| `01 00 02 16` | **Split — Right Shift** | 1 byte | center=`40`(64), ±semitones | Capture |
| `01 00 02 17` | **Dual — Tone 1 Shift** | 1 byte | center=`40`(64), ±semitones | Capture |
| `01 00 02 1D` | **Key Touch** (velocity curve) | 1 byte | `00`=Fix `01`=Super Light `02`=Light `03`=Medium `04`=Heavy `05`=Super Heavy | Capture |
| `01 00 02 1F` | **Metronome Beat** | 1 byte | `00`=0/4 `01`=2/4 `02`=3/4 `03`=4/4 `04`=5/4 `05`=6/4 | Capture |
| `01 00 02 20` | **Metronome Pattern** | 1 byte | `00`=Off `01`–`07`=rhythm subdivisions (♪♪, triplet, dotted, 16ths, etc.) | Capture |
| `01 00 02 21` | **Metronome Volume** | 1 byte | `00`–`0A` (0–10) | Capture |
| `01 00 02 22` | **Metronome Tone** | 1 byte | `00`=Click `01`=Electronic `02`=Japanese `03`=English | Capture |
| `01 00 03 07` | **Keyboard Transpose** | 1 byte | center=`40`(64), +1=`41`, -1=`3F`, range -6→+5. | Capture |
| `01 00 03 09` | **Tempo** | 2 bytes | See encoding below | Capture + RQ1 |
| `01 00 05 09` | **Metronome Toggle** | 1 byte | Always `00` (toggle) | Capture ON + OFF |

> **Note:** `01 00 03 07` Address **Keyboard Transpose** Shifts keyboard mapping + sounding pitch. Note On values change to match. Use this instead of Universal SysEx Master Coarse Tuning (which only shifts the sound engine).

### Performance Parameter Block (`01 00 02 00`) — Full Map

A single `RQ1 [01 00 02 00] size=32` reads all voice mode parameters in one shot. Confirmed offsets as of 2026-04-04:

```
Offset  Address      Default  Parameter
------  -----------  -------  ---------
0x00    01 00 02 00  00       Voice Mode (0=Single, 1=Split, 2=Dual, 3=Twin)
0x01    01 00 02 01  36       Split Point (MIDI note, F#3=0x36=54)
0x02    01 00 02 02  40       Split — Left Shift  (center=64, ±semitones)
0x03    01 00 02 03  40       Balance, Split + Dual  (center=64, 0–127)
0x04    01 00 02 04  40       Dual — Tone 2 Shift  (center=64, ±semitones)
0x05    01 00 02 05  3B       ? (59 — unknown, not a center/shift value)
0x06    01 00 02 06  00       Twin Pair/Individual  (0=Pair, 1=Individual)
0x07    01 00 02 07  --       Right Tone / Single Tone — category (0–8)
0x08    01 00 02 08  --       Right Tone — index high byte
0x09    01 00 02 09  --       Right Tone — index low byte
0x0A    01 00 02 0A  --       Left Tone / Tone 2 — category (0–8)
0x0B    01 00 02 0B  --       Left Tone / Tone 2 — index high byte
0x0C    01 00 02 0C  --       Left Tone / Tone 2 — index low byte
0x0D    01 00 02 0D  04       ? (Reverb type candidate)
0x0E    01 00 02 0E  03       ? (Reverb depth candidate)
0x0F    01 00 02 0F  00       ?
0x10    01 00 02 10  02       ? (Chorus type candidate)
0x11    01 00 02 11  01       ? (On/off toggle candidate)
0x12    01 00 02 12  00       ?
0x13    01 00 02 13  --       Volume (0x00–0x7F)
0x14    01 00 02 14  04       ?
0x15    01 00 02 15  00       ?
0x16    01 00 02 16  40       Split — Right Shift  (center=64, ±semitones)
0x17    01 00 02 17  40       Dual — Tone 1 Shift  (center=64, ±semitones)
0x18    01 00 02 18  02       Unknown
0x19    01 00 02 19  00       Unknown
0x1A    01 00 02 1A  01       Unknown
0x1B    01 00 02 1B  01       Unknown
0x1C    01 00 02 1C  4A       Unknown (74 decimal)
0x1D    01 00 02 1D  03       Key Touch (0=Fix 1=SuperLight 2=Light 3=Medium 4=Heavy 5=SuperHeavy)
0x1E    01 00 02 1E  00       Unknown
0x1F    01 00 02 1F  03       Metronome Beat (0=0/4 1=2/4 2=3/4 3=4/4 4=5/4 5=6/4)

--- Extended block (beyond original 32-byte dump) ---
0x20    01 00 02 20  --       Metronome Pattern (0=Off, 1–7=rhythm subdivisions)
0x21    01 00 02 21  --       Metronome Volume (0x00–0x0A = 0–10)
0x22    01 00 02 22  --       Metronome Tone (0=Click 1=Electronic 2=Japanese 3=English)
0x23    01 00 02 23  --       Unknown (echoes when Beat changes)
```

**Shift encoding:** all shift parameters use 64-offset encoding:
```
Value  Meaning
 40    0 semitones (no shift) — default
 41    +1 semitone
 3F    -1 semitone
 4C    +12 semitones (one octave up)
 34    -12 semitones (one octave down)
```

**Balance encoding:** 0–127, center=64 (displayed as 9:9). Piano reflects balance changes as CC7 (Channel Volume) on the respective voice MIDI channels (ch1 for right/Tone1, ch3 for left/Split, ch6 for Tone2/Dual).

**Split Point:** stored as a raw MIDI note number. The Roland app lets the user tap a key on the piano to set it — the app captures the Note On, displays the note name, then writes the MIDI note number to this address on confirm.

**Independent mode memory:** Split and Dual store their shift values at separate offsets (`0x02`/`0x16` for Split, `0x04`/`0x17` for Dual), so switching between modes preserves each mode's shift settings.

### MIDI Channel Routing by Voice Mode

The piano uses different internal MIDI channels per voice, revealed by CC/PC echoes after mode or tone changes:

| Voice | Mode | MIDI Channel | CC echo |
|-------|------|:------------:|---------|
| Right / Single / Tone 1 | all modes | ch1 | `B0 07 [vol]` |
| Left | Split, Twin | ch3 | `B2 07 [vol]` |
| Tone 2 | Dual | ch6 | `B5 07 [vol]` |

Balance changes are reflected as CC7 (Channel Volume) on these channels. The DT1 address `01 00 02 03` is the canonical way to set balance — the CC7 echoes are informational only.

**Tempo encoding (2 bytes):**
Roland uses 7-bit-per-byte encoding. The two data bytes combine to form the BPM value:
```
BPM = (byte1 × 128) + byte2

Examples:
  107 BPM → byte1=0x00, byte2=0x6B  (0×128 + 107 = 107)
  108 BPM → byte1=0x00, byte2=0x6C  (0×128 + 108 = 108)
  128 BPM → byte1=0x01, byte2=0x00  (1×128 +   0 = 128)
  200 BPM → byte1=0x01, byte2=0x48  (1×128 +  72 = 200)
```

> **Volume note:** The Universal SysEx Master Volume (`F0 7F 7F 04 01 00 mm F7`) changes audio output but does NOT update the piano's physical LED indicator. The DT1 Volume at `01 00 02 13` is the "real" volume — it controls both the audio level AND the LED display, exactly like turning the physical volume knob. The Universal SysEx acts as a secondary gain limited by the DT1 volume.

### Piano → App Notifications (Bidirectional DT1)

**Confirmed on 2026-04-04 via react-native-ble-plx `monitorCharacteristicForDevice`.**

The FP-30X sends unsolicited DT1 notifications on the BLE MIDI characteristic whenever a parameter changes — regardless of whether the change came from the app or from a **physical button/knob on the piano**. This enables a fully reactive UI.

#### What triggers a notification

| Action | Address | Data | Example |
|--------|---------|------|---------|
| Volume knob turned | `01 00 02 13` | `[value]` (0–127) | `01 00 02 13 34` = volume 52 |
| Tempo +/- button | `01 00 01 08` | `[b1] [b2]` | `01 00 01 08 00 62` = 98 BPM |
| Metronome button | `01 00 01 0F` | `01` ON / `00` OFF | (actual state, not toggle) |
| App sends DT1 | same address | same value | piano echoes every write back |

Note: **metronome notifications carry the real state** (`01`=ON, `00`=OFF), not the toggle command (`00`) sent to `01 00 05 09`. The echo address `01 00 01 0F` always reflects the current state.

Note: the piano **echoes writes** — when you send a DT1, the piano sends a notification confirming the new value. The app can use this as an acknowledgment, or simply ignore it.

Tone selection from the **physical tone button** also triggers notifications — confirmed 2026-04-04. The piano sends the same CC/PC echo + DT1 echo sequence as app-initiated tone writes.

#### Raw notification packet format

```
[header] [ts] F0 41 10 00 00 00 28 12 [addr×4] [data] [checksum] [ts] F7
```

Where `header` and `ts` bytes have bit 7 set (BLE MIDI framing). All MIDI data bytes (addr, data, checksum) have bit 7 clear (7-bit safe, Roland MIDI rule).

**Example — volume 52 received:**
```
9f 9c  F0 41 10 00 00 00 28 12  01 00 02 13  34  36  9c  F7
^^ ^^  ^^^^^^^^^^^^^^^^^^^^^^   ^^^^^^^^^^   ^^  ^^  ^^  ^^
|| |   Roland DT1 header        addr         val chk  ts  end
|| timestamp low
|header
```

**Parsing strategy (react-native-ble-plx):**
1. Find `F0 41 10 00 00 00 28 12` in the raw bytes
2. Collect all subsequent bytes with bit 7 clear (skip BLE MIDI timestamps) until `F7`
3. Result: `[addr0] [addr1] [addr2] [addr3] [data...] [checksum]`
4. Discard the last byte (checksum); interpret `addr` + `data`

### Batch Write Behavior

**Confirmed on 2026-04-04:** Three sequential DT1 writes (tone + volume + tempo) via `react-native-ble-plx` completed in **56ms** with no delays between writes. All three parameters were applied by the piano and confirmed via echo notifications.

**No inter-write delay is needed** for DT1-only preset batches. The piano queues and processes them in order. Echo notifications for the batch may arrive with a delay (while the user does other things) — this is normal. Apps should use fire-and-forget for preset applies; do not block waiting for echoes.

#### Tone change: response sequence

A DT1 tone write (or a physical tone button press) triggers multiple response notifications on the BLE MIDI characteristic:

**1. CC/PC echo** — arrives first, standard MIDI Bank Select + Program Change equivalent of the selected tone:
```
b0 00 [bank_msb]    CC 0  = Bank Select MSB
b0 20 [bank_lsb]    CC 32 = Bank Select LSB
c0 [program]        Program Change
```
Example — Strings #0: Bank MSB=1, Bank LSB=0x43 (67), PC=0x30 (48)

**2. DT1 echo** — mirrors the write with model `00 00 00 28`:
```
F0 41 10 00 00 00 28 12  01 00 02 07  [cat] [hi] [lo]  [chk]  F7
```

**3. Model `0x19` DT1** — an additional response with a different Roland model ID, carrying tone catalog metadata. Purpose not fully understood but does not affect control. Data contains the same bank/program values as the CC/PC echo. Ignore in the app.

Volume and tempo writes produce only a single DT1 echo (no CC/PC, no `0x19`).

#### Physical button tone changes

**Confirmed on 2026-04-04:** pressing a tone category button on the piano itself generates the same notification sequence as an app-initiated DT1 tone write. The CC/PC echo and DT1 echo both arrive on the BLE characteristic without any prior write from the app.

This enables a **fully reactive UI**: the app subscribes to BLE notifications once on connect and stays in sync with all parameter changes — whether made in the app or on the piano's physical controls.

| Trigger | Volume echo | Tempo echo | Tone DT1 echo | CC/PC echo |
|---------|:-----------:|:----------:|:-------------:|:----------:|
| App DT1 write (volume) | ✓ | — | — | — |
| App DT1 write (tempo) | — | ✓ | — | — |
| App DT1 write (tone) | — | — | ✓ | ✓ |
| Physical volume knob | ✓ | — | — | — |
| Physical tempo button | — | ✓ | — | — |
| Physical tone button | — | — | ✓ | ✓ |

#### Notes: batching by the piano

The piano may pack multiple simultaneous Note On/Off events into a single BLE notification using MIDI running status:
```
ad f1  9f 3c 0b   f1  9f 43 19    ← two Note Ons in one BLE packet
       ^^^^^^^^^       ^^^^^^^^^
       C4 vel=11       G4 vel=25
```
The notification parser must handle running status (multiple notes sharing one status byte) in addition to the common single-note 5-byte packets.

### Note On / Note Off — Key Press Notifications

**Confirmed on 2026-04-04 via react-native-ble-plx `monitorCharacteristicForDevice`.**

The FP-30X sends standard MIDI Note On and Note Off messages for every key press and release via BLE MIDI notification on the same characteristic (`7772e5db-...`).

#### Packet format (5 bytes)

```
[header] [timestamp] [status] [note] [velocity]

Example — G3 pressed (velocity 63):
83  8f  90  37  3f
^^  ^^  ^^  ^^  ^^
|   |   |   |   velocity (63)
|   |   |   note number (0x37 = 55 = G3)
|   |   Note On ch1 (0x90)
|   BLE MIDI timestamp
BLE MIDI header
```

- **Note On**: status `0x90`, velocity > 0
- **Note Off**: status `0x80`, any velocity
- **Note On, velocity 0**: semantically equivalent to Note Off (handle both)
- **One note per BLE packet** — simultaneous chord keys arrive as sequential packets within ~5ms of each other

#### MIDI note number to name

```
note % 12 → pitch class:  0=C  1=C#  2=D  3=D#  4=E  5=F  6=F#  7=G  8=G#  9=A  10=A#  11=B
octave = floor(note / 12) - 1

Examples: 0x3C = 60 → C4 (middle C)   0x40 = 64 → E4   0x43 = 67 → G4
```

#### Architecture: Held-Notes Set model (recommended)

Each time a Note On/Off notification arrives, update a `Set<number>` of currently held MIDI note numbers, then re-analyze:

```
Note ON  → add to set   → re-analyze → display result
Note OFF → remove from set → re-analyze → display result
```

**Why not a time-window:** the held-notes model has no arbitrary timing parameter, works correctly for slow chord building (press C, then E, then G while holding), and matches musical intent — the chord is what's physically held.

**Display logic:**
- 0 notes held → clear display
- 1 note held → show note name only (e.g. `D4`)
- 2 notes held → show interval or both note names
- 3+ notes held → attempt chord identification; show "unrecognized" if no match

**Caveat — staccato:** if keys are released before the next is pressed (no overlap), the set never grows beyond 1 note. Chord detection only works when notes physically overlap (held legato or with sustain pedal key down). This is acceptable for the intended use case (chord practice/exploration).

**Caveat — sustain pedal:** the piano sends Note Off when the key lifts even if the sustain pedal is held. The held-notes set reflects physical key state, not sounding notes. CC 64 (sustain pedal) notifications have not been tested — capturing them would allow tracking sounding notes instead.

#### Sample capture (C major chord, legato)

```
90 3c = C4 ON   }
90 40 = E4 ON   } three packets within ~5ms → held set = {C4, E4, G4} → C major
90 43 = G4 ON   }

80 3c = C4 OFF  }
80 40 = E4 OFF  } three packets → held set = {} → silent
80 43 = G4 OFF  }
```

> **Address space layout:** The FP-30X organizes parameters across multiple blocks:
> - `01 00 00 xx` — System info (firmware identifier at `00`)
> - `01 00 01 xx` — **Read-only status mirror** — the piano echoes live parameter values here. Confirmed: transpose at `01`, tempo at `08`, beat count at `0A`, metronome state at `0F`. Use RQ1 reads against this block to query current state; do not write here.
> - `01 00 02 xx` — **Performance parameters** (voice mode, split/dual settings, tones, volume, key touch — see full block map above)
> - `01 00 03 xx` — **Control parameters** (keyboard transpose at `07`, tempo at `09`)
> - `01 00 05 xx` — Utility toggles (metronome on/off at `09`)
>
> More blocks may exist. Use RQ1 block reads or PacketLogger captures to discover them.

> **Discovery method:** To identify unknown offsets, change one setting in the Roland Piano App (e.g., reverb type), then send an RQ1 block read and compare which byte changed. See the authoritative full block map in the [Known DT1 Parameter Addresses](#known-dt1-parameter-addresses) section above.

---

### Tone Selection

Tone selection on the FP-30X is performed by writing 3 bytes to address `01 00 02 07`:

```
F0 41 10 00 00 00 28 12  01 00 02 07  [B1] [B2] [B3]  [Checksum]  F7
^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^  ^^^^^^^^^^^^^^   ^^^^^^^^^^
Roland DT1 header        Address      Tone data        Checksum
```

### Tone Data Format (3 bytes)

| Byte | Name | Description |
|------|------|-------------|
| B1 | Category | Tone category (see table below) |
| B2 | Index High | High byte of tone index (0x00 for most tones) |
| B3 | Index Low | Low byte of tone index within the category |

### Category Byte (B1) Values

All 9 categories confirmed via PacketLogger capture (first + last tone of each):

| B1 | Category | Tone Type | Count | First Tone | Last Tone |
|----|----------|-----------|-------|------------|-----------|
| `0x00` | Piano | SuperNatural | 12 | Concert Piano | Harpsi 8'+4' |
| `0x01` | E.Piano | SuperNatural | 7 | 1976SuitCase | Celesta |
| `0x02` | Organ | SuperNatural | 13 | B.Organ Slow | Accordion |
| `0x03` | Strings | SuperNatural | 8 | Epic Strings | OrchestraBrs |
| `0x04` | Pad | SuperNatural | 7 | Super SynPad | Solina |
| `0x05` | Synth | SuperNatural | 3 | Super Saw | Flip Pad |
| `0x06` | Other | SuperNatural | 6 | Jazz Scat | A.Bass+Cymbl |
| `0x07` | Drums | SuperNatural | 9 | Standard Set | SFX Set |
| `0x08` | GM2 | General MIDI 2 | 256 | Piano 1 | Explosion |

**Total SuperNatural: 65 tones. Total with GM2: 321 tones.**

> **Note:** The app's UI groups tones into 4 broad categories (Piano, E.Piano/Keys/Organ, Other, Drums), but the DT1 protocol uses 8 more granular SN categories. E.Piano/Keys/Organ is split into E.Piano (0x01) + Organ (0x02). Other is split into Strings (0x03) + Pad (0x04) + Synth (0x05) + Other (0x06).

### Index Encoding (B2:B3)

The two bytes form a 14-bit index (big-endian) into the tone list for that category:

```
Tone Index = (B2 * 128) + B3
```

For categories with fewer than 128 tones, B2 is always `0x00` and B3 is the index (0-based).

For GM2 (256 tones): indices 0–127 use B2=`0x00`, indices 128–255 use B2=`0x01`.

### Confirmed Captures (PacketLogger)

Boundary tones captured for every category (first + last), plus additional mid-list tones:

| Tone | Category | B1 | B2 | B3 | Checksum | Verified |
|------|----------|-----|-----|-----|----------|----------|
| Concert Piano | Piano | `00` | `00` | `00` | `76` | Capture + send |
| Ballad Piano | Piano | `00` | `00` | `01` | `75` | Capture + send |
| Harpsi 8'+4' | Piano | `00` | `00` | `0B` | `6B` | Capture |
| 1976SuitCase | E.Piano | `01` | `00` | `00` | `75` | Capture + send |
| Celesta | E.Piano | `01` | `00` | `06` | `6F` | Capture |
| B.Organ Slow | Organ | `02` | `00` | `00` | `74` | Capture |
| Accordion | Organ | `02` | `00` | `0C` | `68` | Capture |
| Epic Strings | Strings | `03` | `00` | `00` | `73` | Capture + send |
| OrchestraBrs | Strings | `03` | `00` | `07` | `6C` | Capture |
| Super SynPad | Pad | `04` | `00` | `00` | `72` | Capture |
| Solina | Pad | `04` | `00` | `06` | `6C` | Capture |
| Super Saw | Synth | `05` | `00` | `00` | `71` | Capture |
| Flip Pad | Synth | `05` | `00` | `02` | `6F` | Capture |
| Jazz Scat | Other | `06` | `00` | `00` | `70` | Capture |
| A.Bass+Cymbl | Other | `06` | `00` | `05` | `6B` | Capture |
| Standard Set | Drums | `07` | `00` | `00` | `6F` | Capture |
| SFX Set | Drums | `07` | `00` | `08` | `67` | Capture |
| Piano 1 (GM2) | GM2 | `08` | `00` | `00` | `6E` | Capture + send |
| Organ 1 (GM2) | GM2 | `08` | `00` | `24` | `4A` | Capture + send |

All tones marked "send" were also verified by **sending DT1 from our app** — the piano changed tone in every case.

---

## 7. Complete SuperNatural Tone Map

All 65 SuperNatural tones across 8 categories, confirmed via PacketLogger boundary captures (first + last tone of every category). **B3 = 0-based position within category, matching `tones.json` order.**

### Category 0x00 — Piano (12 tones)

| B3 | Tone Name | Bank MSB | Bank LSB | PC | Verified |
|----|-----------|----------|----------|-----|----------|
| `00` | Concert Piano | 0 | 68 | 0 | Capture + send |
| `01` | Ballad Piano | 16 | 67 | 0 | Capture + send |
| `02` | Mellow Piano | 4 | 64 | 0 | Inferred |
| `03` | Bright Piano | 8 | 66 | 1 | Inferred |
| `04` | Upright Piano | 16 | 64 | 0 | Inferred |
| `05` | Mellow Upright | 1 | 65 | 0 | Inferred |
| `06` | Bright Upright | 1 | 66 | 0 | Inferred |
| `07` | Rock Piano | 8 | 64 | 2 | Inferred |
| `08` | Ragtime Piano | 0 | 64 | 3 | Inferred |
| `09` | Magical Piano | 47 | 65 | 2 | Inferred |
| `0A` | Harpsichord | 0 | 67 | 6 | Inferred |
| `0B` | Harpsi 8'+4' | 8 | 67 | 6 | Capture (last) |

### Category 0x01 — E.Piano (7 tones)

| B3 | Tone Name | Bank MSB | Bank LSB | PC | Verified |
|----|-----------|----------|----------|-----|----------|
| `00` | 1976SuitCase | 8 | 71 | 4 | Capture + send |
| `01` | Wurly 200 | 25 | 64 | 4 | Inferred |
| `02` | Phase EP Mix | 8 | 68 | 4 | Inferred |
| `03` | 80's FM EP | 0 | 68 | 5 | Inferred |
| `04` | Clav. | 121 | 0 | 7 | Inferred |
| `05` | Vibraphone | 121 | 0 | 11 | Inferred |
| `06` | Celesta | 121 | 0 | 8 | Capture (last) |

### Category 0x02 — Organ (13 tones)

| B3 | Tone Name | Bank MSB | Bank LSB | PC | Verified |
|----|-----------|----------|----------|-----|----------|
| `00` | B.Organ Slow | 1 | 65 | 18 | Capture (first) |
| `01` | Combo Jz.Org | 0 | 70 | 18 | Inferred |
| `02` | Ballad Organ | 0 | 69 | 18 | Inferred |
| `03` | Gospel Spin | 0 | 71 | 16 | Inferred |
| `04` | Full Stops | 0 | 69 | 16 | Inferred |
| `05` | Mellow Bars | 32 | 68 | 16 | Inferred |
| `06` | Lower Organ | 0 | 66 | 16 | Inferred |
| `07` | Light Organ | 32 | 69 | 16 | Inferred |
| `08` | Pipe Organ | 8 | 70 | 19 | Inferred |
| `09` | Nason Flt 8' | 16 | 66 | 19 | Inferred |
| `0A` | ChurchOrgan1 | 0 | 66 | 19 | Inferred |
| `0B` | ChurchOrgan2 | 8 | 69 | 19 | Inferred |
| `0C` | Accordion | 121 | 0 | 21 | Capture (last) |

### Category 0x03 — Strings (8 tones)

| B3 | Tone Name | Bank MSB | Bank LSB | PC | Verified |
|----|-----------|----------|----------|-----|----------|
| `00` | Epic Strings | 1 | 67 | 48 | Capture + send |
| `01` | Rich Strings | 0 | 71 | 49 | Inferred |
| `02` | SymphonicStr1 | 1 | 67 | 49 | Inferred |
| `03` | SymphonicStr2 | 1 | 65 | 49 | Inferred |
| `04` | Orchestra | 8 | 66 | 48 | Inferred |
| `05` | String Trio | 0 | 64 | 40 | Inferred |
| `06` | Harpiness | 0 | 70 | 46 | Inferred |
| `07` | OrchestraBrs | 1 | 66 | 60 | Capture (last) |

### Category 0x04 — Pad (7 tones)

| B3 | Tone Name | Bank MSB | Bank LSB | PC | Verified |
|----|-----------|----------|----------|-----|----------|
| `00` | Super SynPad | 1 | 71 | 89 | Capture (first) |
| `01` | Choir Aahs 1 | 8 | 71 | 52 | Inferred |
| `02` | Choir Aahs 2 | 8 | 72 | 52 | Inferred |
| `03` | D50 StackPad | 1 | 64 | 88 | Inferred |
| `04` | JP8 Strings | 0 | 68 | 50 | Inferred |
| `05` | Soft Pad | 0 | 64 | 89 | Inferred |
| `06` | Solina | 0 | 66 | 50 | Capture (last) |

### Category 0x05 — Synth (3 tones)

| B3 | Tone Name | Bank MSB | Bank LSB | PC | Verified |
|----|-----------|----------|----------|-----|----------|
| `00` | Super Saw | 8 | 67 | 81 | Capture (first) |
| `01` | Trancy Synth | 1 | 65 | 90 | Inferred |
| `02` | Flip Pad | 1 | 64 | 90 | Capture (last) |

### Category 0x06 — Other (6 tones)

| B3 | Tone Name | Bank MSB | Bank LSB | PC | Verified |
|----|-----------|----------|----------|-----|----------|
| `00` | Jazz Scat | 0 | 65 | 54 | Capture (first) |
| `01` | Comp'd JBass | 0 | 66 | 33 | Inferred |
| `02` | Nylon-str.Gt | 121 | 0 | 24 | Inferred |
| `03` | Steel-str.Gt | 121 | 0 | 25 | Inferred |
| `04` | AcousticBass | 121 | 0 | 32 | Inferred |
| `05` | A.Bass+Cymbl | 0 | 66 | 32 | Capture (last) |

### Category 0x07 — Drums (9 kits)

| B3 | Kit Name | Bank MSB | Bank LSB | PC | Verified |
|----|----------|----------|----------|-----|----------|
| `00` | Standard Set | 120 | 0 | 0 | Capture (first) |
| `01` | Room Set | 120 | 0 | 8 | Inferred |
| `02` | Power Set | 120 | 0 | 16 | Inferred |
| `03` | Electric Set | 120 | 0 | 24 | Inferred |
| `04` | Analog Set | 120 | 0 | 25 | Inferred |
| `05` | Jazz Set | 120 | 0 | 32 | Inferred |
| `06` | Brush Set | 120 | 0 | 40 | Inferred |
| `07` | Orchestra Set | 120 | 0 | 48 | Inferred |
| `08` | SFX Set | 120 | 0 | 56 | Capture (last) |

---

## 8. Complete GM2 Tone Map

GM2 tones use **category byte `0x08`**. The index is the tone's position in the GM2 tone list (matching `gm2Tones.json` order). Since there are 256 GM2 tones, the high byte B2 is needed for tones at index 128+.

**Formula:**
```
B1 = 0x08
B2 = floor(index / 128)
B3 = index % 128
```

> Verified: index 0 = Piano 1 (`08 00 00`) and index 36 = Organ 1 (`08 00 24`) confirmed via PacketLogger.

### GM2 Index Table

| Index | B2:B3 | Name | Family | MSB | LSB | PC |
|-------|-------|------|--------|-----|-----|-----|
| 0 | `00:00` | Piano 1 | Piano | 121 | 0 | 0 |
| 1 | `00:01` | Piano 1w | Piano | 121 | 1 | 0 |
| 2 | `00:02` | Piano 1d | Piano | 121 | 2 | 0 |
| 3 | `00:03` | Piano 2 | Piano | 121 | 0 | 1 |
| 4 | `00:04` | Piano 2w | Piano | 121 | 1 | 1 |
| 5 | `00:05` | Piano 3 | Piano | 121 | 0 | 2 |
| 6 | `00:06` | Piano 3w | Piano | 121 | 1 | 2 |
| 7 | `00:07` | Honky-tonk | Piano | 121 | 0 | 3 |
| 8 | `00:08` | Honky-tonk w | Piano | 121 | 1 | 3 |
| 9 | `00:09` | E.Piano 1 | Piano | 121 | 0 | 4 |
| 10 | `00:0A` | Detuned EP 1 | Piano | 121 | 1 | 4 |
| 11 | `00:0B` | Vintage EP | Piano | 121 | 2 | 4 |
| 12 | `00:0C` | 60's E.Piano | Piano | 121 | 3 | 4 |
| 13 | `00:0D` | E.Piano 2 | Piano | 121 | 0 | 5 |
| 14 | `00:0E` | Detuned EP 2 | Piano | 121 | 1 | 5 |
| 15 | `00:0F` | St.FM EP | Piano | 121 | 2 | 5 |
| 16 | `00:10` | EP Legend | Piano | 121 | 3 | 5 |
| 17 | `00:11` | EP Phaser | Piano | 121 | 4 | 5 |
| 18 | `00:12` | Harpsi. | Chrom. Perc. | 121 | 0 | 6 |
| 19 | `00:13` | Coupled Hps. | Chrom. Perc. | 121 | 1 | 6 |
| 20 | `00:14` | Harpsi.w | Chrom. Perc. | 121 | 2 | 6 |
| 21 | `00:15` | Harpsi.o | Chrom. Perc. | 121 | 3 | 6 |
| 22 | `00:16` | Clav. | Chrom. Perc. | 121 | 0 | 7 |
| 23 | `00:17` | Pulse Clav. | Chrom. Perc. | 121 | 1 | 7 |
| 24 | `00:18` | Celesta | Chrom. Perc. | 121 | 0 | 8 |
| 25 | `00:19` | Glockenspiel | Chrom. Perc. | 121 | 0 | 9 |
| 26 | `00:1A` | Music Box | Chrom. Perc. | 121 | 0 | 10 |
| 27 | `00:1B` | Vibraphone | Chrom. Perc. | 121 | 0 | 11 |
| 28 | `00:1C` | Vibraphone w | Chrom. Perc. | 121 | 1 | 11 |
| 29 | `00:1D` | Marimba | Chrom. Perc. | 121 | 0 | 12 |
| 30 | `00:1E` | Marimba w | Chrom. Perc. | 121 | 1 | 12 |
| 31 | `00:1F` | Xylophone | Chrom. Perc. | 121 | 0 | 13 |
| 32 | `00:20` | TubularBells | Chrom. Perc. | 121 | 0 | 14 |
| 33 | `00:21` | Church Bell | Chrom. Perc. | 121 | 1 | 14 |
| 34 | `00:22` | Carillon | Chrom. Perc. | 121 | 2 | 14 |
| 35 | `00:23` | Santur | Chrom. Perc. | 121 | 0 | 15 |
| **36** | **`00:24`** | **Organ 1** | **Organ** | **121** | **0** | **16** |
| 37 | `00:25` | TremoloOrgan | Organ | 121 | 1 | 16 |
| 38 | `00:26` | 60's Organ | Organ | 121 | 2 | 16 |
| 39 | `00:27` | Organ 2 | Organ | 121 | 3 | 16 |
| 40 | `00:28` | Perc.Organ 1 | Organ | 121 | 0 | 17 |
| 41 | `00:29` | Chorus Organ | Organ | 121 | 1 | 17 |
| 42 | `00:2A` | Perc.Organ 2 | Organ | 121 | 2 | 17 |
| 43 | `00:2B` | Rock Organ | Organ | 121 | 0 | 18 |
| 44 | `00:2C` | Church Org.1 | Organ | 121 | 0 | 19 |
| 45 | `00:2D` | Church Org.2 | Organ | 121 | 1 | 19 |
| 46 | `00:2E` | Church Org.3 | Organ | 121 | 2 | 19 |
| 47 | `00:2F` | Reed Organ | Organ | 121 | 0 | 20 |
| 48 | `00:30` | Puff Organ | Organ | 121 | 1 | 20 |
| 49 | `00:31` | Accordion 1 | Organ | 121 | 0 | 21 |
| 50 | `00:32` | Accordion 2 | Organ | 121 | 1 | 21 |
| 51 | `00:33` | Harmonica | Organ | 121 | 0 | 22 |
| 52 | `00:34` | Bandoneon | Organ | 121 | 0 | 23 |

> **Tones 53–255:** Follow the same sequential order from `gm2Tones.json`. Use the formula `B2 = floor(index / 128)`, `B3 = index % 128`. Tones 128–255 have B2=`0x01`.

---

## 9. Universal SysEx Messages (Documented)

These are from the official MIDI Implementation document and work over BLE:

### GM System Messages

| Message | SysEx | Effect |
|---------|-------|--------|
| GM1 System On | `F0 7E 7F 09 01 F7` | Reset to GM1 mode |
| GM2 System On | `F0 7E 7F 09 03 F7` | Reset to GM2 mode (Piano 1) |

### Master Controls

| Parameter | SysEx Format | Data Range |
|-----------|-------------|------------|
| Master Volume | `F0 7F 7F 04 01 00 [mm] F7` | mm: `00`–`7F` (0–127) |
| Master Fine Tuning | `F0 7F 7F 04 03 [ll] [mm] F7` | 00 00 – 40 00 – 7F 7F |

> **Removed: Master Coarse Tuning** (`F0 7F 7F 04 04 00 [mm] F7`) — shifts the sound engine pitch without changing MIDI note numbers. Superseded by **Keyboard Transpose** DT1 at `01 00 03 07`, which transposes both the keyboard mapping AND the sounding pitch (MIDI Note On values change to match). Use the DT1 version for presets and chord detection compatibility.

### Reverb Parameters

```
F0 7F 7F 04 05 01 01 01 01 01 [pp] [vv] F7
```

| pp | Parameter | Values |
|----|-----------|--------|
| `00` | Reverb Type | 0=Small Room, 1=Medium Room, 2=Large Room, 3=Medium Hall, 4=Large Hall, 5=Plate |
| `01` | Reverb Time | `00`–`7F` (0–127) |

### Chorus Parameters

```
F0 7F 7F 04 05 01 01 01 01 02 [pp] [vv] F7
```

| pp | Parameter | Values |
|----|-----------|--------|
| `00` | Chorus Type | 0=Chorus1, 1=Chorus2, 2=Chorus3, 3=Chorus4, 4=FB Chorus, 5=Flanger |
| `01` | Mod Rate | `00`–`7F` |
| `02` | Mod Depth | `00`–`7F` |
| `03` | Feedback | `00`–`7F` |
| `04` | Send To Reverb | `00`–`7F` |

### Scale/Octave Tuning

```
F0 7E 7F 08 08 [ff] [gg] [hh] [C] [C#] [D] [D#] [E] [F] [F#] [G] [G#] [A] [A#] [B] F7
```

Each note byte: `00` = -64 cents, `40` = 0 cents (normal), `7F` = +63 cents.

---

## 10. Adapting to Other Roland Pianos

This protocol is likely shared across Roland's digital piano family. To adapt for another model:

### What Stays the Same

- Roland manufacturer ID: `41`
- DT1 command: `12`, RQ1 command: `11`
- Checksum algorithm (see Appendix A)
- Identity Request format: `F0 7E 7F 06 01 F7`
- Universal SysEx messages (Master Volume, Tuning, GM System On)
- BLE MIDI characteristic UUID: `7772E5DB-3868-4112-A1A9-F2669D106BF3`

### What Changes Per Model

| Parameter | FP-30X Value | How to Discover |
|-----------|-------------|-----------------|
| Device ID | `0x10` | Identity Reply byte 3 |
| Model ID | `00 00 00 28` | RQ1 scan (see Section 5) |
| Tone Address | `01 00 02 07` | PacketLogger capture of tone change |
| Category bytes | `00`–`08` | PacketLogger capture of each category |
| Tone ordering | See Sections 7–8 | Match against model's tone list |
| Firmware ID Address | `01 00 00 00` | RQ1 read (usually same across Roland) |

### Likely Compatible Models

These Roland digital pianos share the same platform and BLE architecture:

- Roland FP-10 (entry-level, fewer tones)
- Roland FP-30X (this document)
- Roland FP-60X (more tones, extra features)
- Roland FP-90X (flagship, PHA-50 keyboard)
- Roland HP series (home pianos)
- Roland LX series (luxury digital pianos)
- Roland RP series (entry-level home pianos)

Each will have a different Model ID and potentially different tone addresses. Use the discovery methodology in Section 11.

---

## 11. Methodology — How to Reverse-Engineer a New Model

### Step-by-Step Process

1. **Connect via CoreMIDI BLE**
   - Use Apple's `CABTMIDICentralViewController` to pair
   - Or connect via Settings > Bluetooth on iOS/Mac

2. **Send Identity Request**
   ```
   F0 7E 7F 06 01 F7
   ```
   - Extract Device ID, manufacturer, family code

3. **Discover Model ID**
   - Send RQ1 to `01 00 00 00` with candidate model IDs (`00 00 00 20` through `00 00 00 40`)
   - The correct one returns a DT1 response

4. **Capture Protocol via PacketLogger**
   - Connect iPhone to Mac via USB
   - Open PacketLogger, select iPhone
   - Start capture
   - Open Roland's official app on iPhone, connect to piano, change tones
   - Filter for "ATT Send" packets containing `F0 41`

5. **Decode Packets**
   - Strip BLE MIDI header (first 2 bytes of value)
   - Strip BLE MIDI SysEx end (timestamp before F7)
   - Parse: `F0 41 [dev] [model4] 12 [addr4] [data...] [checksum] F7`

6. **Map Tone Catalog**
   - Capture tone changes across all categories
   - Compare address and data bytes to identify the pattern
   - Cross-reference with the model's tone list

### Tools Required

| Tool | Purpose | Source |
|------|---------|--------|
| PacketLogger | BLE traffic capture | Apple Additional Tools for Xcode |
| Bluetooth Logging Profile | Enable BLE capture on iOS | developer.apple.com/bug-reporting/profiles-and-logs |
| CoreMIDI (native module) | Send/receive SysEx | Custom iOS Swift module |
| React Native DevTools | View console logs | Built into Metro bundler |

---

## Appendix A: Roland Checksum Algorithm

Roland uses a simple checksum to validate DT1/RQ1 messages. The checksum covers the **address bytes** and **data bytes** (or size bytes for RQ1) — NOT the SysEx header, model ID, or command byte.

### Algorithm

```
1. Sum all address bytes and data bytes
2. checksum = (128 - (sum % 128)) % 128
```

### TypeScript Implementation

```typescript
function rolandChecksum(addressAndData: number[]): number {
  const sum = addressAndData.reduce((a, b) => a + b, 0);
  return (128 - (sum % 128)) % 128;
}
```

### Examples

**DT1 for Concert Piano (addr: `01 00 02 07`, data: `00 00 00`):**
```
Sum = 0x01 + 0x00 + 0x02 + 0x07 + 0x00 + 0x00 + 0x00 = 10
Checksum = (128 - 10) % 128 = 118 = 0x76 ✓
```

**DT1 for Organ 1 GM2 (addr: `01 00 02 07`, data: `08 00 24`):**
```
Sum = 0x01 + 0x00 + 0x02 + 0x07 + 0x08 + 0x00 + 0x24 = 54
Checksum = (128 - 54) % 128 = 74 = 0x4A ✓
```

**RQ1 for address `01 00 00 00`, size `00 00 00 01`:**
```
Sum = 0x01 + 0x00 + 0x00 + 0x00 + 0x00 + 0x00 + 0x00 + 0x01 = 2
Checksum = (128 - 2) % 128 = 126 = 0x7E ✓
```

### Building Complete Messages

```typescript
// DT1 (write)
function buildDT1(modelId: number[], devId: number, addr: number[], data: number[]): number[] {
  const checksum = rolandChecksum([...addr, ...data]);
  return [0xF0, 0x41, devId, ...modelId, 0x12, ...addr, ...data, checksum, 0xF7];
}

// RQ1 (read)
function buildRQ1(modelId: number[], devId: number, addr: number[], size: number[]): number[] {
  const checksum = rolandChecksum([...addr, ...size]);
  return [0xF0, 0x41, devId, ...modelId, 0x11, ...addr, ...size, checksum, 0xF7];
}
```

---

## Appendix B: Raw PacketLogger Captures

### Tone Changes Sent by Roland Piano App

**Concert Piano (SN):**
```
ATT Send → Handle 0x000C
BLE MIDI: BF B2
SysEx:    F0 41 10 00 00 00 28 12 01 00 02 07 00 00 00 76 F7
```

**Ballad Piano (SN):**
```
ATT Send → Handle 0x000C
BLE MIDI: 98 A7
SysEx:    F0 41 10 00 00 00 28 12 01 00 02 07 00 00 01 75 F7
```

**1976SuitCase (E.Piano SN):**
```
ATT Send → Handle 0x000C
BLE MIDI: 80 A2
SysEx:    F0 41 10 00 00 00 28 12 01 00 02 07 01 00 00 75 F7
```

**Epic Strings (Other SN):**
```
ATT Send → Handle 0x000C
BLE MIDI: BD A7
SysEx:    F0 41 10 00 00 00 28 12 01 00 02 07 03 00 00 73 F7
```

**Piano 1 (GM2):**
```
ATT Send → Handle 0x000C
BLE MIDI: 93 9E
SysEx:    F0 41 10 00 00 00 28 12 01 00 02 07 08 00 00 6E F7
```

**Organ 1 (GM2):**
```
ATT Send → Handle 0x000C
BLE MIDI: 96 A9
SysEx:    F0 41 10 00 00 00 28 12 01 00 02 07 08 00 24 4A F7
```

### Tone Changes Sent by Our App (Verified Working)

All 6 tones above were successfully replayed from our app via CoreMIDI `MIDISend`, causing the piano to change tone in each case. The piano also responded with standard MIDI CC/PC notifications confirming the tone change.

### Piano Response Pattern

After each DT1 tone change, the piano sends a BLE MIDI notification containing the equivalent standard MIDI Bank Select + Program Change:

```
[CC 0 = Bank MSB] [CC 32 = Bank LSB] [PC = Program]
```

Example response for Piano 1 (GM2):
```
ATT Receive → Handle Value Notification
BLE MIDI: B0 00 79  B0 20 00  C0 00
          ^^^^^^^^  ^^^^^^^^  ^^^^^
          CC0=121   CC32=0    PC=0  → GM2 Piano 1
```

This response can be used to verify the tone change was accepted.

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-04-03 | Wallace Mendes + Claude | Initial reverse-engineering of FP-30X DT1 protocol |
