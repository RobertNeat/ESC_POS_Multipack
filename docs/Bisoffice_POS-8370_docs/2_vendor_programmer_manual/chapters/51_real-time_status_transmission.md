<!-- page 31 -->

# `DLEEOTn`

**Name**: Real-time status transmission

**Format**

| Encoding | Value       |
| -------- | ----------- |
| Ascii    | `DLE EOT n` |
| Hex      | `10 04 n`   |
| Decimal  | `16 4 n`    |

**Range**: `1 ≤ n ≤ 4`

**Description**: Transmits the selected printer status specified by `n` in real-time, according to the following parameters:

`n = 1`: Transmit printer status
`n = 2`: Transmit off-line status
`n = 3`: Transmit error status
`n = 4`: Transmit paper roll sensor status

**Details**:

- In sending status, printer sends a byte without validation of `DSR` signal.

- This command is executed even when the printer is off-line, the receive buffer is full, or there is an error status with a serial interface model.

- With a parallel interface model, this command can not be executed when the printer is busy.

- When use `GS` a to enable Automatic Status Back (`ASB`), the status transmitted by `DLE EOT` and the `ASB` status must be differentiated by using the table in `Appendix D`.

- This command is valid even when the printer is disabled with `ESC = (Select_peripheral_device)`.

- This command is being processed as soon as received by the printer.

**Note**:

- The status is transmitted whenever the data sequence of `<10>H<04>H<n>(1 n 4)` is received.

Example:

In `ESC m nL nH d1...dk`, `d1=<10>H`, `d2=<04>H`, `d3=<01>H`

    - This command should not be used within the data sequence of another command that consists of 2 or more bytes.

Example: If you attempt to transmit `ESC 3 n` to the printer, but `DTR` (DSR for the host computer) goes to `MARK` before `n` is transmitted and then `DLE EOT 3` interrupts before `n` is received, the code `<10>H` for `DLE EOT 3` is processed as the code for `ESC 3 <10>H`.

n = 1: Printer Status

| Bit | 0/1 | Hex | Decimal | Function                 |
| --- | --- | --- | ------- | ------------------------ |
| 0   | 0   | 00  | 0       | Fixed to Off             |
| 1   | 1   | 02  | 2       | Fixed to On              |
| 2   | 0   | 00  | 0       | Drawer open              |
| 2   | 1   | 04  | 4       | Drawer close             |
| 3   | 0   | 00  | 0       | On-line                  |
| 3   | 1   | 08  | 8       | Off-line                 |
| 4   | 1   | 10  | 16      | Fixed to On              |
| 5   | 0   | 00  | 00      | Recover until on-line    |
| 5   | 1   | 20  | 32      | Wait for on-line recover |
| 6   | --  | --  | --      | Undefined                |
| 7   | 0   | 00  | 00      | Fixed to Off             |

n = 2: Off-line Status

| Bit | 0/1 | Hex | Decimal | Function                                        |
| --- | --- | --- | ------- | ----------------------------------------------- |
| 0   | 0   | 00  | 0       | Fixed to Off                                    |
| 1   | 1   | 02  | 2       | Fixed to On                                     |
| 2   | 0   | 00  | 0       | Top cover close                                 |
| 2   | 1   | 04  | 4       | Top cover open                                  |
| 3   | 0   | 00  | 0       | Paper is not being fed by using the FEED button |
| 3   | 1   | 08  | 8       | Paper is beging fed by the FEED button          |
| 4   | 1   | 10  | 16      | Fixed to On                                     |
| 5   | 0   | 00  | 0       | No shortage of paper                            |
| 5   | 1   | 20  | 32      | Shortage of paper                               |
| 6   | 0   | 00  | 0       | No error                                        |
| 6   | 1   | 40  | 64      | Error occurs                                    |
| 7   | 0   | 00  | 0       | Fixed to Off                                    |

n = 3: Error Status

| Bit | 0/1 | Hex | Decimal | Function                                           |
| --- | --- | --- | ------- | -------------------------------------------------- |
| 0   | 0   | 00  | 0       | Fixed to Off                                       |
| 1   | 1   | 02  | 2       | Fixed to On                                        |
| 2   |     | --- | ---     | Undefined                                          |
| 3   | 0   | 00  | 0       | No auto-cutter error                               |
| 3   | 1   | 08  | 8       | Auto-cutter error occurs                           |
| 4   | 1   | 10  | 16      | Fixed to On                                        |
| 5   | 0   | 00  | 0       | No unrecoverable error                             |
| 5   | 1   | 20  | 32      | Unrecoverable error                                |
| 6   | 0   | 00  | 0       | Temperature and voltage of printhead is normal     |
| 6   | 1   | 40  | 64      | Temperature and voltage of printhead is over range |
| 7   | 0   | 00  | 0       | Fixed to Off                                       |

n = 4: Feed Status

| Bit | 1/0 | Hex | Decimal | Function                  |
| --- | --- | --- | ------- | ------------------------- |
| 0   | 0   | 00  | 0       | Fixed to Off              |
| 1   | 1   | 02  | 2       | Fixed to On               |
| 2,3 | 0   | 00  | 0       | Rollpaper near-end sensor |
| 2,3 | 1   | 0C  | 12      | Rollpaper near-end sensor |
| 4   | 1   | 10  | 16      | Fixed to On               |
| 5,6 | 0   | 00  | 0       | Paper present             |
| 5,6 | 1   | 60  | 96      | Paper not present         |
| 7   | 0   | 00  | 0       | Fixed to Off              |
