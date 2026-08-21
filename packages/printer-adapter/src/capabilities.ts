export interface PrinterCapability {
  readonly name: string;
  readonly supported: boolean;
  readonly values?: readonly string[];
}

/** Capability names stay open so a model can advertise vendor extensions. */
export interface PrinterCapabilities {
  readonly model: string;
  readonly paperWidthsMm: readonly number[];
  readonly dpi: number;
  readonly operations: readonly string[];
  readonly features: readonly PrinterCapability[];
}

export interface PrinterCapabilitiesProvider {
  getCapabilities(): PrinterCapabilities;
}
