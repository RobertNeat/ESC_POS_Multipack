import { ApiProperty } from '@nestjs/swagger';

export class OperationResultDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: 3 })
  processed!: number;
}
