import { useState } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ALL_TRADES, TRADE_CATEGORIES } from "@/data/trades";

export function TradeSearchHero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);

  const filteredTrades = searchQuery.length > 0
    ? ALL_TRADES.filter((trade) =>
        trade.label.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const isTradeSupported = selectedTrade !== null;

  const handleSelectTrade = (tradeValue: string, tradeLabel: string) => {
    setSelectedTrade(tradeValue);
    setSearchQuery(tradeLabel);
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setSelectedTrade(null);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Check your trade"
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            className={cn(
              "pl-12 pr-4 h-12 text-base rounded-md border bg-card transition-colors",
              isTradeSupported 
                ? "border-green-500 focus-visible:ring-green-500/20" 
                : "border-border focus-visible:ring-accent/20"
            )}
          />
          {isTradeSupported && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-green-500">
              <Check className="h-5 w-5" />
              <span className="text-sm font-medium hidden sm:inline">Supported</span>
            </div>
          )}
        </div>

        {/* Dropdown Results */}
        {searchQuery.length > 0 && !isTradeSupported && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-md shadow-lg overflow-hidden z-50">
            {filteredTrades.length > 0 ? (
              <div className="py-2">
                {filteredTrades.map((trade) => (
                  <button
                    key={trade.value}
                    onClick={() => handleSelectTrade(trade.value, trade.label)}
                    className="w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-foreground font-medium">{trade.label}</span>
                      <span className="text-muted-foreground text-sm ml-2">({trade.category})</span>
                    </div>
                    <Check className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-muted-foreground text-sm">
                  No exact match, but Quotable works for <span className="text-accent font-medium">all trades</span>!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try the demo to see how it fits your business
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trade count badge */}
      <p className="text-center text-muted-foreground text-sm mt-4">
        <span className="text-accent font-semibold">{ALL_TRADES.length}+</span> trades supported across{" "}
        <span className="text-accent font-semibold">{TRADE_CATEGORIES.length}</span> categories
      </p>
    </div>
  );
}
