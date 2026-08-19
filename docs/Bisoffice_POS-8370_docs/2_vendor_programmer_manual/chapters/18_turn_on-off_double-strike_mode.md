<!-- page 13 -->

## `ESCGn`

**Name**: Turn on/off double-strike mode

**Format**

| Encoding | Value     |
| -------- | --------- |
| ASCII    | `ESC G n` |
| Hex      | `1B 47 n` |
| Decimal  | `27 71 n` |

**Range**: `0 ≤ n ≤ 255`

**Description**:

- Turn on/off double-strike mode

- When the `LSB` of `n` is `0`, double-strike mode is turned off.

- When the `LSB` of `n` is `1`, double-strike mode is turned on.

**Note**:

- Only the lowest bit of n is enabled.

- Printer output is the same in double-strike mode and in emphasized mode.

**Defaults**: `n=0`

**Reference**: `ESCE`
