import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface MobileAgendaListProps {
  schedules: any[];
  quotes: any[];
  onScheduleClick: (schedule: any) => void;
}

export const MobileAgendaList = ({ schedules, quotes, onScheduleClick }: MobileAgendaListProps) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "scheduled":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "paid":
        return "bg-teal-500/10 text-teal-500 border-teal-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (schedules.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No jobs scheduled for this day
      </div>
    );
  }

  const formatTimeBlock = (schedule: any) => {
    const startTime = schedule.start_time || schedule.startTime || "09:00:00";
    const [hours, minutes] = startTime.split(':').map(Number);
    const startFormatted = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
    
    const durationHours = schedule.duration_hours || schedule.durationHours || 0;
    const durationDays = schedule.duration_days || schedule.durationDays || 0;
    
    if (durationHours > 0) {
      const endHours = (hours + durationHours) % 24;
      const endFormatted = `${endHours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${endHours >= 12 ? 'PM' : 'AM'}`;
      return { timeBlock: `${startFormatted} - ${endFormatted}`, duration: `${durationHours} hrs` };
    }
    
    return { timeBlock: startFormatted, duration: durationDays > 1 ? `${durationDays} days` : '' };
  };

  return (
    <div className="space-y-3">
      {schedules.map((schedule) => {
        const quote = quotes.find((q: any) => q.id === (schedule.quote_id || schedule.quoteId));
        if (!quote) return null;

        const { timeBlock, duration } = formatTimeBlock(schedule);

        return (
          <Card
            key={schedule.id}
            className="border-l-4 border-primary cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => onScheduleClick(schedule)}
            style={{ borderLeftColor: `hsl(var(--${quote.status?.toLowerCase() === 'accepted' ? 'blue' : quote.status?.toLowerCase() === 'scheduled' ? 'yellow' : 'primary'}))` }}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-base">{timeBlock}</span>
                {duration && (
                  <Badge variant="secondary" className="ml-auto">
                    {duration}
                  </Badge>
                )}
              </div>
              <div>
                <p className="font-semibold text-lg">{quote.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{quote.client} • £{quote.grand_total?.toFixed(2) || "0.00"}</p>
              </div>
              <Badge variant="outline" className={getStatusColor(quote.status)}>
                {quote.status}
              </Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
