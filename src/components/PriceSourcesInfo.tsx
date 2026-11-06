import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, RefreshCw, Info, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { SUPPLIER_DETAILS } from "@/data/supplierMappings";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface PriceSource {
  id: string;
  name: string;
  source_type: string;
  base_url: string | null;
  is_enabled: boolean;
  last_fetch_at: string | null;
  last_fetch_status: string | null;
  robots_txt_compliant: boolean;
  applicable_trades: string[] | null;
}

interface PriceSourcesInfoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PriceSourcesInfo = ({ open, onOpenChange }: PriceSourcesInfoProps) => {
  const { isAdmin } = useIsAdmin();
  const [sources, setSources] = useState<PriceSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (open) {
      loadPriceSources();
    }
  }, [open]);

  const loadPriceSources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('price_sources')
        .select('*')
        .eq('is_enabled', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error loading price sources:', error);
      toast.error("Failed to load price sources");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to refresh prices");
        return;
      }

      toast.info("Starting price refresh from all sources...");

      // Call the comprehensive refresh-prices-cron function
      const { data, error } = await supabase.functions.invoke('refresh-prices-cron', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      const summary = data?.summary;
      if (summary) {
        toast.success(`Price refresh complete: ${summary.succeeded} sources updated, ${summary.failed} failed`);
      } else {
        toast.success("Prices refreshed successfully");
      }
      
      await loadPriceSources();
    } catch (error) {
      console.error('Error refreshing prices:', error);
      toast.error("Failed to refresh prices");
    } finally {
      setRefreshing(false);
    }
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'merchant_feed':
        return 'Merchant Feed';
      case 'open_data':
        return 'Open Data';
      case 'api':
        return 'API';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Where Our Prices Come From
          </DialogTitle>
          <DialogDescription>
            Quotable uses data from trusted UK trade suppliers to provide accurate, up-to-date pricing for your quotes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Prices are updated regularly from approved sources
            </p>
            {/* Re-crawling the merchants is an admin job; prices refresh on a schedule */}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshPrices}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Prices
              </Button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => {
                const details = SUPPLIER_DETAILS[source.name];
                return (
                  <div
                    key={source.id}
                    className="flex items-start justify-between p-4 border border-border rounded-lg bg-card"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{details?.name || source.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {getSourceTypeLabel(source.source_type)}
                        </Badge>
                        {source.robots_txt_compliant && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Compliant
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {details?.description || 'Trade supplier'}
                      </p>
                      {source.last_fetch_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Last updated: {format(new Date(source.last_fetch_at), "dd MMM yyyy, HH:mm")}
                        </div>
                      )}
                    </div>
                    {source.base_url && (
                      <a
                        href={source.base_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">About Our Pricing Data</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Prices are indicative and may vary by location and supplier</li>
              <li>• All data is collected from publicly available sources</li>
              <li>• We respect robots.txt and supplier terms of service</li>
              <li>• Inventory items you add always take priority</li>
              <li>• Select preferred suppliers in Account Settings for better accuracy</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
