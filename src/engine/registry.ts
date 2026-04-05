/**
 * Piano Engine Registry.
 *
 * Maps DeviceIdentity to the correct PianoEngine instance.
 * Adding a new piano model = implementing PianoEngine + registering here.
 *
 * Constitution V: Layered Architecture with Engine Abstraction.
 */

import type {PianoEngine, DeviceIdentity} from './types';
import {FP30XEngine} from './fp30x/FP30XEngine';

/** All registered engine instances. */
const engines: PianoEngine[] = [new FP30XEngine()];

/**
 * Find a PianoEngine that supports the given device identity.
 * Returns the first matching engine, or null if no engine supports the device.
 */
export function resolveEngine(identity: DeviceIdentity): PianoEngine | null {
  for (const engine of engines) {
    if (engine.supportsDevice(identity)) {
      return engine;
    }
  }
  return null;
}

/**
 * Get the FP-30X engine directly (convenience for when device is already known).
 */
export function getFP30XEngine(): PianoEngine {
  return engines[0];
}
