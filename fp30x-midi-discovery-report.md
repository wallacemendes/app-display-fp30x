# FP-30X MIDI Discovery Report

## Executive Summary

The FP-30X exposes enough MIDI to support a strong mobile controller app, but the shape of the product is clear from the manual: this is best treated as a **remote control surface and sound-access app**, not as a **fully introspective editor/librarian**.

From the MIDI Implementation document alone, the app can realistically offer:

- A structured sound browser with direct tone selection
- Live performance controls on screen
- A small but meaningful set of global sound-engine settings
- Advanced GM2 and drum-kit access that the front panel likely does not surface cleanly

The main limitation is state visibility: the piano does **not** expose a general “give me your current setup” mechanism. That means the app will need its own catalog and should assume **partial sync**, not perfect bidirectional awareness.

## 1. Tone Catalog

## Product View

The hardware supports two broad sound worlds:

1. A **curated built-in tone set** for direct performance use
2. A **full GM2-compatible sound library** for broader playback and compatibility

### A. Curated Built-In Tone Families

These are the main families the app can present as the “native” sound browser.

| Family                 | What the app can list |
| ---------------------- | --------------------- |
| Piano                  | 12 tones              |
| E.Piano / Keys / Organ | 20 tones              |
| Other                  | 24 tones              |
| Drum Kits              | 9 kits                |

### B. What Those Families Contain

#### Piano

This family is centered on acoustic keyboard use cases:

- Concert piano
- Ballad / mellow / bright pianos
- Upright variations
- Rock / ragtime / magical piano
- Harpsichord variants

#### E.Piano / Keys / Organ

This category is broader than the label suggests. It includes:

- Vintage electric pianos
- FM electric piano
- Clav
- Vibraphone
- Celesta
- Jazz organs
- Gospel organs
- Pipe / church organs
- Accordion

Product implication:

- The app can present this as a broader **Keys & Organs** family instead of only “E.Piano.”

#### Other

This is a mixed performance bank with:

- Strings and orchestral layers
- Choir and vocal textures
- Pads and synth layers
- Brass
- Guitar
- Bass
- Harp

Product implication:

- This is strong material for a **Pads / Strings / Ensemble / Misc** browsing experience.

### C. Drum Content

The FP-30X includes 9 drum kits:

- Standard
- Room
- Power
- Electric
- Analog
- Jazz
- Brush
- Orchestra
- SFX

The manual also includes a detailed **per-note rhythm set map** for these kits.

Product implication:

- The app can support more than just “select drum kit.”
- It can expose a drum-oriented screen or advanced mixer/editor for kit pieces.

### D. GM2 Library

Beyond the curated tones, the piano also exposes a **256-voice GM2 library**.

This includes the expected GM families:

- Pianos
- Chromatic percussion
- Organs
- Guitars
- Basses
- Strings
- Ensemble
- Brass
- Reeds
- Pipes
- Leads
- Pads
- Synth effects
- Ethnic instruments
- Percussion
- Sound effects

Product implication:

- The app can offer an **Advanced / GM2 mode** for users who want deeper sound access than the front panel usually makes convenient.
- This is useful for playback, education, experimentation, and power users.

### E. SFX and “Rhythm” Boundary

The manual documents:

- Drum kits
- Per-note drum mappings
- An SFX kit

It does **not** document:

- Arranger-style accompaniment patterns
- Backing rhythm styles
- Automatic rhythm engine controls

Product conclusion:

- The FP-30X supports **drum/percussion sound sets**, not a documented “rhythm arranger” domain through MIDI.

## 2. Expression and Performance Controls

These are the controls the app can offer on-screen while the user is playing.

## Strong Real-Time Controls

These are the clearest candidates for the main live-performance UI.

### Sound Selection

The app can switch sounds using bank/program selection:

- Tone selection
- GM2 sound selection
- Drum kit selection

### Volume and Musical Dynamics

The app can control:

- Master volume
- Per-part volume
- Expression

Product implication:

- You can build both a simple main volume control and a more advanced mixer-style view.

### Pedal Behavior

The piano recognizes:

- Sustain
- Sostenuto
- Soft

Product implication:

- The app can offer virtual pedal buttons or pedal-state indicators.

### Reverb and Chorus Amount

Real-time send levels are available for:

- Reverb send
- Chorus send

Product implication:

- These are good live controls because they are musically obvious and easy to understand.

### Pitch and Modulation

The piano recognizes:

- Pitch bend
- Modulation
- Pitch bend range
- Modulation depth range

Product implication:

