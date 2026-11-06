import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
  deleteUser: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('../services/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({})),
}));

import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { signInWithEmail } from '../services/auth';

describe('authService.signInWithEmail [AUTH-1]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects on auth/invalid-credential without calling createUserWithEmailAndPassword', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce({
      code: 'auth/invalid-credential',
    });

    await expect(signInWithEmail('test@example.com', 'wrongpassword')).rejects.toThrow(
      /incorrect email or password/i,
    );

    // CRITICAL: Must NEVER silently create account on mistyped credentials
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('rejects on auth/user-not-found without calling createUserWithEmailAndPassword', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce({
      code: 'auth/user-not-found',
    });

    await expect(signInWithEmail('nonexistent@example.com', 'password123')).rejects.toThrow(
      /incorrect email or password/i,
    );

    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('resolves cleanly when signInWithEmailAndPassword succeeds', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({} as any);

    await expect(signInWithEmail('valid@example.com', 'correctpass')).resolves.toBeUndefined();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });
});
