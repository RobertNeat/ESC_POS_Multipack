import type { PrinterSettingsRepository } from '@esc-pos-multipack/pos-8370-adapter';
import type { Pos8370LowLevelAdapter } from '@esc-pos-multipack/pos-8370-adapter/low-level';
import { BadRequestException } from '@nestjs/common';
import { MarkdownPrinter } from './markdown-printer';
import { PrinterConfigurationCatalog } from './printer-configuration.catalog';
import {
  AlignmentDto,
  CharacterFontSizeDto,
  PrintRasterDto,
  RasterScaleDto,
  TextEncodingDto,
} from './printer.dto';
import { PrinterService } from './printer.service';
import { PrinterErrorMapper } from './printer.errors';
import { PrinterOperationExecutor } from './printer-operation.executor';
import { PrinterOperationQueue } from './printer-operation.queue';
import { PrinterPayloadDecoder } from './printer-payload.decoder';
import { PrinterPrintJobRunner } from './printer-print-job.runner';

function createService(
  adapter: jest.Mocked<Pos8370LowLevelAdapter>,
  settings = {} as PrinterSettingsRepository,
  markdownPrinter = new MarkdownPrinter(),
): PrinterService {
  const executor = new PrinterOperationExecutor(
    new PrinterOperationQueue(),
    new PrinterErrorMapper(),
    adapter,
  );
  return new PrinterService(
    adapter,
    markdownPrinter,
    executor,
    new PrinterPayloadDecoder(),
    new PrinterPrintJobRunner(adapter, executor),
    new PrinterConfigurationCatalog(settings),
  );
}

describe('PrinterService raster printing', () => {
  const initialize = jest.fn();
  const printRasterImage = jest.fn();
  const setAlignment = jest.fn();
  const cut = jest.fn();
  const adapter = {
    initialize,
    printRasterImage,
    setAlignment,
    cut,
  } as unknown as jest.Mocked<Pos8370LowLevelAdapter>;
  const service = createService(
    adapter,
    {} as PrinterSettingsRepository,
    {} as MarkdownPrinter,
  );

  beforeEach(() => jest.clearAllMocks());

  it('prints validated 1-bit data and cuts in the same operation', async () => {
    const dto: PrintRasterDto = {
      data: Buffer.from([0xaa, 0x55]).toString('base64'),
      widthBytes: 1,
      height: 2,
      alignment: AlignmentDto.Center,
      scale: RasterScaleDto.Normal,
      initialize: true,
      cut: true,
    };

    await expect(service.printRaster(dto)).resolves.toEqual({
      status: 'ok',
      processed: 2,
    });
    expect(initialize).toHaveBeenCalledTimes(1);
    expect(printRasterImage).toHaveBeenCalledWith({
      data: Uint8Array.from([0xaa, 0x55]),
      widthBytes: 1,
      height: 2,
      alignment: 'center',
      scale: 'normal',
    });
    expect(setAlignment).toHaveBeenCalledWith('left');
    expect(cut).toHaveBeenCalledTimes(1);
  });

  it('rejects a payload whose byte count does not match its dimensions', async () => {
    await expect(
      service.printRaster({
        data: Buffer.from([0xff]).toString('base64'),
        widthBytes: 2,
        height: 2,
        alignment: AlignmentDto.Left,
        scale: RasterScaleDto.Normal,
        initialize: true,
        cut: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(printRasterImage).not.toHaveBeenCalled();
  });
});

describe('PrinterService text encoding', () => {
  it('passes the requested code page encoding to every printed line', async () => {
    const adapter = {
      initialize: jest.fn().mockResolvedValue(undefined),
      printText: jest.fn().mockResolvedValue(undefined),
      setAlignment: jest.fn().mockResolvedValue(undefined),
      setTextStyle: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Pos8370LowLevelAdapter>;
    const service = createService(adapter);

    await service.printLines({
      lines: [{ text: 'Mężny żółć' }],
      encoding: TextEncodingDto.Cp852,
      initialize: true,
      cut: false,
    });

    expect(adapter.printText).toHaveBeenCalledWith(
      'Mężny żółć',
      expect.objectContaining({ encoding: 'cp852' }),
    );
  });

  it('applies the selected 9x24 font to every Markdown fragment', async () => {
    const adapter = {
      initialize: jest.fn().mockResolvedValue(undefined),
      printText: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn().mockResolvedValue(undefined),
      setAlignment: jest.fn().mockResolvedValue(undefined),
      setTextStyle: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Pos8370LowLevelAdapter>;
    const service = createService(adapter);

    await service.printMarkdown({
      markdown: '**tekst** i `kod`',
      fontSize: CharacterFontSizeDto.Size9x24,
      encoding: TextEncodingDto.Windows1250,
      initialize: true,
      cut: false,
    });

    expect(adapter.printText).toHaveBeenCalled();
    for (const [, options] of adapter.printText.mock.calls) {
      expect(options?.style?.font).toBe('specialB');
    }
  });
});
