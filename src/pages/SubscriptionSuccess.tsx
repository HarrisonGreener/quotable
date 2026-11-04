import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, ArrowRight, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isActive, isTrialing, getPlanName, checkSubscription, loading } = useSubscription();
  const [countdown, setCountdown] = useState(5);
  const [hasChecked, setHasChecked] = useState(false);

  // Refresh subscription status on mount
  useEffect(() => {
    const refreshStatus = async () => {
      await checkSubscription();
      setHasChecked(true);
    };
    refreshStatus();
  }, [checkSubscription]);

  // Auto-redirect countdown
  useEffect(() => {
    if (!hasChecked) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, hasChecked]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-smooth">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="font-heading text-2xl">Welcome to Quotable Pro!</CardTitle>
          <CardDescription className="text-base">
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading || !hasChecked ? (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Confirming your subscription...</span>
            </div>
          ) : (
            <>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">Quotable Pro {getPlanName() || ''}</p>
                    <p className="text-sm text-muted-foreground">
                      {isTrialing ? '30-day free trial started' : 'Full access activated'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">You now have access to:</p>
                <ul className="space-y-1.5 ml-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    AI-powered quote generation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Professional PDF exports
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Smart scheduling calendar
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Client management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Inventory & pricing tools
                  </li>
                </ul>
              </div>

              <div className="pt-2 space-y-3">
                <Button 
                  onClick={() => navigate("/dashboard")} 
                  className="w-full"
                  size="lg"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Redirecting in {countdown} seconds...
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
