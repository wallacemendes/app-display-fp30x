# Feature Specification: FP-30X Controller v2

**Feature Branch**: `002-fp30x-controller-v2`
**Created**: 2026-04-05
**Status**: Draft
**Input**: User description: "Comprehensive spec rewrite incorporating DT1 SysEx protocol discoveries, bidirectional BLE notifications, landscape hardware-synth UI redesign, real-time chord detection, Split/Dual/Twin modes, and updated phase architecture"

## Context: Why This Rewrite

The original spec (001) was written before reverse-engineering the FP-30X's BLE protocol. It assumed standard MIDI (CC/PC) would work. R&D proved this wrong:

- **Standard MIDI CC/PC messages are silently ignored over BLE.** The FP-30X exclusively uses Roland-proprietary DT1 SysEx for parameter control.
- **The piano is bidirectional** -- it sends unsolicited DT1 notifications when physical controls change (volume knob, tone buttons, tempo, metronome). The app can stay in sync with the piano, not just push state to it.
- **Note On/Off messages are received** -- the piano sends every key press/release as standard MIDI notes via BLE, enabling real-time chord detection.
- **Split/Dual/Twin modes are fully mapped** -- all DT1 addresses for keyboard modes, balance, split point, and per-voice tone/shift parameters are confirmed.

This v2 spec replaces the original's phase structure, functional requirements, and UI design to align with proven protocol capabilities.

## Phased Roadmap

- **Phase 1 -- Core Display (Tone + Status)**: BLE connection via DT1 SysEx, tone browsing and selection, live status bar (tempo, volume, metronome, transpose), initial state read on connect.
- **Phase 2 -- Favorites, Presets & Quick Tones**: Persistent favorites (mixed SN + GM2), named presets with layered DT1 parameters (tone + volume + tempo + metronome), quick-tone slots on main display, auto-apply default preset on connect.
- **Phase 3 -- Live Performance & Chord Detection**: Real-time chord tracker from Note On/Off, Split/Dual mode activation and tone assignment, keyboard transpose, key touch sensitivity control.
- **Phase 4 -- Pads & Advanced Controls**: Assignable performance pads (macro buttons for quick parameter changes), metronome full control (beat, pattern, tone, volume), advanced settings panel.

## Clarifications

### Session 2026-04-05

- Q: What is the app's orientation? -> A: Landscape-only. The UI is designed as a hardware synthesizer display, not a standard mobile app.
- Q: What is the navigation structure? -> A: Three top tabs: PADS, DISPLAY, PRESETS. No bottom tab bar. DISPLAY is the landing screen.
- Q: How does tone selection work? -> A: Two-tier stepper: Category selector (+/- buttons cycling through tone categories) above a Tone selector (+/- buttons cycling within the current category). Not a grid. Not a scrollable list.
- Q: What MIDI protocol is used? -> A: Roland DT1 SysEx exclusively for all parameter control. CC/PC is ignored by the piano over BLE.
- Q: Can the app read the piano's state? -> A: Yes. RQ1 SysEx requests return current parameters. The piano also sends unsolicited DT1 notifications for physical control changes (volume, tone, tempo, metronome). The app operates as a bidirectional control surface.
- Q: Does the app show chords? -> A: Yes. The DISPLAY screen includes a real-time chord tracker that identifies chords from Note On/Off messages. Uses a held-notes set model (not time-window buffering).
- Q: What about Split/Dual modes? -> A: All DT1 addresses mapped. Phase 3 feature. Single/Split/Dual at `01 00 02 00`, with per-voice tones and shift parameters confirmed.
- Q: What about reverb/chorus CC? -> A: Does not work over BLE. Confirmed via testing. Removed from scope.
- Q: Do presets use DT1? -> A: Yes. A preset is a batch of DT1 writes. Tested: 3 DT1 writes complete in ~56ms, all applied, no delays needed.

## User Scenarios & Testing

### Phase 1 -- Core Display

#### User Story 1 - Connect to Piano (Priority: P1 -- Phase 1)

