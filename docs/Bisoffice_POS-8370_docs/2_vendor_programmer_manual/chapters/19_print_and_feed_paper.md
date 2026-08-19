<!-- page 13 -->

## `ESCJn`

**Name**: Print and feedpaper

**Format**

| Encoding | Value     |
| -------- | --------- |
| Ascii    | `ESC J n` |
| Hex      | `1 4A n`  |
| Decimal  | `2 74 n`  |

**Range**: `0 ≤ n ≤ 255`

**Description**:

- Prints the data in the print buffer and feeds the paper `[ n * vertical_or_horizontal_motion_unit]` inches.

**Note**:

- After printing is completed, this command sets the print starting position to the beginning of the line.

- The paper feed amount set by this command does not affect the values set by `ESC 2` or `ESC 3`.

- In standard mode, the printer uses the vertical motion unit `(y)`.
