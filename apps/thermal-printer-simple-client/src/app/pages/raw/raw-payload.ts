import { RawEncoding } from '../../core/printer.models';

export function validateRawPayload(encoding: RawEncoding, payload: string): string | null {
  const value = payload.trim();
  if (!value) {
    return null;
  }
  if (encoding === 'hex') {
    const compact = value.replace(/[\s,:-]+/g, '');
    if (!/^[0-9a-f]+$/i.test(compact)) {
      return 'HEX zawiera niedozwolone znaki';
    }
    return compact.length % 2 ? 'Każdy bajt HEX musi mieć dwie cyfry' : null;
  }
  if (encoding === 'base64') {
    const compact = value.replace(/\s+/g, '');
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(compact)
      ? null
      : 'Niepoprawny Base64';
  }
  const parts = value.split(/[\s,]+/).filter(Boolean);
  return parts.some((part) => !/^\d+$/.test(part) || Number(part) > 255)
    ? 'Bajty muszą być liczbami 0–255'
    : null;
}

export function rawPayloadByteCount(encoding: RawEncoding, payload: string): number {
  const value = payload.trim();
  if (!value || validateRawPayload(encoding, value)) {
    return 0;
  }
  if (encoding === 'hex') {
    return value.replace(/[\s,:-]+/g, '').length / 2;
  }
  if (encoding === 'base64') {
    const compact = value.replace(/\s+/g, '');
    const padding = compact.endsWith('==') ? 2 : compact.endsWith('=') ? 1 : 0;
    return (compact.length * 3) / 4 - padding;
  }
  return value.split(/[\s,]+/).filter(Boolean).length;
}

export function decodeDecimalBytes(payload: string): number[] {
  return payload
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
}
