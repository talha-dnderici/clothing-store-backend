export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface StoredSession {
  token: string;
  user: StoredUser;
}

const sessionStorageKey = 'clothing-store-session';

export function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(sessionStorageKey);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredSession;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: StoredSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(sessionStorageKey);
}
