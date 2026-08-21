import type { Pos8370LowLevelAdapter } from '@esc-pos-multipack/pos-8370-adapter/low-level';
import { ServiceUnavailableException } from '@nestjs/common';
import { PrinterErrorMapper } from './printer.errors';
import { PrinterOperationExecutor } from './printer-operation.executor';
import { PrinterOperationQueue } from './printer-operation.queue';
import { PrinterPrintJobRunner } from './printer-print-job.runner';

function createRunner(adapter: jest.Mocked<Pos8370LowLevelAdapter>) {
  const executor = new PrinterOperationExecutor(
    new PrinterOperationQueue(),
    new PrinterErrorMapper(),
    adapter,
  );
  return new PrinterPrintJobRunner(adapter, executor);
}

describe('PrinterPrintJobRunner', () => {
  it('keeps initialize, print, reset and cut in one ordered operation', async () => {
    const events: string[] = [];
    const adapter = {
      initialize: jest.fn().mockImplementation(() => {
        events.push('initialize');
        return Promise.resolve();
      }),
      setAlignment: jest.fn().mockImplementation(() => {
        events.push('alignment');
        return Promise.resolve();
      }),
      setTextStyle: jest.fn().mockImplementation(() => {
        events.push('style');
        return Promise.resolve();
      }),
      cut: jest.fn().mockImplementation(() => {
        events.push('cut');
        return Promise.resolve();
      }),
    } as unknown as jest.Mocked<Pos8370LowLevelAdapter>;

    const result = await createRunner(adapter).text(
      { initialize: true, cut: true },
      () => {
        events.push('print');
        return Promise.resolve('done');
      },
    );

    expect(result).toBe('done');
    expect(events).toEqual([
      'initialize',
      'print',
      'alignment',
      'style',
      'cut',
    ]);
  });

  it('resets text state after a failed print and does not cut', async () => {
    const adapter = {
      initialize: jest.fn().mockResolvedValue(undefined),
      setAlignment: jest.fn().mockResolvedValue(undefined),
      setTextStyle: jest.fn().mockResolvedValue(undefined),
      cut: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Pos8370LowLevelAdapter>;

    await expect(
      createRunner(adapter).text({ initialize: true, cut: true }, () =>
        Promise.reject(new Error('print failed')),
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(adapter.setAlignment).toHaveBeenCalledWith('left');
    expect(adapter.setTextStyle).toHaveBeenCalledTimes(1);
    expect(adapter.cut).not.toHaveBeenCalled();
  });
});
