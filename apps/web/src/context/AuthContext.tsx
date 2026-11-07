import React, { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../types';
import { AuthContext } from './authContextDef';
import { logger } from '../lib/logger';
import {
  onAuthStateChange,
  signInWithEmail as apiSignInWithEmail,
  signUpWithEmail as apiSignUpWithEmail,
  signInWithGoogle as apiSignInWithGoogle,
  sendPasswordReset as apiSendPasswordReset,
  signOutUser as apiSignOutUser,
  updateUserDisplayName as apiUpdateDisplayName,
  updateUserPassword as apiUpdatePassword,
  deleteUserAccount as apiDeleteAccount,
  resendVerificationEmail as apiResendVerificationEmail,
  reloadCurrentUser as apiReloadCurrentUser,
  reauthenticateCurrentUser as apiReauthenticateCurrentUser,
} from '../services/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const e2eUser = window.localStorage.getItem('e2e_mock_user');
      if (e2eUser) {
        try {
          setUser(JSON.parse(e2eUser));
          setLoading(false);
          return;
        } catch (err: unknown) {
          logger.warn('Failed to parse e2e_mock_user from localStorage', err, { action: 'initE2EMockUser' });
        }
      }
    }

    const unsubscribe = onAuthStateChange((profile) => {
      setUser(profile);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    await apiSignInWithEmail(email, pass);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, pass: string, turnstileToken?: string) => {
    await apiSignUpWithEmail(email, pass, turnstileToken);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await apiSignInWithGoogle();
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await apiSendPasswordReset(email);
  }, []);

  const signOut = useCallback(async () => {
    await apiSignOutUser();
    setUser(null);
  }, []);

  const updateDisplayName = useCallback(async (name: string) => {
    await apiUpdateDisplayName(name);
    setUser((prev) => (prev ? { ...prev, displayName: name } : null));
  }, []);

  const updatePassword = useCallback(async (newPass: string) => {
    await apiUpdatePassword(newPass);
    setUser((prev) => (prev ? { ...prev, hasPassword: true } : null));
  }, []);

  const deleteAccount = useCallback(async () => {
    await apiDeleteAccount();
    setUser(null);
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    await apiResendVerificationEmail();
  }, []);

  const reloadUser = useCallback(async () => {
    const refreshed = await apiReloadCurrentUser();
    setUser(refreshed);
    return refreshed;
  }, []);

  const reauthenticate = useCallback(async (password?: string) => {
    await apiReauthenticateCurrentUser(password);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        signOut,
        updateDisplayName,
        updatePassword,
        deleteAccount,
        resendVerificationEmail,
        reloadUser,
        reauthenticate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
