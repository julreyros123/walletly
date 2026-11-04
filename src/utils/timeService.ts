import { storage } from '@/utils/storage';
import { saveLocalAppState, loadLocalAppState } from '@/db/localRepository';

const HIGH_WATER_MARK_KEY = 'cbudget_time_high_water_mark';
const SERVER_OFFSET_KEY = 'cbudget_server_time_offset';

let cachedServerOffset: number | null = null;
let lastKnownHighWaterMark = 0;
let isInitialized = false;

export interface TimeCheckResult {
  isValid: boolean;
  todayISO: string;
  trustedTimestamp: number;
  isTampered: boolean;
  tamperReason: 'clock_set_backwards' | 'clock_set_forward' | null;
}

/**
 * Initializes and restores the monotonic high-water mark and server clock offset.
 */
export async function initTimeService(): Promise<void> {
  if (isInitialized) return;
  try {
    const storedHwm = (await loadLocalAppState(HIGH_WATER_MARK_KEY)) || (await storage.getItem(HIGH_WATER_MARK_KEY));
    if (storedHwm) {
      lastKnownHighWaterMark = Number(storedHwm) || 0;
    }
    const storedOffset = (await loadLocalAppState(SERVER_OFFSET_KEY)) || (await storage.getItem(SERVER_OFFSET_KEY));
    if (storedOffset !== null) {
      cachedServerOffset = Number(storedOffset);
    }
  } catch (e) {
    console.warn('[TimeService] Init warning:', e);
  }
  isInitialized = true;
}

/**
 * Queries Supabase/Cloudflare atomic server clock to compute authoritative network clock offset.
 * Runs in background without blocking UI.
 */
export async function syncServerTime(): Promise<number | null> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gvridjyyjcvdniwqyjnu.supabase.co';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(supabaseUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const dateHeader = res.headers.get('date');
    if (dateHeader) {
      const serverEpoch = new Date(dateHeader).getTime();
      if (!isNaN(serverEpoch) && serverEpoch > 0) {
        const localNow = Date.now();
        const offset = serverEpoch - localNow;
        cachedServerOffset = offset;
        await storage.setItem(SERVER_OFFSET_KEY, String(offset));
        await saveLocalAppState(SERVER_OFFSET_KEY, String(offset));
        await updateHighWaterMark(serverEpoch);
        return serverEpoch;
      }
    }
  } catch {
    // Offline or network error: quiet fallback to local/cached offset
  }
  return null;
}

/**
 * Updates the monotonic high-water mark. Device time must never go backwards behind this.
 */
export async function updateHighWaterMark(timestamp: number): Promise<void> {
  if (timestamp > lastKnownHighWaterMark) {
    lastKnownHighWaterMark = timestamp;
    await storage.setItem(HIGH_WATER_MARK_KEY, String(timestamp));
    await saveLocalAppState(HIGH_WATER_MARK_KEY, String(timestamp));
  }
}

/**
 * Inspects current time against monotonic high-water mark and trusted server time.
 * Detects time-travel clock manipulation forward or backward.
 */
export function getTrustedTime(): TimeCheckResult {
  const localNow = Date.now();
  const effectiveOffset = cachedServerOffset ?? 0;
  const trustedTimestamp = localNow + effectiveOffset;
  const d = new Date(trustedTimestamp);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const todayISO = `${year}-${month}-${day}`;

  // 1. Detect backward time manipulation (user rolled clock back)
  // Allow a 60-second window for standard NTP auto-adjustments
  if (lastKnownHighWaterMark > 0 && localNow < lastKnownHighWaterMark - 60000) {
    return {
      isValid: false,
      todayISO,
      trustedTimestamp,
      isTampered: true,
      tamperReason: 'clock_set_backwards',
    };
  }

  // 2. Detect forward time manipulation (if server time offset is known, device clock is ahead by > 15 mins)
  if (cachedServerOffset !== null && cachedServerOffset < -15 * 60 * 1000) {
    // Device clock is artificially ahead of server by more than 15 minutes
    const serverDate = new Date(localNow + cachedServerOffset);
    const sYear = serverDate.getFullYear();
    const sMonth = String(serverDate.getMonth() + 1).padStart(2, '0');
    const sDay = String(serverDate.getDate()).padStart(2, '0');
    const serverTodayISO = `${sYear}-${sMonth}-${sDay}`;

    return {
      isValid: false,
      todayISO: serverTodayISO,
      trustedTimestamp: localNow + cachedServerOffset,
      isTampered: true,
      tamperReason: 'clock_set_forward',
    };
  }

  return {
    isValid: true,
    todayISO,
    trustedTimestamp,
    isTampered: false,
    tamperReason: null,
  };
}

