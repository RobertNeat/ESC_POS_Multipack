<!-- page 5 -->

## `ESC%n`

**Name**: Select/cancel user-defined character set

**Format**

| Encoding | Value     |
| -------- | --------- |
| ASCII    | `ESC % n` |
| Hex      | `1B 25 n` |
| Decimal  | `27 37 n` |

**Range**: `0≤ n≤ 255`

**Description**:

- Selects or cancels the user-defined character set.

- When the LSB of n is 0, the user-defined character set is canceled.

- When the LSB of n is 1, the user-defined character set is selected.

**Note**:

- When the user-defined character set is canceled,the internal character set is automatically selected

- n is available only for the least significant bit.

**Defaults**: `n=0`

**Reference**: `ESC&`,`ESC?`
