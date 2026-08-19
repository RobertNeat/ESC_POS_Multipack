<!-- page 14 -->

## `ESCan`

**Name**: Select justification

**Format**

| Encoding | Value     |
| -------- | --------- |
| Ascii    | `ESC a n` |
| Hex      | `1B 61 n` |
| Decimal  | `27 97 n` |

**Range**:

`0 ≤ n ≤ 2`
`48 ≤ n ≤ 50`

**Description**:

Aligns all the data in one line to the specified position

`n` select the justification as follow:

| n     | Justification       |
| ----- | ------------------- |
| 0, 48 | Left justification  |
| 1, 49 | Centering           |
| 2, 50 | Right justification |

**Note**:

- The command is enabled only when processed at the beginning of the line in standard mode.

- This command executes justification in the printing area.

- This command justifies the space area according to `HT`, `ESC $` or `ESC \`.

**Defaults**: `n=0`
