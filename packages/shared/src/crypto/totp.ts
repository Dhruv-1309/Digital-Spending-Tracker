/**
 * Time-Based One-Time Password (TOTP) Algorithm (RFC 6238 / RFC 4226)
 *
 * Implemented using standard Web Crypto API (HMAC-SHA-1) with zero third-party dependencies.
 * Fully compatible with Google Authenticator, Microsoft Authenticator, 1Password, Authy, and Bitwarden.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a Uint8Array buffer into a Base32 string (without padding for cleaner manual entry).
 */
export function base32Encode(buffer: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Uint8Array.
 * Strips whitespace, hyphens, and ignores case.
 */
export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[\s-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === '=') continue; // Skip padding

    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base32 character: "${char}"`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Generates a cryptographically random Base32 secret for TOTP setup.
 * Defaults to 20 bytes (160 bits), which formats as a 32-character string.
 */
export function generateTotpSecret(numBytes = 20): string {
  const bytes = new Uint8Array(numBytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for Node environments if global crypto is absent
    const nodeCrypto = (globalThis as any).crypto;
    nodeCrypto.getRandomValues(bytes);
  }
  return base32Encode(bytes);
}

/**
 * Generates a set of cryptographically random recovery backup codes.
 * Formatted as 4-character pairs separated by hyphens (e.g. "A7E9-4K2M").
 */
export function generateRecoveryCodes(count = 8): string[] {
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Unambiguous characters
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    let code = '';
    for (let b = 0; b < 8; b++) {
      code += charset[bytes[b] % charset.length];
      if (b === 3) code += '-';
    }
    codes.push(code);
  }

  return codes;
}

/**
 * Builds standard otpauth:// URI for QR code scanning into authenticator apps.
 */
export function generateTotpUri(
  secret: string,
  accountName: string,
  issuer = 'MoneyTracker',
): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;
  const cleanSecret = secret.replace(/\s+/g, '');
  return `otpauth://totp/${label}?secret=${cleanSecret}&issuer=${encodeURIComponent(
    issuer,
  )}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Computes the 6-digit TOTP code for a given secret and timestamp using Web Crypto HMAC-SHA1.
 */
export async function generateTotpCode(
  secret: string,
  timestampMs = Date.now(),
  timeStepSeconds = 30,
): Promise<string> {
  const keyBytes = base32Decode(secret);
  const timeStep = Math.floor(timestampMs / 1000 / timeStepSeconds);

  // Pack 64-bit integer into 8 bytes (Big-Endian)
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  // High 32 bits (zero for timestamps before year 2038+)
  const high = Math.floor(timeStep / 0x100000000);
  const low = timeStep >>> 0;
  view.setUint32(0, high, false);
  view.setUint32(4, low, false);

  const cryptoSubtle = crypto.subtle;
  const cryptoKey = await cryptoSubtle.importKey(
    'raw',
    keyBytes as unknown as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );

  const signature = await cryptoSubtle.sign('HMAC', cryptoKey, counterBuffer);
  const hashBytes = new Uint8Array(signature);

  // Dynamic truncation (RFC 4226 Section 5.4)
  const offset = hashBytes[hashBytes.length - 1] & 0x0f;
  const binary =
    ((hashBytes[offset] & 0x7f) << 24) |
    ((hashBytes[offset + 1] & 0xff) << 16) |
    ((hashBytes[offset + 2] & 0xff) << 8) |
    (hashBytes[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

export interface VerifyTotpOptions {
  window?: number; // Check +/- window time steps (default: 1, allowing 30s drift)
  timestampMs?: number;
  timeStepSeconds?: number;
}

export interface VerifyTotpResult {
  valid: boolean;
  stepOffset: number;
}

/**
 * Verifies a 6-digit TOTP token against a Base32 secret with drift tolerance.
 */
export async function verifyTotpCode(
  secret: string,
  token: string,
  options: VerifyTotpOptions = {},
): Promise<VerifyTotpResult> {
  const cleanToken = token.trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanToken)) {
    return { valid: false, stepOffset: 0 };
  }

  const window = options.window ?? 1;
  const timeStepSeconds = options.timeStepSeconds ?? 30;
  const baseTime = options.timestampMs ?? Date.now();

  for (let offset = -window; offset <= window; offset++) {
    const testTime = baseTime + offset * timeStepSeconds * 1000;
    const generated = await generateTotpCode(secret, testTime, timeStepSeconds);
    if (generated === cleanToken) {
      return { valid: true, stepOffset: offset };
    }
  }

  return { valid: false, stepOffset: 0 };
}
