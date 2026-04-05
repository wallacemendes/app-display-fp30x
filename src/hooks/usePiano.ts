/**
 * T044: usePiano Hook — PianoService singleton access.
 *
 * Provides PianoService instance to hooks and screens.
 * Follows the same singleton pattern as useConnection.ts.
 *
 * Constitution V: Presentation -> hooks -> services.
 */

import type {PianoService} from '../services/PianoService';

/** Singleton PianoService instance, set from App initialization. */
let pianoServiceInstance: PianoService | null = null;

export function setPianoService(service: PianoService): void {
  pianoServiceInstance = service;
}

export function getPianoService(): PianoService | null {
  return pianoServiceInstance;
}