A pianist powers on their FP-30X and opens the app in landscape orientation. The app shows the DISPLAY screen while auto-connecting to a previously paired FP-30X in the background. A Bluetooth icon in the top-right corner transitions from grey (disconnected) to green (connected). On successful connection, the app reads the piano's current state (tone, volume, tempo, metronome) via two RQ1 requests and populates the status bar with live values.

**Why this priority**: Nothing works without a connection. The initial state read ensures the display accurately reflects the piano from the first moment.

**Independent Test**: Launch the app near a powered-on FP-30X. Verify the BLE icon turns green, the tone selector shows the piano's current tone, and the status bar shows current tempo and volume.

**Acceptance Scenarios**:

1. **Given** the app is launched and the FP-30X is powered on with Bluetooth enabled, **When** the app scans for devices, **Then** the FP-30X appears as a connectable device within 5 seconds.
2. **Given** the FP-30X is found, **When** the connection is established, **Then** the app sends two RQ1 reads (performance block + tempo/metronome) and populates the UI with the piano's current tone, volume, tempo, beat, and metronome state.
3. **Given** the app was previously connected to an FP-30X, **When** the app is launched again with the same piano nearby, **Then** the app automatically reconnects without manual device selection.
4. **Given** a connection is active, **When** the FP-30X is powered off or moves out of range, **Then** the BLE icon turns red, the app shows a disconnected state, and automatic reconnection is attempted.
5. **Given** the app is connected, **When** the user changes volume, tone, tempo, or metronome on the piano's physical controls, **Then** the app's UI updates in real time to reflect the change (via DT1 notification parsing).

---

#### User Story 2 - Browse and Select Tones (Priority: P1 -- Phase 1)

The DISPLAY screen is the landing screen. On the left side, a two-tier tone selector with stepper buttons lets the user cycle through categories (top row: e.g. "CLASSIC PIANOS") and tones within that category (bottom row: e.g. "1. Concert Piano"). The category name appears in cyan on a recessed display area, and the tone name in orange. Pressing +/- cycles through available options, wrapping at the ends. Each tone change sends a DT1 SysEx to the piano at address `01 00 02 07`.

**Why this priority**: Core value proposition. The piano loses its tone on power-off; the app makes selecting any of the 65 SuperNATURAL or 256 GM2 tones instant.

**Independent Test**: Connect to the FP-30X, press + on the category selector to cycle to "E.PIANO", press + on the tone selector to choose "EP 1", and hear the piano change tone.

**Acceptance Scenarios**:

1. **Given** the app is connected, **When** the user presses + on the category selector, **Then** the display cycles to the next tone category and the tone selector resets to the first tone in that category.
2. **Given** a category is selected, **When** the user presses + or - on the tone selector, **Then** the piano switches to the new tone within 200ms and the display updates the tone name.
3. **Given** the user reaches the last tone in a category, **When** they press +, **Then** the selector wraps to the first tone in that category.
4. **Given** the user is on the first category, **When** they press -, **Then** the selector wraps to the last category.
5. **Given** the user changes the tone on the piano's physical tone button, **When** the DT1 notification is received, **Then** the category and tone selectors update to reflect the piano's new tone.

---

#### User Story 3 - Live Status Bar (Priority: P1 -- Phase 1)

The bottom bar of the DISPLAY screen shows the piano's live performance state: tempo (BPM), beat (time signature), metronome on/off, transpose value, and volume. These values are read from the piano on connect (via RQ1) and kept in sync via DT1 notifications whenever the pianist changes a physical control.

**Why this priority**: Without visible status, the user has no confirmation of what the piano is doing. The status bar closes the feedback loop for all physical control changes.

**Independent Test**: Connect to the piano, verify the status bar shows correct tempo/volume. Change tempo on the piano; verify the display updates. Toggle the metronome; verify M: OFF changes to M: ON.

**Acceptance Scenarios**:

