import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface SchedulingFiltersProps {
  clients: string[];
  selectedClient: string;
  onClientChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedPaymentFilter: string;
  onPaymentFilterChange: (value: string) => void;
}

export const SchedulingFilters = ({
  clients,
  selectedClient,
  onClientChange,
  selectedStatus,
  onStatusChange,
  selectedPaymentFilter,
  onPaymentFilterChange,
}: SchedulingFiltersProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "bg-card border border-border rounded-lg p-4",
      isMobile ? "flex flex-col items-stretch gap-3" : "flex flex-wrap items-center gap-4"
    )}>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Filters:</span>
      </div>

      <div className="flex-1 min-w-[150px]">
        <Label htmlFor="client-filter" className="sr-only">Client</Label>
        <Select value={selectedClient} onValueChange={onClientChange}>
          <SelectTrigger id="client-filter" className="h-9">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client} value={client}>{client}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <Label htmlFor="status-filter" className="sr-only">Status</Label>
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger id="status-filter" className="h-9">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <Label htmlFor="payment-filter" className="sr-only">Payment Due</Label>
        <Select value={selectedPaymentFilter} onValueChange={onPaymentFilterChange}>
          <SelectTrigger id="payment-filter" className="h-9">
            <SelectValue placeholder="All Payments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="due-soon">Due in 7 days</SelectItem>
            <SelectItem value="due-this-month">Due this month</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
