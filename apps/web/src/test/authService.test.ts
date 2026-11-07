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
  sendEmailVerification: vi.fn(),
}));

const mockDeleteMe = vi.fn();
vi.mock('../services/apiClient', () => ({
  apiClient: {
    deleteMe: () => mockDeleteMe(),
  },
}));

const mockClearAll = vi.fn();
vi.mock('../services/syncQueue', () => ({
  syncQueue: {
    clearAll: () => mockClearAll(),
  },
}));

let mockCurrentUser: any = null;
vi.mock('../services/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({
    get currentUser() {
      return mockCurrentUser;
    },
  })),
}));

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
  sendEmailVerification,
} from 'firebase/auth';
import {
  signInWithEmail,
  signUpWithEmail,
  deleteUserAccount,
  signOutUser,
  resendVerificationEmail,
  reloadCurrentUser,
} from '../services/auth';

describe('authService.signInWithEmail [AUTH-1]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = null;
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

describe('authService.deleteUserAccount [AUTH-2]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = { uid: 'user_123', email: 'delete@test.com' };
    mockDeleteMe.mockResolvedValue({ message: 'Deleted' });
    mockClearAll.mockResolvedValue(undefined);
    vi.mocked(deleteUser).mockResolvedValue(undefined);
  });

  it('throws error if user is not signed in', async () => {
    mockCurrentUser = null;
    await expect(deleteUserAccount()).rejects.toThrow(/please sign in to manage your account/i);
    expect(mockDeleteMe).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('cascades delete across backend API, local storage, syncQueue, and auth', async () => {
    const localSpy = vi.spyOn(Storage.prototype, 'clear');

    await deleteUserAccount();

    expect(mockDeleteMe).toHaveBeenCalledTimes(1);
    expect(mockClearAll).toHaveBeenCalledTimes(1);
    expect(localSpy).toHaveBeenCalled();
    expect(deleteUser).toHaveBeenCalledWith(mockCurrentUser);

    localSpy.mockRestore();
  });

  it('continues local and auth cleanup even if backend deleteMe fails', async () => {
    mockDeleteMe.mockRejectedValueOnce(new Error('Network error'));
    const localSpy = vi.spyOn(Storage.prototype, 'clear');

    await deleteUserAccount();

    expect(mockDeleteMe).toHaveBeenCalledTimes(1);
    expect(mockClearAll).toHaveBeenCalledTimes(1);
    expect(localSpy).toHaveBeenCalled();
    expect(deleteUser).toHaveBeenCalledWith(mockCurrentUser);

    localSpy.mockRestore();
  });

  it('throws user-friendly error when deleteUser fails due to recent login requirement', async () => {
    vi.mocked(deleteUser).mockRejectedValueOnce({ code: 'auth/requires-recent-login' });

    await expect(deleteUserAccount()).rejects.toThrow();
  });
});

describe('authService.signOutUser [AUTH-3]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClearAll.mockResolvedValue(undefined);
    vi.mocked(signOut).mockResolvedValue(undefined);
  });

  it('purges syncQueue, local storage, session storage, and calls Firebase signOut', async () => {
    const localSpy = vi.spyOn(Storage.prototype, 'clear');

    await signOutUser();

    expect(mockClearAll).toHaveBeenCalledTimes(1);
    expect(localSpy).toHaveBeenCalled();
    expect(signOut).toHaveBeenCalledTimes(1);

    localSpy.mockRestore();
  });
});

describe('authService email verification [AUTH-4]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers sendEmailVerification when signing up with email', async () => {
    const mockUser = { uid: 'user_123', email: 'new@example.com' };
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    await signUpWithEmail('new@example.com', 'validPass123');

    expect(createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
  });

  it('resends verification email to the current authenticated user', async () => {
    const mockUser = { uid: 'user_123', email: 'unverified@example.com', emailVerified: false };
    mockCurrentUser = mockUser;

    await resendVerificationEmail();

    expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
  });

  it('throws error when resending verification email without an active session', async () => {
    mockCurrentUser = null;
    await expect(resendVerificationEmail()).rejects.toThrow(/No authenticated user found/i);
  });

  it('reloads the current user and returns updated profile', async () => {
    const reloadMock = vi.fn().mockResolvedValue(undefined);
    mockCurrentUser = {
      uid: 'user_123',
      email: 'test@example.com',
      displayName: 'Test User',
      providerData: [{ providerId: 'password' }],
      metadata: { creationTime: '2026-01-01', lastSignInTime: '2026-01-02' },
      emailVerified: true,
      reload: reloadMock,
    };

    const updated = await reloadCurrentUser();

    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(updated?.emailVerified).toBe(true);
  });
});
