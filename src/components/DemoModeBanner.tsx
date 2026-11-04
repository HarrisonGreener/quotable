import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const DemoModeBanner = () => {
  return (
    <Alert className="border-accent bg-accent/10">
      <Info className="h-4 w-4 text-accent" />
      <AlertDescription className="text-foreground">
        <strong>Demo Mode:</strong> You're viewing example data. Create an account to save your own quotes and invoices.
      </AlertDescription>
    </Alert>
  );
};
