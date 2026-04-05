/**
 * Connection Service.
 *
 * T033: Orchestrates BLE scan → connect → identify → select engine →
 * subscribe to notifications → send RQ1 initial state → populate stores.
 * Auto-reconnect on disconnect (max 5 retries, 2s delay).
 *
 * Constitution II: Bidirectional Control Surface.
 * Constitution V: Services orchestrate engine + transport.
 */

import type {Transport, Unsubscribe} from '../transport/types';
import type {PianoEngine, NotificationEvent} from '../engine/types';
import {resolveEngine, getFP30XEngine} from '../engine/registry';
import {useConnectionStore} from '../store/connectionStore';

const MAX_RECONNECT_RETRIES = 5;
const RECONNECT_DELAY_MS = 2000;

export class ConnectionService {
  private transport: Transport;
  private engine: PianoEngine | null = null;
  private notificationUnsub: Unsubscribe | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private onNotification: ((event: NotificationEvent) => void) | null = null;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  /** Set the callback for parsed notification events. */
  setNotificationHandler(handler: (event: NotificationEvent) => void): void {
    this.onNotification = handler;
  }

  /** Get the currently selected engine (null until connected + identified). */
  getEngine(): PianoEngine | null {
    return this.engine;
  }

  /**
   * Scan for BLE MIDI devices.
   * Updates connectionStore with discovered devices.
   */
  async scan(timeoutMs: number = 5000): Promise<void> {
    const store = useConnectionStore.getState();
    store.setScanning();

    try {
      await this.transport.scan((device) => {
        store.setDiscovered(device.id, device.name);
        // Stop scanning after first device found
        this.transport.stopScan();
      }, timeoutMs);
    } catch (error) {
      if (useConnectionStore.getState().status === 'scanning') {
        store.reset();
      }
      throw error;
    }
  }

  /**
   * Connect to a specific device.
   * After connection: select engine, subscribe to notifications, read initial state.
   */
  async connect(deviceId: string): Promise<void> {
    const store = useConnectionStore.getState();
    store.setConnecting();
    this.reconnectAttempts = 0;

    try {
      await this.transport.connect(deviceId);

      // For now, use FP-30X engine directly.
      // In future: send identity request, parse reply, resolve engine.
      this.engine = getFP30XEngine();

      // Subscribe to BLE notifications
      this.notificationUnsub = this.transport.subscribe((rawMidiBytes) => {
        this.handleRawNotification(rawMidiBytes);
      });

      store.setConnected();

      // Read initial state via RQ1
      await this.readInitialState();

      // Setup disconnect monitoring for auto-reconnect
      this.setupAutoReconnect(deviceId);
    } catch (error) {
      store.setDisconnected();
      throw error;
    }
  }

  /**
   * Disconnect from the current device.
   */
  async disconnect(): Promise<void> {
    this.cancelReconnect();
    this.cleanupNotifications();
    this.engine = null;

    try {
      await this.transport.disconnect();
    } catch {
      // Already disconnected
    }

    useConnectionStore.getState().setDisconnected();
  }

  /**
   * Auto-scan and connect to previously paired device.
   */
  async autoConnect(): Promise<void> {
    const {deviceId} = useConnectionStore.getState();
    if (!deviceId) return;

    try {
      await this.connect(deviceId);
    } catch {
      // Auto-connect failed silently — user can manually retry
    }
  }

  /** Clean up all resources. */
  async destroy(): Promise<void> {
    this.cancelReconnect();
    this.cleanupNotifications();
    this.engine = null;
    await this.transport.destroy();
  }

  // ─── Private ────────────────────────────────────────────────

  private handleRawNotification(rawMidiBytes: number[]): void {
    if (!this.engine || !this.onNotification) return;

    const event = this.engine.parseNotification(rawMidiBytes);
    if (event) {
      this.onNotification(event);
    }
  }

  private async readInitialState(): Promise<void> {
    if (!this.engine) return;

    const requests = this.engine.buildInitialStateRequest();
    for (const req of requests) {
      try {
        await this.transport.send(req);
        // Small delay between RQ1 requests to allow piano to respond
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch {
        // Non-fatal: piano may not respond to all RQ1s immediately
      }
    }
  }

  private setupAutoReconnect(deviceId: string): void {
    // Monitor transport status changes
    const checkInterval = setInterval(() => {
      if (this.transport.status === 'disconnected' && this.reconnectAttempts < MAX_RECONNECT_RETRIES) {
        clearInterval(checkInterval);
        useConnectionStore.getState().setDisconnected();
        this.attemptReconnect(deviceId);
      }
    }, 1000);
  }

  private attemptReconnect(deviceId: string): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_RETRIES) {
      useConnectionStore.getState().reset();
      return;
    }

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect(deviceId);
      } catch {
        this.attemptReconnect(deviceId);
      }
    }, RECONNECT_DELAY_MS);
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  private cleanupNotifications(): void {
    if (this.notificationUnsub) {
      this.notificationUnsub();
      this.notificationUnsub = null;
    }
  }
}
