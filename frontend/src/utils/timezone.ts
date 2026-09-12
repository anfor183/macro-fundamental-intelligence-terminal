export interface TimezoneOption {
  id: string;
  city: string;
  country: string;
  flag: string;
  abbr: string;
  offset: string;
  description: string;
  isDefault?: boolean;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  {
    id: 'Africa/Lagos',
    city: 'Lagos',
    country: 'Nigeria',
    flag: '🇳🇬',
    abbr: 'WAT',
    offset: 'UTC+1',
    description: 'West Africa Time (Platform Default)',
    isDefault: true,
  },
  {
    id: 'UTC',
    city: 'UTC / GMT',
    country: 'Global Standard',
    flag: '🌐',
    abbr: 'UTC',
    offset: 'UTC+0',
    description: 'Coordinated Universal Time / London Baseline',
  },
  {
    id: 'America/New_York',
    city: 'New York',
    country: 'United States',
    flag: '🇺🇸',
    abbr: 'ET',
    offset: 'UTC-4 / UTC-5',
    description: 'US Wall Street & Federal Reserve Sessions',
  },
  {
    id: 'Europe/London',
    city: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    abbr: 'LON',
    offset: 'UTC+1 / UTC+0',
    description: 'London FX Fixing & Bank of England',
  },
  {
    id: 'Europe/Frankfurt',
    city: 'Frankfurt',
    country: 'Germany',
    flag: '🇩🇪',
    abbr: 'CET',
    offset: 'UTC+2 / UTC+1',
    description: 'European Central Bank (ECB) Primary Desk',
  },
  {
    id: 'Asia/Tokyo',
    city: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    abbr: 'JST',
    offset: 'UTC+9',
    description: 'Asian Session / Bank of Japan Desk',
  },
  {
    id: 'Asia/Singapore',
    city: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    abbr: 'SGT',
    offset: 'UTC+8',
    description: 'Asia-Pacific Financial & Commodities Hub',
  },
  {
    id: 'Asia/Dubai',
    city: 'Dubai',
    country: 'UAE',
    flag: '🇦🇪',
    abbr: 'GST',
    offset: 'UTC+4',
    description: 'Middle East Energy & Financial Session',
  },
  {
    id: 'Australia/Sydney',
    city: 'Sydney',
    country: 'Australia',
    flag: '🇦🇺',
    abbr: 'AEST',
    offset: 'UTC+10',
    description: 'Asia-Pacific Early Open Session',
  },
];

export const DEFAULT_TIMEZONE = 'Africa/Lagos';

const STORAGE_KEY = 'macro_terminal_timezone';

export function getSavedTimezone(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TIMEZONE_OPTIONS.some((t) => t.id === saved)) {
      return saved;
    }
  } catch {
    // Fallback if localStorage unavailable
  }
  return DEFAULT_TIMEZONE;
}

export function saveTimezone(tz: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, tz);
  } catch {
    // Ignore storage errors
  }
}

export function getTimezoneOption(tzId: string = DEFAULT_TIMEZONE): TimezoneOption {
  return TIMEZONE_OPTIONS.find((t) => t.id === tzId) || TIMEZONE_OPTIONS[0];
}

/**
 * Format a Date or timestamp string into the specified timezone.
 * Example for Lagos: "16:05 WAT" or "04:05 PM WAT"
 */
export function formatTime(
  dateInput: string | number | Date | null | undefined,
  tzId: string = DEFAULT_TIMEZONE,
  includeSeconds: boolean = false
): string {
  if (!dateInput) return '--:--';
  const d = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '--:--';

  const tz = getTimezoneOption(tzId);
  try {
    const formatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz.id,
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: false,
    }).format(d);
    return `${formatted} ${tz.abbr}`;
  } catch {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Format a Date or timestamp into a full date-time string.
 * Example for Lagos: "Sep 12, 2026, 03:45 WAT"
 */
export function formatDateTime(
  dateInput: string | number | Date | null | undefined,
  tzId: string = DEFAULT_TIMEZONE,
  includeYear: boolean = true
): string {
  if (!dateInput) return '—';
  const d = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  const tz = getTimezoneOption(tzId);
  try {
    const dateFormatted = new Intl.DateTimeFormat('en-US', {
      timeZone: tz.id,
      month: 'short',
      day: 'numeric',
      year: includeYear ? 'numeric' : undefined,
    }).format(d);

    const timeFormatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz.id,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);

    return `${dateFormatted}, ${timeFormatted} ${tz.abbr}`;
  } catch {
    return d.toLocaleString();
  }
}

/**
 * Dynamic human-readable relative time (e.g. "12m ago", "2h ago", "3d ago")
 */
export function formatRelativeTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) {
    const absDiff = Math.abs(diffMs);
    const m = Math.floor(absDiff / 60000);
    if (m < 60) return `in ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `in ${h}h`;
    return `in ${Math.floor(h / 24)}d`;
  }

  const s = Math.floor(diffMs / 1000);
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

/**
 * Live clock readout in chosen timezone e.g. "03:45:12 PM"
 */
export function getCurrentClock(tzId: string = DEFAULT_TIMEZONE): string {
  const tz = getTimezoneOption(tzId);
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz.id,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date());
  } catch {
    return new Date().toLocaleTimeString();
  }
}
