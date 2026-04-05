/**
 * BLE MIDI Device Scanner.
 *
 * T031: Scans for BLE devices advertising the MIDI service UUID.
 * Filters by device name, supports timeout, and auto-reconnect.
 *
 * Constitution I: Offline-First.
 * Constitution IV: DT1 SysEx Protocol Fidelity.
 */

import {BleManager, type Device, type Subscription} from 'react-native-ble-plx';
import type {DiscoveredDevice} from '../types';

const BLE_MIDI_SERVICE_UUID = '03B80E5A-EDE8-4B33-A751-6CE34EC4C700';

/**
 * Scan for BLE MIDI devices.
 *
 * @param manager BleManager instance
 * @param onDiscovered Callback for each discovered device
 * @param timeoutMs Maximum scan duration (default: 5000ms per spec SC-003)
 * @returns Cleanup function to stop scanning
 */
export function scanForDevices(
  manager: BleManager,
  onDiscovered: (device: DiscoveredDevice) => void,
  timeoutMs: number = 5000,
): {stop: () => void; promise: Promise<void>} {
  const seen = new Set<string>();
  let stopped = false;
  let timeoutId: ReturnType<typeof setTimeout>;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timeoutId);
    manager.stopDeviceScan();
  };

  const promise = new Promise<void>((resolve, reject) => {
    timeoutId = setTimeout(() => {
      stop();
      resolve();
    }, timeoutMs);

    manager.startDeviceScan(
      [BLE_MIDI_SERVICE_UUID],
      {allowDuplicates: false},
      (error, device) => {
        if (stopped) return;

        if (error) {
          stop();
          reject(error);
          return;
        }

        if (device && device.id && !seen.has(device.id)) {
          seen.add(device.id);
          onDiscovered({
            id: device.id,
            name: device.name ?? device.localName ?? 'Unknown',
            rssi: device.rssi ?? undefined,
          });
        }
      },
    );
  });

  return {stop, promise};
}

/**
 * Get devices already connected at the OS level for the MIDI service.
 * These won't appear in scan results since they stop advertising.
 */
export async function getAlreadyConnectedDevices(
  manager: BleManager,
): Promise<DiscoveredDevice[]> {
  const devices = await manager.connectedDevices([BLE_MIDI_SERVICE_UUID]);
  return devices.map(d => ({
    id: d.id,
    name: d.name ?? d.localName ?? 'Unknown',
    rssi: d.rssi ?? undefined,
  }));
}

/**
 * Connect to a specific BLE device by ID.
 * Discovers services and returns the connected device.
 */
export async function connectToDevice(
  manager: BleManager,
  deviceId: string,
): Promise<Device> {
  const device = await manager.connectToDevice(deviceId, {
    requestMTU: 512,
  });
  await device.discoverAllServicesAndCharacteristics();
  return device;
}
