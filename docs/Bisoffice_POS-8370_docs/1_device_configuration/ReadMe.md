# Bisoffice POS-8370 device configuration

Reverse-engineered device setup commands, captured from the vendor configuration
tool via Wireshark and cross-checked against firmware behavior.

- [`POS-8370_settings_mappings.md`](POS-8370_settings_mappings.md) — overview of
  the configuration options exposed by the vendor software for this device model.
- [`POS-8370_command_mappings.json`](POS-8370_command_mappings.json) — the byte
  commands for each setting and option, consumed by
  [`@esc-pos-multipack/pos-8370-adapter`](../../../packages/pos-8370-adapter).
