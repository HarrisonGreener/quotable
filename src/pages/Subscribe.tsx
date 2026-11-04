import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription, STRIPE_PRODUCTS } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Subscribe() {
  const { createCheckout, isActive, loading } = useSubscription();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // If already subscribed, redirect to dashboard
  if (isActive && !loading) {
    navigate("/dashboard");
    return null;
  }

  const handleSubscribe = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      await createCheckout(priceId);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const features = [
    "AI-Powered Quote Generation",
    "Professional PDF Exports",
    "Smart Scheduling Calendar",
    "Client Management (CRM)",
    "Recurring Invoices",
    "Real-Time Material Pricing",
    "Tax Reports & Analytics",
    "Inventory Management",
    "Unlimited Quotes & Invoices",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Start Your Free Trial
            </h1>
            <p className="text-muted-foreground text-lg">
              Get 30 days free, then choose your plan. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Monthly Plan */}
            <Card className="relative border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-xl">Monthly</CardTitle>
                <CardDescription>Flexible monthly billing</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    £{STRIPE_PRODUCTS.monthly.price}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubscribe(STRIPE_PRODUCTS.monthly.priceId)}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === STRIPE_PRODUCTS.monthly.priceId
                    ? "Loading..."
                    : "Start 30-Day Free Trial"}
                </Button>
              </CardContent>
            </Card>

            {/* Annual Plan */}
            <Card className="relative border-2 border-primary">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  SAVE 11%
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Annual</CardTitle>
                <CardDescription>Best value - save £19.89/year</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    £{STRIPE_PRODUCTS.annual.price}
                  </span>
                  <span className="text-muted-foreground">/year</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubscribe(STRIPE_PRODUCTS.annual.priceId)}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === STRIPE_PRODUCTS.annual.priceId
                    ? "Loading..."
                    : "Start 30-Day Free Trial"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Everything included in Quotable Pro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
