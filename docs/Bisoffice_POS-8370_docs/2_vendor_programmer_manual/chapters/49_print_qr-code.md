<!-- Source PDF page 29 -->

# `ESCZmn kdLdHd1…dn`

**Name**: Print QR-CODE

**Format**

| Encoding | Value                       |
| -------- | --------------------------- |
| ASCII    | `ESC Z m n k dL dH d1...dn` |
| Hex      | `1B 5A m n k dL dH d1...dn` |
| Decimal  | `27 90 m n k dL dH d1...dn` |

**Note**:

`m` means specified version. (1 ~ 40, 0:Auto size)

`n` specifies the EC level. (L:7%, M:15%, Q:25%, H:30%)
`k` specified component type.(1 ~ 8)
`d` the length of the data, and it contains two bytes.
`dL` the first byte is the low order number.
`dH` the second byte is the upper number.
`d1...dn` is the bar code data.

When `m` is 0, the printer automatically selects the bar code type.

- This type of automatic method is proposed.

### QR-CODE Model Form (version):

| Version | Capacity | Capacity | Capacity | Capacity |
| ------- | -------- | -------- | -------- | -------- |
|         | L(7%)    | M(15%)   | Q(25%)   | H(30%)   |
| -       | -        | -        | -        | -        |
| 1       | 19       | 16       | 13       | 9        |
| 2       | 34       | 28       | 22       | 16       |
| 3       | 55       | 44       | 34       | 26       |
| 4       | 80       | 64       | 48       | 36       |
| 5       | 108      | 86       | 62       | 46       |
| 6       | 136      | 108      | 76       | 60       |
| 7       | 156      | 124      | 88       | 66       |
| 8       | 194      | 154      | 110      | 86       |
| 9       | 232      | 182      | 132      | 100      |
| 10      | 274      | 216      | 154      | 122      |
| 11      | 324      | 254      | 180      | 140      |
| 12      | 370      | 290      | 206      | 158      |
| 13      | 428      | 334      | 244      | 180      |
| 14      | 461      | 365      | 261      | 197      |
| 15      | 523      | 415      | 195      | 223      |
| 16      | 589      | 453      | 325      | 253      |
| 17      | 647      | 507      | 367      | 283      |
| 18      | 721      | 563      | 397      | 313      |
| 19      | 795      | 627      | 445      | 341      |

\*Capacity - (coding) the level by EC
