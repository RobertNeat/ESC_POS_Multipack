import type {
  Pos8370DeviceConfig,
  Pos8370LowLevelAdapter,
} from '@esc-pos-multipack/pos-8370-adapter/low-level';
import {
  BadRequestException,
  Inject,
  Injectable,
  OnApplicationShutdown,
} from '@nestjs/common';
import { MarkdownPrinter } from './markdown-printer';
import { PrinterConfigurationCatalog } from './printer-configuration.catalog';
import {
  AlignmentDto,
  CharacterFontSizeDto,
  ConfigureNamedDto,
  ConfigurePrinterDto,
  DeviceActionDto,
  OperationResultDto,
  PrintLinesDto,
  PrintMarkdownDto,
  PrintRawDto,
  PrintRasterDto,
  PrintTextDto,
  TextEncodingDto,
} from './printer.dto';
import { PrinterOperationExecutor } from './printer-operation.executor';
import { PrinterPayloadDecoder } from './printer-payload.decoder';
import { PrinterPrintJobRunner } from './printer-print-job.runner';
import {
  completeTextStyle,
  fontForSize,
  NORMAL_TEXT_STYLE,
} from './printer-text-style';
import { PRINTER_ADAPTER } from './printer.tokens';

/** Application facade used by the HTTP controller. */
@Injectable()
export class PrinterService implements OnApplicationShutdown {
  constructor(
    @Inject(PRINTER_ADAPTER)
    private readonly adapter: Pos8370LowLevelAdapter,
    private readonly markdownPrinter: MarkdownPrinter,
    private readonly executor: PrinterOperationExecutor,
    private readonly payloadDecoder: PrinterPayloadDecoder,
    private readonly printJobs: PrinterPrintJobRunner,
    private readonly configurationCatalog: PrinterConfigurationCatalog,
  ) {}

  capabilities() {
    return this.adapter.getCapabilities();
  }

  availableConfiguration() {
    return this.configurationCatalog.get();
  }

  status() {
    return this.executor.queued(() => this.adapter.getStatus());
  }

  configure(dto: ConfigurePrinterDto): Promise<OperationResultDto> {
    return this.executor.input(async () => {
      await this.adapter.configure(dto);
      return ok(Object.keys(dto).length);
    });
  }

  configureNamed(dto: ConfigureNamedDto): Promise<OperationResultDto> {
    return this.executor.input(async () => {
      const config: Pos8370DeviceConfig = { entries: dto.entries };
      await this.adapter.configureRaw(config);
      return ok(dto.entries.length);
    });
  }

  performAction(dto: DeviceActionDto): Promise<OperationResultDto> {
    return this.executor.input(async () => {
      await this.adapter.performAction(dto);
      return ok(1);
    });
  }

  printRaw(dto: PrintRawDto): Promise<OperationResultDto> {
    return Promise.resolve().then(() => {
      const bytes = this.payloadDecoder.raw(dto);
      return this.executor.transport(async () => {
        await this.adapter.raw(bytes);
        return ok(bytes.length);
      });
    });
  }

  cut(): Promise<OperationResultDto> {
    return this.executor.transport(async () => {
      await this.adapter.cut();
      return ok(1);
    });
  }

  printRaster(dto: PrintRasterDto): Promise<OperationResultDto> {
    return Promise.resolve().then(() => {
      const data = this.payloadDecoder.raster(dto);
      return this.printJobs.raster(dto, async () => {
        await this.adapter.printRasterImage({
          data,
          widthBytes: dto.widthBytes,
          height: dto.height,
          alignment: dto.alignment,
          scale: dto.scale,
        });
        return ok(data.length);
      });
    });
  }

  printLines(dto: PrintLinesDto): Promise<OperationResultDto> {
    return this.printJobs.text(dto, async () => {
      for (const line of dto.lines) {
        await this.adapter.printText(line.text, {
          alignment: line.alignment ?? AlignmentDto.Left,
          style: completeTextStyle(line.style),
          encoding: dto.encoding ?? TextEncodingDto.Windows1250,
          appendLineFeed: true,
        });
      }
      return ok(dto.lines.length);
    });
  }

  printText(dto: PrintTextDto): Promise<OperationResultDto> {
    return this.printJobs.text(dto, async () => {
      await this.adapter.printText(dto.text, {
        alignment: 'left',
        style: { ...NORMAL_TEXT_STYLE, font: fontForSize(dto.fontSize) },
        encoding: dto.encoding ?? TextEncodingDto.Windows1250,
        appendLineFeed: true,
      });
      return ok(dto.text.length);
    });
  }

  printMarkdown(dto: PrintMarkdownDto): Promise<OperationResultDto> {
    return Promise.resolve().then(() => {
      // Validate before the queued operation opens the printer connection.
      this.markdownPrinter.validate(dto.markdown);
      return this.printJobs.text(dto, async () => {
        const lines = await this.markdownPrinter.print(dto.markdown, {
          text: (value, style, alignment = 'left') =>
            this.adapter.printText(value, {
              alignment,
              style: { ...style, font: fontForSize(dto.fontSize) },
              encoding: dto.encoding ?? TextEncodingDto.Windows1250,
              appendLineFeed: false,
            }),
          lineFeed: () => this.adapter.execute([{ type: 'lineFeed' }]),
        });
        return ok(lines);
      });
    });
  }

  printMarkdownText(markdown: unknown): Promise<OperationResultDto> {
    if (typeof markdown !== 'string' || markdown.trim().length === 0) {
      throw new BadRequestException(
        'Markdown body must be a non-empty string.',
      );
    }
    if (markdown.length > 100_000) {
      throw new BadRequestException('Markdown body exceeds 100000 characters.');
    }
    return this.printMarkdown({
      markdown,
      fontSize: CharacterFontSizeDto.Size12x24,
      encoding: TextEncodingDto.Windows1250,
      initialize: true,
      cut: false,
    });
  }

  onApplicationShutdown(): Promise<void> {
    return this.executor.shutdown();
  }
}

function ok(processed: number): OperationResultDto {
  return { status: 'ok', processed };
}
