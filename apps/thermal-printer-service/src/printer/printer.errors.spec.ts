import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrinterConnectivityError, PrinterErrorMapper } from './printer.errors';

describe('PrinterErrorMapper', () => {
  const mapper = new PrinterErrorMapper();

  it('maps an explicit connectivity failure to service unavailable', () => {
    expect(() => mapper.input(new PrinterConnectivityError('offline'))).toThrow(
      ServiceUnavailableException,
    );
  });

  it('maps invalid configuration to bad request without message matching', () => {
    expect(() => mapper.input(new Error('unknown setting'))).toThrow(
      BadRequestException,
    );
  });
});
