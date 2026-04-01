# Feature Specification: FP-30X Custom Controller

**Feature Branch**: `001-fp30x-custom-controller`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "Mobile app acting as a physical display/control surface for the Roland FP-30X digital piano. Replaces the limited official app with fast, dark-mode tone browsing and hardware parameter control via BLE MIDI."

## User Scenarios & Testing

### User Story 1 - Connect to Piano (Priority: P1)

A pianist powers on their FP-30X and opens the app. The app scans for nearby BLE MIDI devices, identifies the FP-30X by its device identity signature, and establishes a connection. The pianist sees a clear connection status indicator confirming the piano is ready to receive commands.

**Why this priority**: Nothing else works without a confirmed connection. This is the foundation for all other features.

**Independent Test**: Can be fully tested by launching the app near a powered-on FP-30X and verifying the connection indicator shows "connected." Delivers value by confirming device compatibility and readiness.

**Acceptance Scenarios**:

1. **Given** the app is launched and the FP-30X is powered on with Bluetooth enabled, **When** the app scans for devices, **Then** the FP-30X appears as an identifiable device in the connection list within 5 seconds.
2. **Given** the FP-30X appears in the device list, **When** the user taps to connect, **Then** a BLE MIDI connection is established and a persistent status indicator shows "Connected."
3. **Given** a connection is active, **When** the FP-30X is powered off or moves out of range, **Then** the app shows a "Disconnected" state and offers a reconnect option.
4. **Given** the app was previously connected to an FP-30X, **When** the app is launched again with the same piano nearby, **Then** the app automatically reconnects without requiring manual device selection.

---

### User Story 2 - Browse and Select Tones (Priority: P1)

A pianist wants to change the sound on their FP-30X. They open the tone browser, which organizes all available sounds into intuitive categories (Piano, E.Piano/Keys/Organ, Strings/Pads/Ensemble, Drum Kits). They tap a tone name and the piano immediately switches to that sound. The browsing experience is fast, grid-based, and requires no scrolling through endless lists.

**Why this priority**: This is the core value proposition — the entire reason the app exists. The official app makes tone selection clumsy; this app must make it instant and pleasant.

**Independent Test**: Can be fully tested by connecting to the FP-30X, navigating to any tone category, tapping a tone, and hearing the piano change sound. Delivers value by giving direct access to all 65 built-in tones that are hard to reach from the front panel.

**Acceptance Scenarios**:

1. **Given** the app is connected to the FP-30X, **When** the user opens the tone browser, **Then** tones are displayed organized by category (Piano, E.Piano/Keys/Organ, Other, Drums) in a grid or tabbed layout.
2. **Given** the tone browser is open showing a category, **When** the user taps a tone name, **Then** the piano switches to that tone within 100ms of the tap (no loading screen, no confirmation dialog).
3. **Given** the user is browsing tones, **When** they switch categories, **Then** the new category loads instantly with no transition delay.
4. **Given** the user selects a tone, **Then** the currently selected tone is visually highlighted so the user always knows what sound is active.

---

### User Story 3 - Browse and Select GM2 Sounds (Priority: P2)

A pianist or educator wants access to the full GM2 sound library (256 voices) for playback, experimentation, or educational purposes. They navigate to an "Advanced" or "GM2" section of the tone browser and can browse the full General MIDI 2 catalog organized by standard GM families (Pianos, Strings, Brass, Woodwinds, Synth, Percussion, Sound Effects, etc.).

**Why this priority**: Extends the tone browser's value significantly. The front panel makes GM2 access nearly impossible. However, the curated built-in tones (P1) are the primary daily use case.

**Independent Test**: Can be tested by connecting to the FP-30X, navigating to the GM2 section, selecting any GM2 sound, and hearing the piano switch to it.

**Acceptance Scenarios**:

1. **Given** the app is connected, **When** the user navigates to the GM2 sound library, **Then** all 256 GM2 voices are displayed organized by standard GM families.
2. **Given** the GM2 browser is open, **When** the user taps a GM2 sound, **Then** the piano switches to that sound immediately.
3. **Given** the user is in GM2 mode, **When** they switch back to the main tone browser, **Then** the app returns to the curated tone categories.

---

### User Story 4 - Live Performance Controls (Priority: P2)

A pianist is performing and wants to adjust volume, expression, or reverb/chorus levels without reaching for the piano's physical controls. They access on-screen controls that send real-time adjustments to the piano. Controls include master volume, per-part volume, expression, and reverb/chorus send levels.

**Why this priority**: The FP-30X has limited physical controls for real-time parameter adjustment. The app adds a meaningful performance control layer that doesn't exist on the hardware.

**Independent Test**: Can be tested by connecting to the FP-30X, adjusting any on-screen control (e.g., reverb level), and hearing the change in the piano's output in real time.

**Acceptance Scenarios**:

