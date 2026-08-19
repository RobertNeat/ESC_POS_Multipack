<!-- page 22 -->

# 1) `GSVm`

# 2) `GSVm n`

**Name**: Select cut mode and cut paper

**Format**

1.  | Encoding | Value     |
    | -------- | --------- |
    | ASCII    | `GS V m`  |
    | Hex      | `1D 56 m` |
    | Decimal  | `29 86 m` |

2.  | Encoding | Value       |
    | -------- | ----------- |
    | ASCII    | `GS V m n`  |
    | Hex      | `1D 56 m n` |
    | Decimal  | `29 86 m n` |

**Range**:

1.`m=1,49`

2.`m=66, 0 ≤ n ≤ 255`

**Description**:

Selects a mode for cutting paper and executes paper cutting. The value of m，select the mode as follow：

| m     | Print Mode                                                                                                           |
| ----- | -------------------------------------------------------------------------------------------------------------------- |
| 1，49 | Partial cut (one point left uncut)                                                                                   |
| 66    | Feeds paper `(cutting_position + [ n *(vertical_motion_unit)])`, and cuts the paper partially(one point left uncut). |

[Notice for 1. and 2.]

- Cutting state are different depending on automatically loaded cutter types.

- This command is effective only processed at the beginning of a line.

[Notice for 1.] - Only the partial cut is available; there is no full cut.
[Notice for 2.] - When `n = 0`, the printer feeds the paper to the cutting position and cuts it. When `n = 0`, the printer feeds the paper to `(cutting_position + [ n *vertical_motion_unit])` and cuts it.
