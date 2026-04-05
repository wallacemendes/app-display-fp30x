/**
 * T004 (A1, A2): Service Bootstrap.
 *
 * Instantiates and wires all application services before the React tree mounts.
 * Must be called once at module level in App.tsx.
 *
 * Constitution V: Layered Architecture — services orchestrate engine + transport.
 */

import {BleTransport} from '../transport/ble/BleTransport';
import {ConnectionService} from '../services/ConnectionService';
import {PianoService} from '../services/PianoService';
import {setConnectionService} from '../hooks/useConnection';
import {setPianoService} from '../hooks/usePiano';

let initialized = false;

export function bootstrap(): void {
  if (initialized) return;

  const transport = new BleTransport();
  const pianoService = new PianoService(transport);
  const connectionService = new ConnectionService(transport);

  // Wire services together
  connectionService.setPianoService(pianoService);
  connectionService.setNotificationHandler(event =>
    pianoService.handleNotification(event),
  );

  // Wire hooks so UI components can access services
  setConnectionService(connectionService);
  setPianoService(pianoService);

  initialized = true;
}
