import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TradeAutocomplete } from "@/components/TradeAutocomplete";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    phone: "",
    primaryTrade: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName.trim()) {
      toast.error("Please enter your business name");
      return;
    }
    
    if (!formData.primaryTrade) {
      toast.error("Please select your trade");
      return;
    }

    setLoading(true);
    try {
      // Update brand_settings with company info
      const { error: brandError } = await supabase
        .from("brand_settings")
        .upsert({
          user_id: user!.id,
          company_name: formData.companyName.trim(),
          phone: formData.phone.trim() || null,
          email: user!.email,
        }, { onConflict: "user_id" });

      if (brandError) throw brandError;

      // Update app_settings with trade and mark onboarding complete
      const { error: appError } = await supabase
        .from("app_settings")
        .upsert({
          user_id: user!.id,
          primary_trade: formData.primaryTrade,
          onboarding_completed: true,
        }, { onConflict: "user_id" });

      if (appError) throw appError;

      toast.success("Profile saved!");
      navigate("/subscribe");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set up your business</CardTitle>
          <CardDescription>
            Tell us a bit about your business to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Business Name *</Label>
              <Input
                id="companyName"
                placeholder="e.g., Smith Plumbing Ltd"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade">Your Trade *</Label>
              <TradeAutocomplete
                value={formData.primaryTrade}
                onValueChange={(value) => setFormData({ ...formData, primaryTrade: value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 07123 456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                maxLength={20}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Saving..." : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
