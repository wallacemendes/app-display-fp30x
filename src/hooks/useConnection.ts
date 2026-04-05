/**
 * T035: useConnection Hook.
 *
 * Exposes connectionStore state + scan/connect/disconnect actions.
 * Screens use this instead of importing services directly.
 *
 * Constitution V: Presentation → hooks → services.
 */

import {useCallback} from 'react';
import {useConnectionStore} from '../store/connectionStore';
import type {ConnectionService} from '../services/ConnectionService';

/** Singleton ConnectionService instance, set from App initialization. */
let connectionService: ConnectionService | null = null;

export function setConnectionService(service: ConnectionService): void {
  connectionService = service;
}

export function useConnection() {
  const status = useConnectionStore(s => s.status);
  const deviceId = useConnectionStore(s => s.deviceId);
  const deviceName = useConnectionStore(s => s.deviceName);
  const isFirstConnectionThisSession = useConnectionStore(
    s => s.isFirstConnectionThisSession,
  );

  const scan = useCallback(async () => {
    if (!connectionService) return;
    await connectionService.scan();
  }, []);

  const connect = useCallback(async (id: string) => {
    if (!connectionService) return;
    await connectionService.connect(id);
  }, []);

  const disconnect = useCallback(async () => {
    if (!connectionService) return;
    await connectionService.disconnect();
  }, []);

  const autoConnect = useCallback(async () => {
    if (!connectionService) return;
    await connectionService.autoConnect();
  }, []);

  return {
    status,
    deviceId,
    deviceName,
    isFirstConnectionThisSession,
    scan,
    connect,
    disconnect,
    autoConnect,
    isConnected: status === 'connected',
    isScanning: status === 'scanning',
    isConnecting: status === 'connecting',
  };
}
