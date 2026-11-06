import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  deleteUser,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import { apiClient } from './apiClient';
import { syncQueue } from './syncQueue';
import { toUserFriendlyError } from '../lib/errorMessages';
import type { UserProfile } from '../types';

export function mapFirebaseUser(user: User): UserProfile {
  const isGoogle = user.providerData.some((p) => p.providerId === 'google.com');
  const hasPassword = user.providerData.some((p) => p.providerId === 'password');

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    authMethod: isGoogle ? 'Google' : 'Email/Password',
    createdAt: user.metadata.creationTime || '-',
    lastSignIn: user.metadata.lastSignInTime || '-',
    hasPassword,
  };
}

export function getCurrentUser(): User | null {
  return getFirebaseAuth().currentUser;
}

export function onAuthStateChange(
  callback: (profile: UserProfile | null) => void,
): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(mapFirebaseUser(user));
    } else {
      callback(null);
    }
  });
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const auth = getFirebaseAuth();

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };

    if (
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/wrong-password'
    ) {
      throw new Error('Incorrect email or password. Please double-check and try again.');
    } else if (err.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (err.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. For your security, please wait a moment and try again.');
    } else {
      throw new Error(toUserFriendlyError(err, 'Unable to sign in. Please try again.'));
    }
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  turnstileToken?: string,
): Promise<void> {
  const auth = getFirebaseAuth();

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Pre-flight spam protection & rate limiting check on backend POST /auth/register
  try {
    const apiBase =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
      'http://localhost:3000/api/v1';
    const baseUrl = apiBase.replace(/\/api\/v1\/?$/, '');
    const registerUrl = `${baseUrl}/auth/register`;

    const res = await fetch(registerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, turnstileToken }),
    });

    if (res.status === 429) {
      throw new Error('Too many registration attempts. Please wait a moment and try again.');
    }

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.error?.code === 'RATE_LIMIT_EXCEEDED') {
        throw new Error('Too many registration attempts. Please wait a moment and try again.');
      }
      if (data?.error?.message) {
        throw new Error(data.error.message);
      }
    }
  } catch (rateErr: unknown) {
    const msg = (rateErr as Error)?.message || '';
    if (msg.includes('registration attempts') || msg.includes('verification')) {
      throw rateErr;
    }
    // Network error or local offline mode: continue gracefully
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please sign in instead.');
    } else if (err.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (err.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 6 characters.');
    } else {
      throw new Error(toUserFriendlyError(err, 'Unable to create account. Please try again.'));
    }
  }
}

export async function signInWithGoogle(): Promise<void> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      return;
    } else if (err.code === 'auth/popup-blocked') {
      throw new Error('The sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
    } else if (err.code === 'auth/unauthorized-domain') {
      throw new Error('Google sign-in is not authorized for this domain yet. Please sign in using your email and password.');
    } else if (err.code === 'auth/operation-not-allowed') {
      throw new Error('Google sign-in is currently unavailable. Please sign in using your email and password.');
    } else if (err.code === 'auth/invalid-api-key') {
      throw new Error('The sign-in service is temporarily undergoing maintenance. Please try again later.');
    } else if (err.code === 'auth/network-request-failed') {
      throw new Error('Unable to connect to the sign-in service. Please check your internet connection and try again.');
    } else if (err.code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with this email using a different sign-in method.');
    } else {
      throw new Error(toUserFriendlyError(err, 'Google sign-in was unsuccessful. Please try again.'));
    }
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/user-not-found') {
      throw new Error('No account found with this email.');
    } else if (err.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else {
      throw new Error(toUserFriendlyError(err, 'Unable to send password reset email. Please try again.'));
    }
  }
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();

  try {
    await syncQueue.clearAll();
  } catch {
    // Non-blocking storage clear
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  } catch {
    // Non-blocking storage clear
  }

  await signOut(auth);
}

export async function updateUserDisplayName(displayName: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Please sign in to update your profile.');
  try {
    await updateProfile(user, { displayName });
  } catch (err: unknown) {
    throw new Error(toUserFriendlyError(err, 'Unable to update display name. Please try again.'));
  }
}

export async function updateUserPassword(newPassword: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Please sign in to update your password.');
  try {
    await updatePassword(user, newPassword);
  } catch (err: unknown) {
    throw new Error(toUserFriendlyError(err, 'Unable to update password. Please try again.'));
  }
}

export async function deleteUserAccount(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Please sign in to manage your account.');

  await apiClient.deleteMe().catch(() => {
    // If backend delete failed or user already wiped in DB, proceed with local and auth cleanup
  });

  try {
    await syncQueue.clearAll();
  } catch {
    // Non-blocking storage clear
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  } catch {
    // Non-blocking storage clear
  }

  try {
    await deleteUser(user);
  } catch (err: unknown) {
    throw new Error(toUserFriendlyError(err, 'Unable to delete account. Please try again.'));
  }
}