- The physical instrument does not expose this like a synth controller, so the app can add meaningful expressive value with:
- A virtual pitch wheel/strip
- A virtual mod wheel/strip

### Tone-Shaping Controls

The piano recognizes real-time parameters for:

- Cutoff
- Resonance
- Attack
- Decay
- Release
- Vibrato rate
- Vibrato depth
- Vibrato delay
- Portamento on/off
- Portamento time
- Portamento control

Product implication:

- The app can provide a lightweight “Sound Shape” panel.
- This is especially valuable for organ, synth, pad, and GM2 use cases.

## Advanced Performance Controls

### Channel Pressure Injection

The piano recognizes channel pressure, and the manual allows mapping that pressure to:

- Pitch
- Filter cutoff
- Amplitude
- LFO pitch depth
- LFO filter depth
- LFO amplitude depth

Product implication:

- Even if the keyboard itself does not physically generate aftertouch, the app can create a **virtual aftertouch layer** and use touch gestures or pressure-like UI to drive it.

### Alternate Tuning / Scale Control

The piano recognizes:

- Master fine tuning
- Master coarse tuning
- Scale/octave tuning

Product implication:

- The app can support alternate temperaments or custom tuning features for advanced users.

### Per-Drum Instrument Control

For drum instruments only, the manual supports per-key control of:

- Level
- Pan
- Reverb send
- Chorus send

Product implication:

- There is room for an advanced drum-kit page with per-piece balancing.

## Important Product Caveat

Some of these parameters are **tone-dependent**. The manual explicitly warns that some tones may not respond, or may not respond fully, to controls like:

- Pan
- Soft
- Resonance
- Cutoff
- Attack / decay / release
- Vibrato-related parameters

Product implication:

- The app should not promise that every live control behaves identically for every sound.

## 3. Global Piano Settings the App Can Offer

These are the clearest “settings menu” candidates supported by the MIDI spec.

### Master Sound Settings

- Master volume
- Master fine tuning
- Master coarse tuning

This covers:

- Global loudness
- A4 adjustment workflows
- Whole-instrument transposition-like tuning at the engine level

### Reverb Engine Settings

The manual exposes:

- Reverb type
- Reverb time

Reverb types include:

- Small Room
- Medium Room
- Large Room
- Medium Hall
- Large Hall
- Plate

Product implication:

- A global ambience page is viable.

### Chorus Engine Settings

The manual exposes:

- Chorus type
- Mod rate
- Mod depth
- Feedback
- Send to reverb

Chorus types include:

- Chorus 1
- Chorus 2
- Chorus 3
- Chorus 4
- FB Chorus
- Flanger

Product implication:

- This is enough for a compact but meaningful global FX page.

### Scale / Tuning Settings

The manual supports:

- Scale/octave tuning adjustment
- Fine tuning
- Coarse tuning

Product implication:

- This supports an advanced tuning section for specialized repertoire or educational use.

### GM Compatibility Mode

The manual supports:

- GM1 System On
- GM2 System On

Product implication:

- This is probably not a primary consumer-facing feature, but it matters as an advanced compatibility mode.

### Device Identification

The device responds to:

- Identity Request
- Identity Reply

Product implication:

- The app can identify that the connected device is the FP-30X family and confirm compatibility before showing the full UI.

## What Is Not Exposed as a Settings Domain in This Manual

Based strictly on this MIDI Implementation document, there is no documented remote control for:

- Metronome tempo
- Metronome time signature
- Metronome volume
- Song transport
- Recorder transport
- Bluetooth settings
- Speaker/system utility settings
- User memory management
- Favorites registration
- Split/layer UI-state management as a named high-level domain

If these exist on the instrument, they are **not exposed here** in this MIDI spec.

## 4. Frontiers and Domain Limitations

This is the most important section for scope control.

### 1. The piano is not a full self-describing device

The manual does **not** provide a general mechanism to ask:

- “What tone is currently selected?”
- “What are your current effect settings?”
- “Give me your current system state.”
- “Send me your tone list.”

The only explicit query/reply behavior documented is device identity.

Product consequence:

- The app must ship with its own internal sound catalog.
- The app must maintain its own mirrored state when it changes something.
- On reconnect, the app cannot assume it can fully reconstruct the current device state from the piano.

### 2. Two-way sync is partial, not complete

The transmit section shows that the piano can send:

- Note on/off
- Bank select
- Program change
- Volume
- Expression
- Sustain
- Sostenuto
- Soft
- Reverb send
- Identity reply
- Local on/off message transmission

