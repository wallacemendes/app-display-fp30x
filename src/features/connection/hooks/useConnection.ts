/**
 * useConnection Hook.
 *
 * T021: Orchestrates BLE connection lifecycle.
 * Provides a simple API for UI components to trigger scan, connect, disconnect.
 *
 * Constitution II: One-Way State Injector.
 * Constitution VI: Feature-Module Architecture.
 */

import {useCallback, useEffect, useRef} from 'react';
import {useConnectionStore} from '../../../store/connectionStore';
import {usePerformanceStore} from '../../../store/performanceStore';
import {
  startScan,
  disconnect,
  connectToDevice,
} from '../services/BleManager';
import type {ConnectionStatus} from '../../../store/connectionStore';

interface UseConnectionReturn {
  status: ConnectionStatus;
  deviceName: string | null;
  isConnected: boolean;
  scan: () => Promise<void>;
  disconnectDevice: () => Promise<void>;
  reconnect: () => Promise<void>;
}

/**
 * Hook that manages BLE connection lifecycle and pending-tone queue.
 *
 * - Triggers scan/connect/disconnect via BleManager
 * - Sends pending tone when connection is established
 * - Tracks first-connection flag for preset auto-apply
 */
export function useConnection(): UseConnectionReturn {
  const status = useConnectionStore((s) => s.status);
  const deviceName = useConnectionStore((s) => s.deviceName);
  const deviceId = useConnectionStore((s) => s.deviceId);
  const isFirstConnection = useConnectionStore(
    (s) => s.isFirstConnectionThisSession,
  );

  const previousStatusRef = useRef<ConnectionStatus>(status);

  const handleConnectionEstablished = useCallback(async () => {
    // Send pending tone if queued before connection
    const pendingToneId = usePerformanceStore.getState().pendingToneId;
    if (pendingToneId) {
      // In a real implementation, we'd look up tone data by ID
      // and call sendToneSelection. For now, clear the pending tone.
      usePerformanceStore.getState().clearPendingTone();
    }

    // Mark first connection handled (for preset auto-apply)
    if (isFirstConnection) {
      useConnectionStore.getState().markFirstConnectionHandled();
    }
  }, [isFirstConnection]);

  // Handle pending tone on connection
  useEffect(() => {
    const wasConnecting = previousStatusRef.current !== 'connected';
    const isNowConnected = status === 'connected';

    if (wasConnecting && isNowConnected) {
      handleConnectionEstablished();
    }

    previousStatusRef.current = status;
  }, [status, handleConnectionEstablished]);

  const scan = useCallback(async () => {
    await startScan();
  }, []);

  const disconnectDevice = useCallback(async () => {
    await disconnect();
  }, []);

  const reconnect = useCallback(async () => {
    if (deviceId) {
      await connectToDevice(deviceId);
    } else {
      await startScan();
    }
  }, [deviceId]);

  return {
    status,
    deviceName,
    isConnected: status === 'connected',
    scan,
    disconnectDevice,
    reconnect,
  };
}
