import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DEFAULT_TIMEZONE,
  TIMEZONE_OPTIONS,
  TimezoneOption,
  getSavedTimezone,
  saveTimezone,
  getTimezoneOption,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  getCurrentClock,
} from '../utils/timezone';

interface TimezoneContextType {
  timezone: string;
  setTimezone: (tz: string) => void;
  activeOption: TimezoneOption;
  availableOptions: TimezoneOption[];
  formatTime: (dateInput: string | number | Date | null | undefined, includeSeconds?: boolean) => string;
  formatDateTime: (dateInput: string | number | Date | null | undefined, includeYear?: boolean) => string;
  formatRelativeTime: (dateInput: string | number | Date | null | undefined) => string;
  currentClock: string;
}

const TimezoneContext = createContext<TimezoneContextType | null>(null);

export const TimezoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timezone, setTimezoneState] = useState<string>(() => getSavedTimezone());
  const [currentClock, setCurrentClock] = useState<string>(() => getCurrentClock(timezone));

  const setTimezone = (tz: string) => {
    setTimezoneState(tz);
    saveTimezone(tz);
    setCurrentClock(getCurrentClock(tz));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClock(getCurrentClock(timezone));
    }, 1000);
    return () => clearInterval(timer);
  }, [timezone]);

  const activeOption = getTimezoneOption(timezone);

  const value: TimezoneContextType = {
    timezone,
    setTimezone,
    activeOption,
    availableOptions: TIMEZONE_OPTIONS,
    formatTime: (date, sec) => formatTime(date, timezone, sec),
    formatDateTime: (date, yr) => formatDateTime(date, timezone, yr),
    formatRelativeTime,
    currentClock,
  };

  return <TimezoneContext.Provider value={value}>{children}</TimezoneContext.Provider>;
};

export const useTimezone = (): TimezoneContextType => {
  const ctx = useContext(TimezoneContext);
  if (!ctx) {
    // Graceful fallback if called outside provider
    const tz = DEFAULT_TIMEZONE;
    return {
      timezone: tz,
      setTimezone: () => {},
      activeOption: getTimezoneOption(tz),
      availableOptions: TIMEZONE_OPTIONS,
      formatTime: (d, s) => formatTime(d, tz, s),
      formatDateTime: (d, y) => formatDateTime(d, tz, y),
      formatRelativeTime,
      currentClock: getCurrentClock(tz),
    };
  }
  return ctx;
};
