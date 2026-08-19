# Printer Adapter

Shared TypeScript contracts for printer integrations.

The package exposes a small dependency-injection surface:

- `PrinterAdapter` as a task-level facade for text, barcodes, QR codes, images, paper handling,
  cash drawers, status and named configuration.
- `LowLevelPrinterAdapter` and `PrinterInstruction` as an explicit escape hatch for adapter
  development and diagnostics.
- `PrinterTransport` for USB, LAN, serial or virtual transport implementations.
- `PrintPayload`, `DeviceConfig` and status/capability DTOs.

Adapter implementations should depend on this package, while services such as `Print_Worker`
should consume only `PrinterAdapter`.
