import { Info, AlertTriangle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PriceSourceLegendProps {
  estimatedCount?: number;
  lowConfidenceCount?: number;
}

export const PriceSourceLegend = ({ estimatedCount = 0, lowConfidenceCount = 0 }: PriceSourceLegendProps) => {
  const needsAttention = estimatedCount > 0 || lowConfidenceCount > 0;
  
  return (
    <div className="space-y-3">
      {needsAttention && (
        <Alert variant="default" className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>{estimatedCount + lowConfidenceCount} item{estimatedCount + lowConfidenceCount !== 1 ? 's' : ''} need{estimatedCount + lowConfidenceCount === 1 ? 's' : ''} price verification.</strong>
            <span className="block text-sm mt-1">
              Prices marked with 🔴 or "Estimate" are AI estimates - verify or adjust before sending to clients.
            </span>
          </AlertDescription>
        </Alert>
      )}
      
      <Collapsible className="mt-2">
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Info className="h-4 w-4" />
          <span>What do the price badges mean?</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 p-4 rounded-lg bg-muted/50 space-y-3 text-sm">
          <h4 className="font-medium">Price Accuracy Guide</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                📦 Inventory
              </span>
              <span className="text-muted-foreground">Your saved price - 100% accurate to your costs</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                🟢 Verified
              </span>
              <span className="text-muted-foreground">Live supplier price (≥85% match) - highly accurate</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                🟡 Market Rate
              </span>
              <span className="text-muted-foreground">Based on similar products (70-84% match) - review recommended</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                🔴 Estimate
              </span>
              <span className="text-muted-foreground"><strong>AI estimate</strong> - no supplier match found, verify before quoting</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                ✏️ Manual
              </span>
              <span className="text-muted-foreground">You entered this price - accurate to your input</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            <strong>Tip:</strong> Click any badge to search for the product on the supplier website. Items with 🔴 should be verified - enter your actual cost to improve accuracy.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};