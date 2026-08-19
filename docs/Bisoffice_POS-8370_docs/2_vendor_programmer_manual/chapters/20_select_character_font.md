<!-- page 13 -->

## `ESCMn`

**Name**: Select character font

**Format**

| Encoding | Value     |
| -------- | --------- |
| Ascii    | `ESC M n` |
| Hex      | `1B 4D n` |
| Decimal  | `27 77 n` |

**Range**: `n=0, 1, 48, 49`

**Description**:

Select character font

| n     | Function                             |
| ----- | ------------------------------------ |
| 0, 48 | Character font A (12 × 24) selected. |
| 1, 49 | Character font B (9 × 17) selected.  |

**Note**:

- `ESC!` can also select the font type. But last received command settings made effective.

**Reference**: `ESC!`
