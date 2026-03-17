import { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { usePlayerSearch } from "@/lib/hooks/usePlayers";
import { getFlag } from "@/lib/countryFlags";

interface PlayerCompareSearchProps {
  onSelect: (playerId: string) => void;
  selectedPlayerId?: string;
  placeholder?: string;
  excludeId?: string;
}

export function PlayerCompareSearch({ 
  onSelect, 
  selectedPlayerId, 
  placeholder = "Search player...",
  excludeId 
}: PlayerCompareSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: players, isLoading } = usePlayerSearch(search);

  const selectedPlayer = players?.find((p) => p.id === selectedPlayerId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 border-border/50 hover:border-primary/50 transition-colors"
        >
          {selectedPlayer ? (
            <div className="flex items-center gap-2">
              <span className="text-xl">{getFlag(selectedPlayer.country)}</span>
              <span className="font-semibold">{selectedPlayer.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Type a name..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : (
                "No player found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {players?.filter(p => p.id !== excludeId).map((player) => (
                <CommandItem
                  key={player.id}
                  value={player.id}
                  onSelect={() => {
                    onSelect(player.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 py-3"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedPlayerId === player.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 font-medium">
                      <span>{getFlag(player.country)}</span>
                      <span>{player.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{player.country}</span>
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
