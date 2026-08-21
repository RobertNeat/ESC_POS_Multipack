import { BadRequestException, Injectable } from '@nestjs/common';
import type { PrinterAlignment } from '@esc-pos-multipack/printer-adapter';
import type { Pos8370TextStyle } from '@esc-pos-multipack/pos-8370-adapter';
import { marked, type Token, type Tokens } from 'marked';
import { NORMAL_TEXT_STYLE } from './printer-text-style';

export interface MarkdownSink {
  text(
    value: string,
    style: Pos8370TextStyle,
    alignment?: PrinterAlignment,
  ): Promise<void>;
  lineFeed(): Promise<void>;
}

@Injectable()
export class MarkdownPrinter {
  validate(markdown: string): void {
    this.tokenize(markdown);
  }

  async print(markdown: string, sink: MarkdownSink): Promise<number> {
    const tokens = this.tokenize(markdown);
    const counter = { lines: 0 };
    await this.renderBlocks(tokens, sink, NORMAL_TEXT_STYLE, 0, counter);
    return counter.lines;
  }

  private tokenize(markdown: string): Token[] {
    const tokens = marked.lexer(markdown, { gfm: true, breaks: false });
    void marked.walkTokens(tokens, (token) => {
      if (token.type === 'html') {
        throw new BadRequestException(
          'HTML embedded in Markdown is not supported.',
        );
      }
    });

    return tokens;
  }

  private async renderBlocks(
    tokens: readonly Token[],
    sink: MarkdownSink,
    style: Pos8370TextStyle,
    listDepth: number,
    counter: { lines: number },
  ): Promise<void> {
    for (const token of tokens) {
      switch (token.type) {
        case 'space':
        case 'def':
          break;
        case 'heading':
          await this.renderHeading(token as Tokens.Heading, sink, counter);
          break;
        case 'paragraph':
          await this.renderInline(
            (token as Tokens.Paragraph).tokens,
            sink,
            style,
          );
          await this.endLine(sink, counter);
          break;
        case 'text':
          await this.renderInline(token.tokens ?? [token], sink, style);
          await this.endLine(sink, counter);
          break;
        case 'list':
          await this.renderList(
            token as Tokens.List,
            sink,
            style,
            listDepth,
            counter,
          );
          break;
        case 'blockquote':
          await this.renderBlockquote(
            token as Tokens.Blockquote,
            sink,
            style,
            listDepth,
            counter,
          );
          break;
        case 'code':
          await this.renderCode(token as Tokens.Code, sink, counter);
          break;
        case 'hr':
          await sink.text('-'.repeat(48), NORMAL_TEXT_STYLE);
          await this.endLine(sink, counter);
          break;
        case 'table':
          await this.renderTable(token as Tokens.Table, sink, counter);
          break;
        case 'html':
          throw new BadRequestException(
            'HTML embedded in Markdown is not supported.',
          );
        default:
          throw new BadRequestException(
            `Unsupported Markdown block: ${token.type}.`,
          );
      }
    }
  }

  private async renderHeading(
    token: Tokens.Heading,
    sink: MarkdownSink,
    counter: { lines: number },
  ): Promise<void> {
    const scale = token.depth === 1 ? 2 : 1;
    await this.renderInline(token.tokens, sink, {
      ...NORMAL_TEXT_STYLE,
      emphasized: true,
      width: scale,
      height: scale,
    });
    await this.endLine(sink, counter);
  }

  private async renderList(
    token: Tokens.List,
    sink: MarkdownSink,
    style: Pos8370TextStyle,
    depth: number,
    counter: { lines: number },
  ): Promise<void> {
    let number = typeof token.start === 'number' ? token.start : 1;
    for (const item of token.items) {
      // Keep list punctuation in ASCII so it is available in every printer font
      // and code page, including the compact CP852 font modes.
      const marker = token.ordered ? `${number++}. ` : '- ';
      const checkbox = item.task ? (item.checked ? '[x] ' : '[ ] ') : '';
      await sink.text(`${'  '.repeat(depth)}${marker}${checkbox}`, style);

      const nested: Token[] = [];
      const content: Token[] = [];
      for (const itemToken of item.tokens) {
        if (itemToken.type === 'list') nested.push(itemToken);
        else content.push(itemToken);
      }
      await this.renderListItemContent(content, sink, style);
      await this.endLine(sink, counter);
      await this.renderBlocks(nested, sink, style, depth + 1, counter);
    }
  }

  private async renderListItemContent(
    tokens: readonly Token[],
    sink: MarkdownSink,
    style: Pos8370TextStyle,
  ): Promise<void> {
    for (const token of tokens) {
      if (token.type === 'text' || token.type === 'paragraph') {
        await this.renderInline(token.tokens ?? [token], sink, style);
      } else if (token.type === 'code') {
        await sink.text((token as Tokens.Code).text, {
          ...style,
          font: 'B',
          reverse: true,
        });
      } else if (token.type !== 'space') {
        throw new BadRequestException(
          `Unsupported Markdown inside a list item: ${token.type}.`,
        );
      }
    }
  }

