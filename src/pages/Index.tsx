import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, STRIPE_PRODUCTS } from "@/hooks/useSubscription";
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
  const { createCheckout, isActive, loading: subLoading } = useSubscription();

  const handleSubscribe = async (plan: "monthly" | "annual") => {
    const priceId = STRIPE_PRODUCTS[plan].priceId;
    if (!user) return navigate("/auth");
    if (isActive) {
      toast.info("You already have an active subscription");
      return navigate("/dashboard");
    }
    try {
      await createCheckout(priceId);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout didn't start. Check your connection and try again.");
    }
  };

  return <LandingContent onSubscribe={handleSubscribe} subLoading={subLoading} />;
};


export default Index;
