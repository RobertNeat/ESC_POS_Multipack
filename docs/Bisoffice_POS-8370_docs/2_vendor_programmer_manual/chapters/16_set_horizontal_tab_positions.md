<!-- page 12 -->

## `ESCDn1...nk NUL`

**Name**: Set horizontal tab positions

**Format**

| Encoding | Value               |
| -------- | ------------------- |
| ASCII    | `ESC D n1...nk NUL` |
| Hex      | `1B 44 n1...nk 00`  |
| Decimal  | `27 68 n1...nk 0`   |

**Range**:
`1 ≤ n ≤ 255`
`0 ≤ k ≤ 32`

**Description**:

- Set horizontal tab positions。

- `n` specifies the column number for setting a horizontal tab position from the beginning of the line.

- `k` indicates the total number of horizontal tab positions to be set.

**Note**:

- The horizontal tab position is stored as a value of `[character_width * n]` measured from the beginning of the line. The character width includes the right-side character spacing, and double-width characters are set with twice the width of normal characters

- This command cancels the previous horizontal tab settings.

- When setting `n = 8`, the print position is moved to column `9` by sending `HT`.

- Up to 32 tab positions `(k = 32)` can be set. Data exceeding 32 tab positions is processed as normal data.

- When `[n]k` is less than or equal to the preceding value `[n]k-1`, tab setting is finished and the following data is processed as normal data.

- `ESC D NUL` cancels all horizontal tab positions.

- The previously specified horizontal tab positions do not change, even if the character width changes.

- The character width is memorized for each standard and page mode.

**Defaults**:

The default tab positions are at intervals of 8 characters (columns 9, 17, 25,...)

for font A (12 × 24).

**Reference**: `HT`
