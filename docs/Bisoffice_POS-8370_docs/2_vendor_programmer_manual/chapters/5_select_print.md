<!-- page 4 -->

## `ESC!n`

**Name**: Select print mode(s)

**Format**

| Encoding | Value     |
| -------- | --------- |
| Ascii    | `ESC ! n` |
| Hex      | `1B 21 n` |
| Decimal  | `27 33 n` |

**Range**: `0≤ n≤ 255`

**Description**: Selects print mode(s), using n as follows:

| Bit | OFF/ON | Hex | Decimal | Functions                        |
| --- | ------ | --- | ------- | -------------------------------- |
| 0   | OFF    | 00  | 0       | Character font A(12×24)          |
|     | ON     | 01  | 1       | Character font B(9×17)           |
| 1   | \-     | \-  | \-      | N/A                              |
| 2   | \-     | \-  | \-      | N/A                              |
| 3   | OFF    | 00  | 0       | Emphasized mode not selected.    |
|     | ON     | 08  | 8       | Emphasized mode selected.        |
| 4   | OFF    | 00  | 0       | Double-height mode not selected. |
|     | ON     | 10  | 16      | Double-height mode selected.     |
| 5   | OFF    | 00  | 0       | Double-width mode not selected.  |
|     | ON     | 20  | 32      | Double-width mode selected.      |
| 6   | \-     | \-  | \-      | N/A                              |
| 7   | OFF    | 00  | 0       | Underline mode not selected.     |
|     | ON     | 80  | 128     | Underline mode selected.         |

**Note**:

- When both double-height and double-width modes are selected, quadruple size characters are printed.

- The printer can underline all characters, but can not underline the space set by HT or 90° clockwise rotated characters.

- The thickness of the underline is that selected by `ESC`, regardless of the character size.

- When some characters in a line are double or more height, all the characters on the line are aligned at the baseline.

- `ESC E` can also turn on or off emphasized mode. However, the setting of the last received command is effective.

- `ESC` — can also turn on or off underline mode. However, the setting of the last received command is effective

- `GS !` can also select character size. However, the setting of the last received command is effective.

- Emphasized mode is effective for alphanumeric and Hanzi. All print modes except emphasized mode is effective only for alphanumeric.

**Defaults**: `n=0`

**Reference**: `ESC-`,`ESCE`,`GS !`
