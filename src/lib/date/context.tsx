"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { format } from "date-fns";

interface DateContextValue {
  date: string;
  setDate: (date: string) => void;
  isToday: boolean;
  goToToday: () => void;
}

const DateContext = createContext<DateContextValue | null>(null);

function getToday(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function DateProvider({ children }: { children: ReactNode }) {
  const [date, setDate] = useState(getToday);

  const goToToday = useCallback(() => {
    setDate(getToday());
  }, []);

  const value = useMemo(
    () => ({
      date,
      setDate,
      isToday: date === getToday(),
      goToToday,
    }),
    [date, goToToday]
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
