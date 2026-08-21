import { rawPayloadByteCount, validateRawPayload } from './raw-payload';

describe('raw payload', () => {
  it('validates complete hexadecimal bytes', () => {
    expect(validateRawPayload('hex', '1b 40 ff')).toBeNull();
    expect(validateRawPayload('hex', '1b 4')).toContain('dwie cyfry');
  });

  it('reports decoded Base64 length including padding', () => {
    expect(rawPayloadByteCount('base64', 'SGVsbG8=')).toBe(5);
  });

  it('rejects decimal values outside a byte', () => {
    expect(validateRawPayload('bytes', '0, 255, 256')).toContain('0–255');
  });
});
