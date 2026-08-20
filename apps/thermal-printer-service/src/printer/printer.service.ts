import type {
  DeviceConfig,
  LowLevelPrinterAdapter,
  PrinterTextStyle,
} from '@esc-pos-multipack/printer-adapter';
import type { PrinterSettingsRepository } from '@esc-pos-multipack/pos-8370-adapter';
import {
  BadRequestException,
  Inject,
  Injectable,
  OnApplicationShutdown,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MarkdownPrinter } from './markdown-printer';
import {
  AlignmentDto,
  ConfigureNamedDto,
  ConfigurePrinterDto,
  DeviceActionDto,
  OperationResultDto,
  PrintLinesDto,
  PrintMarkdownDto,
  PrintRawDto,
  PrintRasterDto,
  RawEncodingDto,
  TextStyleDto,
} from './printer.dto';
import { PRINTER_ADAPTER, PRINTER_SETTINGS } from './printer.tokens';

const NORMAL_STYLE: Required<PrinterTextStyle> = {
  font: 'A',
  emphasized: false,
  underline: 0,
  width: 1,
  height: 1,
  reverse: false,
};
const MAX_RAW_BYTES = 1024 * 1024;

@Injectable()
export class PrinterService implements OnApplicationShutdown {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    @Inject(PRINTER_ADAPTER)
    private readonly adapter: LowLevelPrinterAdapter,
    @Inject(PRINTER_SETTINGS)
    private readonly settings: PrinterSettingsRepository,
    private readonly markdownPrinter: MarkdownPrinter,
  ) {}

  capabilities() {
    return this.adapter.getCapabilities();
  }

  availableConfiguration() {
    return {
      settings: this.settings.listSettings(),
      actions: this.settings.listActions(),
    };
  }

  async status() {
    return this.enqueue(() => this.adapter.getStatus());
  }

  async configure(dto: ConfigurePrinterDto): Promise<OperationResultDto> {
    return this.inputOperation(async () => {
      await this.adapter.configure(dto);
      return ok(Object.keys(dto).length);
    });
  }

  async configureNamed(dto: ConfigureNamedDto): Promise<OperationResultDto> {
    return this.inputOperation(async () => {
      const config: DeviceConfig = { entries: dto.entries };
      await this.adapter.configureRaw(config);
      return ok(dto.entries.length);
    });
  }

  async performAction(dto: DeviceActionDto): Promise<OperationResultDto> {
    return this.inputOperation(async () => {
      await this.adapter.performAction(dto);
      return ok(1);
    });
  }

  async printRaw(dto: PrintRawDto): Promise<OperationResultDto> {
    const bytes = decodeRaw(dto);
    if (bytes.length > MAX_RAW_BYTES) {
      throw new BadRequestException(
        `Raw payload exceeds ${MAX_RAW_BYTES} bytes.`,
      );
    }
    return this.transportOperation(async () => {
      await this.adapter.raw(bytes);
      return ok(bytes.length);
    });
  }

  async printRaster(dto: PrintRasterDto): Promise<OperationResultDto> {
    const data = decodeRaster(dto);
    return this.transportOperation(async () => {
      if (dto.initialize) await this.adapter.initialize();
      await this.adapter.printRasterImage({
        data,
        widthBytes: dto.widthBytes,
        height: dto.height,
        alignment: dto.alignment,
        scale: dto.scale,
      });
      await this.adapter.setAlignment('left');
      if (dto.cut) await this.adapter.cut();
      return ok(data.length);
    });
  }

  async printLines(dto: PrintLinesDto): Promise<OperationResultDto> {
    return this.transportOperation(async () => {
      if (dto.initialize) await this.adapter.initialize();
      for (const line of dto.lines) {
        await this.adapter.printText(line.text, {
          alignment: line.alignment ?? AlignmentDto.Left,
          style: completeStyle(line.style),
          appendLineFeed: true,
        });
      }
      await this.resetTextMode();
      if (dto.cut) await this.adapter.cut();
      return ok(dto.lines.length);
    });
  }

  async printMarkdown(dto: PrintMarkdownDto): Promise<OperationResultDto> {
    // Parse and reject unsupported input before opening a printer connection.
    this.markdownPrinter.validate(dto.markdown);
    let lines = 0;
    return this.transportOperation(async () => {
      if (dto.initialize) await this.adapter.initialize();
      lines = await this.markdownPrinter.print(dto.markdown, {
        text: (value, style, alignment = 'left') =>
          this.adapter.printText(value, {
            alignment,
            style,
            appendLineFeed: false,
          }),
        lineFeed: () => this.adapter.execute([{ type: 'lineFeed' }]),
      });
      await this.resetTextMode();
      if (dto.cut) await this.adapter.cut();
      return ok(lines);
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
    return this.printMarkdown({ markdown, initialize: true, cut: false });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.enqueue(() => this.adapter.close());
  }

  private async resetTextMode(): Promise<void> {
    await this.adapter.setAlignment('left');
    await this.adapter.setTextStyle(NORMAL_STYLE);
  }

  private inputOperation<T>(operation: () => Promise<T>): Promise<T> {
    return this.enqueue(async () => {
      try {
        return await operation();
      } catch (error) {
        if (isConnectivityError(error)) {
          throw unavailable(error);
        }
        throw new BadRequestException(errorMessage(error));
      }
    });
  }

  private transportOperation<T>(operation: () => Promise<T>): Promise<T> {
    return this.enqueue(async () => {
      try {
        return await operation();
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        throw unavailable(error);
      }
    });
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}

function completeStyle(style?: TextStyleDto): Required<PrinterTextStyle> {
  return { ...NORMAL_STYLE, ...style };
}

function decodeRaw(dto: PrintRawDto): Uint8Array {
  if (dto.encoding === RawEncodingDto.Bytes) {
    if (!Array.isArray(dto.data)) {
      throw new BadRequestException(
        'bytes encoding requires an integer array.',
      );
    }
    for (const byte of dto.data) {
      if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
        throw new BadRequestException(
          'Every raw byte must be an integer from 0 to 255.',
        );
      }
    }
    return Uint8Array.from(dto.data);
  }

  if (typeof dto.data !== 'string') {
    throw new BadRequestException(
      `${dto.encoding} encoding requires a string.`,
    );
  }
  if (dto.encoding === RawEncodingDto.Hex) {
    const compact = dto.data.replace(/[\s,:-]+/g, '');
    if (compact.length === 0 || compact.length % 2 !== 0) {
      throw new BadRequestException('Hex data must contain complete bytes.');
    }
    if (!/^[0-9a-f]+$/i.test(compact)) {
      throw new BadRequestException('Hex data contains invalid characters.');
    }
    return Uint8Array.from(Buffer.from(compact, 'hex'));
  }

  const compact = dto.data.replace(/\s+/g, '');
  if (
    compact.length === 0 ||
    compact.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      compact,
    )
  ) {
    throw new BadRequestException('Invalid base64 data.');
  }
  return Uint8Array.from(Buffer.from(compact, 'base64'));
}

function decodeRaster(dto: PrintRasterDto): Uint8Array {
  const expectedLength = dto.widthBytes * dto.height;
  if (expectedLength > MAX_RAW_BYTES) {
    throw new BadRequestException(
      `Raster payload exceeds ${MAX_RAW_BYTES} bytes.`,
    );
  }

  const data = Uint8Array.from(Buffer.from(dto.data, 'base64'));
  if (data.length !== expectedLength) {
    throw new BadRequestException(
      `Raster data must contain exactly ${expectedLength} bytes; received ${data.length}.`,
    );
  }
  return data;
}

function ok(processed: number): OperationResultDto {
  return { status: 'ok', processed };
}

function unavailable(error: unknown): ServiceUnavailableException {
  return new ServiceUnavailableException(
    `Printer operation failed: ${errorMessage(error)}`,
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isConnectivityError(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();
  return /connect|socket|transport|timeout|endpoint|printer.*open|device/.test(
    message,
  );
}
