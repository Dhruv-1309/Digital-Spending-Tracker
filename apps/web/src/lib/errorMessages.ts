/**
 * User-Friendly Error Mapper
 *
 * Converts technical exceptions, HTTP status codes, Firebase auth codes,
 * and database/network errors into empathetic, actionable, plain-English messages.
 * Prevents technical jargon (e.g. VALIDATION_ERROR, ECONNREFUSED, PrismaClient,
 * status 400/500, Failed to fetch) from leaking into the UI.
 */

export interface ErrorLike {
  name?: string;
  code?: string | number;
  statusCode?: number;
  status?: number;
  message?: string;
  details?: unknown;
}

const FIREBASE_AUTH_CODE_MAP: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password. Please double-check and try again.',
  'auth/user-not-found': 'Incorrect email or password. Please double-check and try again.',
  'auth/wrong-password': 'Incorrect email or password. Please double-check and try again.',
  'auth/email-already-in-use': 'An account with this email already exists. Please sign in instead.',
  'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many failed attempts. For your security, please wait a moment and try again.',
  'auth/requires-recent-login': 'For security reasons, please sign out and sign back in to continue.',
  'auth/popup-blocked': 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.',
  'auth/popup-closed-by-user': '',
  'auth/cancelled-popup-request': '',
  'auth/network-request-failed': 'Unable to connect to the sign-in service. Please check your internet connection and try again.',
  'auth/unauthorized-domain': 'Google sign-in is not authorized for this domain yet. Please sign in using your email and password.',
  'auth/operation-not-allowed': 'Google sign-in is currently unavailable. Please sign in using your email and password.',
  'auth/invalid-api-key': 'The sign-in service is temporarily undergoing maintenance. Please try again later.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
  'auth/id-token-expired': 'Your session has expired. Please sign in again.',
  'auth/user-disabled': 'This account has been disabled. Please contact support for help.',
};

const API_CODE_MAP: Record<string, string> = {
  UNAUTHORIZED: 'Your session has expired. Please sign in again to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested item could not be found.',
  TRANSACTION_NOT_FOUND: 'This transaction could not be found. It may have already been removed.',
  AUTOPAY_PLAN_NOT_FOUND: 'This autopay plan could not be found. It may have already been removed.',
  CATEGORY_NOT_FOUND: 'This category could not be found.',
  CATEGORY_ALREADY_EXISTS: 'A category with this name already exists.',
  CATEGORY_IN_USE: 'This category cannot be deleted because transactions or recurring plans are using it.',
  USER_NOT_FOUND: 'User profile could not be found.',
  RATE_LIMIT_EXCEEDED: 'You are doing that a bit too fast. Please wait a moment and try again.',
  INTERNAL_SERVER_ERROR: 'Something went wrong on our end. Please try again in a few moments.',
  VALIDATION_ERROR: 'Please check your entered details and try again.',
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
};

/**
 * Extracts a friendly user message from any thrown error, status code, or string.
 */
export function toUserFriendlyError(
  error: unknown,
  fallbackMessage: string = 'Something went wrong. Please try again.',
): string {
  if (!error) {
    return fallbackMessage;
  }

  // Handle plain string error
  if (typeof error === 'string') {
    return sanitizeStringMessage(error, fallbackMessage);
  }

  const err = error as ErrorLike;

  // 1. Check for known Firebase Auth code
  if (typeof err.code === 'string') {
    const cleanCode = err.code.trim();
    if (FIREBASE_AUTH_CODE_MAP[cleanCode] !== undefined) {
      return FIREBASE_AUTH_CODE_MAP[cleanCode];
    }
    if (API_CODE_MAP[cleanCode]) {
      return API_CODE_MAP[cleanCode];
    }
  }

  // 2. Check for Firebase error wrapped in message string: "Firebase: Error (auth/...)"
  if (err.message && typeof err.message === 'string') {
    const authCodeMatch = err.message.match(/\((auth\/[a-zA-Z0-9-]+)\)/);
    if (authCodeMatch && authCodeMatch[1]) {
      const code = authCodeMatch[1];
      if (FIREBASE_AUTH_CODE_MAP[code] !== undefined) {
        return FIREBASE_AUTH_CODE_MAP[code];
      }
    }
  }

  // 3. Check HTTP Status Code if present (e.g. ApiError)
  const status = Number(err.statusCode || err.status || 0);
  if (status > 0) {
    if (status === 401) {
      return 'Your session has expired. Please sign in again to continue.';
    }
    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (status === 404) {
      return 'The requested item could not be found.';
    }
    if (status === 409) {
      return 'This item already exists or conflicts with another record.';
    }
    if (status === 429) {
      return 'You are doing that a bit too fast. Please wait a moment and try again.';
    }
    if (status >= 500 && status <= 504) {
      return 'Something went wrong on our end. Please try again in a few moments.';
    }
  }

  // 4. Sanitize message string if present
  if (err.message && typeof err.message === 'string') {
    return sanitizeStringMessage(err.message, fallbackMessage);
  }

  return fallbackMessage;
}

/**
 * Checks whether a raw error message contains technical jargon, and replaces it with clear language.
 */
function sanitizeStringMessage(msg: string, fallback: string): string {
  const trimmed = msg.trim();
  if (!trimmed) return fallback;

  const lower = trimmed.toLowerCase();

  // Network / fetch errors
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    lower.includes('fetch failed') ||
    lower.includes('err_connection_refused') ||
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout') ||
    lower.includes('offline change limit')
  ) {
    if (lower.includes('offline change limit')) {
      return 'You have reached the limit for offline changes. Please connect to the internet to save your work.';
    }
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // Database / internal errors
  if (
    lower.includes('prisma') ||
    lower.includes('database error') ||
    lower.includes('internal server error') ||
    lower.includes('sql') ||
    lower.includes('request failed with status 5')
  ) {
    return 'Something went wrong on our end. Please try again in a few moments.';
  }

  // Raw HTTP status messages
  if (/^request failed with status \d{3}$/i.test(trimmed)) {
    return 'Something went wrong while communicating with the server. Please try again.';
  }

  // Technical token or validation codes
  if (trimmed === 'VALIDATION_ERROR' || trimmed === 'Validation error') {
    return 'Please check your entered details and try again.';
  }
  if (trimmed === 'UNAUTHORIZED') {
    return 'Your session has expired. Please sign in again to continue.';
  }

  // Strip generic "Error: " prefix
  const cleaned = trimmed.replace(/^Error:\s*/i, '');

  // If the cleaned message looks human-friendly (starts with a capital letter, does not contain code artifacts)
  if (/^[A-Z][a-zA-Z0-9\s.,'()\-₹]+$/.test(cleaned) && !cleaned.includes('{') && !cleaned.includes('}')) {
    return cleaned;
  }

  return cleaned || fallback;
}
