import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <Card className="border-border hover:border-accent transition-smooth shadow-smooth hover:shadow-lg">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-accent" />
        </div>
        <h3 className="font-heading text-lg mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
};
