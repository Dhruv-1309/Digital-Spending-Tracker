import { describe, it, expect } from 'vitest';
import {
  encryptBackup,
  decryptBackup,
  uint8ArrayToBase64,
  base64ToUint8Array,
  PBKDF2_ITERATIONS,
  type EncryptedBackupEnvelope,
} from '../src/crypto/encryptedBackup.js';

describe('Passphrase-Encrypted Backup and Restore via Web Crypto (DIFF-6)', () => {
  const sampleBackupJson = JSON.stringify({
    version: 1,
    exportedAt: '2026-11-07T12:00:00Z',
    transactions: [
      {
        id: 'tx_1',
        amount: 1450,
        type: 'expense',
        category: 'Food & Dining',
        date: '2026-11-05',
        description: 'Team Dinner',
      },
      {
        id: 'tx_2',
        amount: 75000,
        type: 'income',
        category: 'Salary',
        date: '2026-11-01',
      },
    ],
    autopays: [
      {
        id: 'ap_1',
        name: 'Internet Fiber',
        amount: 999,
        day: 15,
        type: 'expense',
      },
    ],
    budgetGoal: {
      monthlyExpenseLimit: 40000,
      thresholdPercent: 80,
    },
  });

  const validPassphrase = 'CorrectHorseBatteryStaple#2026';

  it('uses 100,000 PBKDF2 iterations for key derivation', () => {
    expect(PBKDF2_ITERATIONS).toBe(100000);
  });

  it('encodes and decodes base64 byte arrays losslessly', () => {
    const original = new Uint8Array([0, 1, 15, 255, 128, 64, 32, 16, 8, 4, 2]);
    const b64 = uint8ArrayToBase64(original);
    const decoded = base64ToUint8Array(b64);
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  it('successfully encrypts and decrypts backup with exact plaintext recovery', async () => {
    const envelope = await encryptBackup(sampleBackupJson, validPassphrase);

    expect(envelope.version).toBe(1);
    expect(envelope.algorithm).toBe('AES-GCM');
    expect(envelope.kdf).toBe('PBKDF2');
    expect(envelope.iterations).toBe(100000);
    expect(envelope.hash).toBe('SHA-256');
    expect(envelope.salt).toBeTruthy();
    expect(envelope.iv).toBeTruthy();
    expect(envelope.ciphertext).toBeTruthy();

    // Ciphertext must not contain plaintext substrings
    expect(envelope.ciphertext).not.toContain('Team Dinner');
    expect(envelope.ciphertext).not.toContain('Food & Dining');

    // Decrypt with correct passphrase
    const decryptedJson = await decryptBackup(envelope, validPassphrase);
    expect(decryptedJson).toBe(sampleBackupJson);

    const parsed = JSON.parse(decryptedJson);
    expect(parsed.transactions.length).toBe(2);
    expect(parsed.transactions[0].description).toBe('Team Dinner');
  });

  it('successfully decrypts from a serialized envelope JSON string', async () => {
    const envelope = await encryptBackup(sampleBackupJson, validPassphrase);
    const envelopeString = JSON.stringify(envelope);

    const decrypted = await decryptBackup(envelopeString, validPassphrase);
    expect(decrypted).toBe(sampleBackupJson);
  });

  it('rejects decryption with incorrect passphrase', async () => {
    const envelope = await encryptBackup(sampleBackupJson, validPassphrase);

    await expect(decryptBackup(envelope, 'WrongPassword123!')).rejects.toThrow(
      'Incorrect passphrase or corrupted backup file.',
    );
  });

  it('rejects decryption when ciphertext has been tampered with or corrupted', async () => {
    const envelope = await encryptBackup(sampleBackupJson, validPassphrase);

    // Tamper with ciphertext bytes
    const bytes = base64ToUint8Array(envelope.ciphertext);
    bytes[5] ^= 0xff; // Flip bits
    const corruptedEnvelope: EncryptedBackupEnvelope = {
      ...envelope,
      ciphertext: uint8ArrayToBase64(bytes),
    };

    await expect(decryptBackup(corruptedEnvelope, validPassphrase)).rejects.toThrow(
      'Incorrect passphrase or corrupted backup file.',
    );
  });

  it('enforces minimum passphrase length of 6 characters on encryption', async () => {
    await expect(encryptBackup(sampleBackupJson, 'short')).rejects.toThrow(
      'Passphrase must be at least 6 characters long.',
    );
  });

  it('rejects empty passphrase on decryption', async () => {
    const envelope = await encryptBackup(sampleBackupJson, validPassphrase);
    await expect(decryptBackup(envelope, '')).rejects.toThrow(
      'Passphrase is required to decrypt backup.',
    );
  });

  it('rejects invalid or non-JSON envelope strings', async () => {
    await expect(decryptBackup('{ not a valid json', validPassphrase)).rejects.toThrow(
      'Invalid encrypted backup file format',
    );
  });

  it('rejects envelope missing required fields or having unsupported algorithm', async () => {
    const invalidEnvelope: any = {
      version: 2, // Unsupported version
      algorithm: 'DES',
      salt: 'abc',
    };

    await expect(decryptBackup(invalidEnvelope, validPassphrase)).rejects.toThrow(
      'Unsupported or corrupted encrypted backup envelope.',
    );
  });
});
