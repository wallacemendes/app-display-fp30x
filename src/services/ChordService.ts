/**
 * T066: Chord Detection Service.
 *
 * Maintains a held-notes Set, analyzes chords from pitch-class intervals.
 * Subscribes to noteOn/noteOff from PianoService notifications.
 *
 * Architecture: Held-Notes Set model (from discovery doc Section 6).
 */

/** Pitch class names (0-11) */
const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Chord templates: intervals from root → chord name suffix.
 * Ordered by specificity (longer templates first) so 7th chords
 * match before their triad subsets. */
const CHORD_TEMPLATES: [number[], string][] = [
  // Sevenths (check first — they are supersets of triads)
  [[0, 4, 7, 11], 'maj7'],  // Major 7th
  [[0, 3, 7, 10], 'm7'],    // Minor 7th
  [[0, 4, 7, 10], '7'],     // Dominant 7th
  [[0, 3, 6, 10], 'm7b5'],  // Half-diminished
  [[0, 3, 6, 9], 'dim7'],   // Diminished 7th
  [[0, 4, 8, 10], 'aug7'],  // Augmented 7th
  [[0, 3, 7, 11], 'mMaj7'], // Minor-major 7th

  // Triads
  [[0, 4, 7], ''],          // Major
  [[0, 3, 7], 'm'],         // Minor
  [[0, 3, 6], 'dim'],       // Diminished
  [[0, 4, 8], 'aug'],       // Augmented
  [[0, 5, 7], 'sus4'],      // Suspended 4th
  [[0, 2, 7], 'sus2'],      // Suspended 2nd
];

export interface ChordResult {
  /** Display string: "C", "Cm", "G7", or note names */
  name: string;
  /** Root note name (null if no chord detected) */
  root: string | null;
  /** Number of held notes */
  noteCount: number;
  /** Held MIDI note numbers */
  notes: number[];
}

type ChordListener = (result: ChordResult) => void;

export class ChordService {
  private heldNotes = new Set<number>();
  private listeners: ChordListener[] = [];

  /** Add a note (Note On). */
  addNote(note: number): void {
    this.heldNotes.add(note);
    this.analyze();
  }

  /** Remove a note (Note Off). */
  removeNote(note: number): void {
    this.heldNotes.delete(note);
    this.analyze();
  }

  /** Clear all held notes. */
  clear(): void {
    this.heldNotes.clear();
    this.analyze();
  }

  /** Subscribe to chord changes. */
  subscribe(listener: ChordListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  /** Get current chord result without subscribing. */
  getCurrent(): ChordResult {
    return this.buildResult();
  }

  // ─── Private ────────────────────────────────────────────────

  private analyze(): void {
    const result = this.buildResult();
    for (const listener of this.listeners) {
      listener(result);
    }
  }

  private buildResult(): ChordResult {
    const notes = Array.from(this.heldNotes).sort((a, b) => a - b);
    const noteCount = notes.length;

    if (noteCount === 0) {
      return {name: '', root: null, noteCount: 0, notes: []};
    }

    if (noteCount === 1) {
      const name = noteToName(notes[0]);
      return {name, root: name, noteCount: 1, notes};
    }

    if (noteCount === 2) {
      const name = `${noteToName(notes[0])} ${noteToName(notes[1])}`;
      return {name, root: null, noteCount: 2, notes};
    }

    // 3+ notes: attempt chord identification
    const chord = identifyChord(notes);
    if (chord) {
      return {name: chord, root: chord.replace(/[^A-G#b].*/, ''), noteCount, notes};
    }

    // No chord match: show individual note names
    const name = notes.map(noteToName).join(' ');
    return {name, root: null, noteCount, notes};
  }
}

/**
 * Convert MIDI note number to note name with octave.
 * 60 = C4, 61 = C#4, etc.
 */
function noteToName(note: number): string {
  const pitchClass = note % 12;
  const octave = Math.floor(note / 12) - 1;
  return `${PITCH_NAMES[pitchClass]}${octave}`;
}

/**
 * Identify a chord from an array of MIDI note numbers.
 * Tries each pitch class as potential root, matches against templates.
 */
function identifyChord(notes: number[]): string | null {
  // Extract unique pitch classes
  const pitchClasses = [...new Set(notes.map(n => n % 12))].sort((a, b) => a - b);

  if (pitchClasses.length < 3) return null;

  // Try each pitch class as root
  for (const root of pitchClasses) {
    const intervals = pitchClasses.map(pc => (pc - root + 12) % 12).sort((a, b) => a - b);

    for (const [template, suffix] of CHORD_TEMPLATES) {
      if (intervalsMatch(intervals, template)) {
        return `${PITCH_NAMES[root]}${suffix}`;
      }
    }
  }

  return null;
}

/**
 * Check if a set of intervals matches a chord template.
 * The intervals array may have extra notes (e.g., octave doublings).
 */
function intervalsMatch(intervals: number[], template: number[]): boolean {
  // Every template interval must be present in the intervals
  return template.every(t => intervals.includes(t));
}

// T014 (A4): Lazy singleton — moved from hooks/useChord.ts to fix layer violation.
let chordServiceInstance: ChordService | null = null;

export function getChordService(): ChordService {
  if (!chordServiceInstance) {
    chordServiceInstance = new ChordService();
  }
  return chordServiceInstance;
}
