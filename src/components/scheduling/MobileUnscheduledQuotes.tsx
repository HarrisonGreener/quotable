import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileUnscheduledQuotesProps {
  quotes: any[];
  onScheduleClick: (quote: any) => void;
}

export const MobileUnscheduledQuotes = ({ quotes, onScheduleClick }: MobileUnscheduledQuotesProps) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (quotes.length === 0) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Unscheduled Quotes</h2>
          <Badge variant="secondary">{quotes.length}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Tap + to schedule a quote
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {quotes.map((quote) => (
            <Card key={quote.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={getStatusColor(quote.status)}>
                      {quote.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-semibold text-base">{quote.client}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{quote.title}</p>
                  </div>
                  <p className="text-base font-medium text-primary">
                    £{quote.grand_total?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="default"
                  className="shrink-0 h-12 w-12"
                  onClick={() => onScheduleClick(quote)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
