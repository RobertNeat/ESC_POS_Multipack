import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createPos8370Adapter, InMemoryPrinterSettingsRepository } from "../dist/index.js";
import { encodePos8370Instruction } from "../dist/low-level.js";

const mappingUrl = new URL("../assets/POS-8370_command_mappings.json", import.meta.url);

test("loads every captured setting and button command without changing its bytes", async () => {
  const source = JSON.parse(await readFile(mappingUrl, "utf8"));
  const repository = InMemoryPrinterSettingsRepository.fromJson(source);
  assert.equal(repository.listSettings().length, source.settings.length);
  assert.equal(repository.listActions().length, source.buttons.length);

  for (const [settingIndex, setting] of source.settings.entries()) {
    for (const [optionIndex, option] of setting.options.entries()) {
      const id = repository.listSettings()[settingIndex].options[optionIndex].id;
      assert.deepEqual([...repository.getCommandBytes(setting.title, id)], hex(option.commandHex));
    }
  }
  for (const action of source.buttons) {
    assert.deepEqual(
      repository.getActionCommands(action.title).map((bytes) => [...bytes]),
      action.commands.map((command) => hex(command.commandHex))
    );
  }
});

test("encodes an example of every model-independent vendor instruction", () => {
  const instructions = [
    { type: "horizontalTab" }, { type: "lineFeed" },
    { type: "realTimeDrawerPulse", pin: 2, duration100ms: 1 },
    { type: "characterSpacing", units: 0 }, { type: "printMode", value: 0 },
    { type: "absolutePosition", units: 256 }, { type: "userDefinedCharacterSet", enabled: true },
    { type: "defineUserDefinedCharacters", firstCode: 65, characters: [{ width: 1, data: [0, 0, 0] }] },
    { type: "bitImage", mode: 0, width: 1, data: [0] }, { type: "underline", thickness: 1 },
    { type: "defaultLineSpacing" }, { type: "lineSpacing", units: 30 },
    { type: "cancelUserDefinedCharacter", code: 65 }, { type: "initialize" },
    { type: "buzzer", count: 1, interval100ms: 1 }, { type: "horizontalTabs", columns: [8, 16] },
    { type: "emphasized", enabled: true }, { type: "doubleStrike", enabled: true },
    { type: "feedDots", units: 1 }, { type: "font", font: "A" }, { type: "rotate90", enabled: true },
    { type: "relativePosition", units: -1 }, { type: "justification", value: "center" },
    { type: "panelButtons", enabled: false }, { type: "feedLines", lines: 1 },
    { type: "drawerPulse", pin: 5, onTime2ms: 1, offTime2ms: 1 }, { type: "codeTable", table: 0 },
    { type: "upsideDown", enabled: true },
    { type: "legacyPartialCut", variant: "ESC i" }, { type: "legacyPartialCut", variant: "ESC m" },
    { type: "printNvImage", image: 1, mode: "normal" },
    { type: "defineNvImages", images: [{ widthBytes: 1, heightBytes: 1, data: new Uint8Array(8) }] },
    { type: "characterSize", width: 2, height: 3 }, { type: "reverse", enabled: true },
    { type: "hriPosition", position: "below" }, { type: "leftMargin", units: 0 },
    { type: "cut" }, { type: "cut", feedUnits: 16 }, { type: "hriFont", font: "B" },
    { type: "barcodeHeight", dots: 162 },
    { type: "barcode", system: "code39", data: [65] },
    { type: "barcode", system: "code39", data: [65], format: "nulTerminated" },
    { type: "rasterImage", mode: "normal", widthBytes: 1, height: 1, data: [128] },
    { type: "barcodeWidth", width: 3 }, { type: "barcodeLeftSpacing", units: 0 },
    { type: "hanziPrintMode", value: 0 }, { type: "hanziMode", enabled: true }, { type: "hanziMode", enabled: false },
    { type: "hanziUnderline", thickness: 1 }, { type: "hanziSpacing", left: 0, right: 0 },
    { type: "qrCode", version: 0, errorCorrection: "M", moduleSize: 3, data: [65] },
    { type: "hanziQuadruple", enabled: true }, { type: "realTimeStatus", status: 1 }
  ];
  for (const instruction of instructions) assert.ok(encodePos8370Instruction(instruction).length > 0, instruction.type);
  assert.deepEqual([...encodePos8370Instruction({ type: "relativePosition", units: -1 })], [0x1b, 0x5c, 0xff, 0xff]);
});

test("public adapter facade executes task-level operations and semantic configuration", async () => {
  const source = JSON.parse(await readFile(mappingUrl, "utf8"));
  const writes = [];
  const adapter = createPos8370Adapter({
    transport: { descriptor: { kind: "usb" }, async write(bytes) { writes.push([...bytes]); } },
    settingsRepository: InMemoryPrinterSettingsRepository.fromJson(source)
  });
  await adapter.initialize();
  await adapter.setAlignment("center");
  await adapter.configure({ autoCut: true, paperWidthMm: 80, dhcp: true });
  await adapter.printSelfTest();
  assert.deepEqual(writes.slice(0, 2), [[0x1b, 0x40], [0x1b, 0x61, 1]]);
  assert.deepEqual(writes.slice(2), [
    hex("1f 1b 12 01"),
    hex("1f 1b 17 01 01"),
    hex("1f 1b 16 0b 05"),
    hex("1f 11 04")
  ]);
});

test("POS-8370 rejects serial and non-USB/LAN transports at runtime", () => {
  for (const kind of ["serial", "network", "virtual"]) {
    assert.throws(
      () => createPos8370Adapter({ transport: { descriptor: { kind }, async write() {} } }),
      /only USB or LAN/
    );
  }
  assert.doesNotThrow(() => createPos8370Adapter({ transport: { descriptor: { kind: "lan" }, async write() {} } }));
});

function hex(value) {
  return value.trim().split(/\s+/).map((part) => Number.parseInt(part, 16));
}
