'use client';

export type AuthLinkEventType = 'password_reset_completed' | 'email_confirmed';

export type AuthLinkEventPayload = {
  type: AuthLinkEventType;
  message: string;
  issuedAt: number;
};

const AUTH_LINK_EVENT_STORAGE_KEY = 'memora:auth-link-event';

export function broadcastAuthLinkEvent(payload: AuthLinkEventPayload) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_LINK_EVENT_STORAGE_KEY, JSON.stringify(payload));
}

export function subscribeToAuthLinkEvents(
  callback: (payload: AuthLinkEventPayload) => void
) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== AUTH_LINK_EVENT_STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      const payload = JSON.parse(event.newValue) as AuthLinkEventPayload;
      if (!payload?.type || !payload?.message) {
        return;
      }

      callback(payload);
    } catch {
      // Ignore malformed storage payloads.
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('storage', handleStorage);
  };
}
