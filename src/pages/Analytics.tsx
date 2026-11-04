import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { StatsCard } from "@/components/StatsCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuotes } from "@/hooks/useQuotes";
import { isDemoMode } from "@/utils/demoMode";
import { demoQuotes } from "@/data/demoData";
import { TrendingUp, FileText, CheckCircle, BarChart3, XCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Footer } from "@/components/Footer";

const Analytics = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDemo = isDemoMode(searchParams);
  const isMobile = useIsMobile();
  const { data: userQuotes = [] } = useQuotes(!isDemo);
  const quotes = isDemo ? demoQuotes : userQuotes;

  const analytics = useMemo(() => {
    // Group quotes by month
    const monthlyData: Record<string, { created: number; accepted: number; rejected: number; total: number }> = {};

    quotes.forEach((quote) => {
      const date = parseISO(quote.created_at);
      const monthKey = format(date, "MMM yyyy");

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { created: 0, accepted: 0, rejected: 0, total: 0 };
      }

      monthlyData[monthKey].created++;
      monthlyData[monthKey].total += Number(quote.grand_total);

      if (quote.status === "Accepted" || quote.status === "Approved") {
        monthlyData[monthKey].accepted++;
      }
      
      if (quote.status === "Rejected") {
        monthlyData[monthKey].rejected++;
      }
    });

    // Convert to array and sort by date
    const chartData = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        created: data.created,
        accepted: data.accepted,
        rejected: data.rejected,
        conversionRate: (data.accepted + data.rejected) > 0 
          ? Math.round((data.accepted / (data.accepted + data.rejected)) * 100) 
          : 0,
        total: data.total,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months

    // Calculate overall metrics - only count quotes with final status (Accepted or Rejected)
    const totalQuotes = quotes.length;
    const acceptedQuotes = quotes.filter(
      (q) => q.status === "Accepted" || q.status === "Approved"
    ).length;
    const rejectedQuotes = quotes.filter((q) => q.status === "Rejected").length;
    const quotesWithFinalStatus = acceptedQuotes + rejectedQuotes;
    const overallConversionRate = quotesWithFinalStatus > 0 
      ? Math.round((acceptedQuotes / quotesWithFinalStatus) * 100) 
      : 0;
    const totalValue = quotes.reduce((sum, q) => sum + Number(q.grand_total), 0);

    return {
      chartData,
      totalQuotes,
      acceptedQuotes,
      rejectedQuotes,
      overallConversionRate,
      totalValue,
    };
  }, [quotes]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto w-full">
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className={`flex items-center gap-4 ${isMobile ? 'p-3 h-14' : 'p-4 h-16'}`}>
              <SidebarTrigger />
              <h1 className={`font-heading ${isMobile ? 'text-xl' : 'text-2xl'}`}>Analytics</h1>
            </div>
          </header>

          <div className={`space-y-6 max-w-full ${isMobile ? 'p-4' : 'p-6'}`}>
            <p className="text-muted-foreground">Track your business growth and performance</p>

            {/* KPI Cards */}
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
              <StatsCard
                icon={FileText}
                title="Total Quotes"
                value={analytics.totalQuotes}
                onClick={() => navigate(`/quotes${isDemo ? '?demo=true' : ''}`)}
              />
              <StatsCard
                icon={CheckCircle}
                title="Accepted Quotes"
                value={analytics.acceptedQuotes}
                onClick={() => navigate(`/quotes${isDemo ? '?demo=true' : ''}`)}
              />
              <StatsCard
                icon={XCircle}
                title="Rejected Quotes"
                value={analytics.rejectedQuotes}
                onClick={() => navigate(`/quotes${isDemo ? '?demo=true' : ''}`)}
              />
              <StatsCard
                icon={TrendingUp}
                title="Conversion Rate"
                value={`${analytics.overallConversionRate}%`}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {/* Quotes Created vs Accepted */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className={isMobile ? "text-base" : ""}>Quotes Overview</CardTitle>
                </CardHeader>
                <CardContent className="overflow-hidden px-2">
                  <ChartContainer
                     config={{
                      created: {
                        label: "Created",
                        color: "hsl(var(--primary))",
                      },
                      accepted: {
                        label: "Accepted",
                        color: "hsl(142 76% 36%)",
                      },
                      rejected: {
                        label: "Rejected",
                        color: "hsl(var(--destructive))",
                      },
                    }}
                    className={isMobile ? "h-[200px] w-full" : "h-[300px]"}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={analytics.chartData} 
                        margin={isMobile ? { left: -20, right: 5, top: 5, bottom: 5 } : undefined}
                        barSize={isMobile ? 12 : 20}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="month" 
                          stroke="hsl(var(--muted-foreground))" 
                          tickFormatter={(value) => isMobile ? value.split(' ')[0].slice(0, 3) : value}
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))" 
                          width={isMobile ? 30 : 60}
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="created" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="accepted" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="rejected" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Conversion Rate Trend */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className={isMobile ? "text-base" : ""}>Conversion Rate Trend</CardTitle>
                </CardHeader>
                <CardContent className="overflow-hidden px-2">
                  <ChartContainer
                    config={{
                      conversionRate: {
                        label: "Conversion Rate",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className={isMobile ? "h-[200px] w-full" : "h-[300px]"}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={analytics.chartData} 
                        margin={isMobile ? { left: -20, right: 5, top: 5, bottom: 5 } : undefined}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="month" 
                          stroke="hsl(var(--muted-foreground))"
                          tickFormatter={(value) => isMobile ? value.split(' ')[0].slice(0, 3) : value}
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))" 
                          width={isMobile ? 30 : 60}
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="conversionRate"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--chart-1))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Analytics;
