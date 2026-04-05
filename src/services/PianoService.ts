/**
 * Piano Service — Core Facade.
 *
 * T034: Routes commands to engine via transport, handles notifications
 * by updating the correct stores. Debounces rapid input.
 *
 * Constitution II: Bidirectional Control Surface.
 * Constitution V: Services orchestrate engine + transport.
 */

import type {Transport} from '../transport/types';
import type {PianoEngine, Tone, NotificationEvent} from '../engine/types';
import {usePerformanceStore} from '../store/performanceStore';
import {getChordService} from './ChordService';

/** Debounce timeout for rapid input (ms). */
const DEBOUNCE_MS = 50;

export class PianoService {
  private transport: Transport;
  private engine: PianoEngine | null = null;
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(transport: Transport) {
    this.transport = transport;
  }

  /** Set the engine (called by ConnectionService after identification). */
  setEngine(engine: PianoEngine): void {
    this.engine = engine;
  }

  /** Get the current engine. */
  getEngine(): PianoEngine | null {
    return this.engine;
  }

  /**
   * Handle a parsed notification event from the piano.
   * Routes the event to the correct store.
   */
  handleNotification(event: NotificationEvent): void {
    const store = usePerformanceStore.getState();

    switch (event.type) {
      case 'tone': {
        if (!this.engine) break;
        const tone = this.engine.tones.findByDT1(event.category, event.indexHigh, event.indexLow);
        if (tone) {
          store.setActiveTone(tone);
        }
        break;
      }
      case 'volume':
        store.setVolume(event.value);
        break;
      case 'tempo':
        store.setTempo(event.bpm);
        break;
      case 'metronomeState':
        store.setMetronomeOn(event.on);
        break;
      case 'metronomeBeat':
        store.setMetronomeBeat(event.value);
        break;
      case 'metronomePattern':
        store.setMetronomePattern(event.value);
        break;
      case 'metronomeVolume':
        store.setMetronomeVolume(event.value);
        break;
      case 'metronomeTone':
        store.setMetronomeTone(event.value);
        break;
      case 'voiceMode':
        store.setVoiceMode(event.value);
        break;
      case 'transpose':
        store.setTranspose(event.value);
        break;
      case 'keyTouch':
        store.setKeyTouch(event.value);
        break;
      case 'splitPoint':
        store.setSplitPoint(event.value);
        break;
      case 'balance':
        store.setBalance(event.value);
        break;
      case 'leftTone': {
        if (!this.engine) break;
        const leftTone = this.engine.tones.findByDT1(event.category, event.indexHigh, event.indexLow);
        store.setLeftTone(leftTone ?? null);
        break;
      }
      case 'noteOn': {
        const chordSvc = getChordService();
        chordSvc.addNote(event.note);
        break;
      }
      case 'noteOff': {
        const chordSvc = getChordService();
        chordSvc.removeNote(event.note);
        break;
      }
      case 'controlChange':
        // T021 (A7): CC echoes are informational only over BLE — log, don't update stores
        console.debug(`CC echo: ch=${event.channel} cc=${event.controller} val=${event.value}`);
        break;
      case 'programChange':
        // T021 (A7): PC echoes are informational only over BLE — log, don't update stores
        console.debug(`PC echo: ch=${event.channel} pc=${event.program}`);
        break;
      case 'unknown':
        // Logged but not acted on
        break;
    }
  }

  /**
   * Change the active tone.
   * Debounced — only the last selection in a rapid sequence is sent.
   */
  async changeTone(tone: Tone): Promise<void> {
    if (!this.engine) return;

    this.debounce('tone', async () => {
      const sysex = this.engine!.buildToneChange(tone);
      await this.transport.send(sysex);
      // Store update will come from the notification echo
    });
  }

  /**
   * Change volume.
   * @param value 0–127
   */
  async changeVolume(value: number): Promise<void> {
    if (!this.engine) return;

    this.debounce('volume', async () => {
      const sysex = this.engine!.buildVolumeChange(value);
      await this.transport.send(sysex);
    });
  }

  /**
   * Change tempo.
   * @param bpm 20–250
   */
  async changeTempo(bpm: number): Promise<void> {
    if (!this.engine) return;

    this.debounce('tempo', async () => {
      const sysex = this.engine!.buildTempoChange(bpm);
      await this.transport.send(sysex);
    });
  }

  /** Toggle metronome on/off. */
  async toggleMetronome(): Promise<void> {
    if (!this.engine) return;

    const sysex = this.engine.buildMetronomeToggle();
    await this.transport.send(sysex);
  }

  /**
   * Change a metronome parameter.
   */
  async changeMetronomeParam(
    param: 'beat' | 'pattern' | 'volume' | 'tone',
    value: number,
  ): Promise<void> {
    if (!this.engine) return;

    const sysex = this.engine.buildMetronomeParam(param, value);
    await this.transport.send(sysex);
  }

  /**
   * Apply a preset — sends a batch of DT1 commands.
   */
  async applyPreset(commands: number[][]): Promise<void> {
    for (const cmd of commands) {
      await this.transport.send(cmd);
    }
  }

  // ─── Private ────────────────────────────────────────────────

  private debounce(key: string, fn: () => Promise<void>): void {
    const existing = this.debounceTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(async () => {
      this.debounceTimers.delete(key);
      try {
        await fn();
      } catch {
        // Send failures are non-fatal; the echo won't arrive
      }
    }, DEBOUNCE_MS);

    this.debounceTimers.set(key, timer);
  }
}
