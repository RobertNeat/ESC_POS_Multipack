import { BadRequestException } from '@nestjs/common';
import type { PrinterAlignment } from '@esc-pos-multipack/printer-adapter';
import type { Pos8370TextStyle } from '@esc-pos-multipack/pos-8370-adapter';
import { MarkdownPrinter, type MarkdownSink } from './markdown-printer';

interface Fragment {
  text: string;
  style: Pos8370TextStyle;
  alignment?: PrinterAlignment;
}

describe('MarkdownPrinter', () => {
  let printer: MarkdownPrinter;
  let fragments: Fragment[];
  let lineFeeds: number;
  let sink: MarkdownSink;

  beforeEach(() => {
    printer = new MarkdownPrinter();
    fragments = [];
    lineFeeds = 0;
    sink = {
      text: (text, style, alignment) => {
        fragments.push({ text, style: { ...style }, alignment });
        return Promise.resolve();
      },
      lineFeed: () => {
        lineFeeds += 1;
        return Promise.resolve();
      },
    };
  });

  it('renders nested lists with increasing indentation', async () => {
    const lines = await printer.print(
      '1. First\n   - Nested\n     - Deep\n2. Second',
      sink,
    );

    expect(lines).toBe(4);
    expect(fragments.map((fragment) => fragment.text)).toEqual(
      expect.arrayContaining(['1. ', '  - ', '    - ', '2. ']),
    );
  });

  it('restores the parent style after nested inline formatting', async () => {
    await printer.print('**bold and *underlined* then bold** normal', sink);

    const underlined = fragments.find(
      (fragment) => fragment.text === 'underlined',
    );
    const thenBold = fragments.find((fragment) =>
      fragment.text.includes('then bold'),
    );
    const normal = fragments.find((fragment) => fragment.text === ' normal');
    expect(underlined?.style).toMatchObject({
      emphasized: true,
      underline: 1,
    });
    expect(thenBold?.style).toMatchObject({
      emphasized: true,
      underline: 0,
    });
    expect(normal?.style).toMatchObject({
      emphasized: false,
      underline: 0,
    });
    expect(lineFeeds).toBe(1);
  });

  it('aligns table columns to the widest cell and keeps table borders', async () => {
    await printer.print('|test|test|\n|-|-|\n|test|test|\n|smalll|test|', sink);

    expect(fragments.map((fragment) => fragment.text).join('')).toBe(
      '|test  |test||------|----||test  |test||smalll|test|',
    );
    expect(lineFeeds).toBe(4);
  });

  it('rejects HTML before writing anything', async () => {
    await expect(
      printer.print('safe\n\n<div>unsafe</div>', sink),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fragments).toEqual([]);
  });
});
