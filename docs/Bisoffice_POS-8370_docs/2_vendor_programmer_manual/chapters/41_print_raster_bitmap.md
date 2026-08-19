<!-- page 26 -->

## `GSv0mxLxHyLyHd1....dk`

**Name**: Print raster bitmap

**Format**

| Encoding | Value                             |
| -------- | --------------------------------- |
| Ascii    | `GS v 0 m xL xH yL yH d1...dk`    |
| Hex      | `1D 76 30 m xL xH yL yH d1...dk`  |
| Decimal  | `29 118 48 m xL xH yL yH d1...dk` |

**Range**:

`0 ≤ m ≤ 3`
`48 ≤ m ≤ 51`
`0 ≤ xL ≤ 255`
`0 ≤ xH ≤ 255 => when 1 ≤ (xL + xH × 256) ≤ 128`
`0 ≤ yL ≤ 255`
`0 ≤ yH ≤ 8 => when 1 ≤ (yL + yH × 256) ≤ 4095`
`0 ≤ d ≤ 255`
`k = (xL + xH × 256) × (yL + yH × 256)(k≠0)`

**Description**:

Setting raster bitmap mode.
m value setting mode as follows:

| m     | Mode          | Vertical DotDensity | Horizontal Dot Density |
| ----- | ------------- | ------------------- | ---------------------- |
| 0，48 | Normal        | 203.2dpi            | 203.2dpi               |
| 1，49 | Double-width  | 203.2dpi            | 101.6dpi               |
| 2，50 | Double-height | 101.6dpi            | 203.2dpi               |
| 3，51 | Quadruple     | 101.6dpi            | 101.6dpi               |

(dpi: dots per 25.4 mm {1"})

**Note**:

- `xL`, `xH`, select the number of data bits `(xL + xH * 256)` in the horizontal direction for the bit image.

- `yL`, `yH`, select the number of data bits `(yL + yH * 256)` in the vertical direction for the bit image.

- In standard mode, this command is effective only when there is no data in the print buffer.

- This command has no effect in all print modes (character size, emphasized,double-strike, upside-down, underline, white/black reverse printing, etc.) for raster bit image

- If the printing area width set by `GS L` and `GS W` is less than the minimum width, the printing area is extended to the minimum width only on the line in question. The minimum width means 1 dot in normal `(m=0, 48)` and double height `(m=2,50)`, 2 dots in double-width `(m=1, 49)` and quadruple `(m=3, 51)` modes.

- Data outside the printing area is read in and discarded on a dot-by-dot basis.

- The position at which subsequent characters are to be printed for raster bit image is specified by `HT` (Horizontal Tab), `ESC $` (Set absolute print position),`ESC \` ( Set relative print position), and `GS L` (Set left margin ). If the position at which subsequent characters are to be printed is not a multiple of 8, print speed may decline.

- The `ESC a` (Select justification) setting is also effective on raster bit images.

- When this command is received during macro definition, the printer ends macro definition, and begins performing this command. The definition of this command should be cleared.

- `d` indicates the bit-image data. Set time a bit to 1 prints a dot and setting it to 0 does not print a dot.
