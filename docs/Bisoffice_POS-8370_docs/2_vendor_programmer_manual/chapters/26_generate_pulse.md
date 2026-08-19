<!-- page 15 -->

## `ESCpmt1t2`

**Name**: Generate pulse

**Format**

| Encoding | Value            |
| -------- | ---------------- |
| ASCII    | `ESC p m t1 t2`  |
| HEX      | `1B 70 m t1 t2`  |
| Decimal  | `27 112 m t1 t2` |

**Range**:

`m=0, 1, 48, 49`
`0 ≤ t1 ≤ 255`
`0 ≤ t2 ≤ 255`

**Description**:

Sends a pulse to the specified connection pins.

- `On_time = t1 x 2_millisecond`
- `Off_time = t2 x 2_millisecond`
- `m = 0/48` - Drawer kick-out connector pin 2.
- `M = 1/49` - Drawer kick-out connector pin 5.
