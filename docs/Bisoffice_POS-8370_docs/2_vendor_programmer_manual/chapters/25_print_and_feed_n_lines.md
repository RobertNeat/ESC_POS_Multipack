<!-- page 15 -->

## `ESCdn`

**Name**: Print and feed n lines

**Format**

| Encoding | Value      |
| -------- | ---------- |
| ASCII    | `ESC d n`  |
| Hex      | `1B 64 n`  |
| Decimal  | `27 100 n` |

**Range**: `0 ≤ n ≤ 255`

**Description**: Prints the data in the print buffer and feeds `n` lines.

**Note**:

- This command sets the print starting position to the beginning of the line.

- This command does not affect the line spacing set by `ESC 2` or `ESC 3`.

- The maximum paper feed amount is 1016 mm (40 inches). If the paper feed amount ( `nx` line spacing) of more than 1016 mm (40 inches) is specified, the printer feeds the paper only 1016 mm (40 inches).

**Reference**: `ESC2`, `ESC3`
