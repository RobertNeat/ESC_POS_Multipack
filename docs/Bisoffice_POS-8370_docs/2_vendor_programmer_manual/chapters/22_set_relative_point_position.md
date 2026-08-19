<!-- page 14 -->

## `ESC\nLnH`

**Name**: Set relative print position

**Format**

| Encoding | Value        |
| -------- | ------------ |
| Ascii    | `ESC \ nLnH` |
| Hex      | `1B 5C nLnH` |
| Decimal  | `27 92nLnH`  |

**Range**:

`0 ≤ nL ≤ 255`
`0 ≤ nH ≤ 255`

**Description**:

- Sets the print starting position based on the current position by using the horizontal or vertical motion unit.

- This command sets the distance from the current position to `[( nL + nH * 256) * horizontal_or_vertical_motion_unit]`

**Note**:

- Any setting that exceeds the printable area is ignored.

- When pitch `N` is specified to the right: `nL+ nH * 256 = N`

- When pitch `N` is specified to the left (the negative direction), use the complement of 65536.

- In standard mode, the horizontal motion unit is used.

**Reference**: `ESC$`
