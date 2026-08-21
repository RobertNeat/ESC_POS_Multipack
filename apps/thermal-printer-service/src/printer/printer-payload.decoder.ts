import { BadRequestException, Injectable } from '@nestjs/common';
import { PrintRasterDto, PrintRawDto, RawEncodingDto } from './printer.dto';

export const MAX_RAW_BYTES = 1024 * 1024;

@Injectable()
export class PrinterPayloadDecoder {
  raw(dto: PrintRawDto): Uint8Array {
    const bytes = this.decodeRaw(dto);
    this.assertMaximumSize(bytes.length, 'Raw');
    return bytes;
  }

  raster(dto: PrintRasterDto): Uint8Array {
    const expectedLength = dto.widthBytes * dto.height;
    this.assertMaximumSize(expectedLength, 'Raster');

    const data = Uint8Array.from(Buffer.from(dto.data, 'base64'));
    if (data.length !== expectedLength) {
      throw new BadRequestException(
        `Raster data must contain exactly ${expectedLength} bytes; received ${data.length}.`,
      );
    }
    return data;
  }

  private decodeRaw(dto: PrintRawDto): Uint8Array {
    if (dto.encoding === RawEncodingDto.Bytes) {
      if (!Array.isArray(dto.data)) {
        throw new BadRequestException(
          'bytes encoding requires an integer array.',
        );
      }
      if (
        dto.data.some(
          (byte) => !Number.isInteger(byte) || byte < 0 || byte > 255,
        )
      ) {
        throw new BadRequestException(
          'Every raw byte must be an integer from 0 to 255.',
        );
      }
      return Uint8Array.from(dto.data);
    }

    if (typeof dto.data !== 'string') {
      throw new BadRequestException(
        `${dto.encoding} encoding requires a string.`,
      );
    }
    return dto.encoding === RawEncodingDto.Hex
      ? this.hex(dto.data)
      : this.base64(dto.data);
  }

  private hex(value: string): Uint8Array {
    const compact = value.replace(/[\s,:-]+/g, '');
    if (compact.length === 0 || compact.length % 2 !== 0) {
      throw new BadRequestException('Hex data must contain complete bytes.');
    }
    if (!/^[0-9a-f]+$/i.test(compact)) {
      throw new BadRequestException('Hex data contains invalid characters.');
    }
    return Uint8Array.from(Buffer.from(compact, 'hex'));
  }

  private base64(value: string): Uint8Array {
    const compact = value.replace(/\s+/g, '');
    const pattern =
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    if (
      compact.length === 0 ||
      compact.length % 4 !== 0 ||
      !pattern.test(compact)
    ) {
      throw new BadRequestException('Invalid base64 data.');
    }
    return Uint8Array.from(Buffer.from(compact, 'base64'));
  }

  private assertMaximumSize(length: number, label: string): void {
    if (length > MAX_RAW_BYTES) {
      throw new BadRequestException(
        `${label} payload exceeds ${MAX_RAW_BYTES} bytes.`,
      );
    }
  }
}
