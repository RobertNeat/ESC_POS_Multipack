<!-- page 5 -->

## `ESC$nLnH`

**Name**: Set absolute print position

**Format**

| Encoding | Value       |
| -------- | ----------- |
| ASCII    | ESC $ nL nH |
| Hex      | 1B 24 nL nH |
| Decimal  | 27 36 nL nH |

**Range**:

`0≤ nL≤ 255`

`0≤ nH≤ 255`

**Description**:

- Sets the distance from the beginning of the line to the position at which subsequent characters are to be printed.

- The distance from the beginning of the line to the print position is `[( nL + nH * 256) *(vertical or horizontal motion unit)] inches`.

**Note**:

- Settings outside the specified printable area are ignored.

- In standard mode, the horizontal motion unit `(x)` is used.

**Reference**: `ESC`,`GS $`,`GS \`
