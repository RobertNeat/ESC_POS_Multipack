<!-- page 27 -->

## `FS!n`

**Name**: Set print mode(s) for Hanzi characters

**Format**

| Encoding | Value     |
| -------- | --------- |
| ASCII    | `FS ! n`  |
| Hex      | `1C 21 n` |
| Decimal  | `28 33 n` |

**Range**:
`0 ≤ n ≤ 255`

**Description**: Sets the print mode for Hanzi characters, using `n` as follows:

| Bit | OFF/ON | Hex | Decimal | ASB Status                 |
| --- | ------ | --- | ------- | -------------------------- |
| 0   | －     | －  | －      | N/A                        |
| 1   | －     | －  | －      | N/A                        |
| 2   | OFF    | 00  | 0       | Double-width mode is OFF.  |
|     | ON     | 04  | 4       | Double-width mode is ON.   |
| 3   | OFF    | 00  | 0       | Double-height mode is OFF. |
|     | ON     | 08  | 8       | Double-height mode is ON.  |
| 4   | －     | －  | －      | N/A                        |
| 5   | －     | －  | －      | N/A                        |
| 6   | －     | －  | －      | N/A                        |
| 7   | OFF    | 00  | 0       | Underline mode is OFF.     |
|     | ON     | 80  | 128     | Underline mode is ON.      |

**Note**:

- When both double-width and double-height modes are set (including right-side and left-side character spacing), quadruple-size characters are printed.

- The printer can underline all characters (including right-side and left-side character spacing), but cannot underline the space set by HT and 90° clockwise-rotated characters.

- The thickness of the underline is that specified by `FS`, regardless of the character size.

- When some of the characters in a line are double or more height, all the characters on the line are aligned at the baseline.

- It is possible to emphasize the Hanzi character using `GS !`, the setting of the last received command is effective.

- It is possible to turn under line mode on or off using `FS`, and the setting of the last received command is effective.

**Defaults**: `n=0`

**Reference**: `FS`,`GS !`
