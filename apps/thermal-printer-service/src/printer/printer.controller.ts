import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ConfigureNamedDto,
  ConfigurePrinterDto,
  DeviceActionDto,
  OperationResultDto,
  PrintLinesDto,
  PrintMarkdownDto,
  PrintRawDto,
  PrintRasterDto,
  PrintTextDto,
} from './printer.dto';
import { PrinterService } from './printer.service';

@Controller('printer')
@ApiTags('printer')
@ApiServiceUnavailableResponse({
  description: 'Brak połączenia z drukarką lub błąd transportu.',
})
export class PrinterController {
  constructor(private readonly printer: PrinterService) {}

  @Get('capabilities')
  @ApiOperation({ summary: 'Zwraca możliwości adaptera POS-8370' })
  @ApiOkResponse({
    description: 'Model, szerokości papieru i obsługiwane operacje.',
  })
  capabilities() {
    return this.printer.capabilities();
  }

  @Get('status')
  @ApiOperation({ summary: 'Odczytuje status drukarki' })
  @ApiOkResponse({ description: 'Status online, papieru, pokrywy i błędów.' })
  status() {
    return this.printer.status();
  }

  @Get('configuration/options')
  @ApiTags('configuration')
  @ApiOperation({ summary: 'Lista ustawień i akcji dostępnych dla POS-8370' })
  availableConfiguration() {
    return this.printer.availableConfiguration();
  }

  @Post('configuration')
  @HttpCode(200)
  @ApiTags('configuration')
  @ApiOperation({ summary: 'Konfiguruje drukarkę przez typowane ustawienia' })
  @ApiOkResponse({ type: OperationResultDto })
  @ApiBadRequestResponse({ description: 'Nieobsługiwana wartość ustawienia.' })
  configure(@Body() body: ConfigurePrinterDto) {
    return this.printer.configure(body);
  }

  @Post('configuration/named')
  @HttpCode(200)
  @ApiTags('configuration')
  @ApiOperation({
    summary: 'Konfiguruje drukarkę nazwami z mapowania producenta',
  })
  @ApiOkResponse({ type: OperationResultDto })
  @ApiBadRequestResponse({ description: 'Nieznane ustawienie lub opcja.' })
  configureNamed(@Body() body: ConfigureNamedDto) {
    return this.printer.configureNamed(body);
  }

  @Post('actions')
  @HttpCode(200)
  @ApiTags('configuration')
  @ApiOperation({
    summary:
      'Uruchamia akcję urządzenia, np. autotest lub ustawienia fabryczne',
  })
  @ApiOkResponse({ type: OperationResultDto })
  performAction(@Body() body: DeviceActionDto) {
    return this.printer.performAction(body);
  }

  @Post('raw')
  @HttpCode(200)
  @ApiTags('printing')
  @ApiOperation({ summary: 'Wysyła surowe bajty ESC/POS' })
  @ApiOkResponse({ type: OperationResultDto })
  @ApiBadRequestResponse({ description: 'Niepoprawny hex, base64 lub bajty.' })
  printRaw(@Body() body: PrintRawDto) {
    return this.printer.printRaw(body);
  }

  @Post('cut')
  @HttpCode(200)
  @ApiTags('printing')
  @ApiOperation({ summary: 'Odcina papier bez drukowania kolejnej linii' })
  @ApiOkResponse({ type: OperationResultDto })
  cut() {
    return this.printer.cut();
  }

  @Post('raster')
  @HttpCode(200)
  @ApiTags('printing')
  @ApiOperation({
    summary: 'Drukuje bezpośrednio spakowaną bitmapę rastrową ESC/POS',
    description:
      'Każdy wiersz ma widthBytes bajtów; najbardziej znaczący bit jest lewym pikselem, a 1 oznacza czarny punkt.',
  })
  @ApiOkResponse({ type: OperationResultDto })
  @ApiBadRequestResponse({
    description: 'Niepoprawne base64, wymiary lub liczba bajtów bitmapy.',
  })
  printRaster(@Body() body: PrintRasterDto) {
    return this.printer.printRaster(body);
  }

  @Post('lines')
  @HttpCode(200)
  @ApiTags('printing')
  @ApiOperation({
    summary: 'Drukuje wiadomość linia po linii jak na maszynie do pisania',
  })
  @ApiOkResponse({ type: OperationResultDto })
  printLines(@Body() body: PrintLinesDto) {
    return this.printer.printLines(body);
  }

  @Post('text')
  @HttpCode(200)
  @ApiTags('printing')
  @ApiOperation({ summary: 'Drukuje tekst dosłownie, bez interpretowania Markdown' })
  @ApiOkResponse({ type: OperationResultDto })
  printText(@Body() body: PrintTextDto) {
    return this.printer.printText(body);
  }

  @Post('markdown')
  @HttpCode(200)
  @ApiTags('printing')
  @ApiOperation({
    summary: 'Mapuje bezpieczny Markdown na formatowanie ESC/POS i drukuje',
    description:
      'HTML jest odrzucany. Zagnieżdżenia strong/em/del/code oraz list zachowują i przywracają styl nadrzędny.',
  })
  @ApiOkResponse({ type: OperationResultDto })
  @ApiBadRequestResponse({
    description: 'HTML lub nieobsługiwany element Markdown.',
  })
  printMarkdown(@Body() body: PrintMarkdownDto) {
    return this.printer.printMarkdown(body);
  }

  @Post('markdown/text')
  @HttpCode(200)
  @ApiTags('printing')
  @ApiConsumes('text/markdown', 'text/plain')
  @ApiBody({
    schema: {
      type: 'string',
      example: '# Lista\n\n- pierwszy element\n- drugi element',
    },
  })
  @ApiOperation({
    summary: 'Drukuje plik Markdown przesłany bezpośrednio jako tekst',
  })
  @ApiOkResponse({ type: OperationResultDto })
  @ApiBadRequestResponse({
    description: 'Pusty, zbyt duży lub niebezpieczny Markdown.',
  })
  printMarkdownText(@Body() body: string) {
    return this.printer.printMarkdownText(body);
  }
}
