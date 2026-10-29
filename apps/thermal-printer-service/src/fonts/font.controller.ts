import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  DeleteFontResponseDto,
  FontDto,
  FontListResponseDto,
} from './dto/font.dto';
import { UploadFontDto } from './dto/upload-font.dto';
import {
  BuiltInFontImmutableError,
  DuplicateFontError,
  FontInUseError,
  FontNotFoundError,
  InvalidFontFileError,
  UnsupportedFontFormatError,
} from './font-library.errors';
import { MAX_FONT_UPLOAD_BYTES } from './font-library.constants';
import { FontLibraryService } from './font-library.service';
import type { FontRecord } from './font-record';

@Controller('fonts')
@ApiTags('fonts')
export class FontController {
  constructor(private readonly fonts: FontLibraryService) {}

  @Get()
  @ApiOperation({ summary: 'Lista czcionek dostępnych do druku rastrowego' })
  @ApiOkResponse({ type: FontListResponseDto })
  async list(): Promise<FontListResponseDto> {
    const fonts = await this.fonts.list();
    return { fonts: fonts.map(toDto) };
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Wgrywa nową czcionkę TTF/OTF do biblioteki' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        displayName: { type: 'string' },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ type: FontDto })
  @ApiBadRequestResponse({
    description:
      'Plik nie jest poprawną czcionką TTF/OTF, jest za duży lub uszkodzony.',
  })
  @ApiConflictResponse({
    description: 'Identyczna czcionka już istnieje w bibliotece.',
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FONT_UPLOAD_BYTES } }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UploadFontDto,
  ): Promise<FontDto> {
    if (!file)
      throw new BadRequestException('Missing font file ("file" field).');
    try {
      const record = await this.fonts.upload({
        data: file.buffer,
        originalFilename: file.originalname,
        displayName: body.displayName,
      });
      return toDto(record);
    } catch (error) {
      throw mapUploadError(error);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Usuwa wgraną czcionkę z biblioteki' })
  @ApiOkResponse({ type: DeleteFontResponseDto })
  @ApiNotFoundResponse({ description: 'Nieznana czcionka.' })
  @ApiForbiddenResponse({
    description: 'Czcionka wbudowana nie może być usunięta.',
  })
  @ApiConflictResponse({
    description: 'Czcionka jest używana przez trwające zadanie druku.',
  })
  async delete(@Param('id') id: string): Promise<DeleteFontResponseDto> {
    try {
      await this.fonts.delete(id);
      return { status: 'ok' };
    } catch (error) {
      throw mapDeleteError(error);
    }
  }
}

function toDto(record: FontRecord): FontDto {
  return {
    id: record.id,
    displayName: record.displayName,
    originalFilename: record.originalFilename,
    familyName: record.familyName,
    format: record.format,
    builtIn: record.builtIn,
    hasBold: record.boldFileName !== undefined,
    sizeBytes: record.sizeBytes,
    uploadedAt: record.uploadedAt,
    coverage: {
      ok: record.coverage.ok,
      missingCharacters: [...record.coverage.missingCharacters],
    },
  };
}

function mapUploadError(error: unknown): Error {
  if (
    error instanceof UnsupportedFontFormatError ||
    error instanceof InvalidFontFileError
  ) {
    return new BadRequestException(error.message);
  }
  if (error instanceof DuplicateFontError) {
    return new ConflictException(error.message);
  }
  return error instanceof Error ? error : new Error(String(error));
}

function mapDeleteError(error: unknown): Error {
  if (error instanceof FontNotFoundError) {
    return new NotFoundException(error.message);
  }
  if (error instanceof BuiltInFontImmutableError) {
    return new ForbiddenException(error.message);
  }
  if (error instanceof FontInUseError) {
    return new ConflictException(error.message);
  }
  return error instanceof Error ? error : new Error(String(error));
}
