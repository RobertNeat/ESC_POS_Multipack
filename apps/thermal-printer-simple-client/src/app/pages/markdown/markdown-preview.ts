export interface MarkdownPreviewLine {
  text: string;
  className: string;
  indent: number;
}

export function markdownPreviewLines(markdown: string): MarkdownPreviewLine[] {
  return markdown.split('\n').slice(0, 38).map(toPreviewLine);
}

function toPreviewLine(raw: string): MarkdownPreviewLine {
  const spaces = raw.match(/^\s*/)?.[0].length ?? 0;
  let text = raw.trim();
  let className = '';
  if (/^# /.test(text)) {
    className = 'h1';
    text = text.slice(2);
  } else if (/^#{2,6} /.test(text)) {
    className = 'h2';
    text = text.replace(/^#{2,6} /, '');
  } else if (/^> /.test(text)) {
    className = 'quote';
    text = text.slice(2);
  } else if (/^([-*+] |\d+\. )/.test(text)) {
    className = 'list';
  } else if (/^```/.test(text)) {
    className = 'code';
  }
  text = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`(.*?)`/g, '$1');
  return { text, className, indent: Math.min(spaces, 10) };
}
