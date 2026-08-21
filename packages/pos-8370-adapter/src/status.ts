import { PrinterStatus } from '@esc-pos-multipack/printer-adapter';

export interface Pos8370StatusBytes {
  readonly printer: number;
  readonly offline: number;
  readonly error: number;
  readonly paper: number;
}

export function parsePos8370Status(status: Pos8370StatusBytes): PrinterStatus {
  return {
    online: (status.printer & 0x08) === 0 && (status.offline & 0x40) === 0,
    drawerOpen: (status.printer & 0x04) === 0,
    coverOpen: (status.offline & 0x04) !== 0,
    paperNearEnd: (status.paper & 0x0c) !== 0,
    paperOut: (status.paper & 0x60) !== 0,
    cutterError: (status.error & 0x08) !== 0,
    recoverableError: (status.printer & 0x20) !== 0,
    unrecoverableError: (status.error & 0x20) !== 0,
    headOrVoltageError: (status.error & 0x40) !== 0,
    raw: {
      printer: status.printer,
      offline: status.offline,
      error: status.error,
      paper: status.paper,
    },
  };
}