1. **Given** the app just connected, **When** initial state is loaded, **Then** the status bar shows the piano's current tempo (BPM), beat (e.g., 4/4), metronome state (ON/OFF), and volume (0-100).
2. **Given** the app is connected, **When** the user changes the tempo on the piano, **Then** the BPM display updates within 100ms of the notification.
3. **Given** the app is connected, **When** the user presses the physical metronome button, **Then** the M: ON/OFF indicator toggles.
4. **Given** the app is connected, **When** the user turns the volume knob on the piano, **Then** the volume number in the status bar updates in real time.

---

### Phase 2 -- Favorites, Presets & Quick Tones

#### User Story 4 - Favorite Tones (Priority: P1 -- Phase 2)

A pianist has go-to sounds they use frequently. They can mark any tone (SuperNATURAL or GM2) as a favorite. Favorites are stored locally and persist across sessions. The favorites list mixes SN and GM2 tones freely -- something the official Roland app cannot do. Tapping a favorite applies it via the correct DT1 category byte regardless of tone type.

**Why this priority**: Directly addresses the piano's volatile memory. Users shouldn't need to cycle through 300+ tones each session to find their preferred sounds.

**Independent Test**: Mark "Concert Piano" (SN) and "Organ 1" (GM2) as favorites. Close the app. Reopen. Verify both appear in favorites. Tap each; verify the piano changes tone correctly.

**Acceptance Scenarios**:

1. **Given** a tone is displayed in the selector, **When** the user marks it as a favorite, **Then** the tone appears in the Favorites list.
2. **Given** favorites contain both SN and GM2 tones, **When** the user taps any favorite, **Then** the piano switches to that tone via the correct DT1 category and index bytes.
3. **Given** the user has saved favorites, **When** they reopen the app after closing, **Then** all previously saved favorites are still present.
4. **Given** a tone is favorited, **When** the user removes it from favorites, **Then** it no longer appears in the Favorites list.

---

#### User Story 5 - Quick Tone Slots (Priority: P1 -- Phase 2)

On the right side of the DISPLAY screen, 3 quick-tone buttons are always visible alongside the chord tracker. Each slot shows a favorite tone name (e.g., "2: BRIGHT PNO") and a star icon. Tapping a quick-tone button instantly applies that tone. The user can assign any favorite to a quick-tone slot.

**Why this priority**: During a performance, the pianist needs one-tap access to their most-used tones without opening a separate favorites screen. The quick-tone slots are always visible on the main display.

**Independent Test**: Assign 3 favorites to the quick-tone slots. Play the piano. Tap a different quick-tone slot; verify the tone changes instantly without leaving the DISPLAY screen.

**Acceptance Scenarios**:

1. **Given** the DISPLAY screen is active, **When** the user taps a quick-tone slot, **Then** the piano changes to that tone immediately.
2. **Given** a quick-tone slot is empty, **When** the user assigns a favorite to it, **Then** the slot displays the tone name.
3. **Given** quick-tone assignments are saved, **When** the app is reopened, **Then** the assignments persist.

---

#### User Story 6 - Presets (Saved Performance States) (Priority: P1 -- Phase 2)

The FP-30X resets all settings when powered off. A pianist saves their complete setup (tone + volume + tempo + metronome settings) as a named Preset. Applying a preset sends a batch of DT1 commands (~56ms total). One preset can be marked as "Default" -- which auto-applies when the app first connects after launch. Reconnection after a drop does NOT re-apply the default (to avoid disrupting live performance).

**Why this priority**: The app's strongest differentiator. Presets solve the piano's volatile memory problem completely.

**Independent Test**: Save a preset with tone=Strings, volume=80, tempo=90. Close the app. Reopen. Connect. Verify the default preset auto-applied and the piano is in the correct state.

**Acceptance Scenarios**:

