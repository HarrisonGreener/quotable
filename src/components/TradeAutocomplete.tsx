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
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TRADE_CATEGORIES, ALL_TRADES } from "@/data/trades";

interface TradeAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TradeAutocomplete({
  value,
  onValueChange,
  placeholder = "Select your trade...",
  disabled = false,
}: TradeAutocompleteProps) {
  const [open, setOpen] = useState(false);

  const selectedTrade = ALL_TRADES.find((trade) => trade.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedTrade ? selectedTrade.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search trades..." />
          <CommandEmpty>No trade found.</CommandEmpty>
          <div className="max-h-[300px] overflow-y-auto">
            {TRADE_CATEGORIES.map((category) => (
              <CommandGroup key={category.name} heading={category.name}>
                {category.trades.map((trade) => (
                  <CommandItem
                    key={trade.value}
                    value={trade.label}
                    onSelect={() => {
                      onValueChange(trade.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === trade.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {trade.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
