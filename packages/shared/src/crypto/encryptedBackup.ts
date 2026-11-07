/**
 * Client-Side Passphrase-Encrypted Backup and Restore (DIFF-6)
 *
 * Privacy-First Architecture:
 * - All cryptographic operations execute 100% locally in the browser/client.
 * - PBKDF2 with SHA-256 and 100,000 iterations for key derivation.
 * - AES-GCM with 256-bit key and 12-byte initialization vector (IV) with authentication tag.
 * - The server never receives the passphrase or plaintext backup.
 */

export const PBKDF2_ITERATIONS = 100000;
export const SALT_LENGTH_BYTES = 16;
export const IV_LENGTH_BYTES = 12;
export const AES_KEY_LENGTH_BITS = 256;

export interface EncryptedBackupEnvelope {
  version: 1;
  algorithm: 'AES-GCM';
  kdf: 'PBKDF2';
  iterations: number;
  hash: 'SHA-256';
  salt: string; // Base64 encoded 16-byte random salt
  iv: string; // Base64 encoded 12-byte random IV
  ciphertext: string; // Base64 encoded AES-GCM ciphertext + auth tag
  createdAt: string; // ISO 8601
}

/**
 * Base64 encoding helper compatible with browser and Node environments
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof (globalThis as any).Buffer !== 'undefined') {
    return (globalThis as any).Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 decoding helper compatible with browser and Node environments
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof (globalThis as any).Buffer !== 'undefined') {
    return new Uint8Array((globalThis as any).Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getSubtleCrypto(): any {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    return crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle) {
    return (globalThis as any).crypto.subtle;
  }
  throw new Error('Web Crypto API (crypto.subtle) is not available in this environment.');
}

function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(bytes);
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.getRandomValues) {
    return (globalThis as any).crypto.getRandomValues(bytes);
  }
  throw new Error('Web Crypto API (crypto.getRandomValues) is not available in this environment.');
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a passphrase and salt using PBKDF2 (SHA-256)
 */
async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<any> {
  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);

  const baseKey = await subtle.importKey(
    'raw',
    passphraseBytes,
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH_BITS,
    },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypts a JSON backup string with a user passphrase using AES-GCM & PBKDF2
 */
export async function encryptBackup(
  jsonData: string,
  passphrase: string,
): Promise<EncryptedBackupEnvelope> {
  if (!passphrase || passphrase.length < 6) {
    throw new Error('Passphrase must be at least 6 characters long.');
  }

  const salt = getRandomBytes(SALT_LENGTH_BYTES);
  const iv = getRandomBytes(IV_LENGTH_BYTES);
  const key = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS);

  const subtle = getSubtleCrypto();
  const plaintextBytes = new TextEncoder().encode(jsonData);

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintextBytes,
  );

  return {
    version: 1,
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2',
    iterations: PBKDF2_ITERATIONS,
    hash: 'SHA-256',
    salt: uint8ArrayToBase64(salt),
    iv: uint8ArrayToBase64(iv),
    ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertextBuffer)),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Decrypts an encrypted backup envelope or raw string with the user passphrase
 */
export async function decryptBackup(
  input: EncryptedBackupEnvelope | string,
  passphrase: string,
): Promise<string> {
  if (!passphrase) {
    throw new Error('Passphrase is required to decrypt backup.');
  }

  let envelope: EncryptedBackupEnvelope;
  if (typeof input === 'string') {
    try {
      envelope = JSON.parse(input);
    } catch {
      throw new Error('Invalid encrypted backup file format: file is not valid JSON.');
    }
  } else {
    envelope = input;
  }

  // Validate envelope metadata
  if (
    !envelope ||
    envelope.version !== 1 ||
    envelope.algorithm !== 'AES-GCM' ||
    envelope.kdf !== 'PBKDF2' ||
    !envelope.salt ||
    !envelope.iv ||
    !envelope.ciphertext
  ) {
    throw new Error('Unsupported or corrupted encrypted backup envelope.');
  }

  try {
    const salt = base64ToUint8Array(envelope.salt);
    const iv = base64ToUint8Array(envelope.iv);
    const ciphertext = base64ToUint8Array(envelope.ciphertext);

    const key = await deriveKey(passphrase, salt, envelope.iterations || PBKDF2_ITERATIONS);
    const subtle = getSubtleCrypto();

    const decryptedBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext,
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err: unknown) {
    // If decryption fails, AES-GCM throws due to auth tag verification failure
    throw new Error('Incorrect passphrase or corrupted backup file.');
  }
}
