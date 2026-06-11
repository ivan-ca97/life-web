"use client";

import { format, parse, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  showTodayButton?: boolean;
}

export function DatePicker({ value, onChange, showTodayButton = false }: DatePickerProps) {
  const date = parse(value, "yyyy-MM-dd", new Date());
  const isToday = value === format(new Date(), "yyyy-MM-dd");

  function handleSelect(selected: Date | undefined) {
    if (!selected) return;
    onChange(format(selected, "yyyy-MM-dd"));
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-xs" onClick={() => onChange(format(subDays(date, 1), "yyyy-MM-dd"))}>
        <ChevronLeft className="size-4" />
      </Button>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" className="justify-start text-left font-normal" />}>
            <CalendarIcon className="mr-2 size-4" />
            {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }).replace(/^./, c => c.toUpperCase())}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            locale={es}
          />
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="icon-xs" onClick={() => onChange(format(addDays(date, 1), "yyyy-MM-dd"))}>
        <ChevronRight className="size-4" />
      </Button>
      {showTodayButton && !isToday && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(format(new Date(), "yyyy-MM-dd"))}
        >
          Hoy
        </Button>
      )}
    </div>
  );
}
