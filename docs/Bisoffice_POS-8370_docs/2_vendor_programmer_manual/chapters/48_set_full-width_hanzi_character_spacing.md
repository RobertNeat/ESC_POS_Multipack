<!-- page 29 -->

## `FSSn1n2`

**Name**: Set full-width Hanzi character spacing

**Format**

| Encoding | Value         |
| -------- | ------------- |
| Ascii    | `FS S n1 n2`  |
| Hex      | `1C 53 n1 n2` |
| Decimal  | `28 83 n1 n2` |

**Range**:

`0 ≤ n1 ≤ 255`
`0 ≤ n2 ≤ 255`

**Description**:

Sets left-side and right-side Kanji character spacing `n1` and `n2`,

- Left side spacing is `[n1 × 0.125mm]`, right side spacing is `[n2 × 0.125mm]`.

**Note**:

- When double-width mode is set, the left-side and right-side character spacing is twice the normal value.

- In standard mode, this command sets the spacing respectively.

- In standard mode, the horizontal motion unit is used.

**Defaults**: `n1=0`,`n2=0`
