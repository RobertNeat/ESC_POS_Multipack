export type ConnectionState = 'checking' | 'online' | 'offline';
export type Alignment = 'left' | 'center' | 'right';
export type RawEncoding = 'hex' | 'base64' | 'bytes';
export type RasterScale = 'normal' | 'doubleWidth' | 'doubleHeight' | 'quadruple';
export interface RasterPrintRequest {
  data: string;
  widthBytes: number;
  height: number;
  alignment: Alignment;
  scale: RasterScale;
  initialize: boolean;
  cut: boolean;
}
export interface PrinterStatus { online: boolean; coverOpen?: boolean; paperNearEnd?: boolean; paperOut?: boolean; cutterError?: boolean; recoverableError?: boolean; unrecoverableError?: boolean; }
export interface PrinterCapabilities { model: string; paperWidthsMm: number[]; dpi: number; operations: string[]; features: Array<{ name: string; supported: boolean; values?: string[] }>; }
export interface TextStyle { font: 'A' | 'B'; emphasized: boolean; underline: 0 | 1 | 2; width: 1|2|3|4|5|6|7|8; height: 1|2|3|4|5|6|7|8; reverse: boolean; }
export interface OperationResult { status: 'ok'; processed: number; }
export interface SettingOption { id: string; label: string; }
export interface SettingDefinition { title: string; description?: string; options: SettingOption[]; }
export interface ActionCommand { id: string; label: string; }
export interface ActionDefinition { title: string; description?: string; commands: ActionCommand[]; }
export interface ConfigurationOptions { settings: SettingDefinition[]; actions: ActionDefinition[]; }
