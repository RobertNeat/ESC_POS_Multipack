<!-- page 15 -->

## `ESCc5n`

**Name**: Enable/disable panel buttons

**Format**

| Encoding | Value        |
| -------- | ------------ |
| ASCII    | `ESC c 5 n`  |
| Hex      | `1B 63 35 n` |
| Decimal  | `27 99 53 n` |

**Range**: `0 ≤ n ≤ 255`

**Description**:

- Enable/disable panel buttons。

- When the `LSB` of `n` is `0`, the panel buttons are enabled.

- When the `LSB` of `n` is `1`, the panel buttons are disabled.

**Note**:

- Only the lowest bit of `n` is valid.

- When the panel buttons are disabled, none of them are usable when the printer cover is closed.

- In this printer, the panel buttons are the `FEED` button.

- In the macro ready mode, the `FEED` button are enabled regardless of thesettings of this command. However, the paper cannot be fed by using these buttons.

**Defaults**: `n=0`
