import { useState, useEffect } from "react";
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
import { Client } from "@/hooks/useClients";

interface ClientAutocompleteProps {
  clients: Client[];
  value: string;
  onValueChange: (value: string) => void;
  onClientSelect?: (client: Client | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ClientAutocomplete = ({
  clients,
  value,
  onValueChange,
  onClientSelect,
  placeholder = "Select or type client name...",
  disabled = false,
}: ClientAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const handleSelect = (client: Client) => {
    onValueChange(client.company_name);
    onClientSelect?.(client);
    setOpen(false);
  };

  const handleSearchChange = (search: string) => {
    setSearchValue(search);
    onValueChange(search);
    
    // If search doesn't match any client, clear selection
    const matchingClient = clients.find(
      c => c.company_name.toLowerCase() === search.toLowerCase()
    );
    if (!matchingClient) {
      onClientSelect?.(null);
    }
  };

  const selectedClient = clients.find(
    c => c.company_name.toLowerCase() === value.toLowerCase()
  );

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
          <span className={cn(
            "truncate",
            !value && "text-muted-foreground"
          )}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type new client..."
            value={searchValue}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>
              <div className="p-2 text-sm text-muted-foreground">
                Type to add "{searchValue}" as a new client
              </div>
            </CommandEmpty>
            <CommandGroup heading="Existing Clients">
              {clients
                .filter(client =>
                  client.company_name.toLowerCase().includes(searchValue.toLowerCase())
                )
                .map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.company_name}
                    onSelect={() => handleSelect(client)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{client.company_name}</div>
                      {client.contact_name && (
                        <div className="text-xs text-muted-foreground">
                          {client.contact_name}
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
};
