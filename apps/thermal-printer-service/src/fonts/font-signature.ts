import type { FontFileFormat } from './font-record';

/**
 * sfnt wrapper signatures. TTF uses the version tag 0x00010000 (or legacy
 * Apple 'true'/'typ1'); OTF (CFF-flavored) uses 'OTTO'. Font collections use
 * 'ttcf' and are explicitly unsupported here, not silently misdetected.
 */
export type FontSignature =
  | { readonly format: FontFileFormat }
  | { readonly format: 'ttc' }
  | { readonly format: 'unknown' };

export function detectFontSignature(data: Buffer): FontSignature {
  if (data.byteLength < 4) return { format: 'unknown' };
  const tag = data.readUInt32BE(0);
  if (tag === 0x00010000) return { format: 'ttf' };
  const ascii = data.subarray(0, 4).toString('ascii');
  if (ascii === 'true' || ascii === 'typ1') return { format: 'ttf' };
  if (ascii === 'OTTO') return { format: 'otf' };
  if (ascii === 'ttcf') return { format: 'ttc' };
  return { format: 'unknown' };
}
