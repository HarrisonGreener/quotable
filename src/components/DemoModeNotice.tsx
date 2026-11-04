import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const DemoModeNotice = () => {
  const navigate = useNavigate();
  
  return (
    <Alert className="mb-6 border-primary/50 bg-primary/5">
      <Info className="h-4 w-4 text-primary flex-shrink-0" />
      <AlertDescription className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <span className="text-sm">
          <strong>Demo Mode:</strong> You're viewing example data. Subscribe to Quotable Pro to save your work.
        </span>
        <Button 
          size="sm" 
          variant="default"
          onClick={() => navigate("/auth")}
          className="w-full md:w-auto flex-shrink-0"
        >
          Get Quotable Pro
        </Button>
      </AlertDescription>
    </Alert>
  );
};