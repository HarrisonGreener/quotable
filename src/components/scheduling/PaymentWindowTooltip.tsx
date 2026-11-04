import { format } from "date-fns";
import { DollarSign } from "lucide-react";

interface PaymentWindowTooltipProps {
  paymentWindows: any[];
  quotes: any[];
}

export const PaymentWindowTooltip = ({ paymentWindows, quotes }: PaymentWindowTooltipProps) => {
  if (paymentWindows.length === 0) return null;

  return (
    <div className="absolute top-full left-0 mt-2 p-3 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-[250px] pointer-events-none">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
        <DollarSign className="h-4 w-4 text-primary" />
        Payment Window
      </div>
      {paymentWindows.slice(0, 3).map((invoice: any) => {
        const quote = quotes.find((q: any) => q.id === invoice.quote_id);
        const daysUntilDue = Math.ceil((new Date(invoice.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <div key={invoice.id} className="mb-2 pb-2 border-b border-border last:border-0 last:mb-0 last:pb-0">
            <div className="text-xs font-medium text-foreground truncate">{quote?.title || invoice.title}</div>
            <div className="text-xs text-muted-foreground truncate">{invoice.client}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-semibold text-foreground">£{invoice.total.toLocaleString()}</span>
              <span className={`text-xs ${daysUntilDue <= 7 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                Due {format(new Date(invoice.due_date), "MMM d")}
              </span>
            </div>
          </div>
        );
      })}
      {paymentWindows.length > 3 && (
        <div className="text-xs text-muted-foreground mt-2">
          +{paymentWindows.length - 3} more
        </div>
      )}
    </div>
  );
};
