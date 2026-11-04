import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { ComplianceDialog } from "@/components/ComplianceDialog";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, needsCompliance, markCompliant } = useAuth();
  const { isActive, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      if (isDemoMode) {
        setCheckingOnboarding(false);
        setOnboardingComplete(true);
        return;
      }

      if (!user) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("app_settings")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();

        setOnboardingComplete(data?.onboarding_completed ?? false);
      } catch (error) {
        console.error("Error checking onboarding:", error);
        setOnboardingComplete(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (!loading) {
      checkOnboarding();
    }
  }, [user, loading, isDemoMode]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user && !isDemoMode) {
      navigate("/auth");
    }
  }, [user, loading, isDemoMode, navigate]);

  // Check onboarding after auth is confirmed
  useEffect(() => {
    if (!loading && user && !checkingOnboarding && !onboardingComplete && !isDemoMode) {
      if (location.pathname !== "/onboarding") {
        navigate("/onboarding");
      }
    }
  }, [user, loading, onboardingComplete, checkingOnboarding, isDemoMode, navigate, location.pathname]);

  // Check subscription after onboarding is confirmed
  useEffect(() => {
    if (!loading && user && !subscriptionLoading && onboardingComplete && !isActive && !isDemoMode) {
      if (location.pathname !== "/subscribe" && location.pathname !== "/onboarding") {
        navigate("/subscribe");
      }
    }
  }, [user, loading, isActive, subscriptionLoading, onboardingComplete, isDemoMode, navigate, location.pathname]);

  if (loading || checkingOnboarding || (user && subscriptionLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && !isDemoMode) {
    return null;
  }

  // Show compliance dialog if user needs to accept terms/privacy
  if (user && needsCompliance && !isDemoMode) {
    return <ComplianceDialog open={true} onCompliance={markCompliant} />;
  }

  // Block access if not onboarded (unless on onboarding page or demo mode)
  if (user && !onboardingComplete && !isDemoMode && location.pathname !== "/onboarding") {
    return null;
  }

  // Block access if not subscribed (unless demo mode or on allowed pages)
  if (user && onboardingComplete && !isActive && !isDemoMode && 
      location.pathname !== "/subscribe" && location.pathname !== "/onboarding") {
    return null;
  }

  return <>{children}</>;
};
