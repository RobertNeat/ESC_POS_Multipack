# Printer Adapter

Shared TypeScript contracts for printer integrations.

The package exposes a small dependency-injection surface:

- `PrinterAdapter` for print, status, capabilities, configuration and raw bytes.
- `PrinterTransport` for USB, LAN, serial or virtual transport implementations.
- `PrintPayload`, `DeviceConfig` and status/capability DTOs.

Adapter implementations should depend on this package, while services such as `Print_Worker`
should consume only `PrinterAdapter`.

