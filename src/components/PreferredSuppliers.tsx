import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Info, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { getRecommendedSuppliers, SUPPLIER_DETAILS } from "@/data/supplierMappings";
import { PriceSourcesInfo } from "./PriceSourcesInfo";

interface PriceSource {
  id: string;
  name: string;
  base_url: string | null;
  applicable_trades: string[] | null;
}

interface PreferredSuppliersProps {
  primaryTrade: string;
  preferredSuppliers: string[];
  onPreferredSuppliersChange: (suppliers: string[]) => void;
  disabled?: boolean;
}

export const PreferredSuppliers = ({
  primaryTrade,
  preferredSuppliers,
  onPreferredSuppliersChange,
  disabled = false,
}: PreferredSuppliersProps) => {
  const [availableSources, setAvailableSources] = useState<PriceSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPriceSourcesInfo, setShowPriceSourcesInfo] = useState(false);

  useEffect(() => {
    loadPriceSources();
  }, []);

  const loadPriceSources = async () => {
    try {
      const { data, error } = await supabase
        .from('price_sources')
        .select('id, name, base_url, applicable_trades')
        .eq('is_enabled', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      setAvailableSources(data || []);
    } catch (error) {
      console.error('Error loading price sources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get recommended suppliers for the user's trade
  const recommendedSupplierNames = primaryTrade 
    ? getRecommendedSuppliers(primaryTrade)
    : getRecommendedSuppliers('default');

  // Filter available sources to show recommended ones first
  const sortedSources = [...availableSources].sort((a, b) => {
    const aRecommended = recommendedSupplierNames.includes(a.name);
    const bRecommended = recommendedSupplierNames.includes(b.name);
    if (aRecommended && !bRecommended) return -1;
    if (!aRecommended && bRecommended) return 1;
    return 0;
  });

  const handleToggleSupplier = (supplierName: string) => {
    if (preferredSuppliers.includes(supplierName)) {
      onPreferredSuppliersChange(preferredSuppliers.filter(s => s !== supplierName));
    } else {
      onPreferredSuppliersChange([...preferredSuppliers, supplierName]);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-smooth">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Store className="h-5 w-5" />
            Preferred Suppliers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-smooth">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Store className="h-5 w-5" />
            Preferred Suppliers
          </CardTitle>
          <CardDescription className="flex items-start gap-2">
            <span>
              Select your preferred suppliers for more accurate pricing. 
              {primaryTrade && (
                <> Recommended suppliers for <strong>{primaryTrade.replace(/-/g, ' ')}</strong> are highlighted.</>
              )}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0 mt-0.5" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>When generating quotes, prices from your preferred suppliers will be checked first. This helps ensure accurate pricing based on where you actually buy materials.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {sortedSources.map((source) => {
              const details = SUPPLIER_DETAILS[source.name];
              const isRecommended = recommendedSupplierNames.includes(source.name);
              const isSelected = preferredSuppliers.includes(source.name);

              return (
                <div
                  key={source.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  } ${disabled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`supplier-${source.id}`}
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSupplier(source.name)}
                      disabled={disabled}
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`supplier-${source.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {details?.name || source.name}
                        </Label>
                        {isRecommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {details?.description || 'Trade supplier'}
                      </p>
                    </div>
                  </div>
                  {source.base_url && (
                    <a
                      href={source.base_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border">
            <Button
              variant="link"
              className="p-0 h-auto text-sm"
              onClick={() => setShowPriceSourcesInfo(true)}
            >
              <Info className="h-4 w-4 mr-1" />
              Where do prices come from?
            </Button>
          </div>
        </CardContent>
      </Card>

      <PriceSourcesInfo 
        open={showPriceSourcesInfo} 
        onOpenChange={setShowPriceSourcesInfo} 
      />
    </>
  );
};
