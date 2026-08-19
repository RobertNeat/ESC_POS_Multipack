# POS-8370 Adapter

BisOffice POS-8370 implementation of `@esc-pos-multipack/printer-adapter`.

This printer model accepts only USB and LAN transports. The restriction is enforced both by the
`Pos8370Transport` TypeScript type and by a runtime constructor check.

```ts
import {
  createPos8370Adapter,
  InMemoryPrinterSettingsRepository,
} from "@esc-pos-multipack/pos-8370-adapter";
import commandMappings from "@esc-pos-multipack/pos-8370-adapter/assets/POS-8370_command_mappings.json" with { type: "json" };

const settingsRepository = InMemoryPrinterSettingsRepository.fromJson(commandMappings);

const printer = createPos8370Adapter({
  transport: usbOrLanTransport,
  settingsRepository
});

await printer.initialize();
await printer.setAlignment("center");
await printer.setTextStyle({ emphasized: true, width: 2, height: 2 });
await printer.printText("Paragon nr 123");
await printer.printQrCode({ data: encodedQrPayload });
await printer.cut();

await printer.configure({
  printingMode: "ascii",
  defaultCharacterSize: "9x17",
  densityLevel: 3,
  paperWidthMm: 80,
  dhcp: true
});

await printer.openCashDrawer();
```

The returned value implements the model-independent `PrinterAdapter` task facade. Applications do
not need to construct ESC/POS instructions. A separate `@esc-pos-multipack/pos-8370-adapter/low-level`
entry point contains raw instruction tools for adapter development and diagnostics.

The package-owned mapping asset is shipped with the library. Configuration and captured setup-tool
actions are loaded byte-for-byte from it; `commandHex` is canonical, while `rawBytes` remains
accepted for backwards compatibility.

Every parsed option has a stable `id`. Use it when labels are duplicated (as in the captured code
page list). Literal setting names, raw actions and individual ESC/POS instructions are available
only from the explicit low-level entry point.
