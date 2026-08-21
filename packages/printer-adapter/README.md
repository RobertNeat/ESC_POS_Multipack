# Printer Adapter

Model-independent TypeScript contracts for printer integrations.

The package exposes small dependency-injection contracts:

- `PrinterAdapter` for lifecycle, normalized status and capabilities.
- Focused task interfaces such as `TextPrinter`, `BarcodePrinter` and `PaperController`.
- `ReceiptPrinterAdapter` as a convenient composition of common receipt tasks.
- `PrinterTransport` for USB, LAN, serial or virtual transport implementations.

Device configuration, raw commands and protocol instructions intentionally belong to concrete
driver packages. Consumers should depend on the narrowest task interface they use.
