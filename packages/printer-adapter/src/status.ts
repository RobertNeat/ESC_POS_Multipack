/** Normalized status shared by printer models. Model data belongs in `raw`. */
export interface PrinterStatus {
  readonly online: boolean;
  readonly coverOpen?: boolean;
  readonly paperNearEnd?: boolean;
  readonly paperOut?: boolean;
  readonly drawerOpen?: boolean;
  readonly cutterError?: boolean;
  readonly recoverableError?: boolean;
  readonly unrecoverableError?: boolean;
  readonly headOrVoltageError?: boolean;
  readonly raw?: Readonly<Record<string, number>>;
}

export interface PrinterStatusProvider {
  getStatus(): Promise<PrinterStatus>;
}
