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
import {getFP30XEngine} from '../engine/registry';
import type {PianoService} from './PianoService';
import {useConnectionStore} from '../store/connectionStore';
import {usePresetsStore} from '../store/presetsStore';
import {PresetService} from './PresetService';

const MAX_RECONNECT_RETRIES = 5;
const RECONNECT_DELAY_MS = 2000;

export class ConnectionService {
  private transport: Transport;
  private engine: PianoEngine | null = null;
  private notificationUnsub: Unsubscribe | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private onNotification: ((event: NotificationEvent) => void) | null = null;
  private pianoServiceRef: PianoService | null = null;
  private monitorIntervalId: ReturnType<typeof setInterval> | null = null;
  private pendingStateRead = false;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  /** Set PianoService reference (needed for default preset auto-apply). */
  setPianoService(service: PianoService): void {
    this.pianoServiceRef = service;
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

      // T006 (A2): Hand engine to PianoService so it can build DT1 messages
      if (this.pianoServiceRef) {
        this.pianoServiceRef.setEngine(this.engine);
      }

      // Subscribe to BLE notifications
      this.notificationUnsub = this.transport.subscribe((rawMidiBytes) => {
        this.handleRawNotification(rawMidiBytes);
      });

      store.setConnected();

      // Read initial state via RQ1
      await this.readInitialState();

      // T065: Auto-apply default preset on first connection this session
      await this.autoApplyDefaultPreset();

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
    this.clearMonitorInterval();
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
    this.clearMonitorInterval();
    this.cleanupNotifications();
    this.engine = null;
    await this.transport.destroy();
  }

  // ─── Private ────────────────────────────────────────────────

  /**
   * T065: Auto-apply default preset on first connection this session.
   * Skips on reconnection (isFirstConnectionThisSession already false).
   */
  private async autoApplyDefaultPreset(): Promise<void> {
    const connStore = useConnectionStore.getState();
    if (!connStore.isFirstConnectionThisSession) return;

    const defaultPreset = usePresetsStore.getState().getDefaultPreset();
    if (defaultPreset && this.pianoServiceRef) {
      try {
        const presetService = new PresetService(this.pianoServiceRef);
        await presetService.applyPreset(defaultPreset);
      } catch {
        // Non-fatal: preset apply failure should not break connection flow
      }
    }

    connStore.markFirstConnectionHandled();
  }

  private handleRawNotification(rawMidiBytes: number[]): void {
    if (!this.engine || !this.onNotification) return;

    // T010 (A3): Route RQ1 responses through parseStateResponse for bulk decomposition
    if (this.pendingStateRead) {
      const events = this.engine.parseStateResponse(rawMidiBytes);
      if (events.length > 0) {
        for (const event of events) {
          this.onNotification(event);
        }
        // After processing a state response, check if we've received both blocks
        // (performance + tempo). Simple heuristic: any successful parse counts.
        this.pendingStateRead = false;
        return;
      }
      // If parseStateResponse returns empty, fall through to normal parsing
    }

    const event = this.engine.parseNotification(rawMidiBytes);
    if (event) {
      this.onNotification(event);
    }
  }

  private async readInitialState(): Promise<void> {
    if (!this.engine) return;

    // T010 (A3): Flag that we're expecting RQ1 responses
    this.pendingStateRead = true;

    const requests = this.engine.buildInitialStateRequest();
    for (const req of requests) {
      try {
        await this.transport.send(req);
        // Small delay between RQ1 requests to allow piano to respond
        await new Promise<void>(resolve => setTimeout(resolve, 50));
      } catch {
        // Non-fatal: piano may not respond to all RQ1s immediately
      }
    }

    // Safety: clear flag after a timeout in case responses never arrive
    setTimeout(() => {
      this.pendingStateRead = false;
    }, 2000);
  }

  private setupAutoReconnect(deviceId: string): void {
    // T007 (A13): Clear any existing monitor before creating a new one
    this.clearMonitorInterval();

    // Monitor transport status changes
    this.monitorIntervalId = setInterval(() => {
      if (this.transport.status === 'disconnected' && this.reconnectAttempts < MAX_RECONNECT_RETRIES) {
        this.clearMonitorInterval();
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

  private clearMonitorInterval(): void {
    if (this.monitorIntervalId) {
      clearInterval(this.monitorIntervalId);
      this.monitorIntervalId = null;
    }
  }

  private cleanupNotifications(): void {
    if (this.notificationUnsub) {
      this.notificationUnsub();
      this.notificationUnsub = null;
    }
  }
}
