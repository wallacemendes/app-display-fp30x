<!--
  Sync Impact Report
  ─────────────────────────────────────────────────
  Version change: 2.0.0 → 2.0.1 (PATCH — UI refinements)
  Modified principles:
    - III. Landscape Hardware-Synth UI:
      - Light mode: #FFFFFF → steel-grey background (brushed metal)
      - Added LCD/display font requirement (Orbitron, VT323, or
        Digital-7 style) for BPM, time signature, and tone names
  Added sections: (none)
  Removed sections: (none)
  Templates checked:
    ✅ .specify/templates/plan-template.md — no conflicts
    ✅ .specify/templates/spec-template.md — no conflicts
    ✅ .specify/templates/tasks-template.md — no conflicts
  Propagated changes:
    ⚠ CLAUDE.md — must be regenerated after constitution ratification
  Follow-up TODOs:
    - Regenerate CLAUDE.md from updated constitution + v2 spec
    - Navigation library TBD (spec says top tabs, no bottom tab bar)
    - Final font selection during Phase 1 UI implementation
-->

# FP-30X Controller Constitution

## Core Principles

### I. Offline-First & Protocol-Authoritative

The app MUST function entirely offline after installation. No
network requests, accounts, or cloud services are permitted for
core functionality.

The **Roland SysEx Protocol Discovery document**
(`docs/roland-sysex-discovery.md`) is the primary authoritative
source for all MIDI protocol behavior. It documents the
reverse-engineered DT1/RQ1 protocol, BLE MIDI framing, address
maps, and notification patterns confirmed via PacketLogger
captures.

The **FP-30X MIDI Implementation document**
(`docs/FP-30X_MIDI_Imple_eng01_W.md`) remains the reference for:
(a) the complete GM2 tone list (256 voices), (b) documented
Universal SysEx messages, and (c) CC/controller number definitions.
Where the two documents conflict on BLE behavior, the discovery
document takes precedence.

- All tone catalogs, UI assets, and configuration data MUST be
  bundled in the app — no runtime downloads.
- BLE is the sole external I/O channel; it connects only to the
  piano, never to the internet.

### II. Bidirectional Control Surface (Hardware-Authoritative)

The app operates as a **bidirectional control surface**. It writes
parameters to the piano via DT1 SysEx AND reads the piano's state
via RQ1 requests and unsolicited DT1 notifications.

When the app's internal state and the piano's actual state
disagree, **the piano's state wins**. The app MUST update its UI
to reflect reality, never silently assume its last write succeeded.

- On initial connection, the app MUST read the piano's current
  state by sending RQ1 requests (performance block + tempo/
  metronome block) and populating the UI with the response.
- The app MUST subscribe to BLE MIDI notifications and parse
  inbound DT1 messages to keep the UI in sync with physical
  piano control changes (volume knob, tone buttons, tempo, etc.).
- On first connection after app launch, the app MUST apply the
  user's default preset (if set) AFTER reading initial state.
- On reconnection after a connection drop, the app MUST NOT
  auto-apply any preset — it reads the piano's current state and
  updates the UI to reflect reality.
- Queued tone selections (made while disconnected) MUST be sent
  automatically when the connection is established, and the UI
  MUST show a "pending" state indicator until the piano's echo
  notification confirms it.

### III. Landscape Hardware-Synth UI

The app MUST operate in landscape orientation exclusively. The UI
aesthetic MUST evoke a hardware synthesizer display — dark
background, tactile button appearance, glowing display-style text.

The app MUST follow the device's system appearance setting (light
or dark mode) by default. A manual toggle MUST allow the user to
override and lock to light or dark independently of the system.

- **Dark mode**: Base background MUST be absolute black
  (`#000000`). All UI surfaces derive from this anchor.
- **Light mode**: Base background MUST be a steel-grey tone
  that evokes brushed metal — NOT pure white. The palette
  SHOULD convey the look of a physical synthesizer chassis
  under bright lighting. Foreground elements use deep,
  saturated colors for contrast against the metallic base.
- **Typography**: Numeric displays (BPM, time signature) and
  tone names MUST use an LCD/display-style font to reinforce
  the hardware synth aesthetic. Candidates: Orbitron, VT323,
  Digital-7, or a comparable monospaced digital typeface from
  Google Fonts. The final font MUST be bundled as a custom
  asset (no runtime download). Body text and labels MAY use a
  complementary sans-serif for readability.
- Text and interactive elements MUST meet WCAG AA contrast ratios
  in both modes. High contrast is non-negotiable.
- The theme preference (system / light / dark) MUST be persisted
  locally and restored on next launch.
- The device screen MUST NOT auto-lock while the app is in the
  foreground (wake lock required).
- Haptic feedback MUST accompany destructive or significant
  gestures (e.g., long-press to favorite, delete preset).
- The UI MUST be designed iPhone-first with adaptive layouts that
  scale gracefully to iPad.

### IV. DT1 SysEx Protocol Fidelity

