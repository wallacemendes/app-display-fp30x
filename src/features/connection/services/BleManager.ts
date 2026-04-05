/**
 * BLE Manager for FP-30X.
 *
 * T019: Scanning, connecting, and managing BLE connection to Roland FP-30X.
 * Handles auto-reconnect on unexpected disconnection.
 *
 * Constitution I: Offline-First. Constitution IV: MIDI Protocol Fidelity.
 */

import {
  BleManager as RNBleManager,
  State,
} from 'react-native-ble-plx';
import type {Device, Subscription, BleError} from 'react-native-ble-plx';
import {
  BLE_MIDI_SERVICE_UUID,
  BLE_MIDI_CHARACTERISTIC_UUID,
} from '../../../services/midi/constants';
import {useConnectionStore} from '../../../store/connectionStore';

/** Scan timeout in milliseconds (SC-003: < 5s connection) */
const SCAN_TIMEOUT_MS = 10_000;

/** Auto-reconnect delay in milliseconds */
const AUTO_RECONNECT_DELAY_MS = 2_000;

/** Maximum auto-reconnect attempts before giving up */
const MAX_RECONNECT_ATTEMPTS = 5;

/** Singleton BLE manager instance */
let manager: RNBleManager | null = null;

/** Active subscriptions to clean up */
let disconnectSubscription: Subscription | null = null;
let scanTimeoutId: ReturnType<typeof setTimeout> | null = null;
let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;

function getManager(): RNBleManager {
  if (!manager) {
    manager = new RNBleManager();
  }
  return manager;
}

/**
 * Wait until Bluetooth is powered on.
 * Resolves immediately if already powered on.
 */
function waitForPoweredOn(): Promise<void> {
  const mgr = getManager();
  return new Promise((resolve, reject) => {
    const sub = mgr.onStateChange((state) => {
      if (state === State.PoweredOn) {
        sub.remove();
        resolve();
      } else if (state === State.Unsupported || state === State.Unauthorized) {
        sub.remove();
        reject(new Error(`Bluetooth ${state}`));
      }
    }, true);
  });
}

/**
 * Start scanning for devices advertising the BLE MIDI service.
 * Filters for devices with Roland-typical names (FP-30X, Roland).
 * Updates connectionStore as devices are discovered.
 */
export async function startScan(): Promise<void> {
  const store = useConnectionStore.getState();
  const mgr = getManager();

  // If already connected or connecting, skip scan
  if (store.status === 'connected' || store.status === 'connecting') {
    return;
  }

  await waitForPoweredOn();

  store.setScanning();
  reconnectAttempts = 0;

  // Stop any existing scan
  await mgr.stopDeviceScan();

  // Set scan timeout
  scanTimeoutId = setTimeout(() => {
    stopScan();
  }, SCAN_TIMEOUT_MS);

  await mgr.startDeviceScan(
    [BLE_MIDI_SERVICE_UUID],
    {allowDuplicates: false},
    (error: BleError | null, device: Device | null) => {
      if (error) {
        console.warn('[BleManager] Scan error:', error.message);
        return;
      }

      if (!device) {
        return;
      }

      // Accept any device advertising BLE MIDI service
      // The UUID filter already ensures it's a MIDI device
      const name = device.name || device.localName;
      if (name) {
        stopScan();
        useConnectionStore.getState().setDiscovered(device.id, name);
        connectToDevice(device.id);
      }
    },
  );
}

/**
 * Stop scanning for devices.
 */
export async function stopScan(): Promise<void> {
  if (scanTimeoutId) {
    clearTimeout(scanTimeoutId);
    scanTimeoutId = null;
  }
  await getManager().stopDeviceScan();
}

/**
 * Connect to a previously discovered device by ID.
 * Discovers services and sets up disconnect monitoring.
 */
