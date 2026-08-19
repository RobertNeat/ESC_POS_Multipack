<!-- page 10 -->

## `ESC- n`

**Name**: Turn underline mode on/off

**Format**

| Encoding | Value     |
| -------- | --------- |
| Ascii    | `ESC - n` |
| Hex      | `1B 2D n` |
| Decimal  | `27 45 n` |

**Range**:
`0 ≤ n ≤ 2`
`48 ≤ n ≤ 50`

**Description**:

Turns underline mode on or off, based on the following values of n:

| n     | Function                               |
| ----- | -------------------------------------- |
| 0, 48 | Turns off underline mode               |
| 1, 49 | Turns on underline mode (1-dot thick)  |
| 2, 50 | Turns on underline mode (2-dots thick) |

**Note**:

- The printer can underline all characters (including right-side character spacing), but cannot underline the space set by `HT`.

- The printer cannot underline 90° clockwise rotated characters and white/black inverted characters.

- When underline mode id turned off by setting the value of `n` to 0 or 48, the following data is not underlined, and the underline thickness set before the mode is turned off does not change. The default underline thickness is 1 dot.

- Changing the character size does not affect the current underline thickness.

- Underline mode can also be turned on or off by using `ESC !`. Note, however, that the last received command is effective.

**Defaults**: `n=0`

**Reference**: `ESC!`
