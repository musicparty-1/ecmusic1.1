import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * Returns a stable device ID persisted in localStorage.
 * Uses a lazy initializer so the value is available on the FIRST render,
 * eliminating the race condition where an early click would find deviceId === null.
 */
export const useDevice = (): string => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [deviceId] = useState<string>(() => {
    try {
      let id = localStorage.getItem('device_id');
      if (!id) {
        id = uuidv4();
        localStorage.setItem('device_id', id);
      }
      return id;
    } catch {
      // Fallback for environments where localStorage is unavailable (private mode)
      return uuidv4();
    }
  });

  return deviceId;
};
