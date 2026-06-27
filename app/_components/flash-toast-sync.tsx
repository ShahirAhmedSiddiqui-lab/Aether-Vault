'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { consumeFlashToast } from '@/lib/client/flash-toast';

export function FlashToastSync() {
  React.useEffect(() => {
    const nextToast = consumeFlashToast();
    if (!nextToast) {
      return;
    }

    if (nextToast.type === 'error') {
      toast.error(nextToast.message);
      return;
    }

    if (nextToast.type === 'info') {
      toast(nextToast.message);
      return;
    }

    toast.success(nextToast.message);
  }, []);

  return null;
}
