import * as iconv from "iconv-lite";

export const POS_8370_TEXT_ENCODINGS = ["utf8", "cp852", "windows1250", "cp3843"] as const;
export type Pos8370TextEncoding = (typeof POS_8370_TEXT_ENCODINGS)[number];

const CP3843_POLISH_BYTES = new Map<string, number>([
  ["ą", 0x86], ["Ą", 0x8f], ["ć", 0x8d], ["Ć", 0x95],
  ["ę", 0x91], ["Ę", 0x90], ["ł", 0x92], ["Ł", 0x9c],
  ["ń", 0xa4], ["Ń", 0xa5], ["ó", 0xa2], ["Ó", 0xa3],
  ["ś", 0x98], ["Ś", 0x97], ["ź", 0xa0], ["Ź", 0xa6],
  ["ż", 0xa1], ["Ż", 0xa7]
]);

/** Encodes Unicode text into a byte stream matching the selected POS-8370 code page. */
export function encodePos8370Text(text: string, encoding = "utf8"): Uint8Array {
  const normalized = normalizeEncoding(encoding);
  if (normalized === "cp3843") return encodeCp3843(text);
  return Uint8Array.from(iconv.encode(text, normalized));
}

function normalizeEncoding(encoding: string): Pos8370TextEncoding {
  const normalized = encoding.toLowerCase().replace(/[-_]/g, "");
  if (normalized === "utf8") return "utf8";
  if (normalized === "cp852" || normalized === "ibm852" || normalized === "oem852") return "cp852";
  if (normalized === "windows1250" || normalized === "win1250" || normalized === "cp1250") return "windows1250";
  if (normalized === "cp3843" || normalized === "pc3843" || normalized === "mazovia") return "cp3843";
  throw new RangeError(`Unsupported POS-8370 text encoding: ${encoding}`);
}

function encodeCp3843(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const character of text) {
    const polishByte = CP3843_POLISH_BYTES.get(character);
    if (polishByte !== undefined) {
      bytes.push(polishByte);
      continue;
    }
    bytes.push(...iconv.encode(character, "cp437"));
  }
  return Uint8Array.from(bytes);
}
