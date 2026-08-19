<!-- page 21 -->

## `GSHn`

**Name**: Select printing position for HRI characters

**Format**

| Encoding | Value     |
| -------- | --------- |
| ASCII    | `GS H n`  |
| Hex      | `1D 48 n` |
| Decimal  | `29 72 n` |

**Range**:
`0 ≤ n ≤ 3`
`48 ≤ n ≤ 51`

**Description**:

Selects the printing position of HRI characters when printing a bar code.

`n` select printing position as follow:

| n    | Printing position                 |
| ---- | --------------------------------- |
| 0,48 | Not printed                       |
| 1,49 | Above the bar code                |
| 2,50 | Below the bar code                |
| 3,51 | Both above and below the bar code |

- HRI indicates Human Readable Interpretation.

**Note**: HRI characters are printed using the font specified by `GS f`.

**Defaults**: `n=0`

**Reference**: `GS f`,`GS k`
