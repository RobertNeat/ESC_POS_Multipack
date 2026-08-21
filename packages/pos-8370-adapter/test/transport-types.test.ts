import { createPos8370Adapter } from '../dist/index.js';

const write = async (): Promise<void> => {};

createPos8370Adapter({ transport: { descriptor: { kind: 'usb' }, write } });
createPos8370Adapter({ transport: { descriptor: { kind: 'lan' }, write } });

// @ts-expect-error POS-8370 does not expose a serial transport.
createPos8370Adapter({ transport: { descriptor: { kind: 'serial' }, write } });

// @ts-expect-error Generic network transports are not necessarily LAN transports supported by POS-8370.
createPos8370Adapter({ transport: { descriptor: { kind: 'network' }, write } });

// @ts-expect-error Virtual transports are reserved for generic adapters and tests.
createPos8370Adapter({ transport: { descriptor: { kind: 'virtual' }, write } });
