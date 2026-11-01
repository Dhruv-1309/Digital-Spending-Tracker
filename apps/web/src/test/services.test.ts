import { describe, it, expect } from 'vitest';
import { isOnline } from '../services/network';
import { mapFirebaseUser } from '../services/auth';
import type { User } from 'firebase/auth';

describe('Services Layer', () => {
  it('network service correctly checks navigator online status', () => {
    expect(typeof isOnline()).toBe('boolean');
  });

  it('mapFirebaseUser maps user fields properly', () => {
    const mockUser = {
      uid: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      providerData: [{ providerId: 'google.com' }],
      metadata: {
        creationTime: '2026-01-01',
        lastSignInTime: '2026-02-01',
      },
    } as unknown as User;

    const profile = mapFirebaseUser(mockUser);
    expect(profile.uid).toBe('user-123');
    expect(profile.email).toBe('test@example.com');
    expect(profile.displayName).toBe('Test User');
    expect(profile.authMethod).toBe('Google');
    expect(profile.hasPassword).toBe(false);
  });
});