1. **Given** the user has configured settings on the piano, **When** they save a new preset with a name, **Then** the preset captures current tone, volume, tempo, and metronome state.
2. **Given** a saved preset exists, **When** the user taps "Apply", **Then** all DT1 commands are sent as a batch and the piano reflects the preset within 500ms.
3. **Given** a preset is marked as "Default", **When** the app launches and connects for the first time, **Then** the default preset auto-applies within 2 seconds of connection.
4. **Given** a connection drops and reconnects during a session, **When** reconnection succeeds, **Then** the default preset is NOT re-applied.
5. **Given** the user has multiple presets, **When** they view the presets list (PRESETS tab), **Then** they can rename, delete, reorder, and set/unset the default flag.

---

### Phase 3 -- Live Performance & Chord Detection

#### User Story 7 - Real-Time Chord Tracker (Priority: P1 -- Phase 3)

The DISPLAY screen shows a large chord display area that identifies chords in real time as the pianist plays. It uses a held-notes set model: each Note On adds to the set, each Note Off removes from it. On every change, the set is analyzed for chord shapes. 1 note shows the note name. 2 notes shows an interval. 3+ notes attempts chord identification (e.g., "C Maj7", "Am", "Dm7"). Random non-chord note combinations show individual note names.

**Why this priority**: Unique feature that the official Roland app doesn't offer. Extremely valuable for practice, music education, and composition.

**Independent Test**: Connect to the piano, play C-E-G simultaneously. Verify the chord display shows "C" or "C Major". Release E; verify it updates. Play C-Eb-G; verify it shows "Cm".

**Acceptance Scenarios**:

1. **Given** the app is connected and no keys are pressed, **When** the user presses C4, **Then** the chord display shows "C4".
2. **Given** C4 and E4 are held, **When** the user presses G4, **Then** the display shows "C" (C major triad).
3. **Given** a chord is displayed, **When** the user releases one key, **Then** the display updates to reflect the remaining held notes.
4. **Given** the user plays notes that don't form a standard chord, **Then** the display shows the individual note names.
5. **Given** the user releases all keys, **Then** the chord display clears.

---

#### User Story 8 - Split and Dual Mode Control (Priority: P2 -- Phase 3)

A pianist wants to use Split mode (different tones for left and right hand) or Dual mode (layer two tones across the full keyboard). The app sets the voice mode and configures per-voice parameters (right/left tone, balance, split point, per-voice shift).

**Why this priority**: Powerful feature with full DT1 protocol mapped. Adds significant value beyond the official app by allowing saved Split/Dual configurations.

**Independent Test**: Set voice mode to Split, assign Piano to right hand and Bass to left hand, set split point to F#3. Verify the piano responds correctly.

**Acceptance Scenarios**:

1. **Given** the app is in Single mode, **When** the user selects Split mode, **Then** the piano enters Split mode and the UI shows right/left tone selectors.
2. **Given** Split mode is active, **When** the user changes the left tone, **Then** the piano's left zone changes tone.
3. **Given** Split mode is active, **When** the user sets a new split point, **Then** all keys below the split point use the left tone and all above use the right tone.
4. **Given** Dual mode is selected, **When** the user adjusts balance, **Then** the piano's voice mix changes.
5. **Given** a Split/Dual configuration is saved as a preset, **When** applied, **Then** all voice mode parameters are sent as a batch.

---

#### User Story 9 - Keyboard Transpose and Key Touch (Priority: P3 -- Phase 3)

A pianist needs to transpose the keyboard for accompaniment or adjust touch sensitivity. The TRANSPOSE button in the status bar opens a control for keyboard transpose (range -6 to +5 semitones). Key Touch sensitivity (6 levels: Fix through Super Heavy) is available in a settings panel.

**Acceptance Scenarios**:

1. **Given** the app is connected, **When** the user sets transpose to +2, **Then** all subsequent key presses sound 2 semitones higher.
2. **Given** the user changes transpose on the piano, **When** the notification is received, **Then** the transpose display in the status bar updates.
3. **Given** the settings panel is open, **When** the user selects Key Touch "Heavy", **Then** the piano's touch sensitivity changes.

---

### Phase 4 -- Pads & Advanced Controls

