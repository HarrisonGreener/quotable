import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface StatsCardProps {
  /** Kept for compatibility; the figure carries the card, not an icon */
  icon?: LucideIcon;
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  onClick?: () => void;
}

export const StatsCard = ({ title, value, trend, trendUp, onClick }: StatsCardProps) => {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Card className={onClick ? "transition-colors hover:border-primary/40" : ""}>
      <CardContent className="p-4 md:p-5">
        <Wrapper onClick={onClick} className="flex flex-col items-start gap-1.5 w-full text-left">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="font-heading text-2xl md:text-[2rem] leading-none text-primary tabular break-words">{value}</p>
          {trend && (/^[+-]?\d/.test(trend) ? (
            <p className={`text-xs tabular ${trendUp ? "text-emerald-700" : "text-red-700"}`}>
              {trendUp ? "Up" : "Down"} {trend.replace(/^[+-]\s*/, "")}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{trend}</p>
          ))}
        </Wrapper>
      </CardContent>
    </Card>
  );
};
