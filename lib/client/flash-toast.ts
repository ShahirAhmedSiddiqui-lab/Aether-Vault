'use client';

export type FlashToastPayload = {
  message: string;
  type?: 'success' | 'error' | 'info';
};

const FLASH_TOAST_STORAGE_KEY = 'memora:flash-toast';

export function queueFlashToast(payload: FlashToastPayload) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(FLASH_TOAST_STORAGE_KEY, JSON.stringify(payload));
}

export function consumeFlashToast(): FlashToastPayload | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(FLASH_TOAST_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  window.sessionStorage.removeItem(FLASH_TOAST_STORAGE_KEY);

  try {
    const parsed = JSON.parse(raw) as FlashToastPayload;
    if (!parsed?.message) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