#### User Story 10 - Assignable Performance Pads (Priority: P1 -- Phase 4)

The PADS tab shows a grid of assignable buttons. Each pad can be configured to send a specific command or sequence of commands (e.g., "set volume to 80", "activate Split mode with Piano+Strings", "toggle metronome"). This transforms the app into a macro controller for live performance.

**Acceptance Scenarios**:

1. **Given** the PADS screen is active, **When** the user taps a configured pad, **Then** the assigned command(s) are sent immediately.
2. **Given** a pad is unconfigured, **When** the user long-presses it, **Then** a configuration dialog appears to assign an action.

---

#### User Story 11 - Full Metronome Control (Priority: P2 -- Phase 4)

The user controls all metronome parameters: toggle on/off, tempo, beat/time signature (0/4 through 6/4), rhythm pattern (8 options), metronome volume (0-10), and metronome tone/sound (Click, Electronic, Japanese, English).

**Acceptance Scenarios**:

1. **Given** the metronome control is open, **When** the user toggles metronome on, **Then** the metronome starts and the M: indicator updates based on the piano's echo.
2. **Given** the metronome is running, **When** the user changes tempo +/-1 BPM, **Then** the tempo changes and the status bar updates.
3. **Given** the metronome settings are open, **When** the user changes beat to 3/4, **Then** the piano's metronome switches to 3/4 time.

---

### Edge Cases

- What happens when BLE disconnects mid-performance? The app shows a disconnected state (red BLE icon), stops updating live values, and attempts automatic reconnection. No commands are silently lost. The user is notified.
- What happens when the user selects a tone while disconnected? The tone is queued as "pending" and auto-sent when BLE reconnects. The UI shows a pending indicator on the tone selector.
- What happens when the piano is power-cycled? The piano resets to defaults. When the app reconnects, it reads the piano's state via RQ1 and updates the UI to reflect reality. The user can then re-apply their preset.
- What happens when the user rapidly presses +/+ on the tone selector? Only the last tone selection is sent to the piano; intermediate steps are debounced.
- What happens when the piano sends a tone notification the app doesn't recognize? The app logs the unknown tone bytes and shows the raw category/index values instead of a name.
- What happens when multiple BLE MIDI devices are nearby? The app lists all discovered devices and lets the user choose, preferring previously connected FP-30X units.
- What happens on reconnection after a drop? The default preset is NOT re-applied. The app reads the piano's current state via RQ1 and updates the display.
- What happens if no default preset is set? On first connection, no preset is auto-applied. The app reads and displays the piano's current state.
- What happens when the user plays staccato (no note overlap)? The chord tracker shows each note individually as it's pressed, since the held-notes set never accumulates more than one note at a time. Chord detection only works with overlapping (legato) notes or sustain pedal.

## Requirements

### Functional Requirements -- Phase 1 (Core Display)

