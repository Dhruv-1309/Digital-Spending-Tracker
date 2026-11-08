import { describe, it, expect } from 'vitest';
import { toUserFriendlyError } from '../lib/errorMessages';
import { ApiError } from '../services/apiClient';

describe('toUserFriendlyError', () => {
  it('handles null, undefined, or empty inputs with fallback', () => {
    expect(toUserFriendlyError(null)).toBe('Something went wrong. Please try again.');
    expect(toUserFriendlyError(undefined, 'Custom fallback')).toBe('Custom fallback');
    expect(toUserFriendlyError('')).toBe('Something went wrong. Please try again.');
  });

  it('maps Firebase auth error codes to empathetic text without jargons and avoids user enumeration', () => {
    expect(toUserFriendlyError({ code: 'auth/invalid-credential' })).toBe(
      'Incorrect email or password. Please double-check and try again.',
    );
    expect(toUserFriendlyError({ code: 'auth/user-not-found' })).toBe(
      'Incorrect email or password. Please double-check and try again.',
    );
    expect(toUserFriendlyError({ code: 'auth/wrong-password' })).toBe(
      'Incorrect email or password. Please double-check and try again.',
    );
    expect(toUserFriendlyError({ code: 'auth/email-already-in-use' })).toBe(
      'An account with this email already exists. Please sign in instead.',
    );
    expect(toUserFriendlyError({ code: 'auth/too-many-requests' })).toBe(
      'Too many failed attempts. For your security, please wait a moment and try again.',
    );
    expect(toUserFriendlyError({ code: 'auth/requires-recent-login' })).toBe(
      'For security reasons, please sign out and sign back in to continue.',
    );
  });

  it('parses Firebase error strings wrapped in Error messages', () => {
    const error = new Error('Firebase: Error (auth/invalid-credential).');
    expect(toUserFriendlyError(error)).toBe(
      'Incorrect email or password. Please double-check and try again.',
    );

    const netError = new Error('Firebase: Error (auth/network-request-failed).');
    expect(toUserFriendlyError(netError)).toBe(
      'Unable to connect to the sign-in service. Please check your internet connection and try again.',
    );
  });

  it('maps HTTP status codes from ApiError without technical codes', () => {
    expect(toUserFriendlyError(new ApiError(401, 'UNAUTHORIZED', 'UNAUTHORIZED'))).toBe(
      'Your session has expired. Please sign in again to continue.',
    );
    expect(toUserFriendlyError(new ApiError(403, 'FORBIDDEN', 'Forbidden'))).toBe(
      'You do not have permission to perform this action.',
    );
    expect(toUserFriendlyError(new ApiError(404, 'NOT_FOUND', 'Not found'))).toBe(
      'The requested item could not be found.',
    );
    expect(
      toUserFriendlyError(new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Request failed with status 500')),
    ).toBe('Something went wrong on our end. Please try again in a few moments.');
  });

  it('sanitizes network and connection errors', () => {
    expect(toUserFriendlyError(new TypeError('Failed to fetch'))).toBe(
      'Unable to connect to the server. Please check your internet connection and try again.',
    );
    expect(toUserFriendlyError(new Error('NetworkError when attempting to fetch resource.'))).toBe(
      'Unable to connect to the server. Please check your internet connection and try again.',
    );
    expect(toUserFriendlyError(new Error('connect ECONNREFUSED 127.0.0.1:3000'))).toBe(
      'Unable to connect to the server. Please check your internet connection and try again.',
    );
  });

  it('sanitizes database and Prisma jargon', () => {
    expect(
      toUserFriendlyError(new Error('Invalid `prisma.transaction.findMany()` invocation: database error')),
    ).toBe('Something went wrong on our end. Please try again in a few moments.');
  });

  it('preserves clean, user-friendly messages', () => {
    expect(toUserFriendlyError('Please enter a valid amount greater than ₹0')).toBe(
      'Please enter a valid amount greater than ₹0',
    );
    expect(toUserFriendlyError(new Error('Please select a category'))).toBe(
      'Please select a category',
    );
  });
});
