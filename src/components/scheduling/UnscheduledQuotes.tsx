import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnscheduledQuotesProps {
  quotes: any[];
  onQuoteDrop: (quote: any, date: Date) => void;
  isDemo: boolean;
}

export const UnscheduledQuotes = ({ quotes, onQuoteDrop, isDemo }: UnscheduledQuotesProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const handleDragStart = (e: React.DragEvent, quote: any) => {
    e.dataTransfer.setData("quote", JSON.stringify(quote));
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case "approved": return "bg-green-500/20 text-green-700 dark:text-green-300";
      default: return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex-shrink-0 flex items-start pt-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="h-10 w-10 rounded-l-none"
          title="Show unscheduled quotes"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-80 flex-shrink-0 animate-slide-in-right">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Unscheduled Quotes
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-8 w-8"
          title="Hide panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto">
        {quotes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            All quotes are scheduled
          </p>
        ) : (
          quotes.map((quote) => (
            <div
              key={quote.id}
              draggable
              onDragStart={(e) => handleDragStart(e, quote)}
              className={cn(
                "p-4 rounded-lg border border-border bg-card cursor-move hover:shadow-md transition-shadow",
                "flex items-start gap-3"
              )}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm truncate">{quote.client}</h4>
                  <Badge className={cn("text-xs flex-shrink-0", getStatusColor(quote.status))}>
                    {quote.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-2">
                  {quote.title}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  £{((quote as any).total || (quote as any).grand_total)?.toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
