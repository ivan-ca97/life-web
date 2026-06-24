"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { todayAr } from "@/lib/datetime";

interface DateContextValue {
  date: string;
  setDate: (date: string) => void;
  isToday: boolean;
  goToToday: () => void;
}

const DateContext = createContext<DateContextValue | null>(null);

const STORAGE_KEY = "life_selected_date";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function getToday(): string {
  return todayAr();
}

function getInitialDate(): string {
  if (typeof window === "undefined") return getToday();
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored && DATE_RE.test(stored)) return stored;
  return getToday();
}

export function DateProvider({ children }: { children: ReactNode }) {
  const [date, setDateRaw] = useState(getInitialDate);

  const setDate = useCallback((d: string) => {
    setDateRaw(d);
    try { sessionStorage.setItem(STORAGE_KEY, d); } catch {}
  }, []);

  const goToToday = useCallback(() => {
    const today = getToday();
    setDateRaw(today);
    try { sessionStorage.setItem(STORAGE_KEY, today); } catch {}
  }, []);

  const value = useMemo(
    () => ({
      date,
      setDate,
      isToday: date === getToday(),
      goToToday,
    }),
    [date, setDate, goToToday]
  );

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
}

export function useDate(): DateContextValue {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error("useDate must be used within a DateProvider");
  }
  return context;
}
