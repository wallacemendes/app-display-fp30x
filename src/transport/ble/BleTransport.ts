/**
 * BLE MIDI Transport Implementation.
 *
 * T032: Implements the Transport interface using react-native-ble-plx.
 * Handles scan, connect, disconnect, send (with BLE framing),
 * subscribe (monitor + strip framing), and destroy.
 *
 * Constitution V: Layered Architecture — transport is model-agnostic.
 */

import {BleManager, type Device, type Subscription} from 'react-native-ble-plx';
import type {
  Transport,
  TransportStatus,
  DiscoveredDevice,
  NotificationListener,
  Unsubscribe,
} from '../types';
import {wrapInBleMidiPacket, stripBleFraming, base64ToBytes, bytesToBase64} from './framing';
import {scanForDevices, connectToDevice, getAlreadyConnectedDevices} from './scanner';

const BLE_MIDI_SERVICE_UUID = '03B80E5A-EDE8-4B33-A751-6CE34EC4C700';
const BLE_MIDI_CHAR_UUID = '7772E5DB-3868-4112-A1A9-F2669D106BF3';

export class BleTransport implements Transport {
  private manager: BleManager;
  private device: Device | null = null;
  private listeners: NotificationListener[] = [];
  private monitorSub: Subscription | null = null;
  private scanStop: (() => void) | null = null;
  private _status: TransportStatus = 'idle';

  constructor(manager?: BleManager) {
    this.manager = manager ?? new BleManager();
  }

  get status(): TransportStatus {
    return this._status;
  }

  async scan(
    onDiscovered: (device: DiscoveredDevice) => void,
    timeoutMs: number = 5000,
  ): Promise<void> {
    this._status = 'scanning';

    // First check for devices already connected at the OS level
    // (these won't appear in scan results since they stop advertising)
    try {
      const connected = await getAlreadyConnectedDevices(this.manager);
      for (const device of connected) {
        onDiscovered(device);
      }
    } catch {
      // Non-fatal — fall through to active scan
    }

    // Then scan for new/unpaired devices that are advertising
    const {stop, promise} = scanForDevices(this.manager, onDiscovered, timeoutMs);
    this.scanStop = stop;
    try {
      await promise;
    } finally {
      this.scanStop = null;
      if (this._status === 'scanning') {
        this._status = 'idle';
      }
    }
  }

  async stopScan(): Promise<void> {
    if (this.scanStop) {
      this.scanStop();
      this.scanStop = null;
    }
    this.manager.stopDeviceScan();
    if (this._status === 'scanning') {
      this._status = 'idle';
    }
  }

  async connect(deviceId: string): Promise<void> {
    this._status = 'connecting';
    try {
      this.device = await connectToDevice(this.manager, deviceId);

      // T018 (A6): Validate MIDI characteristic properties
      await this.validateMidiCharacteristic();

      this._status = 'connected';
      this.setupMonitor();
      this.setupDisconnectListener(deviceId);
    } catch (error) {
      // If validation failed, ensure we disconnect cleanly
      if (this.device) {
        try {
          await this.device.cancelConnection();
        } catch {
          // Already disconnected or never fully connected
        }
        this.device = null;
      }
      this._status = 'disconnected';
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.cleanupMonitor();
    if (this.device) {
      try {
        await this.device.cancelConnection();
      } catch {
        // Already disconnected
      }
      this.device = null;
    }
    this._status = 'disconnected';
  }

  async send(rawMidiBytes: number[]): Promise<void> {
    if (!this.device || this._status !== 'connected') {
      throw new Error('Not connected');
    }

    const blePacket = wrapInBleMidiPacket(rawMidiBytes);
    const base64 = bytesToBase64(blePacket);

    await this.device.writeCharacteristicWithoutResponseForService(
      BLE_MIDI_SERVICE_UUID,
      BLE_MIDI_CHAR_UUID,
      base64,
    );
  }

  subscribe(listener: NotificationListener): Unsubscribe {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) {
        this.listeners.splice(idx, 1);
      }
    };
  }

  async destroy(): Promise<void> {
    await this.disconnect();
    this.listeners = [];
    this.manager.destroy();
  }

  // ─── Private ────────────────────────────────────────────────

  /**
   * T018 (A6): Validate that the MIDI characteristic has the required
   * BLE properties (write-without-response + notify).
   */
  private async validateMidiCharacteristic(): Promise<void> {
    if (!this.device) {
      throw new Error('No device connected');
    }

    const services = await this.device.services();
    const midiService = services.find(
      s => s.uuid.toUpperCase() === BLE_MIDI_SERVICE_UUID.toUpperCase(),
    );
    if (!midiService) {
      throw new Error('BLE MIDI service not found on device');
    }

    const characteristics = await midiService.characteristics();
    const midiChar = characteristics.find(
      c => c.uuid.toUpperCase() === BLE_MIDI_CHAR_UUID.toUpperCase(),
    );
    if (!midiChar) {
      throw new Error('BLE MIDI characteristic not found on device');
    }

    const missing: string[] = [];
    if (!midiChar.isWritableWithoutResponse) {
      missing.push('isWritableWithoutResponse');
    }
    if (!midiChar.isNotifiable) {
      missing.push('isNotifiable');
    }

    if (missing.length > 0) {
      throw new Error(
        `BLE MIDI characteristic missing required properties: ${missing.join(', ')}`,
      );
    }
  }

  private setupMonitor(): void {
    if (!this.device) return;

    this.monitorSub = this.device.monitorCharacteristicForService(
      BLE_MIDI_SERVICE_UUID,
      BLE_MIDI_CHAR_UUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;

        const rawPacket = base64ToBytes(characteristic.value);
        const messages = stripBleFraming(rawPacket);

        for (const msg of messages) {
          for (const listener of this.listeners) {
            try {
              listener(msg);
            } catch {
              // Don't let listener errors crash the monitor
            }
          }
        }
      },
    );
  }

  private cleanupMonitor(): void {
    if (this.monitorSub) {
      this.monitorSub.remove();
      this.monitorSub = null;
    }
  }

  private setupDisconnectListener(deviceId: string): void {
    this.manager.onDeviceDisconnected(deviceId, () => {
      this.cleanupMonitor();
      this.device = null;
      this._status = 'disconnected';
    });
  }
}
