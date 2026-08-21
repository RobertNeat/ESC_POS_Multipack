import { PrinterOperationQueue } from './printer-operation.queue';

describe('PrinterOperationQueue', () => {
  it('runs operations sequentially and continues after a rejected operation', async () => {
    const queue = new PrinterOperationQueue();
    const events: string[] = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = queue.enqueue(async () => {
      events.push('first:start');
      await firstGate;
      events.push('first:end');
      throw new Error('expected failure');
    });
    const second = queue.enqueue(() => {
      events.push('second');
      return Promise.resolve(2);
    });

    await Promise.resolve();
    expect(events).toEqual(['first:start']);
    releaseFirst();
    await expect(first).rejects.toThrow('expected failure');
    await expect(second).resolves.toBe(2);
    expect(events).toEqual(['first:start', 'first:end', 'second']);
  });
});