All parameter control to the piano MUST use Roland DT1 SysEx
messages with model ID `00 00 00 28`. Standard MIDI CC/PC channel
messages are silently ignored by the FP-30X over BLE and MUST NOT
be used for parameter control.

State reads MUST use Roland RQ1 SysEx. The piano responds with a
DT1 containing the requested data.

- Tone selection MUST write 3 data bytes (category, index high,
  index low) to DT1 address `01 00 02 07`.
- Every DT1/RQ1 message MUST include a correct Roland checksum
  (see `docs/roland-sysex-discovery.md`, Appendix A).
- BLE MIDI packets MUST include proper timestamp headers per the
  BLE MIDI specification. SysEx messages require a separate
  timestamp byte before the `F7` end marker.
- The notification parser MUST handle both DT1 echoes (parameter
  confirmations) and standard MIDI messages (Note On/Off for
  chord detection, CC/PC echoes for tone identification).
- Rapid user input (e.g., fast tone cycling) MUST be debounced
  so only the last selection is sent to the piano.
- Batch DT1 writes (e.g., preset apply) MUST be sent sequentially
  with no inter-write delay. Confirmed: 3 DT1 writes complete in
  ~56ms with all parameters applied.

### V. Layered Architecture with Engine Abstraction

Source code MUST be organized in distinct layers with clear
dependency rules. This is a constitutional requirement to ensure
multi-piano extensibility and low coupling between modules.

```
┌─────────────────────────────────────────────────────┐
│  PRESENTATION                                       │
│  screens/ + components/ + hooks/                    │
│  Organized by screen/tab. UI concerns only.         │
│  Depends on: services (via hooks), stores           │
├─────────────────────────────────────────────────────┤
│  APPLICATION SERVICES                               │
│  services/                                          │
│  Orchestrates engine + transport. Stateless logic.  │
│  PianoService routes commands to the active engine. │
│  Depends on: engine, transport, stores              │
├──────────────────┬──────────────────┬───────────────┤
│  DOMAIN          │  INFRASTRUCTURE  │  STATE        │
│  engine/         │  transport/      │  store/       │
│  Model-specific  │  Communication   │  Zustand +    │
│  protocol        │  (BLE now,       │  MMKV.        │
│  knowledge.      │   USB later).    │               │
│                  │  Model-agnostic. │               │
└──────────────────┴──────────────────┴───────────────┘
```

**Layer rules:**

- **Engine** (`engine/`) encapsulates ALL model-specific knowledge:
  DT1/RQ1 address maps, tone catalogs, SysEx message builders,
  notification parsers, and model constants. Each piano model is
  a separate subdirectory (e.g., `engine/fp30x/`) implementing
  a common `PianoEngine` interface.
- **Transport** (`transport/`) abstracts the communication channel.
  BLE is the current implementation; USB is planned for the
  future. Transport is model-agnostic — it sends and receives raw
  bytes without understanding their meaning.
- **Services** (`services/`) orchestrate engine + transport.
  `PianoService` is the core facade: it asks the engine to build
  a SysEx message, then hands the bytes to the transport.
- **Stores** (`store/`) hold shared application state and are
  accessible from any layer.
- **Presentation** (`screens/`, `components/`, `hooks/`) is
  organized by screen/tab, not by feature domain. Screens depend
  on services via hooks; they MUST NOT import from engine or
  transport directly.

**Dependency rules:**
- Presentation → Services (via hooks) → Engine + Transport
- Engine and Transport MUST NOT depend on each other
- No layer may import from a layer above it
- Cross-layer violations MUST be justified in the Complexity
  Tracking table of the relevant plan

**Adding a new piano model** = adding a new `engine/<model>/`
directory that implements `PianoEngine`. No changes to services,
transport, or presentation code.

### VI. Phased Delivery

The project follows a five-phase roadmap. Each phase is
independently deliverable and MUST NOT introduce dependencies
on later phases.

- **Phase 1 (Core Display)**: BLE connection via DT1 SysEx, tone
  browsing and selection (65 SN + 256 GM2), live status bar
  (tempo, volume, metronome, beat), initial state read on connect,
  bidirectional notification sync.
- **Phase 2 (Favorites, Presets & Quick Tones)**: Persistent
  favorites (mixed SN + GM2), named presets with DT1 parameter
  batches, quick-tone slots on DISPLAY, auto-apply default preset
  on first connect.
- **Phase 3 (Live Performance & Chord Detection)**: Real-time
  chord tracker from Note On/Off, Split/Dual mode activation and
  tone assignment, keyboard transpose, key touch sensitivity.
- **Phase 4 (Pads & Advanced Controls)**: Assignable performance
  pads, full metronome control (beat, pattern, tone, volume).
- **Phase 5 (Import/Export)**: Export and import presets as files
  for backup, sharing, and device migration.

Rules:
- Data models MUST use nullable fields for future-phase parameters
  — no Phase 2 code in Phase 1, but schema extensibility MUST be
  planned.
- A feature spec, plan, and task breakdown MUST exist before any
  implementation begins for a phase.

### VII. Simplicity & Justified Complexity

Start with the simplest implementation that satisfies the current
phase's requirements. Reject speculative complexity.

