import NetworkAdapter from '@node-escpos/network-adapter';
import { NodeEscposLanTransport } from './node-escpos.transport';

type Callback = (error: Error | null) => void;

class MockNetworkDevice {
  private dataCallback?: (data: Buffer) => void;

  open(callback?: Callback): this {
    callback?.(null);
    return this;
  }

  write(_data: Buffer | string, callback?: Callback): this {
    callback?.(null);
    return this;
  }

  close(callback?: Callback): this {
    callback?.(null);
    return this;
  }

  read(callback?: (data: Buffer) => void): this {
    this.dataCallback = callback;
    return this;
  }

  emitData(data: readonly number[]): void {
    this.dataCallback?.(Buffer.from(data));
  }
}

const devices: MockNetworkDevice[] = [];

jest.mock('@node-escpos/network-adapter', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    const device = new MockNetworkDevice();
    devices.push(device);
    return device;
  }),
}));

describe('NodeEscposLanTransport reconnection', () => {
  beforeEach(() => {
    devices.length = 0;
    jest.clearAllMocks();
  });

  it('discards a timed-out socket so open creates a fresh connection', async () => {
    const transport = new NodeEscposLanTransport('192.0.2.1', 9100, 5);
    await transport.open();

    await expect(transport.request(Uint8Array.of(0x10), 1)).rejects.toThrow(
      'Printer response timeout.',
    );
    await transport.open();

    expect(NetworkAdapter).toHaveBeenCalledTimes(2);
    const response = transport.request(Uint8Array.of(0x10), 1);
    devices[1].emitData([0x12]);
    await expect(response).resolves.toEqual(Uint8Array.of(0x12));
  });
});
