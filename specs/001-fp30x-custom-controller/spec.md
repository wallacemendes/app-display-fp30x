# Feature Specification: FP-30X Custom Controller

**Feature Branch**: `001-fp30x-custom-controller`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "Mobile app acting as a physical display/control surface for the Roland FP-30X digital piano. Replaces the limited official app with fast, dark-mode tone browsing and hardware parameter control via BLE MIDI."

## Phased Roadmap

This specification is organized in three delivery phases. Each phase is independently deliverable and builds on the previous one.

- **Phase 1 — MVP (Tone Control Base)**: BLE MIDI connection + complete tone browser (SuperNATURAL built-in tones and GM2 library). The minimum product that delivers core value.
- **Phase 2 — Parameter & Effect Controls**: Live performance parameters (Volume, Reverb, Chorus, Pan, Expression). Turns the app from a tone selector into a real performance control surface.
- **Phase 3 — Deep Hardware / SysEx (Future Backlog)**: SysEx-based deep parameter control (Master Tuning, Brightness, effects engine types). Research-driven: includes reverse engineering the official app for undocumented capabilities like memory persistence.

## Clarifications

### Session 2026-03-31

- Q: What is the primary screen the user lands on after connecting? → A: Tone browser with the last-used category pre-selected (auto-connects in background).
- Q: Which MIDI channel should the app send tone-change messages on? → A: Always channel 1 (match the piano's default).
- Q: Which platform ships first for the MVP? → A: iOS first, Android follows after MVP validation.
- Q: What should happen when the user taps a tone before connection is established? → A: Allow browsing freely; queue the last-tapped tone and auto-send it once connected.
- Q: Should the app support presets (saved states)? → A: Yes. Users can save the entire app state as a Preset and apply it with one tap to batch-send all MIDI commands. A default preset auto-applies on first connection after app launch, but NOT on reconnection (to avoid disrupting live performance).
- Q: Should the UI adapt for tablet? → A: Yes. iPhone-first but the UI must be adaptive for iPad/tablet layouts.
- Q: Tech stack? → A: React Native.

## User Scenarios & Testing

### Phase 1 — MVP

#### User Story 1 - Connect to Piano (Priority: P1 · Phase 1)

A pianist powers on their FP-30X and opens the app. The app immediately shows the tone browser (the landing screen) while auto-connecting to a previously paired FP-30X in the background. A persistent connection status indicator transitions from "Connecting..." to "Connected" once the BLE MIDI link is established. If no previously paired device is found, the app shows a device scan/selection overlay.

**Why this priority**: Nothing else works without a confirmed connection. This is the foundation for all other features.

**Independent Test**: Can be fully tested by launching the app near a powered-on FP-30X and verifying the connection indicator shows "connected." Delivers value by confirming device compatibility and readiness.

**Acceptance Scenarios**:

1. **Given** the app is launched and the FP-30X is powered on with Bluetooth enabled, **When** the app scans for devices, **Then** the FP-30X appears as an identifiable device in the connection list within 5 seconds.
2. **Given** the FP-30X appears in the device list, **When** the user taps to connect, **Then** a BLE MIDI connection is established and a persistent status indicator shows "Connected."
3. **Given** a connection is active, **When** the FP-30X is powered off or moves out of range, **Then** the app shows a "Disconnected" state and offers a reconnect option.
4. **Given** the app was previously connected to an FP-30X, **When** the app is launched again with the same piano nearby, **Then** the app automatically reconnects without requiring manual device selection.

---

#### User Story 2 - Browse and Select Built-In Tones (Priority: P1 · Phase 1)

The tone browser is the app's landing screen — it is the first thing the user sees when the app opens. It organizes all available SuperNATURAL built-in sounds into intuitive categories (Piano, E.Piano/Keys/Organ, Strings/Pads/Ensemble, Drum Kits), pre-selecting the last-used category from the previous session. The user taps a tone name and the piano immediately switches to that sound. The browsing experience is fast, grid-based, and requires no scrolling through endless lists.

**Why this priority**: This is the core value proposition — the entire reason the app exists. The official app makes tone selection clumsy; this app must make it instant and pleasant. The piano loses its tone selection when powered off, so the app acts as a fast state injector at power-on.

**Independent Test**: Can be fully tested by connecting to the FP-30X, navigating to any tone category, tapping a tone, and hearing the piano change sound. Delivers value by giving direct access to all 65 built-in tones that are hard to reach from the front panel.

**Acceptance Scenarios**:

1. **Given** the app is connected to the FP-30X, **When** the user opens the tone browser, **Then** tones are displayed organized by category (Piano, E.Piano/Keys/Organ, Other, Drums) in a grid or tabbed layout.
2. **Given** the tone browser is open showing a category, **When** the user taps a tone name, **Then** the piano switches to that tone within 100ms of the tap (no loading screen, no confirmation dialog).
3. **Given** the user is browsing tones, **When** they switch categories, **Then** the new category loads instantly with no transition delay.
4. **Given** the user selects a tone, **Then** the currently selected tone is visually highlighted so the user always knows what sound is active.

---

#### User Story 3 - Browse and Select GM2 Sounds (Priority: P1 · Phase 1)

A pianist or educator wants access to the full GM2 sound library (256 voices) for playback, experimentation, or educational purposes. They navigate to a "GM2" section of the tone browser and can browse the full General MIDI 2 catalog organized by standard GM families (Pianos, Strings, Brass, Woodwinds, Synth, Percussion, Sound Effects, etc.).

**Why this priority**: Part of the MVP because the complete tone catalog (both SuperNATURAL and GM2) is the app's core offering. The front panel makes GM2 access nearly impossible — the app unlocks 256 hidden sounds.

**Independent Test**: Can be tested by connecting to the FP-30X, navigating to the GM2 section, selecting any GM2 sound, and hearing the piano switch to it.

**Acceptance Scenarios**:

1. **Given** the app is connected, **When** the user navigates to the GM2 sound library, **Then** all 256 GM2 voices are displayed organized by standard GM families.
2. **Given** the GM2 browser is open, **When** the user taps a GM2 sound, **Then** the piano switches to that sound immediately.
3. **Given** the user is in GM2 mode, **When** they switch back to the main tone browser, **Then** the app returns to the curated tone categories.

---

#### User Story 4 - Favorite Tones (Priority: P2 · Phase 1)

A pianist has a set of go-to sounds they use frequently. They can mark any tone (built-in or GM2) as a favorite and access all favorites from a dedicated quick-access section. Favorites persist between app sessions. This is especially valuable because the piano resets to defaults on power-off — favorites let the user instantly re-apply their preferred setup.

**Why this priority**: Included in MVP because it's a local-only feature with no hardware dependency, and directly addresses the piano's volatile memory limitation. It makes the tone browser immediately more useful for daily use.

**Independent Test**: Can be tested by marking a tone as favorite, closing and reopening the app, navigating to favorites, tapping the saved tone, and hearing the piano switch to it.

**Acceptance Scenarios**:

1. **Given** a tone is displayed in the browser, **When** the user marks it as a favorite, **Then** the tone appears in the Favorites section.
2. **Given** the user has saved favorites, **When** they reopen the app after closing it, **Then** all previously saved favorites are still present.
3. **Given** the Favorites section is open with saved tones, **When** the user taps a favorite, **Then** the piano switches to that tone immediately.
4. **Given** a tone is marked as favorite, **When** the user removes it from favorites, **Then** it no longer appears in the Favorites section.

---

#### User Story 5 - Presets (Saved States) (Priority: P2 · Phase 1)

The FP-30X resets all settings when powered off. A pianist wants to save their complete setup (selected tone, and in future phases: volume, reverb, chorus, pan, expression settings) as a named Preset. With one tap, they can re-apply their entire setup by sending a batch of MIDI commands to the piano. They can also designate one preset as their "Default Preset" — which auto-applies when the app first connects to the piano after launch.

**Why this priority**: Directly solves the piano's volatile memory limitation. Without presets, the user must manually reconfigure everything each time they power on. This is the app's strongest differentiator vs. the official Roland app.

**Independent Test**: Can be tested by saving a preset (tone + future parameters), closing the app, reopening, connecting to the piano, and verifying the default preset was automatically applied. Also test manual preset recall via one-tap.

**Acceptance Scenarios**:

1. **Given** the user has configured a tone (and in future phases: parameter settings), **When** they save a new preset with a name, **Then** the preset is stored locally with all current MIDI state values.
2. **Given** saved presets exist, **When** the user taps a preset, **Then** all MIDI commands for that preset are sent to the piano as a batch.
3. **Given** a preset is marked as "Default," **When** the app launches and successfully connects to the piano for the first time in that session, **Then** the default preset is automatically applied.
4. **Given** a connection is lost and then re-established during an active session, **When** the reconnection succeeds, **Then** the default preset is NOT re-applied (to avoid disrupting a live performance). The user can manually re-apply if desired.
5. **Given** the user has multiple presets, **When** they view the presets list, **Then** they can rename, delete, reorder, and set/unset the default flag.

### Phase 2 — Parameter & Effect Controls

#### User Story 6 - Live Performance Controls (Priority: P1 · Phase 2)

A pianist is performing and wants to adjust volume, reverb level, chorus level, panning, or expression without reaching for the piano's physical controls. They access on-screen controls that send real-time adjustments to the piano.

**Why this priority**: Transforms the app from a tone selector into a genuine performance control surface. These are the most immediately useful real-time parameters.

**Independent Test**: Can be tested by connecting to the FP-30X, adjusting any on-screen control (e.g., reverb level), and hearing the change in the piano's output in real time.

**Acceptance Scenarios**:

1. **Given** the app is connected and a tone is active, **When** the user adjusts the volume control, **Then** the piano's volume changes in real time with no perceptible delay.
2. **Given** the app is connected, **When** the user adjusts the reverb send level, **Then** the reverb effect amount on the piano changes audibly.
3. **Given** the app is connected, **When** the user adjusts the chorus send level, **Then** the chorus effect amount changes audibly.
4. **Given** the app is connected, **When** the user adjusts the pan control, **Then** the stereo position of the sound shifts accordingly.
5. **Given** the app is connected, **When** the user adjusts the expression control, **Then** the piano's dynamic expression level changes audibly.

---

### Phase 3 — Deep Hardware / SysEx (Future Backlog)

#### User Story 7 - Deep Parameter Control via SysEx (Priority: P1 · Phase 3)

An advanced user wants to control deep hardware parameters that are only accessible via System Exclusive messages: Master Tuning (concert pitch adjustment), tonal Brightness, and potentially metronome settings. They access an advanced settings panel for these controls.

**Why this priority**: Unlocks the full depth of the FP-30X's capabilities. Requires SysEx messaging which is more complex than standard Control Change messages.

**Independent Test**: Can be tested by connecting, adjusting the Master Tuning value, and verifying the piano's pitch changes accordingly.

**Acceptance Scenarios**:

1. **Given** the app is connected, **When** the user adjusts the Master Fine Tuning control, **Then** the piano's concert pitch changes (e.g., from A4=440Hz to A4=442Hz).
2. **Given** the app is connected, **When** the user adjusts the Master Coarse Tuning, **Then** the piano transposes in semitone increments.
3. **Given** the app is connected, **When** the user sets a global effects parameter via SysEx (reverb type, chorus type), **Then** the piano's effect engine responds.

---

#### User Story 8 - Reverse Engineering & Memory Persistence (Priority: P2 · Phase 3)

A power user wants the piano to retain settings (Key Touch sensitivity, selected tone, etc.) after being powered off. This requires research into undocumented MIDI commands by capturing and analyzing traffic from the official Roland app.

**Why this priority**: This is research-driven and speculative. The MIDI Implementation document does not expose memory persistence commands. Success depends on reverse engineering the official app's BLE MIDI traffic.

**Independent Test**: Can be tested by sending the discovered persistence command, power-cycling the piano, and verifying the setting was retained.

**Acceptance Scenarios**:

1. **Given** the official app's BLE MIDI traffic has been captured and analyzed, **When** a persistence command pattern is identified, **Then** the app can replicate that command to save settings to the piano's memory.
2. **Given** no persistence command is discoverable, **Then** this feature is documented as hardware-limited and the app continues to operate as a state injector (re-sending settings on each session).

---

### Edge Cases

- What happens when the BLE connection drops mid-performance? The app must show a clear disconnection alert and attempt automatic reconnection. No MIDI commands should be queued or silently lost.
- What happens when the user selects a tone while disconnected? The app must show the disconnected state clearly and prevent false feedback (no "tone selected" confirmation without an active connection).
- What happens when the piano is power-cycled? The piano resets to its default state. The app should indicate that the piano may have reset and offer a "re-send current tone" action.
- What happens if multiple BLE MIDI devices are nearby? The app should list all discovered devices and let the user choose, with preference given to previously connected FP-30X units.
- What happens when the user rapidly taps multiple tones in succession? Only the last-tapped tone should be applied; intermediate selections should be debounced or superseded.
- What happens when the user taps a tone before the BLE connection has finished establishing? The app allows full browsing and tone selection while disconnected. The last-tapped tone is queued and automatically sent to the piano once the connection is established. The UI highlights the queued tone with a visual indicator (e.g., "pending" state) until confirmed.
- What happens on reconnection after a connection drop? The default preset is NOT re-applied automatically. The user is notified that the connection was restored and can manually re-apply their preset if needed. This prevents unexpected sound changes during a live performance.
- What happens if no default preset is set? On first connection, no preset is auto-applied — the app simply connects and the user browses/selects manually.

## Requirements

### Functional Requirements — Phase 1 (MVP)

- **FR-001**: System MUST scan for and connect to BLE MIDI devices, identifying the FP-30X by its MIDI Identity Reply signature (Roland manufacturer ID 41H, device family 19H 03H).
- **FR-002**: System MUST display a persistent connection status indicator visible from all screens.
- **FR-003**: System MUST automatically attempt reconnection to a previously paired FP-30X when the app is launched.
- **FR-004**: System MUST contain a complete hardcoded catalog of all FP-30X built-in tones (12 Piano, 20 E.Piano/Keys/Organ, 24 Other, 9 Drum Kits) with their correct Bank Select MSB, Bank Select LSB, and Program Change values.
- **FR-005**: System MUST contain a complete hardcoded catalog of all 256 GM2 tones with their correct Bank Select MSB (121), LSB, and Program Change values.
- **FR-006**: System MUST send the correct MIDI message sequence (CC 0 Bank Select MSB → CC 32 Bank Select LSB → Program Change) on MIDI channel 1 when the user selects a tone.
- **FR-007**: System MUST organize tones in a categorized grid or tabbed interface — not a single scrollable list.
- **FR-008**: System MUST visually highlight the currently selected/active tone.
- **FR-009**: System MUST send GM2 System On SysEx (F0 7E 7F 09 03 F7) before sending GM2 tone selections, and respect the 50ms post-message delay.
- **FR-010**: System MUST use a high-contrast dark theme (light text on absolute black background) as the only visual mode.
- **FR-011**: System MUST prevent the device screen from turning off while the app is in the foreground during active use (wake lock).
- **FR-012**: System MUST persist favorite tones locally across app sessions.
- **FR-012a**: System MUST open directly to the tone browser as the landing screen, pre-selecting the last-used category from the previous session. BLE connection MUST proceed automatically in the background.
- **FR-012b**: System MUST persist the last-used tone category locally so it can be restored on next launch.
- **FR-012c**: System MUST allow tone browsing and selection while BLE connection is in progress. The last-selected tone MUST be queued and automatically sent to the piano when the connection is established.
- **FR-013**: System MUST allow users to save named Presets that capture the current MIDI state (selected tone, and in future phases: parameter values).
- **FR-014**: System MUST apply a saved preset by sending all its MIDI commands as a batch to the piano with one tap.
- **FR-015**: System MUST allow the user to designate one preset as the "Default Preset."
- **FR-016**: System MUST auto-apply the default preset on the FIRST successful BLE connection after app launch — but MUST NOT re-apply it on reconnection after a connection drop.
- **FR-017**: System MUST persist all presets locally across app sessions.
- **FR-018**: System MUST provide preset management (create, rename, delete, reorder, set/unset default).
- **FR-019**: The UI MUST be designed for iPhone (smartphone) as the primary form factor, with adaptive layouts that scale gracefully to iPad (tablet) screens.

### Functional Requirements — Phase 2 (Parameter Controls)

- **FR-020**: System MUST send Control Change messages for: Volume (CC 7), Reverb Send Level (CC 91), Chorus Send Level (CC 93), Pan (CC 10), Expression (CC 11).
- **FR-021**: System MUST provide on-screen controls (sliders or knobs) for each Phase 2 parameter with real-time MIDI transmission on value change.
- **FR-022**: Presets created in Phase 2 MUST additionally capture parameter values (volume, reverb, chorus, pan, expression) alongside the tone selection.

### Functional Requirements — Phase 3 (Deep Hardware / SysEx — Future)

- **FR-023**: System MUST send Universal Realtime SysEx for Master Volume, Master Fine Tuning, and Master Coarse Tuning.
- **FR-024**: System MUST send Global Parameter Control SysEx messages for reverb engine settings (type and time) and chorus engine settings (type, mod rate, mod depth, feedback, send-to-reverb).
- **FR-025**: System SHOULD investigate undocumented MIDI commands via traffic analysis of the official Roland app to discover memory persistence capabilities (Key Touch, tone retention after power-off).
- **FR-026**: System MUST send Control Change messages for sound-shaping parameters: Cutoff (CC 74), Resonance (CC 71), Attack (CC 73), Decay (CC 75), Release (CC 72), Vibrato Rate (CC 76), Vibrato Depth (CC 77), Vibrato Delay (CC 78), Portamento On/Off (CC 65), Portamento Time (CC 5).
- **FR-027**: System MUST clearly indicate when a control is "tone-dependent" (may not produce an audible effect on all sounds).

### Key Entities

- **Tone**: Represents a selectable sound. Attributes: name, category (Piano / E.Piano-Keys-Organ / Other / Drums / GM2), Bank Select MSB, Bank Select LSB, Program Change number, isFavorite flag.
- **Drum Kit**: A specialized Tone with Bank MSB = 120 and per-note instrument mappings. Attributes: name, Bank LSB, Program Change, note-to-instrument map.
- **Device Connection**: Represents a BLE MIDI connection session. Attributes: device name, device ID, connection status (scanning / discovered / connecting / connected / disconnected), last connected timestamp, isFirstConnectionThisSession flag (tracks whether default preset has been applied).
- **Preset**: A saved snapshot of the app's MIDI state. Attributes: id, name, created timestamp, isDefault flag, tone (reference), parameter values (Phase 2+: volume, reverb, chorus, pan, expression; Phase 3+: sound-shaping, tuning, effects engine). Applying a preset sends all its stored MIDI commands as a batch.
- **Performance State**: The app's internal mirror of what has been sent to the piano. Attributes: active tone, active preset (if any), volume level, expression level, pan position, reverb send, chorus send. Expanded in Phase 3 with: sound-shaping parameter values, tuning values, effect engine settings.

## Success Criteria

### Measurable Outcomes

#### Phase 1 (MVP)

- **SC-001**: Users can select any built-in tone within 2 taps from the main screen (one tap to choose category, one tap to choose tone).
- **SC-002**: Tone changes are audible on the piano within 200ms of the user's tap.
- **SC-003**: The app connects to the FP-30X within 5 seconds of launching when the piano is nearby and powered on.
- **SC-004**: Users can access all 65 built-in tones and 256 GM2 tones without needing the piano's front-panel controls.
- **SC-005**: The screen remains active (no auto-lock) throughout a performance session of at least 4 hours.
- **SC-006**: 90% of first-time users can select a tone within 30 seconds of opening the app (after initial connection).
- **SC-007**: Favorite tones persist across 100% of app restarts with zero data loss.
- **SC-008**: A saved preset can be applied to the piano with a single tap, sending all MIDI commands within 500ms.
- **SC-009**: The default preset auto-applies within 2 seconds of the first successful BLE connection after app launch.
- **SC-010**: Presets persist across 100% of app restarts with zero data loss.

#### Phase 2

- **SC-011**: All live performance controls (volume, reverb, chorus, pan, expression) produce audible changes on the piano with no perceptible latency.

#### Phase 3

- **SC-012**: Master Tuning adjustments are audible (e.g., shifting from A4=440Hz to A4=442Hz).
- **SC-013**: Reverse engineering findings are documented regardless of success — either as implemented features or as "hardware-limited" conclusions.

## Assumptions

- The user owns a Roland FP-30X with Bluetooth MIDI functionality enabled and working.
- The user's mobile device supports Bluetooth Low Energy (BLE) and the platform's native MIDI connectivity.
- The MVP targets iOS exclusively (iPhone smartphone as primary). Android support follows after the iOS MVP is validated.
- The UI is designed iPhone-first but must be adaptive for iPad/tablet layouts (responsive grids, scalable components).
- The app is built with React Native for cross-platform architecture accommodating future Android expansion without a full rewrite.
- The FP-30X MIDI Implementation document (Version 1.00, Aug 2021) is the authoritative and complete source for all documented MIDI messages. Phase 3 features may rely on undocumented commands discovered through reverse engineering.
- The piano's volatile memory behavior (resets to defaults on power off) is a permanent hardware constraint that cannot be changed by the app — unless Phase 3 reverse engineering discovers a persistence mechanism.
- The app does not need to read back the piano's current state — it operates as a one-way control surface that maintains its own state mirror.
- Internet connectivity is not required for any core functionality — the app works entirely offline after installation.
- The app does not need to support any Roland piano model other than the FP-30X in its initial release.
- The tone catalog data (names, MSB/LSB/PC values) is static and does not change with firmware updates within the same model.
- Split/Layer mode configuration is out of scope for all phases (not exposed via the FP-30X MIDI Implementation document).
- The app is single-user; no accounts, authentication, or cloud sync are required.
- Phase 1 (MVP) is the immediate development target. Phase 2 and Phase 3 are planned but not committed to a timeline.
- All MIDI messages are sent on channel 1 (the FP-30X's default receive channel). Multi-channel support is out of scope.
