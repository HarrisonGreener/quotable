import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandSettings } from "@/hooks/useBrandSettings";

interface BrandCompletionNoticeProps {
  brandSettings: BrandSettings | null;
}

export const BrandCompletionNotice = ({ brandSettings }: BrandCompletionNoticeProps) => {
  const isComplete = brandSettings && 
    brandSettings.company_name && 
    brandSettings.email && 
    brandSettings.phone && 
    brandSettings.address;

  if (isComplete) return null;

  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <Info className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-sm">
        <strong>Complete your brand details</strong> to unlock full professional PDF exports.{" "}
        <Link to="/account" className="underline font-medium">
          Go to Account Settings
        </Link>
      </AlertDescription>
    </Alert>
  );
};
