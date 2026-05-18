'use client';

const UMAMI_MAX_EVENT_DATA_STRING_LENGTH = 500;

type UmamiEventDataValue = string | number | boolean | null | undefined;
type UmamiEventData = Record<string, UmamiEventDataValue>;

interface UmamiClient {
  track: (eventName?: string, data?: Record<string, string | number | boolean | null>) => void;
}

declare global {
  interface Window {
    umami?: UmamiClient;
  }
}

function sanitizeUmamiEventData(
  data: UmamiEventData,
): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return [key, value.slice(0, UMAMI_MAX_EVENT_DATA_STRING_LENGTH)];
        }
        return [key, value ?? null];
      }),
  );
}

export function trackUmamiEvent(eventName: string, data: UmamiEventData = {}): void {
  if (typeof window === 'undefined') return;

  window.umami?.track(eventName, sanitizeUmamiEventData(data));
}