1. **Given** the app is connected and a tone is active, **When** the user adjusts the volume slider, **Then** the piano's volume changes in real time with no perceptible delay.
2. **Given** the app is connected, **When** the user adjusts the reverb send level, **Then** the reverb effect amount on the piano changes audibly.
3. **Given** the app is connected, **When** the user adjusts the chorus send level, **Then** the chorus effect amount changes audibly.
4. **Given** the user is on the performance controls screen, **When** they tap a virtual sustain/sostenuto/soft pedal button, **Then** the piano responds as if a physical pedal was pressed.

---

### User Story 5 - Effects Engine Settings (Priority: P3)

A pianist wants to change the reverb type from "Large Hall" to "Plate" or adjust the chorus character. They access a global effects settings page where they can select reverb type (6 options), adjust reverb time, select chorus type (6 options), and adjust chorus parameters (mod rate, mod depth, feedback, send-to-reverb).

**Why this priority**: Meaningful sound customization that the front panel exposes poorly. Builds on the performance controls to provide deeper sound personalization.

**Independent Test**: Can be tested by connecting, changing the reverb type, and hearing the difference when playing notes with reverb applied.

**Acceptance Scenarios**:

1. **Given** the app is connected, **When** the user opens the effects settings, **Then** they see the current reverb type and chorus type with adjustable parameters.
2. **Given** the effects page is open, **When** the user selects a different reverb type (Small Room, Medium Room, Large Room, Medium Hall, Large Hall, Plate), **Then** the piano's reverb engine changes to that type.
3. **Given** the effects page is open, **When** the user adjusts chorus parameters (type, mod rate, mod depth, feedback, send-to-reverb), **Then** the piano's chorus engine reflects those changes.

---

### User Story 6 - Favorite Tones (Priority: P3)

A pianist has a set of go-to sounds they use frequently. They can mark any tone (built-in or GM2) as a favorite and access all favorites from a dedicated quick-access section. Favorites persist between app sessions.

**Why this priority**: The FP-30X has no user-accessible memory for tone favorites via MIDI. The app fills this gap by storing favorites locally and re-sending the MIDI commands to recall them.

**Independent Test**: Can be tested by marking a tone as favorite, closing and reopening the app, navigating to favorites, tapping the saved tone, and hearing the piano switch to it.

**Acceptance Scenarios**:

1. **Given** a tone is displayed in the browser, **When** the user marks it as a favorite, **Then** the tone appears in the Favorites section.
2. **Given** the user has saved favorites, **When** they reopen the app after closing it, **Then** all previously saved favorites are still present.
3. **Given** the Favorites section is open with saved tones, **When** the user taps a favorite, **Then** the piano switches to that tone immediately.
4. **Given** a tone is marked as favorite, **When** the user removes it from favorites, **Then** it no longer appears in the Favorites section.

---

### User Story 7 - Sound Shaping Controls (Priority: P4)

An advanced user wants to tweak the character of a tone by adjusting filter cutoff, resonance, envelope (attack/decay/release), vibrato parameters (rate/depth/delay), or portamento. They access a "Sound Shape" panel that provides these controls.

**Why this priority**: Advanced feature for power users. Most pianists will use tones as-is, but this panel adds significant value for organ, synth, pad, and GM2 use cases. Some tones may not respond to all parameters.

**Independent Test**: Can be tested by selecting a synth pad tone, adjusting the cutoff filter, and hearing the tonal change.

**Acceptance Scenarios**:

1. **Given** the app is connected and a tone is active, **When** the user opens the Sound Shape panel, **Then** controls for cutoff, resonance, attack, decay, release, vibrato rate, vibrato depth, vibrato delay, and portamento are displayed.
2. **Given** the Sound Shape panel is open, **When** the user adjusts any parameter, **Then** the change is sent to the piano in real time.
3. **Given** a tone that does not respond to a particular parameter, **When** the user adjusts it, **Then** the control still functions (sends the MIDI message) but the app does not guarantee an audible effect — a "tone-dependent" indicator is visible.

---

### Edge Cases

- What happens when the BLE connection drops mid-performance? The app must show a clear disconnection alert and attempt automatic reconnection. No MIDI commands should be queued or silently lost.
- What happens when the user selects a tone while disconnected? The app must show the disconnected state clearly and prevent false feedback (no "tone selected" confirmation without an active connection).
- What happens when the piano is power-cycled? The piano resets to its default state. The app should indicate that the piano may have reset and offer a "re-send current tone" action.
- What happens if multiple BLE MIDI devices are nearby? The app should list all discovered devices and let the user choose, with preference given to previously connected FP-30X units.
- What happens when the user rapidly taps multiple tones in succession? Only the last-tapped tone should be applied; intermediate selections should be debounced or superseded.

## Requirements

### Functional Requirements

