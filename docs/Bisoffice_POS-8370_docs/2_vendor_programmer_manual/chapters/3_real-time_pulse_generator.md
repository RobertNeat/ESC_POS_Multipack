<!-- Source PDF page 3 -->

## `DLEDC4nmt`

**Name**: Real-time pulse generator

**Format**

| Encoding | Value           |
| -------- | --------------- |
| Ascii    | `DLE DC4 n m t` |
| Hex      | `10 14 n m t`   |
| Decimal  | `16 20 n m t`   |

**Range**: n=1,m=0,1

1≤t≤8

**Description**: Output pulse is specified by the parameter t connection pins, “m” show as below：

| m   | Connect Pins              |
| --- | ------------------------- |
| 0   | Cash Drawer Connect Pin 2 |
| 1   | Cash Drawer Connect Pin 5 |

Pulse high time for `[t*100 ms]`，low time for `[t*100ms]`。

**Details**:

- When the printer is executing a command to open the cash drawer (`ESCp` or `DELDC4`), the command is ignored.

- In serial mode, the printer immediately after receiving the order.

- In parallel mode, the printer is busy when the command is not executed.

- If the print data same as the command contains data, the data will be used as the command is executed. The user must take into account this situation.

- Don’t try to insert the command in two or more bytes in the command sequence.

- Even if the printer is set to disabled by the command of `ESC = (select peripheral)`, the order is still valid.

**Reference**: ESCp
