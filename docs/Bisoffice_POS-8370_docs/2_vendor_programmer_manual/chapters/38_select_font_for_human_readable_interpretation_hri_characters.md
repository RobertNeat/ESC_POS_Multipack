<!-- page 22 -->

## `GSfn`

**Name**: Select font for Human Readable Interpretation (HRI) characters

**Format**

| Encoding | Value      |
| -------- | ---------- |
| ASCII    | `GS f n`   |
| Hex      | `1D 66 n`  |
| Decimal  | `29 102 n` |

**Range**:
n= 0,1,48,49

**Description**:

Selects a font for the HRI characters used when printing a bar code.

`n` selects a font from the following table:

| n    | Font             |
| ---- | ---------------- |
| 0,48 | Font A `(12*24)` |
| 1,49 | Font B `(9*17)`  |

**Note**:

- HRI indicates Human Readable Interpretation.

- HRI characters are printed at the position specified by `GS H`.

**Defaults**: `n=0`

**Reference**: `GS H`,`GS k`