But many expressive controls are **receive-only**, including:

- Modulation
- Pitch bend
- Pan
- Chorus send
- Filter/envelope controls
- Vibrato controls
- Portamento controls
- Channel pressure

Product consequence:

- The app can control more than the keyboard can report back.
- UI state should not assume the piano will always mirror every parameter change back to the app.

### 3. Physical tone-change awareness is not a full contract

Because the implementation chart marks bank select and program change as transmitted, the device may provide useful tone-change telemetry.

However, the manual does **not** define a complete state-sync model for front-panel actions.

Product consequence:

- It is reasonable to use outbound program/bank messages as a helpful sync signal.
- It is **not** safe to design the app around the assumption that the piano will always fully describe its current state after any physical interaction.

### 4. No transport or tempo-sync domain

The manual explicitly shows no support for:

- Song Position
- Song Select
- Tune Request
- MIDI Clock
- Realtime transport commands

Product consequence:

- The app cannot act as a transport controller for an internal sequencer based on this spec.
- The app cannot rely on MIDI clock sync for metronome-style experiences with the FP-30X.
- A transport/metronome-control feature set is out of scope based on this document alone.

### 5. No aftertouch from the keyboard itself

The implementation chart shows:

- Polyphonic aftertouch: not transmitted, not recognized
- Channel aftertouch: recognized, not transmitted

Product consequence:

- The keybed does not give the app aftertouch performance data.
- The app can inject channel pressure virtually, but it cannot read aftertouch from the player’s actual key performance.

### 6. No hardware pitch/mod controller telemetry

The piano recognizes:

- Pitch bend
- Modulation

But does not transmit them.

Product consequence:

- The app can add these as virtual expressive controls.
- The keyboard itself is not behaving like a synth controller that reports those gestures back.

### 7. No remote Local Control command

The implementation chart shows:

- Local On/Off transmitted: yes
- Local On/Off recognized: no

Product consequence:

- The app should not promise remote switching of local control through MIDI.

### 8. Tone response is not uniform

The manual repeatedly notes that some tones may:

- Ignore certain parameters
- Not pan fully left/right
- Show little or no audible change to some controls

Product consequence:

- The app needs sensible labeling such as “tone-dependent” or “advanced.”
- A generic synth-like UI should not imply identical behavior across all sounds.

### 9. GM1 mode reduces flexibility

The manual states that when GM1 System On is received, bank select is no longer received.

Product consequence:

- GM1 mode is a compatibility mode, not the best mode for rich browsing or extended sound access.
- The app should avoid forcing GM1 for normal direct-control workflows.

### 10. There is no documented patch librarian or bulk dump workflow

The manual does not describe:

- Bulk patch dump
- Current patch request
- User tone storage access
- Patch naming request/response
- Scene registration exchange

Product consequence:

- This is not a deep librarian/editor product, at least not from this MIDI document alone.

## 5. Product Framing: What the FP-30X App Can Realistically Be

## Best Product Thesis

A strong product fit is:

**A fast, modern remote control surface for tone access, live expression, and sound shaping.**

Not:

**A full-state editor/librarian with guaranteed bidirectional sync.**

## High-Confidence Feature Areas

### Strong fit for V1

- Tone browser for native tones
- Advanced GM2 browser
- Drum kit browser
- Favorite sounds in the app
- Live volume / expression / pedal controls
- Virtual pitch and modulation controls
- Reverb / chorus controls
- Tuning page
- Device detection and connection confirmation

### Strong fit for later phases

- Sound-shape panel for cutoff, resonance, envelope, vibrato, portamento
- Advanced per-part mixer
- Advanced tuning/temperament tools
- Drum-piece mixer for drum kits

### Poor fit or out of scope from this manual

- Full current-state readback
- Guaranteed hardware-to-app UI sync for all parameters
- Metronome editor
- Transport control / sequencer sync
- Arranger rhythm control
- Patch librarian / bulk dump workflows

## Final Product Takeaway

The FP-30X MIDI domain is richer than a basic “change piano sound” controller, but it is still a **control-oriented MIDI surface**, not an **open stateful editing platform**.

That is good news for product strategy. It means the opportunity is to build:

- A much better sound-selection experience
- A cleaner live-performance control layer
- A smart advanced page for hidden GM2 and effect capabilities

The key scope discipline is this:

**Build around direct control and curated UX, not around full device introspection.**

If you want, I can turn this next into:

1. A feature map by screen
2. A MoSCoW roadmap for MVP / V1 / V2
3. A spec-ready backlog in product language for Spec Driven Development
