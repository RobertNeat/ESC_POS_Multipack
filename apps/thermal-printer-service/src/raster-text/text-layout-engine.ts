export function fontString(options: {
  readonly fontSizePx: number;
  readonly bold: boolean;
  readonly fontAlias: string;
}): string {
  const weight = options.bold ? 'bold ' : '';
  return `${weight}${options.fontSizePx}px "${options.fontAlias}"`;
}
