# POS-8370 Adapter

BisOffice POS-8370 implementation of `@esc-pos-multipack/printer-adapter`.

The adapter accepts an injected `PrinterTransport`, so a later worker can wrap USB, LAN,
serial or `@node-escpos` without coupling print orchestration to the concrete library.

```ts
import {
  InMemoryPrinterSettingsRepository,
  Pos8370Adapter
} from "@esc-pos-multipack/pos-8370-adapter";

const settingsRepository = InMemoryPrinterSettingsRepository.fromJson(settingsJson);

const adapter = new Pos8370Adapter({
  transport,
  settingsRepository
});

await adapter.configure({
  entries: [
    { setting: "Set Printing mode", option: "English" },
    { setting: "Set Default Char", option: "ASCII:9X17" }
  ]
});
```

Configuration bytes are intentionally read from JSON. The vendor setup tool documentation lists
settings, but does not provide verified raw command bytes for every option. Use
`settings.schema.json` for the project file and fill each option with confirmed POS raw bytes.

