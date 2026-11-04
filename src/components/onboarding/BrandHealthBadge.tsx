import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Image, MapPin, CreditCard, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BrandSettings {
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logo_url?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  vat_number?: string | null;
}

interface BrandHealthBadgeProps {
  brandSettings: BrandSettings | null;
  compact?: boolean;
}

interface MissingField {
  label: string;
  icon: typeof Building2;
  weight: number;
}

export const BrandHealthBadge = ({ brandSettings, compact = false }: BrandHealthBadgeProps) => {
  const navigate = useNavigate();

  const calculateCompleteness = () => {
    if (!brandSettings) return { percentage: 0, missing: [] as MissingField[] };

    const fields: { key: keyof BrandSettings; label: string; icon: typeof Building2; weight: number }[] = [
      { key: "company_name", label: "Company name", icon: Building2, weight: 20 },
      { key: "email", label: "Email", icon: Building2, weight: 15 },
      { key: "phone", label: "Phone", icon: Building2, weight: 10 },
      { key: "address", label: "Address", icon: MapPin, weight: 20 },
      { key: "logo_url", label: "Logo", icon: Image, weight: 20 },
      { key: "bank_name", label: "Bank details", icon: CreditCard, weight: 10 },
      { key: "vat_number", label: "VAT number", icon: Building2, weight: 5 },
    ];

    let totalWeight = 0;
    const missing: MissingField[] = [];

    fields.forEach((field) => {
      const value = brandSettings[field.key];
      if (value && String(value).trim()) {
        totalWeight += field.weight;
      } else {
        missing.push({ label: field.label, icon: field.icon, weight: field.weight });
      }
    });

    return { percentage: totalWeight, missing };
  };

  const { percentage, missing } = calculateCompleteness();

  const getStatus = () => {
    if (percentage >= 100) return { color: "bg-green-500", text: "Complete", variant: "default" as const };
    if (percentage >= 75) return { color: "bg-blue-500", text: "Almost there", variant: "secondary" as const };
    if (percentage >= 50) return { color: "bg-amber-500", text: "Getting there", variant: "secondary" as const };
    return { color: "bg-destructive", text: "Needs attention", variant: "destructive" as const };
  };

  const status = getStatus();

  if (compact) {
    return (
      <Badge variant={status.variant} className="gap-1">
        {percentage >= 100 ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <AlertCircle className="h-3 w-3" />
        )}
        Brand {percentage}%
      </Badge>
    );
  }

  if (percentage >= 100) {
    return null; // Don't show when complete
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Complete Your Brand Profile
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Professional PDFs need complete business details
          </p>
        </div>
        <Badge variant={status.variant}>{percentage}%</Badge>
      </div>
      
      <Progress value={percentage} className="h-2 mb-3" />
      
      {missing.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {missing.slice(0, 4).map((field) => {
            const Icon = field.icon;
            return (
              <Badge key={field.label} variant="outline" className="text-xs gap-1">
                <Icon className="h-3 w-3" />
                {field.label}
              </Badge>
            );
          })}
          {missing.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{missing.length - 4} more
            </Badge>
          )}
        </div>
      )}
      
      <Button 
        size="sm" 
        variant="default"
        className="w-full"
        onClick={() => navigate("/account")}
      >
        Complete Profile
      </Button>
    </div>
  );
};
