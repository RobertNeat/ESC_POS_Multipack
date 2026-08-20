import type { LowLevelPrinterAdapter } from '@esc-pos-multipack/printer-adapter';
import type { PrinterSettingsRepository } from '@esc-pos-multipack/pos-8370-adapter';
import { BadRequestException } from '@nestjs/common';
import { MarkdownPrinter } from './markdown-printer';
import { AlignmentDto, PrintRasterDto, RasterScaleDto } from './printer.dto';
import { PrinterService } from './printer.service';

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
  } as unknown as jest.Mocked<LowLevelPrinterAdapter>;
  const service = new PrinterService(
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
