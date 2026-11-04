import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

export const ColorLegend = () => {
  const legendItems = [
    { color: "bg-red-500/20", label: "Due in 3 days", border: "border-l-red-500" },
    { color: "bg-orange-500/15", label: "Due in 7 days", border: "border-l-orange-500" },
    { color: "bg-yellow-500/10", label: "Due in 14 days", border: "border-l-yellow-500" },
    { color: "bg-blue-500/5", label: "Payment window", border: "border-l-blue-500" },
  ];

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Payment Window Legend</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded border-l-4 ${item.color} ${item.border}`} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
