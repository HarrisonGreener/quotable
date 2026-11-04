import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Database, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CrawlResult {
  source: string;
  status: 'success' | 'error';
  error?: string;
}

interface PricingStats {
  totalProducts: number;
  highConfidence: number;
  recentlyUpdated: number;
  verifiedPercent: number;
}

export const PricingCrawlPanel = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<CrawlResult[]>([]);
  const [stats, setStats] = useState<PricingStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const { data, error } = await supabase
        .from('market_prices')
        .select('confidence_score, last_updated', { count: 'exact' });

      if (error) throw error;

      const total = data?.length || 0;
      const highConf = data?.filter(p => (p.confidence_score || 0) >= 0.85).length || 0;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent = data?.filter(p => p.last_updated && new Date(p.last_updated) >= sevenDaysAgo).length || 0;

      setStats({
        totalProducts: total,
        highConfidence: highConf,
        recentlyUpdated: recent,
        verifiedPercent: total > 0 ? Math.round((highConf / total) * 100) : 0
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const runFullRefresh = async () => {
    setIsRefreshing(true);
    setProgress(0);
    setResults([]);

    try {
      toast.info('Starting full price refresh...');
      setProgress(10);

      const { data, error } = await supabase.functions.invoke('refresh-prices-cron', {
        body: {}
      });

      if (error) throw error;

      setProgress(100);
      setResults(data?.results || []);

      const successCount = data?.summary?.succeeded || 0;
      const failedCount = data?.summary?.failed || 0;

      if (failedCount === 0) {
        toast.success(`Refresh complete: ${successCount} sources updated`);
      } else {
        toast.warning(`Refresh done: ${successCount} succeeded, ${failedCount} failed`);
      }

      await fetchStats();
    } catch (err) {
      console.error('Refresh error:', err);
      toast.error('Refresh failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const runCatalogueCrawl = async () => {
    setIsCrawling(true);
    setProgress(0);
    setResults([]);

    try {
      toast.info('Starting supplier catalogue crawl...');
      setProgress(20);

      const { data, error } = await supabase.functions.invoke('crawl-supplier-catalogue', {
        body: {}
      });

      if (error) throw error;

      setProgress(100);

      const saved = data?.products_saved || 0;
      const pages = data?.pages_crawled || 0;
      const suppliers = data?.suppliers_crawled || 0;

      toast.success(`Crawl complete: ${saved} products saved from ${pages} pages across ${suppliers} suppliers`);

      await fetchStats();
    } catch (err) {
      console.error('Crawl error:', err);
      toast.error('Crawl failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Pricing Engine Control Panel
        </CardTitle>
        <CardDescription>
          Refresh market prices and crawl supplier catalogues to expand the product matching pool
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{loadingStats ? '...' : (stats?.totalProducts || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Products</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600">{loadingStats ? '...' : (stats?.highConfidence || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">High Confidence</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{loadingStats ? '...' : (stats?.recentlyUpdated || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Updated (7d)</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{loadingStats ? '...' : `${stats?.verifiedPercent || 0}%`}</div>
            <div className="text-xs text-muted-foreground">Verified Rate</div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loadingStats}>
          {loadingStats ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh Stats
        </Button>

        {/* Progress */}
        {(isRefreshing || isCrawling) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{isRefreshing ? 'Refreshing prices...' : 'Crawling catalogues...'}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={runFullRefresh} disabled={isRefreshing || isCrawling}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Full Price Refresh
          </Button>
          <Button variant="secondary" onClick={runCatalogueCrawl} disabled={isRefreshing || isCrawling}>
            {isCrawling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
            Deep Catalogue Crawl
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Results</h4>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {r.status === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="flex-1 truncate">{r.source}</span>
                  <Badge variant={r.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
