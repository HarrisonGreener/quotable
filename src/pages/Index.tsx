import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { LandingContent } from "@/components/landing/Landing";
import { landingMeta, usePageMeta } from "@/seo/meta";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  usePageMeta(landingMeta());

  // "Pricing" in the navbar links to /#pricing
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, [location.hash]);
  const { isActive, loading: subLoading } = useSubscription();

  const handleSubscribe = async (_plan: "monthly" | "annual") => {
    if (!user) return navigate("/auth");
    if (isActive) {
      toast.info("You already have an active subscription");
      return navigate("/dashboard");
    }
    // The plan page has the "Have a code?" box, so go there rather than straight to payment
    navigate("/subscribe");
  };

  return <LandingContent onSubscribe={handleSubscribe} subLoading={subLoading} />;
};


export default Index;
