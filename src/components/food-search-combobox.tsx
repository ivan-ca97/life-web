"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useFoods } from "@/lib/hooks/use-foods";
import type { Food } from "@/lib/types/food";

interface FoodSearchComboboxProps {
  onSelect: (food: Food) => void;
  excludeIds?: string[];
}

export function FoodSearchCombobox({ onSelect, excludeIds = [] }: FoodSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data } = useFoods({ q: search, limit: 20 });

  const foods = (data?.items ?? []).filter((f) => !excludeIds.includes(f.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" role="combobox" aria-expanded={open} className="justify-between w-full" />}>
          Buscar alimento...
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {foods.map((food) => (
                <CommandItem
                  key={food.id}
                  value={food.id}
                  onSelect={() => {
                    onSelect(food);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check className={cn("mr-2 size-4", "opacity-0")} />
                  <div className="flex-1 min-w-0">
                    <span>{food.name}</span>
                    {food.tags.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {food.tags.slice(0, 3).map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px] px-1 py-0">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
