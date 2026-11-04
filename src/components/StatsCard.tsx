import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  onClick?: () => void;
}

export const StatsCard = ({ icon: Icon, title, value, trend, trendUp, onClick }: StatsCardProps) => {
  const CardWrapper = onClick ? "button" : "div";
  
  return (
    <Card 
      className={`shadow-smooth ${onClick ? 'cursor-pointer transition-smooth hover:shadow-lg hover:scale-[1.02]' : ''}`}
    >
      <CardContent className="p-4 md:p-6 lg:p-8">
        <CardWrapper
          onClick={onClick}
          className={`flex flex-col items-center justify-center gap-3 md:gap-4 w-full ${onClick ? 'text-left' : ''}`}
        >
          {/* Icon - Always centered at top */}
          <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-primary" />
          </div>
          
          {/* Content - Always below icon */}
          <div className="space-y-1 md:space-y-2 text-center w-full">
            <p className="text-muted-foreground text-xs md:text-sm font-medium">{title}</p>
            <h3 className="font-heading text-xl md:text-2xl lg:text-3xl text-foreground break-words">{value}</h3>
            {trend && (
              <p className={`text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trendUp ? '↑' : '↓'} {trend}
              </p>
            )}
          </div>
        </CardWrapper>
      </CardContent>
    </Card>
  );
};