- **FR-001**: System MUST scan for and connect to BLE MIDI devices, identifying the FP-30X by its MIDI Identity Reply signature (Roland manufacturer ID 41H, device family 19H 03H).
- **FR-002**: System MUST display a persistent connection status indicator visible from all screens.
- **FR-003**: System MUST contain a complete hardcoded catalog of all FP-30X built-in tones (12 Piano, 20 E.Piano/Keys/Organ, 24 Other, 9 Drum Kits) with their correct Bank Select MSB, Bank Select LSB, and Program Change values.
- **FR-004**: System MUST contain a complete hardcoded catalog of all 256 GM2 tones with their correct Bank Select MSB (121), LSB, and Program Change values.
- **FR-005**: System MUST send the correct MIDI message sequence (Bank Select MSB → Bank Select LSB → Program Change) when the user selects a tone.
- **FR-006**: System MUST organize tones in a categorized grid or tabbed interface — not a single scrollable list.
- **FR-007**: System MUST send Control Change messages for live performance parameters: Volume (CC 7), Expression (CC 11), Reverb Send (CC 91), Chorus Send (CC 93), Hold/Sustain (CC 64), Sostenuto (CC 66), Soft (CC 67).
- **FR-008**: System MUST send Global Parameter Control SysEx messages for reverb engine settings (type and time) and chorus engine settings (type, mod rate, mod depth, feedback, send-to-reverb).
- **FR-009**: System MUST send Control Change messages for sound-shaping parameters: Cutoff (CC 74), Resonance (CC 71), Attack (CC 73), Decay (CC 75), Release (CC 72), Vibrato Rate (CC 76), Vibrato Depth (CC 77), Vibrato Delay (CC 78), Portamento On/Off (CC 65), Portamento Time (CC 5).
- **FR-010**: System MUST use a high-contrast dark theme (light text on absolute black background) as the only visual mode.
- **FR-011**: System MUST prevent the device screen from turning off while the app is in the foreground during active use (wake lock).
- **FR-012**: System MUST persist favorite tones locally across app sessions.
- **FR-013**: System MUST automatically attempt reconnection to a previously paired FP-30X when the app is launched.
- **FR-014**: System MUST visually highlight the currently selected/active tone.
- **FR-015**: System MUST send GM2 System On SysEx (F0 7E 7F 09 03 F7) before sending GM2 tone selections, and respect the 50ms post-message delay.
- **FR-016**: System MUST support Master Volume control via Universal Realtime SysEx.
- **FR-017**: System MUST clearly indicate when a control is "tone-dependent" (may not produce an audible effect on all sounds).

### Key Entities

- **Tone**: Represents a selectable sound. Attributes: name, category (Piano / E.Piano-Keys-Organ / Other / Drums / GM2), Bank Select MSB, Bank Select LSB, Program Change number, isFavorite flag.
- **Drum Kit**: A specialized Tone with Bank MSB = 120 and per-note instrument mappings. Attributes: name, Bank LSB, Program Change, note-to-instrument map.
- **Device Connection**: Represents a BLE MIDI connection session. Attributes: device name, device ID, connection status (scanning / discovered / connecting / connected / disconnected), last connected timestamp.
- **Effect Preset**: Represents the current state of reverb and chorus engine settings. Attributes: reverb type, reverb time, chorus type, chorus mod rate, chorus mod depth, chorus feedback, chorus send-to-reverb.
- **Performance State**: The app's internal mirror of what has been sent to the piano. Attributes: active tone, volume level, expression level, reverb send, chorus send, sound-shaping parameter values.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can select any built-in tone within 2 taps from the main screen (one tap to choose category, one tap to choose tone).
- **SC-002**: Tone changes are audible on the piano within 200ms of the user's tap.
- **SC-003**: The app connects to the FP-30X within 5 seconds of launching when the piano is nearby and powered on.
- **SC-004**: Users can access all 65 built-in tones and 256 GM2 tones without needing the piano's front-panel controls.
- **SC-005**: The screen remains active (no auto-lock) throughout a performance session of at least 4 hours.
- **SC-006**: 90% of first-time users can select a tone within 30 seconds of opening the app (after initial connection).
- **SC-007**: All live performance controls (volume, expression, reverb, chorus) produce audible changes on the piano with no perceptible latency.
- **SC-008**: Favorite tones persist across 100% of app restarts with zero data loss.

## Assumptions

- The user owns a Roland FP-30X with Bluetooth MIDI functionality enabled and working.
- The user's mobile device supports Bluetooth Low Energy (BLE) and the platform's native MIDI connectivity.
- The FP-30X MIDI Implementation document (Version 1.00, Aug 2021) is the authoritative and complete source for all supported MIDI messages. No undocumented MIDI features are relied upon.
- The piano's volatile memory behavior (resets to defaults on power off) is a permanent hardware constraint that cannot be changed by the app.
- The app does not need to read back the piano's current state — it operates as a one-way control surface that maintains its own state mirror.
- Internet connectivity is not required for any core functionality — the app works entirely offline after installation.
- The app does not need to support any Roland piano model other than the FP-30X in its initial release.
- The tone catalog data (names, MSB/LSB/PC values) is static and does not change with firmware updates within the same model.
- Split/Layer mode configuration is out of scope for this specification (not exposed via the FP-30X MIDI Implementation document).
- Metronome, song transport, and recorder controls are out of scope (not exposed via MIDI on the FP-30X).
- The app is single-user; no accounts, authentication, or cloud sync are required.
