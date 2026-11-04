import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Building2, FileText, Receipt, Calendar, Image, MapPin, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ChecklistItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: typeof Building2;
  route: string;
  completed: boolean;
  missingFields?: { label: string; icon: typeof Building2 }[];
  priority?: boolean;
}

interface BrandSettings {
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logo_url?: string | null;
  bank_name?: string | null;
}

interface SetupChecklistProps {
  checklist: {
    brand_added: boolean;
    quote_created: boolean;
    invoice_created: boolean;
    job_scheduled: boolean;
  };
  brandSettings?: BrandSettings | null;
  onDismiss?: () => void;
}

export const SetupChecklist = ({ checklist, brandSettings, onDismiss }: SetupChecklistProps) => {
  const navigate = useNavigate();

  // Calculate which brand fields are missing
  const getMissingBrandFields = (): { label: string; icon: typeof Building2 }[] => {
    if (!brandSettings) return [];
    const missing: { label: string; icon: typeof Building2 }[] = [];
    
    if (!brandSettings.logo_url) missing.push({ label: "Logo", icon: Image });
    if (!brandSettings.address) missing.push({ label: "Address", icon: MapPin });
    if (!brandSettings.bank_name) missing.push({ label: "Bank details", icon: CreditCard });
    
    return missing;
  };

  const missingBrandFields = getMissingBrandFields();
  const isBrandTrulyComplete = checklist.brand_added && missingBrandFields.length === 0;

  const items: ChecklistItem[] = [
    {
      id: "brand_added",
      label: "Complete your brand profile",
      sublabel: "Logo, address & bank details for professional PDFs",
      icon: Building2,
      route: "/account",
      completed: isBrandTrulyComplete,
      missingFields: missingBrandFields,
      priority: !isBrandTrulyComplete,
    },
    {
      id: "quote_created",
      label: "Create your first quote",
      icon: FileText,
      route: "/quotes",
      completed: checklist.quote_created,
    },
    {
      id: "invoice_created",
      label: "Generate your first invoice",
      icon: Receipt,
      route: "/invoices",
      completed: checklist.invoice_created,
    },
    {
      id: "job_scheduled",
      label: "Schedule a job",
      icon: Calendar,
      route: "/scheduling",
      completed: checklist.job_scheduled,
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progress = (completedCount / totalCount) * 100;
  const allCompleted = completedCount === totalCount;

  if (allCompleted && onDismiss) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Getting Started</CardTitle>
            <CardDescription>
              Complete these steps to get the most out of Quotable
            </CardDescription>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
        <Progress value={progress} className="mt-4" />
        <p className="text-sm text-muted-foreground mt-2">
          {completedCount} of {totalCount} completed
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className={`w-full flex flex-col gap-1 p-3 rounded-lg transition-colors text-left ${
                item.priority && !item.completed
                  ? "bg-primary/10 border border-primary/30 hover:bg-primary/15"
                  : "hover:bg-background/50"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                ) : item.priority ? (
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className={`flex-1 ${item.completed ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>
                  {item.label}
                </span>
                {item.priority && !item.completed && (
                  <Badge variant="secondary" className="text-xs">Priority</Badge>
                )}
              </div>
              
              {item.sublabel && !item.completed && (
                <span className="text-xs text-muted-foreground ml-12">
                  {item.sublabel}
                </span>
              )}
              
              {item.missingFields && item.missingFields.length > 0 && !item.completed && (
                <div className="flex flex-wrap gap-1 ml-12 mt-1">
                  {item.missingFields.map((field) => {
                    const FieldIcon = field.icon;
                    return (
                      <Badge key={field.label} variant="outline" className="text-xs gap-1 bg-background">
                        <FieldIcon className="h-3 w-3" />
                        Add {field.label.toLowerCase()}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
};
