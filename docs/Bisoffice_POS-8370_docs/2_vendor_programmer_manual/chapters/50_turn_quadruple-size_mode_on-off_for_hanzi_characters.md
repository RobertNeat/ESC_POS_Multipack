<!-- page 30 -->

## `FSWn`

**Name**: Turn quadruple-size mode on/off for Hanzi characters

**Format**

| Encoding | Value     |
| -------- | --------- |
| ASCII    | `FS W n`  |
| Hex      | `1C 57 n` |
| Decimal  | `28 87 n` |

**Range**: `0 ≤ n ≤ 255`

**Description**: Turn quadruple-size mode on/off for Hanzi characters

- When the `LSB` of `n` is 0, quadruple-size mode for Hanzi characters is turned off.
- When the `LSB` of `n` is 1, quadruple-size mode for Hazji characters is turned on.

**Details**:

- Only the lowest bit of `n` is valid.

- In quadruple-size mode, the printer prints the same size characters as when double-width and double-height modes are both turned on.

- When quadruple-size mode is turned off using this command, the following characters are printed in normal size.

- When some of the characters on a line are different in height, all the characterson the line are aligned at the baseline.

- When a character in the horizontal direction to enlarge, zoom in to the left of the character to the right character as a reference.

- `FS !` or `GS !` can also select and cancel quadruple-size mode by selecting double-height and double-width modes, and the setting of the last received command is effective.

**Defaults**: `n=0`

**Reference**: `FS !`,`GS !`
