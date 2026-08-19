<!-- page 3 -->

## `HT`

**Name**: Horizontal tab

**Format**

| Encoding | Value |
| -------- | ----- |
| Ascii    | `HT`  |
| Hex      | `09`  |
| Decimal  | `09`  |

**Description**: Moves the print position to the next horizontal tab position.

**Details**

- This command is ignored unless the next horizontal tab position has been set.

- If the next horizontal tab position exceeds the printing area, the printer sets the printing position to \[Printing area width + 1\].

- Horizontal tab positions are set with `ESC D`.

- If this command is received when the printing position is at \[printing area width + 1\], the printer executes print buffer-full printing of the current line and horizontal tab processing from the beginning of the next line.

**Reference**: ESCD