  private async renderBlockquote(
    token: Tokens.Blockquote,
    sink: MarkdownSink,
    style: Pos8370TextStyle,
    depth: number,
    counter: { lines: number },
  ): Promise<void> {
    await sink.text('│ ', { ...style, emphasized: true });
    await this.renderBlocks(token.tokens, sink, style, depth, counter);
  }

  private async renderCode(
    token: Tokens.Code,
    sink: MarkdownSink,
    counter: { lines: number },
  ): Promise<void> {
    for (const line of token.text.split('\n')) {
      await sink.text(line, {
        ...NORMAL_TEXT_STYLE,
        font: 'B',
        reverse: true,
      });
      await this.endLine(sink, counter);
    }
  }

  private async renderTable(
    token: Tokens.Table,
    sink: MarkdownSink,
    counter: { lines: number },
  ): Promise<void> {
    const widths = token.header.map((cell, index) =>
      Math.max(
        this.tableCellText(cell).length,
        ...token.rows.map((row) => this.tableCellText(row[index]).length),
      ),
    );
    await this.renderTableRow(token.header, widths, sink, true, counter);
    await sink.text(
      `|${widths.map((width) => '-'.repeat(width)).join('|')}|`,
      NORMAL_TEXT_STYLE,
    );
    await this.endLine(sink, counter);
    for (const row of token.rows) {
      await this.renderTableRow(row, widths, sink, false, counter);
    }
  }

  private async renderTableRow(
    cells: readonly Tokens.TableCell[],
    widths: readonly number[],
    sink: MarkdownSink,
    heading: boolean,
    counter: { lines: number },
  ): Promise<void> {
    for (const [index, cell] of cells.entries()) {
      await sink.text('|', NORMAL_TEXT_STYLE);
      await this.renderInline(cell.tokens, sink, {
        ...NORMAL_TEXT_STYLE,
        emphasized: heading,
      });
      await sink.text(
        ' '.repeat(
          Math.max(0, (widths[index] ?? 0) - this.tableCellText(cell).length),
        ),
        NORMAL_TEXT_STYLE,
      );
    }
    await sink.text('|', NORMAL_TEXT_STYLE);
    await this.endLine(sink, counter);
  }

  private tableCellText(cell: Tokens.TableCell | undefined): string {
    if (!cell) return '';
    return this.inlineText(cell.tokens);
  }

  private inlineText(tokens: readonly Token[]): string {
    return tokens
      .map((token) => {
        if ('tokens' in token && token.tokens?.length)
          return this.inlineText(token.tokens);
        if (token.type === 'image')
          return `[obraz: ${(token as Tokens.Image).text}] <${(token as Tokens.Image).href}>`;
        if (token.type === 'link') return (token as Tokens.Link).text;
        return 'text' in token ? String(token.text) : '';
      })
      .join('');
  }

  private async renderInline(
    tokens: readonly Token[],
    sink: MarkdownSink,
    style: Pos8370TextStyle,
  ): Promise<void> {
    for (const token of tokens) {
      switch (token.type) {
        case 'text':
          if (token.tokens?.length) {
            await this.renderInline(token.tokens, sink, style);
          } else {
            await sink.text((token as Tokens.Text).text, style);
          }
          break;
        case 'escape':
          await sink.text((token as Tokens.Escape).text, style);
          break;
        case 'strong':
          await this.renderInline((token as Tokens.Strong).tokens, sink, {
            ...style,
            emphasized: true,
          });
          break;
        case 'em':
          await this.renderInline((token as Tokens.Em).tokens, sink, {
            ...style,
            underline: 1,
          });
          break;
        case 'del':
          await this.renderInline((token as Tokens.Del).tokens, sink, {
            ...style,
            reverse: true,
          });
          break;
        case 'codespan':
          await sink.text((token as Tokens.Codespan).text, {
            ...style,
            font: 'B',
            reverse: true,
          });
          break;
        case 'link': {
          const link = token as Tokens.Link;
          await this.renderInline(link.tokens, sink, {
            ...style,
            underline: 1,
          });
          if (link.href !== link.text) {
            await sink.text(` <${link.href}>`, style);
          }
          break;
        }
        case 'image': {
          const image = token as Tokens.Image;
          await sink.text(`[obraz: ${image.text}] <${image.href}>`, style);
          break;
        }
        case 'br':
          await sink.lineFeed();
          break;
        case 'html':
          throw new BadRequestException(
            'HTML embedded in Markdown is not supported.',
          );
        default:
          throw new BadRequestException(
            `Unsupported inline Markdown: ${token.type}.`,
          );
      }
    }
  }

  private async endLine(
    sink: MarkdownSink,
    counter: { lines: number },
  ): Promise<void> {
    await sink.lineFeed();
    counter.lines += 1;
  }
}