- **FR-001**: System MUST scan for and connect to BLE MIDI devices, discovering the writable+notifiable MIDI characteristic dynamically (by finding the characteristic with write-without-response AND notification support on the BLE MIDI service).
- **FR-002**: System MUST display a BLE connection status icon visible from all screens (green=connected, red=disconnected, grey=idle).
- **FR-003**: System MUST automatically attempt reconnection to a previously paired FP-30X on app launch.
- **FR-004**: System MUST use Roland DT1 SysEx for ALL parameter writes to the piano. Standard MIDI CC/PC messages are not supported by the FP-30X over BLE and MUST NOT be used.
- **FR-005**: System MUST contain a complete hardcoded catalog of all FP-30X SuperNATURAL tones (65 tones across 9 categories: Piano, E.Piano, Organ, Strings, Pad, Synth, Other, Drums, GM2) with their DT1 category byte and index values.
- **FR-006**: System MUST send DT1 tone selection with 3 data bytes (category, index high, index low) when the user selects a tone.
- **FR-007**: System MUST wrap all DT1 SysEx messages in BLE MIDI packet framing (header + timestamp + SysEx body + timestamp + end byte) before writing to the BLE characteristic.
- **FR-008**: System MUST subscribe to BLE MIDI notifications on the same characteristic used for writes, and parse incoming DT1 notifications to keep the UI in sync with physical piano controls.
- **FR-009**: System MUST read the piano's current state on connect by sending two RQ1 requests: (a) performance block for tone and volume, (b) status block for tempo and metronome state.
- **FR-010**: System MUST display in the status bar: tempo (BPM), beat (time signature), metronome state (ON/OFF), and volume.
- **FR-011**: The app MUST operate in landscape orientation exclusively. The UI aesthetic MUST be a dark hardware synthesizer display (dark background, tactile button appearance, glowing display-style text).
- **FR-012**: System MUST present tones via a two-tier stepper interface: a category selector (+/- buttons) above a tone-within-category selector (+/- buttons). Not a grid, not a scrollable list.
- **FR-013**: System MUST visually highlight the currently active tone and category.
- **FR-014**: System MUST prevent the device screen from turning off while the app is in the foreground (wake lock).
- **FR-015**: System MUST persist the last-used tone category locally so it can be restored on next launch.
- **FR-016**: System MUST allow tone selection while BLE connection is in progress. The last-selected tone MUST be queued and auto-sent once connected.

### Functional Requirements -- Phase 2 (Favorites, Presets & Quick Tones)

- **FR-017**: System MUST persist favorite tones locally across app sessions, supporting both SN and GM2 tones in the same list.
- **FR-018**: System MUST allow users to save named Presets that capture tone, volume, tempo, and metronome state as a batch of DT1 commands.
- **FR-019**: System MUST apply a preset by sending all its DT1 commands sequentially (no inter-write delay needed).
- **FR-020**: System MUST support a "Default Preset" that auto-applies on first BLE connection after app launch, but NOT on reconnection after a drop.
- **FR-021**: System MUST provide 3 quick-tone slots on the DISPLAY screen that apply a favorite tone with one tap.
- **FR-022**: System MUST provide preset management (create, rename, delete, reorder, set/unset default) in the PRESETS tab.

### Functional Requirements -- Phase 3 (Live Performance & Chord Detection)

- **FR-023**: System MUST parse Note On/Off messages from BLE MIDI notifications and maintain a held-notes set of currently pressed MIDI keys.
- **FR-024**: System MUST identify chord shapes from the held-notes set and display the chord name (e.g., "C Maj7", "Am7") in real time on the DISPLAY screen.
- **FR-025**: System MUST support voice mode changes (Single/Split/Dual) and configure per-voice parameters (right/left tone, balance, split point, per-voice shift).
- **FR-026**: System MUST support keyboard transpose (center=64, range -6 to +5 semitones) and display the current transpose value in the status bar.
- **FR-027**: System MUST support key touch sensitivity selection (6 levels: Fix, Super Light, Light, Medium, Heavy, Super Heavy).

### Functional Requirements -- Phase 4 (Pads & Advanced Controls)

- **FR-028**: System MUST provide assignable performance pads (PADS tab) that can each trigger a configured command or command sequence.
- **FR-029**: System MUST support full metronome control: toggle on/off, tempo, beat (6 options), pattern (8 options), volume (0-10), and tone (4 options).

### Key Entities

- **Tone**: A selectable piano sound. Attributes: name, category (Piano/E.Piano/Organ/Strings/Pad/Synth/Other/Drums/GM2), DT1 category byte (0-8), DT1 index high byte, DT1 index low byte, isFavorite flag.
- **Device Connection**: A BLE MIDI connection session. Attributes: device ID, device name, connection status (idle/scanning/connecting/connected/disconnected), MIDI characteristic UUID (discovered dynamically), isFirstConnectionThisSession flag.
- **Preset**: A saved batch of DT1 commands. Attributes: id, name, created timestamp, isDefault flag, tone (DT1 bytes), volume (0-127), tempo (BPM), metronome state, voice mode and parameters (Phase 3+: split/dual settings). Applying a preset sends all DT1 writes sequentially.
- **Performance State**: The app's internal mirror of the piano's current state, kept in sync via both outbound DT1 writes and inbound DT1 notifications. Attributes: active tone, volume, tempo, metronome state, beat, voice mode, keyboard transpose. Updated by: user actions in app, DT1 echoes from piano, RQ1 responses on connect.
- **Held Notes**: A transient set of currently pressed MIDI note numbers, updated by Note On (add) and Note Off (remove) notifications. Not persisted. Used by the chord detection engine.