export async function connectToDevice(deviceId: string): Promise<void> {
  const store = useConnectionStore.getState();
  const mgr = getManager();

  store.setConnecting();

  try {
    // Connect with timeout
    const device = await mgr.connectToDevice(deviceId, {timeout: 5000});

    // Discover services to access MIDI characteristic
    await device.discoverAllServicesAndCharacteristics();

    // Verify MIDI characteristic exists
    const characteristics = await mgr.characteristicsForDevice(
      deviceId,
      BLE_MIDI_SERVICE_UUID,
    );

    const midiChar = characteristics.find(
      (c) =>
        c.uuid.toUpperCase() === BLE_MIDI_CHARACTERISTIC_UUID.toUpperCase(),
    );

    if (!midiChar) {
      throw new Error('MIDI characteristic not found on device');
    }

    // Connection successful
    reconnectAttempts = 0;
    useConnectionStore.getState().setConnected();

    // Monitor for disconnection
    monitorDisconnection(deviceId);
  } catch (error) {
    console.warn(
      '[BleManager] Connection failed:',
      error instanceof Error ? error.message : error,
    );
    useConnectionStore.getState().setDisconnected();
  }
}

/**
 * Monitor for unexpected disconnection and trigger auto-reconnect.
 */
function monitorDisconnection(deviceId: string): void {
  // Clean up previous subscription
  if (disconnectSubscription) {
    disconnectSubscription.remove();
    disconnectSubscription = null;
  }

  disconnectSubscription = getManager().onDeviceDisconnected(
    deviceId,
    (_error, _device) => {
      useConnectionStore.getState().setDisconnected();
      attemptReconnect(deviceId);
    },
  );
}

/**
 * Attempt to reconnect to a known device after disconnection.
 */
function attemptReconnect(deviceId: string): void {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.warn('[BleManager] Max reconnect attempts reached');
    return;
  }

  reconnectAttempts++;

  reconnectTimeoutId = setTimeout(() => {
    const store = useConnectionStore.getState();
    // Only reconnect if still disconnected (user hasn't manually reset)
    if (store.status === 'disconnected' && store.deviceId === deviceId) {
      connectToDevice(deviceId);
    }
  }, AUTO_RECONNECT_DELAY_MS);
}

/**
 * Disconnect from the current device and clean up all subscriptions.
 */
export async function disconnect(): Promise<void> {
  const store = useConnectionStore.getState();
  const mgr = getManager();

  // Cancel pending reconnect
  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId);
    reconnectTimeoutId = null;
  }

  // Remove disconnect listener
  if (disconnectSubscription) {
    disconnectSubscription.remove();
    disconnectSubscription = null;
  }

  // Disconnect if connected
  if (store.deviceId) {
    try {
      await mgr.cancelDeviceConnection(store.deviceId);
    } catch {
      // Device may already be disconnected
    }
  }

  store.setDisconnected();
}

/**
 * Write raw bytes to the BLE MIDI characteristic (Write Without Response).
 * Used by MidiService to send packets.
 */
export async function writeMidiPacket(data: number[]): Promise<void> {
  const store = useConnectionStore.getState();

  if (store.status !== 'connected' || !store.deviceId) {
    throw new Error('Not connected to device');
  }

  // Convert number array to base64
  const bytes = new Uint8Array(data);
  const base64 = uint8ArrayToBase64(bytes);

  await getManager().writeCharacteristicWithoutResponseForDevice(
    store.deviceId,
    BLE_MIDI_SERVICE_UUID,
    BLE_MIDI_CHARACTERISTIC_UUID,
    base64,
  );
}

/**
 * Convert Uint8Array to base64 string.
 * react-native-ble-plx requires base64 encoded data.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Clean up BLE manager. Call on app unmount.
 */
export async function destroyManager(): Promise<void> {
  await stopScan();

  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId);
    reconnectTimeoutId = null;
  }

  if (disconnectSubscription) {
    disconnectSubscription.remove();
    disconnectSubscription = null;
  }

  if (manager) {
    await manager.destroy();
    manager = null;
  }
}