- The engine and transport interfaces (Principle V) are the ONLY
  mandated abstractions. Additional abstraction layers (repositories,
  DAOs, service locators, DI containers) MUST NOT be introduced
  unless justified by a documented complexity violation.
- NativeWind MUST be used for styling. Custom `StyleSheet.create`
  objects SHOULD be avoided when NativeWind utility classes suffice.
- React Native Reusables MUST be used as the component foundation
  for high flexibility and customizability.
- Zustand + MMKV for state management — no upgrades unless a
  concrete scaling problem is demonstrated.
- If a simpler alternative exists, the complex approach MUST be
  justified in the plan's Complexity Tracking table.

## Technology Constraints

The following stack decisions are locked for the project's
lifetime unless a constitution amendment explicitly changes them.

| Layer | Decision | Rationale |
|-------|----------|-----------|
| Framework | React Native 0.76+ (TypeScript 5.x) | Cross-platform, iOS-first with future Android |
| BLE | `react-native-ble-plx` + custom MIDI parser | No production-ready RN BLE MIDI lib exists |
| Storage | MMKV (`react-native-mmkv`) | Synchronous, fast, encrypts if needed |
| State | Zustand + MMKV persist middleware | Lightweight, TS-native, no boilerplate |
| Styling | NativeWind (Tailwind CSS for RN) | Utility-first, fast iteration, system-adaptive theming |
| Components | React Native Reusables | High flexibility and customizability |
| Fonts | LCD/display typeface (Orbitron, VT323, or Digital-7) + sans-serif body | Hardware synth aesthetic; bundled as custom assets |
| Wake Lock | `react-native-keep-awake` | Single-purpose, minimal |
| Haptics | `react-native-haptic-feedback` | iOS Taptic Engine support |
| Target | iOS 15+ (iPhone primary, iPad adaptive) | Matches FP-30X user base |
| Orientation | Landscape-only | Hardware synth display aesthetic |
| Protocol | Roland DT1/RQ1 SysEx (model `0x28`) | Only protocol that works over BLE |

- All MIDI message construction MUST be in pure TypeScript
  (no native modules) unless JS-bridge latency is measured and
  proven unacceptable.
- Third-party dependencies MUST be actively maintained (last
  commit < 6 months or > 1k GitHub stars).

## Development Workflow

1. **Spec-Driven Development**: Every feature begins with a
   specification (`spec.md`) containing user stories, acceptance
   scenarios, and functional requirements. No code is written
   before the spec is approved.
2. **Plan Before Code**: A technical plan (`plan.md`) with research
   (`research.md`), data model (`data-model.md`), and quickstart
   (`quickstart.md`) MUST be produced and reviewed before
   implementation.
3. **Task Breakdown**: Implementation follows a structured task
   list (`tasks.md`) organized by user story, enabling independent
   delivery of each story.
4. **Constitution Check Gate**: The plan template includes a
   mandatory Constitution Check section. Every plan MUST verify
   compliance with these principles before research begins and
   again after design is complete.
5. **Test-Driven Development**: Tests MUST be written first for
   every feature. Pure-logic modules (SysEx builders, parsers,
   checksum, stores) MUST have unit tests with byte-level
   assertions. Run tests after implementation to verify.
6. **Physical Device Testing**: BLE MIDI features MUST be tested
   on a physical iOS device connected to a real FP-30X. Simulator-
   only testing is NOT acceptable for BLE functionality.
7. **Commit Discipline**: Commit after each completed task or
   logical group. Each commit message references the task ID
   (e.g., `T001`, `T015`).

## Key References

| Document | Path | Purpose |
|----------|------|---------|
| SysEx Protocol Discovery | `docs/roland-sysex-discovery.md` | **Primary** protocol reference. DT1/RQ1 addresses, tone maps, BLE framing, notification parsing. |
| MIDI Implementation | `docs/FP-30X_MIDI_Imple_eng01_W.md` | GM2 tone list, Universal SysEx, CC definitions. Secondary to discovery doc for BLE behavior. |
| V2 Feature Spec | `specs/002-fp30x-controller-v2/spec.md` | Active feature specification. |

## Governance

This constitution is the supreme governing document for the
FP-30X Controller project. All development decisions, code
reviews, and architectural choices MUST comply with these
principles.

- **Amendments** require: (1) a documented rationale, (2) user
  approval, and (3) an updated Sync Impact Report at the top of
  this file.
- **Versioning** follows semantic versioning: MAJOR for principle
  removals/redefinitions, MINOR for new principles or expanded
  guidance, PATCH for clarifications and wording fixes.
- **Compliance Review**: Every plan MUST include a Constitution
  Check section verifying alignment. Violations MUST be logged in
  the Complexity Tracking table with explicit justification.
- **Complexity Justification**: Any deviation from the simplicity
  principle (Principle VII) MUST document: (a) the violation,
  (b) why it is needed, and (c) why the simpler alternative was
  rejected.

**Version**: 2.0.1 | **Ratified**: 2026-04-01 | **Last Amended**: 2026-04-05