## Success Criteria

### Measurable Outcomes

#### Phase 1 (Core Display)

- **SC-001**: Users can select any tone within 2 interactions from the main screen (one press on category +/-, one press on tone +/-).
- **SC-002**: Tone changes are audible on the piano within 200ms of the user's tap.
- **SC-003**: The app connects to the FP-30X within 5 seconds of launching when the piano is nearby and powered on.
- **SC-004**: After connection, the status bar displays the piano's actual tempo, volume, and metronome state within 1 second.
- **SC-005**: When the user changes a physical control on the piano (volume knob, tempo button, metronome), the app's display updates within 200ms.
- **SC-006**: The screen remains active (no auto-lock) throughout a performance session of at least 4 hours.

#### Phase 2 (Favorites, Presets & Quick Tones)

- **SC-007**: Favorite tones persist across 100% of app restarts with zero data loss.
- **SC-008**: A saved preset applies all its DT1 commands to the piano within 500ms of a single tap.
- **SC-009**: The default preset auto-applies within 2 seconds of the first successful BLE connection after app launch.
- **SC-010**: Quick-tone slot taps change the piano's tone with no additional interaction required.

#### Phase 3 (Live Performance & Chord Detection)

- **SC-011**: The chord tracker correctly identifies standard triads and seventh chords (major, minor, diminished, augmented, maj7, min7, dom7) when 3 or more notes are held simultaneously.
- **SC-012**: Chord display updates within 100ms of the last Note On/Off event.
- **SC-013**: Split/Dual mode activation and per-voice tone assignment work correctly.

#### Phase 4 (Pads & Advanced Controls)

- **SC-014**: Pad taps execute their assigned command(s) immediately.
- **SC-015**: All 6 metronome parameters (toggle, tempo, beat, pattern, volume, tone) can be controlled from the app.

## Assumptions

- The user owns a Roland FP-30X with Bluetooth MIDI functionality enabled and working.
- The user's mobile device supports Bluetooth Low Energy (BLE).
- The app targets iOS exclusively (iPhone primary, iPad adaptive). Android support follows later.
- The app operates in landscape orientation only.
- The FP-30X uses Roland DT1 SysEx for all parameter control over BLE. Standard MIDI CC/PC messages are ignored. This is a confirmed hardware behavior, not an assumption.
- The piano sends unsolicited DT1 notifications for physical control changes. This enables bidirectional state sync. Confirmed via R&D testing.
- Note On/Off messages are sent for every key press/release. Each note arrives as a separate 5-byte BLE MIDI packet. Confirmed.
- Batch DT1 writes (3 sequential writes with no delays) complete in ~56ms and all are applied. Confirmed.
- The BLE MIDI characteristic is used for both writes and notifications. The ISSC UART characteristics on the same service are ignored. Confirmed.
- Split/Dual/Twin mode parameters, metronome settings, key touch, and keyboard transpose DT1 addresses are all fully mapped and confirmed via PacketLogger captures. Full protocol documentation is in `docs/roland-sysex-discovery.md`.
- Internet connectivity is not required for any core functionality.
- The app does not support any Roland piano model other than the FP-30X in its initial release.
- The tone catalog data is static and bundled in the app.
- The app is single-user; no accounts, authentication, or cloud sync.
- Reverb and chorus CC/SysEx control does NOT work over BLE. Removed from scope.
- The UI is styled as a hardware synthesizer display, not a standard mobile app aesthetic.
