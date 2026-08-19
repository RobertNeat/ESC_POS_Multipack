import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
@ApiTags('printer')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Sprawdza dostępność serwisu' })
  @ApiOkResponse({ schema: { example: 'Thermal Printer Service' } })
  getHello(): string {
    return this.appService.getHello();
  }
}
