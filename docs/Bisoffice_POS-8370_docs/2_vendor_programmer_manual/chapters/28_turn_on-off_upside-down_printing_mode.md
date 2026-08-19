<!-- page 16 -->

## `ESC{n`

**Name**: Turns on/off upside-down printing mode

**Format**

| Encoding | Value      |
| -------- | ---------- |
| Ascii    | `ESC { n`  |
| Hex      | `1B 7B n`  |
| Decimal  | `27 123 n` |

**Range**:

`0 ≤ n ≤ 255`

**Description**:

Turns on/off upside-down printing mode

- When the `LSB` of `n` is `0`, upside-down printing mode is turned off.

- When the `LSB` of `n` is `1`, upside-down printing mode is turned on.

**Note**:

- Only the lowest bit of `n` is valid.

- This command is enabled only when processed at the beginning of a line in standard mode.

- In upside-down printing mode, the printer rotates the line to be printed by 180°and then prints it.

**Defaults**: `n=0`
