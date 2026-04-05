/**
 * Connection Zustand Store.
 *
 * T021: Manages BLE MIDI connection state with the FP-30X.
 * Persists deviceId, deviceName, and lastConnectedAt for auto-reconnect.
 * Runtime-only fields: status, isFirstConnectionThisSession.
 *
 * Constitution I: Offline-First — all data stored locally.
 * Constitution II: Bidirectional Control Surface — app reads piano state
 * via RQ1 and subscribes to DT1 notifications. Hardware state wins on conflict.
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

export type ConnectionStatus =
  | 'idle'
  | 'scanning'
  | 'discovered'
  | 'connecting'
  | 'connected'
  | 'disconnected';

export interface ConnectionState {
  /** BLE peripheral identifier (platform-assigned) */
  deviceId: string | null;
  /** BLE advertised name */
  deviceName: string | null;
  /** Current connection state (runtime-only, not persisted) */
  status: ConnectionStatus;
  /** Last successful connection timestamp (ISO 8601) */
  lastConnectedAt: string | null;
  /** Whether default preset should be applied on connect (reset on launch) */
  isFirstConnectionThisSession: boolean;
}

export interface ConnectionActions {
  setScanning: () => void;
  setDiscovered: (deviceId: string, deviceName: string) => void;
  setConnecting: () => void;
  setConnected: () => void;
  setDisconnected: () => void;
  reset: () => void;
  markFirstConnectionHandled: () => void;
}

const initialState: ConnectionState = {
  deviceId: null,
  deviceName: null,
  status: 'idle',
  lastConnectedAt: null,
  isFirstConnectionThisSession: true,
};

export const useConnectionStore = create<
  ConnectionState & ConnectionActions
>()(
  persist(
    (set) => ({
      ...initialState,

      setScanning: () =>
        set({status: 'scanning'}),

      setDiscovered: (deviceId, deviceName) =>
        set({deviceId, deviceName, status: 'discovered'}),

      setConnecting: () =>
        set({status: 'connecting'}),

      setConnected: () =>
        set({
          status: 'connected',
          lastConnectedAt: new Date().toISOString(),
        }),

      setDisconnected: () =>
        set({status: 'disconnected'}),

      reset: () =>
        set(initialState),

      markFirstConnectionHandled: () =>
        set({isFirstConnectionThisSession: false}),
    }),
    {
      name: 'connection-store',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist device info for auto-reconnect.
      // Status and isFirstConnectionThisSession are runtime-only.
      partialize: (state) => ({
        deviceId: state.deviceId,
        deviceName: state.deviceName,
        lastConnectedAt: state.lastConnectedAt,
      }),
    },
  ),
);
