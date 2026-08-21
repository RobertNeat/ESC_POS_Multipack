import {
  BadRequestException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

const CONNECTIVITY_CODES = new Set([
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTDOWN',
  'EHOSTUNREACH',
  'ENETDOWN',
  'ENETUNREACH',
  'ENODEV',
  'ENOTCONN',
  'ETIMEDOUT',
]);

/** Marks a failure originating at the transport boundary. */
export class PrinterConnectivityError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PrinterConnectivityError';
  }
}

@Injectable()
export class PrinterErrorMapper {
  input(error: unknown): never {
    if (error instanceof HttpException) throw error;
    if (isConnectivityError(error)) throw unavailable(error);
    throw new BadRequestException(errorMessage(error));
  }

  transport(error: unknown): never {
    if (error instanceof HttpException) throw error;
    throw unavailable(error);
  }
}

export function asConnectivityError(error: unknown): PrinterConnectivityError {
  if (error instanceof PrinterConnectivityError) return error;
  return new PrinterConnectivityError(errorMessage(error), {
    cause: error,
  });
}

function isConnectivityError(error: unknown): boolean {
  if (error instanceof PrinterConnectivityError) return true;
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }
  return CONNECTIVITY_CODES.has(String(error.code).toUpperCase());
}

function unavailable(error: unknown): ServiceUnavailableException {
  return new ServiceUnavailableException(
    `Printer operation failed: ${errorMessage(error)}`,
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
