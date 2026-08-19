<!-- page 28 -->

## `FS-n`

**Name**: Turn underline mode on/off for Hanzi characters

**Format**

| Encoding | Value     |
| -------- | --------- |
| ASCII    | `FS n`    |
| Hex      | `1C 6D n` |
| Decimal  | `28 45 n` |

**Range**:
`0 ≤ n ≤ 2`
`48 ≤ n ≤ 50`

**Description**:

Turns underline mode for Hanzi characters on or off, based on the following values of `n`.

| n     | Function                                                   |
| ----- | ---------------------------------------------------------- |
| 0, 48 | Turns off underline mode for Hanzi characters              |
| 1, 49 | Turns on underline mode for Hanzi characters (1-dot thick) |
| 2, 50 | Turns on underline mode for Hanzi characters (2-dot thick) |

**Note**:

- The printer can underline all characters (including right-side and left-side character spacing), but cannot underline the space set by HT and 90° clockwise-rotated characters.

- After the underline mode for Hanzi characters is turned off by setting `n` to 0,underline printing is no longer performed, but the previously specified underline thickness is not changed. The default underline thickness is 1 dot.

- The specified line thickness does not change even when the character size changes.

- It is possible to turn underline mode on or off using `FS !`, and the last received command is effective.

**Defaults**: `n=0`

**Reference**: `FS !`
