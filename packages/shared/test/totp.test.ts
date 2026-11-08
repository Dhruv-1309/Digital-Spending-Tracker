import { describe, it, expect } from 'vitest';
import {
  base32Encode,
  base32Decode,
  generateTotpSecret,
  generateRecoveryCodes,
  generateTotpUri,
  generateTotpCode,
  verifyTotpCode,
} from '../src/crypto/totp.js';

describe('TOTP (Time-Based One-Time Password) - RFC 6238', () => {
  it('correctly encodes and decodes Base32 roundtrip', () => {
    const raw = new TextEncoder().encode('MoneyTrackerSecure2FA');
    const encoded = base32Encode(raw);
    const decoded = base32Decode(encoded);
    expect(new TextDecoder().decode(decoded)).toBe('MoneyTrackerSecure2FA');
  });

  // RFC 6238 Appendix B Official Test Vectors for HMAC-SHA-1
  // Secret is ASCII '12345678901234567890' (20 bytes)
  // Base32 representation of '12345678901234567890' is 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
  const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

  it('matches RFC 6238 test vector at time 59s', async () => {
    const code = await generateTotpCode(rfcSecret, 59 * 1000);
    expect(code).toBe('287082');
  });

  it('matches RFC 6238 test vector at time 1111111109s', async () => {
    const code = await generateTotpCode(rfcSecret, 1111111109 * 1000);
    expect(code).toBe('081804');
  });

  it('matches RFC 6238 test vector at time 1111111111s', async () => {
    const code = await generateTotpCode(rfcSecret, 1111111111 * 1000);
    expect(code).toBe('050471');
  });

  it('matches RFC 6238 test vector at time 1234567890s', async () => {
    const code = await generateTotpCode(rfcSecret, 1234567890 * 1000);
    expect(code).toBe('005924');
  });

  it('matches RFC 6238 test vector at time 2000000000s', async () => {
    const code = await generateTotpCode(rfcSecret, 2000000000 * 1000);
    expect(code).toBe('279037');
  });

  it('verifies valid TOTP code within standard time step', async () => {
    const testTime = 1700000000000;
    const token = await generateTotpCode(rfcSecret, testTime);
    const result = await verifyTotpCode(rfcSecret, token, { timestampMs: testTime });

    expect(result.valid).toBe(true);
    expect(result.stepOffset).toBe(0);
  });

  it('verifies code with acceptable clock drift (+1 or -1 step)', async () => {
    const testTime = 1700000000000;
    // Generated 30 seconds ago
    const pastToken = await generateTotpCode(rfcSecret, testTime - 30000);
    const resultPast = await verifyTotpCode(rfcSecret, pastToken, { timestampMs: testTime, window: 1 });
    expect(resultPast.valid).toBe(true);
    expect(resultPast.stepOffset).toBe(-1);

    // Generated 30 seconds in future
    const futureToken = await generateTotpCode(rfcSecret, testTime + 30000);
    const resultFuture = await verifyTotpCode(rfcSecret, futureToken, { timestampMs: testTime, window: 1 });
    expect(resultFuture.valid).toBe(true);
    expect(resultFuture.stepOffset).toBe(1);
  });

  it('rejects invalid or expired TOTP codes', async () => {
    const testTime = 1700000000000;
    // Too far in the past (90 seconds ago, outside window = 1)
    const oldToken = await generateTotpCode(rfcSecret, testTime - 90000);
    const resultOld = await verifyTotpCode(rfcSecret, oldToken, { timestampMs: testTime, window: 1 });
    expect(resultOld.valid).toBe(false);

    // Completely wrong code
    const resultWrong = await verifyTotpCode(rfcSecret, '999999', { timestampMs: testTime });
    expect(resultWrong.valid).toBe(false);

    // Malformed code
    const resultShort = await verifyTotpCode(rfcSecret, '123', { timestampMs: testTime });
    expect(resultShort.valid).toBe(false);
  });

  it('generates random base32 secrets and recovery codes', () => {
    const secret = generateTotpSecret();
    expect(secret).toHaveLength(32);
    expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);

    const recoveryCodes = generateRecoveryCodes(8);
    expect(recoveryCodes).toHaveLength(8);
    recoveryCodes.forEach((code) => {
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });
  });

  it('constructs standard otpauth URI for authenticator app configuration', () => {
    const uri = generateTotpUri('JBSWY3DPEHPK3PXP', 'alice@example.com', 'MoneyTracker');
    expect(uri).toContain('otpauth://totp/MoneyTracker:alice%40example.com');
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(uri).toContain('issuer=MoneyTracker');
    expect(uri).toContain('digits=6');
  });
});
