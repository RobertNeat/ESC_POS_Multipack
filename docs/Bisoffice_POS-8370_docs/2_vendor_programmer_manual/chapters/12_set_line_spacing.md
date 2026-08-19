<!-- page 11 -->

## `ESC3n`

**Name**: Set line spacing

**Format**

| Encoding | Value     |
| -------- | --------- |
| Ascii    | `ESC 3 n` |
| Hex      | `1B 33 n` |
| Decimal  | `27 51 n` |

**Range**: `0 ≤ n ≤ 255`

**Description**: Set line spacing for `[n × 0.125mm]`.

**Note**:

- The line spacing can be set independently in standard mode and in page mode.

- In standard mode, the vertical motion unit (y) is used.

**Defaults**: `n=30`

**Reference**: `ESC2`
