import { createContext } from 'react';
import type { UserProfile } from '../types';

export interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isDemoMode?: boolean;
  enterDemoMode?: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, turnstileToken?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<UserProfile | null>;
  reauthenticate: (password?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
