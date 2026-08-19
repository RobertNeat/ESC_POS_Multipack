<!-- page 16 -->

## `FSpnm`

**Name**: Print NV bit image

**Format**

| Encoding | Value       |
| -------- | ----------- |
| Ascii    | `FS p n m`  |
| Hex      | `1C 70 n m` |
| Decimal  | `28 11 n m` |

**Range**:

`1 ≤ n ≤ 255`
`0 ≤ m ≤ 3`
`48 ≤ m ≤ 51`

**Description**: Prints a NV bit image n using the mode specified by m.

| m     | Mode          | Vertical Dot Density | Horizontal Dot Density |
| ----- | ------------- | -------------------- | ---------------------- |
| 0，48 | Normal        | 203.2dpi             | 203.2dpi               |
| 1，49 | Double-width  | 203.2dpi             | 101.6dpi               |
| 2，50 | Double-height | 101.6dpi             | 203.2dpi               |
| 3，51 | Quadruple     | 101.6dpi             | 101.6dpi               |

dpi: dots per 25.4 mm {1"}

- n is the number of the NV bit image (defined using the `FS q` command).

- m specifies the bit image mode.

**Note**:

- NV bit image means a bit image which is defined in a non-volatile memory by `FS q` and printed by `FS p`.

- This command is not effective when the specified NV bit image has not been defined.

- In standard mode, this command is effective only when there is no data in the print buffer.

- This command is not affected by print modes (emphasized, double-strike,underline,character size, white/black reverse printing, or 90° rotated characters, etc.),except upside-down printing mode.
  - If the printing area width set by `GS L` and `GS W` for the NV bit image is less than one vertical line, the following processing is performed only on the line in question. However,in NV bit image mode, one vertical line means 1 dot in normal mode `(m=0, 48)` and indouble-height mode `(m=2, 50)`, and it means 2 dots in double-width mode `(m=1, 49)` and in quadruple mode `(m=3, 51)`.
  1. The printing area width is extended to the right in NV bit image mode up to one line vertically. In this case, printing does not exceed the printable area.
  2. If the printing area width cannot be extended by one line vertically, the left margin is reduced to accommodate one line vertically.

- If the downloaded bit-image to be printed exceeds one line, the excess data is not printed.

- This command feeds dots (for the height n of the NV bit-image) in normal and double-width modes, and (for the height `n × 2` of the NV bit-image) in double-height andquadruple modes, regardless of the line spacing specified by `ESC 2` or `ESC 3`.

- After printing the bit image, this command sets the print position to the beginning of the line and processes the data that follows as normal data.

**Reference**: `ESC*`, `FS q`, `GS /`, `GS v0`
