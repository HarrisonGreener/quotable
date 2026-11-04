import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Upload, Eye, Mail, KeyRound, LogOut, User, FileText, Shield, Wrench, CreditCard, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSignedLogoUrl } from "@/hooks/useBrandSettings";
import { BrandPreviewDialog } from "@/components/BrandPreviewDialog";
import { PDFTemplatePreview } from "@/components/PDFTemplatePreview";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Footer } from "@/components/Footer";
import { TradeAutocomplete } from "@/components/TradeAutocomplete";
import { TRADE_SPECIALIZATIONS, TRADE_CERTIFICATIONS, ALL_TRADES } from "@/data/trades";
import { PreferredSuppliers } from "@/components/PreferredSuppliers";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";

const Account = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDemo = searchParams.get("demo") === "true";
  const isMobile = useIsMobile();
  const { signOut } = useAuth();
  const { isActive, isTrialing, subscriptionEnd, trialEnd, loading: subscriptionLoading, getPlanName, openCustomerPortal } = useSubscription();
  
  // Brand Settings
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showBrandPreview, setShowBrandPreview] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Bank Details
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [swiftBic, setSwiftBic] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentLink, setPaymentLink] = useState("");

  // PDF Template Settings
  const [pdfTemplate, setPdfTemplate] = useState<"minimalist" | "modern" | "classic">("minimalist");
  const [includeVat, setIncludeVat] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Quote Generation Settings
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<string>("");
  const [defaultCalloutFee, setDefaultCalloutFee] = useState<string>("");
  const [markupPercent, setMarkupPercent] = useState<string>("");
  const [tradeDiscountPercent, setTradeDiscountPercent] = useState<string>("");
  const [chargeWholePacks, setChargeWholePacks] = useState(false);
  const [hoursPerDay, setHoursPerDay] = useState<string>("8");
  const [overheadRates, setOverheadRates] = useState<Record<string, string>>({ transport: "", "waste disposal": "", parking: "" });
  const [defaultDayRate, setDefaultDayRate] = useState<string>("");
  const [quoteGenerationMode, setQuoteGenerationMode] = useState<'minimal' | 'detailed'>('minimal');
  const [skipAiPricing, setSkipAiPricing] = useState(false);

  // Document Settings
  const [quoteExpiry, setQuoteExpiry] = useState<string>("30");
  const [paymentTerms, setPaymentTerms] = useState<string>("30");

  // Trade Profile Settings
  const [primaryTrade, setPrimaryTrade] = useState<string>("");
  const [businessType, setBusinessType] = useState<'residential' | 'commercial' | 'both'>('both');
  const [typicalJobSize, setTypicalJobSize] = useState<'small' | 'medium' | 'large' | 'all'>('all');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [tradeNotes, setTradeNotes] = useState<string>("");
  const [otherTradeName, setOtherTradeName] = useState<string>("");
  const [otherTradeDescription, setOtherTradeDescription] = useState<string>("");
  const [otherTradeSimilarTo, setOtherTradeSimilarTo] = useState<string>("");
  const [otherTradeAttributes, setOtherTradeAttributes] = useState<string[]>([]);
  const [preferredSuppliers, setPreferredSuppliers] = useState<string[]>([]);

  // Auto-save PDF template when it changes
  useEffect(() => {
    const savePdfTemplate = async () => {
      if (!userId || isDemo || isInitialLoad) return;
      
      try {
        const { error } = await supabase
          .from('app_settings')
          .upsert({
            user_id: userId,
            pdf_theme: pdfTemplate,
            include_vat: includeVat,
          }, { onConflict: 'user_id' });
        
        if (error) {
          console.error('Error auto-saving settings:', error);
          toast.error("Failed to save settings");
        } else {
          toast.success("Settings saved successfully!");
        }
      } catch (error) {
        console.error('Error auto-saving settings:', error);
        toast.error("Failed to save settings");
      }
    };

    if (userId && !isInitialLoad) {
      savePdfTemplate();
    }
  }, [pdfTemplate, includeVat, userId, isDemo, isInitialLoad]);

  // Account Management
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (!isDemo) {
      loadAccountSettings();
    }
  }, [isDemo]);

  const loadAccountSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      setUserEmail(user.email || "");
      setUserName(user.user_metadata?.full_name || "");

      // Load brand settings
      const { data: brandData, error: brandError } = await supabase
        .from('brand_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (brandError) throw brandError;

      if (brandData) {
        setCompanyName(brandData.company_name || "");
        setEmail(brandData.email || "");
        setPhone(brandData.phone || "");
        setWebsite(brandData.website || "");
        setAddress(brandData.address || "");
        setVatNumber(brandData.vat_number || "");
        // Generate signed URL for the logo
        const signedLogoUrl = await getSignedLogoUrl(brandData.logo_url || "");
        setLogoUrl(signedLogoUrl);
        setAccountName(brandData.account_name || "");
        setBankName(brandData.bank_name || "");
        setSortCode(brandData.sort_code || "");
        setAccountNumber(brandData.account_number || "");
        setIban(brandData.iban || "");
        setSwiftBic(brandData.swift_bic || "");
        setPaymentNotes(brandData.payment_notes || "");
        setPaymentLink((brandData as any).payment_link || "");
      }

      // Load app settings for PDF template
      const { data: appData, error: appError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (appError && appError.code !== 'PGRST116') throw appError;

      if (appData) {
        setSettingsId(appData.id);
        setPdfTemplate((appData.pdf_theme as "minimalist" | "modern" | "classic") || "minimalist");
        setIncludeVat(appData.include_vat !== false); // Default to true if not set
        setDefaultHourlyRate(appData.default_hourly_rate ? String(appData.default_hourly_rate) : "");
        setDefaultCalloutFee(appData.default_callout_fee ? String(appData.default_callout_fee) : "");
        const a = appData as any;
        setMarkupPercent(a.material_markup_percent ? String(a.material_markup_percent) : "");
        setTradeDiscountPercent(a.trade_discount_percent ? String(a.trade_discount_percent) : "");
        setChargeWholePacks(!!a.charge_whole_packs);
        setHoursPerDay(a.hours_per_day ? String(a.hours_per_day) : "8");
        const rates = (a.overhead_rates || {}) as Record<string, number>;
        setOverheadRates({
          transport: rates.transport != null ? String(rates.transport) : "",
          "waste disposal": rates["waste disposal"] != null ? String(rates["waste disposal"]) : "",
          parking: rates.parking != null ? String(rates.parking) : "",
        });
        setDefaultDayRate(appData.default_day_rate ? String(appData.default_day_rate) : "");
        setQuoteGenerationMode((appData.quote_generation_mode as 'minimal' | 'detailed') || 'minimal');
        setSkipAiPricing(appData.skip_ai_pricing || false);
        setQuoteExpiry(appData.quote_expiry?.toString() || "30");
        setPaymentTerms(appData.payment_terms?.toString() || "30");
        
        // Load trade profile data
        setPrimaryTrade(appData.primary_trade || "");
        setBusinessType((appData.business_type as 'residential' | 'commercial' | 'both') || 'both');
        setTypicalJobSize((appData.typical_job_size as 'small' | 'medium' | 'large' | 'all') || 'all');
        setSpecializations((appData.specializations as string[]) || []);
        setCertifications((appData.certifications as string[]) || []);
        setTradeNotes(appData.trade_notes || "");
        setOtherTradeName(appData.other_trade_name || "");
        setOtherTradeDescription(appData.other_trade_description || "");
        setOtherTradeSimilarTo(appData.other_trade_similar_to || "");
        setOtherTradeAttributes((appData.other_trade_attributes as string[]) || []);
        setPreferredSuppliers((appData.preferred_suppliers as string[]) || []);
      }
      
      // Mark initial load as complete
      setTimeout(() => setIsInitialLoad(false), 100);
    } catch (error) {
      console.error('Error loading account settings:', error);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      setLogoUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSave = async () => {
    if (isDemo) {
      toast.error("Brand details can't be saved in demo mode");
      return;
    }

    if (!userId) {
      toast.error("Please log in to save settings");
      return;
    }

    if (!companyName || !email) {
      toast.error("Company name and email are required");
      return;
    }

    // Basic bank details validation
    if (sortCode && !/^\d{6}$/.test(sortCode)) {
      toast.error("Sort code must be 6 digits");
      return;
    }

    if (accountNumber && !/^\d{8}$/.test(accountNumber)) {
      toast.error("Account number must be 8 digits");
      return;
    }

    if (iban && !/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(iban.replace(/\s+/g, '').toUpperCase())) {
      toast.error("Please enter a valid IBAN");
      return;
    }

    setLoading(true);
    try {
      let finalLogoUrl = logoUrl;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        // Store the file path, not the URL - we'll generate signed URLs on load
        finalLogoUrl = fileName;
      }

      const brandData = {
        user_id: userId,
        company_name: companyName,
        email: email,
        phone: phone,
        website: website,
        address: address,
        vat_number: vatNumber,
        logo_url: finalLogoUrl,
        account_name: accountName || null,
        bank_name: bankName || null,
        sort_code: sortCode || null,
        account_number: accountNumber || null,
        iban: iban || null,
        swift_bic: swiftBic || null,
        payment_notes: paymentNotes || null,
        payment_link: /^https:\/\//i.test(paymentLink.trim()) ? paymentLink.trim() : null,
      };

      const { error: brandError } = await supabase
        .from('brand_settings')
        .upsert(brandData, { onConflict: 'user_id' });

      if (brandError) throw brandError;

      // Save PDF template, VAT preference, document settings, quote generation settings, and trade profile
      const appSettingsData = {
        user_id: userId,
        pdf_theme: pdfTemplate,
        include_vat: includeVat,
        default_hourly_rate: defaultHourlyRate ? parseFloat(defaultHourlyRate) : null,
        default_callout_fee: defaultCalloutFee ? parseFloat(defaultCalloutFee) : null,
        material_markup_percent: markupPercent ? Math.max(0, parseFloat(markupPercent)) : 0,
        trade_discount_percent: tradeDiscountPercent ? Math.min(90, Math.max(0, parseFloat(tradeDiscountPercent))) : 0,
        charge_whole_packs: chargeWholePacks,
        hours_per_day: hoursPerDay ? Math.min(14, Math.max(1, parseFloat(hoursPerDay))) : 8,
        overhead_rates: Object.fromEntries(
          Object.entries(overheadRates).filter(([, v]) => v !== "" && !isNaN(parseFloat(v))).map(([k, v]) => [k, parseFloat(v)])
        ),
        default_day_rate: defaultDayRate ? parseFloat(defaultDayRate) : null,
        quote_generation_mode: quoteGenerationMode,
        skip_ai_pricing: skipAiPricing,
        quote_expiry: parseInt(quoteExpiry),
        payment_terms: parseInt(paymentTerms),
        primary_trade: primaryTrade || null,
        business_type: businessType,
        typical_job_size: typicalJobSize,
        specializations: specializations,
        certifications: certifications,
        trade_notes: tradeNotes || null,
        other_trade_name: otherTradeName || null,
        other_trade_description: otherTradeDescription || null,
        other_trade_similar_to: otherTradeSimilarTo || null,
        other_trade_attributes: otherTradeAttributes,
        preferred_suppliers: preferredSuppliers,
      };

      const { error: appError } = await supabase
        .from('app_settings')
        .upsert(appSettingsData, { onConflict: 'user_id' });

      if (appError) throw appError;

      toast.success("Settings saved successfully");
      setLogoFile(null);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("We couldn't save your brand information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const brandSettings = {
    company_name: companyName,
    email,
    phone,
    website,
    address,
    vat_number: vatNumber,
    logo_url: logoUrl,
    account_name: accountName,
    bank_name: bankName,
    sort_code: sortCode,
    account_number: accountNumber,
    iban: iban,
    swift_bic: swiftBic,
    payment_notes: paymentNotes
  };

  const handlePasswordReset = async () => {
    if (isDemo) {
      toast.error("Password reset is not available in demo mode");
      return;
    }

    if (!userEmail) {
      toast.error("No email address found");
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleLogout = async () => {
    if (isDemo) {
      navigate("/auth");
      return;
    }

    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error("Failed to log out");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto w-full">
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className={`flex items-center gap-4 ${isMobile ? 'p-3 h-14' : 'p-4 h-16'}`}>
              <SidebarTrigger />
              <h1 className={`font-heading ${isMobile ? 'text-xl' : 'text-2xl'}`}>Account</h1>
            </div>
          </header>

          <div className={`space-y-6 max-w-3xl ${isMobile ? 'p-3 pb-24' : 'p-6'}`}>
            {isDemo && (
              <Alert className="border-accent bg-accent/10">
                <Info className="h-4 w-4 text-accent" />
                <AlertDescription>
                  <strong>Demo Mode:</strong> Brand details can't be saved in demo mode. Create an account to save your settings.
                </AlertDescription>
              </Alert>
            )}

            {/* Account Information */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Full Name</Label>
                  <Input
                    id="user-name"
                    value={userName}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email Address</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={userEmail}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Subscription
                </CardTitle>
                <CardDescription>Your Quotable Pro subscription status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading subscription status...
                  </div>
                ) : isActive ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {isTrialing ? 'Free Trial Active' : 'Subscription Active'}
                      </span>
                    </div>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan</span>
                        <span className="font-medium">Quotable Pro {getPlanName()}</span>
                      </div>
                      {isTrialing && trialEnd && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Trial ends</span>
                          <span className="font-medium">{format(new Date(trialEnd), 'dd MMM yyyy')}</span>
                        </div>
                      )}
                      {!isTrialing && subscriptionEnd && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Renews on</span>
                          <span className="font-medium">{format(new Date(subscriptionEnd), 'dd MMM yyyy')}</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={() => openCustomerPortal()} 
                      variant="outline" 
                      className="w-full"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      <span className="text-muted-foreground">No active subscription</span>
                    </div>
                    <Button 
                      onClick={() => navigate('/')} 
                      className="w-full"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Subscribe to Quotable Pro
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Brand Settings */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading">Brand Details</CardTitle>
                <CardDescription>These details will appear on your PDFs and invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Company Logo</Label>
                  <div className="flex items-center gap-4">
                    <Input 
                      id="logo" 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoChange}
                      disabled={isDemo}
                    />
                  </div>
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo preview" className="h-20 object-contain mt-2" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name *</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Company Ltd"
                    disabled={isDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@yourcompany.com"
                    disabled={isDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 20 1234 5678"
                    disabled={isDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.yourcompany.com"
                    disabled={isDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Business Street, London, UK"
                    rows={3}
                    disabled={isDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat-number">VAT Number</Label>
                  <Input
                    id="vat-number"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="GB123456789"
                    disabled={isDemo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pdfTemplate">PDF Export Template</Label>
                  <Select 
                    value={pdfTemplate} 
                    onValueChange={(value: "minimalist" | "modern" | "classic") => setPdfTemplate(value)}
                    disabled={isDemo}
                  >
                    <SelectTrigger id="pdfTemplate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimalist">
                        <div className="flex flex-col">
                          <span className="font-medium">Clean Minimalist</span>
                          <span className="text-xs text-muted-foreground">Thin borders, large headline, spacious layout</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="modern">
                        <div className="flex flex-col">
                          <span className="font-medium">Modern Professional</span>
                          <span className="text-xs text-muted-foreground">Strong header banner, two-column layout</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="classic">
                        <div className="flex flex-col">
                          <span className="font-medium">Tradesperson Classic</span>
                          <span className="text-xs text-muted-foreground">Blocky structure, bold totals, easy-to-read</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground text-center">
                    This template will be used for all quote and invoice PDF exports
                  </p>
                </div>

                <div className="flex items-center justify-between space-x-2 p-4 rounded-lg bg-muted/50">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="include-vat" className="text-base cursor-pointer">Include VAT</Label>
                    <p className="text-sm text-muted-foreground">Add 20% VAT to all quotes and invoices</p>
                  </div>
                  <Switch
                    id="include-vat"
                    checked={includeVat}
                    onCheckedChange={setIncludeVat}
                    disabled={isDemo}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading">Bank Details</CardTitle>
                <CardDescription>Used only on invoice payment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Account Name</Label>
                  <Input
                    id="account-name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Your Company Ltd"
                    disabled={isDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <Input
                    id="bank-name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Your Bank"
                    disabled={isDemo}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sort-code">Sort Code</Label>
                    <Input
                      id="sort-code"
                      value={sortCode}
                      onChange={(e) => setSortCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="112233"
                      maxLength={6}
                      disabled={isDemo}
                    />
                    <p className="text-xs text-muted-foreground">6 digits, numbers only</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-number">Account Number</Label>
                    <Input
                      id="account-number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="12345678"
                      maxLength={8}
                      disabled={isDemo}
                    />
                    <p className="text-xs text-muted-foreground">8 digits, numbers only</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="GB00 BANK 0000 0000 0000 00"
                    disabled={isDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="swift-bic">SWIFT / BIC</Label>
                  <Input
                    id="swift-bic"
                    value={swiftBic}
                    onChange={(e) => setSwiftBic(e.target.value)}
                    placeholder="ABCDEF12"
                    disabled={isDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-notes">Payment Notes (optional)</Label>
                  <Textarea
                    id="payment-notes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Please use the invoice number as the payment reference."
                    rows={3}
                    disabled={isDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-link">Card payment link (optional)</Label>
                  <Input
                    id="payment-link"
                    type="url"
                    inputMode="url"
                    value={paymentLink}
                    onChange={(e) => setPaymentLink(e.target.value)}
                    placeholder="https://buy.stripe.com/… or https://pay.sumup.com/… or https://paypal.me/…"
                    disabled={isDemo}
                  />
                  <p className="text-xs text-muted-foreground">
                    Shown as a "Pay now" button on the quote and invoice links you send. Payments go straight to you.
                    {paymentLink && !/^https:\/\//i.test(paymentLink.trim()) && <span className="text-destructive"> Must start with https://</span>}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Document Settings */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Settings
                </CardTitle>
                <CardDescription>Default terms for quotes and invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quote-expiry">Default Quote Expiry (days)</Label>
                  <Input
                    id="quote-expiry"
                    type="number"
                    value={quoteExpiry}
                    onChange={(e) => setQuoteExpiry(e.target.value)}
                    disabled={isDemo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-terms-doc">Default Payment Terms (days)</Label>
                  <Input
                    id="payment-terms-doc"
                    type="number"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    disabled={isDemo}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Trade Profile */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Trade Profile
                </CardTitle>
                <CardDescription>Tell us about your trade for more accurate AI quote generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-trade">Primary Trade *</Label>
                  <TradeAutocomplete
                    value={primaryTrade}
                    onValueChange={setPrimaryTrade}
                    placeholder="Select your trade..."
                    disabled={isDemo}
                  />
                  <p className="text-xs text-muted-foreground">This helps the AI understand your specialty</p>
                </div>

                {/* Show "Other" trade follow-up questions */}
                {primaryTrade === "other" && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm font-medium">Help us understand your trade better</p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="other-trade-name">Trade/Profession Name *</Label>
                      <Input
                        id="other-trade-name"
                        value={otherTradeName}
                        onChange={(e) => setOtherTradeName(e.target.value)}
                        placeholder="e.g. Solar Panel Maintenance Engineer"
                        disabled={isDemo}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="other-trade-description">Brief Description of Your Work *</Label>
                      <Textarea
                        id="other-trade-description"
                        value={otherTradeDescription}
                        onChange={(e) => setOtherTradeDescription(e.target.value)}
                        placeholder="Describe what you do, typical materials, and equipment you use..."
                        rows={3}
                        disabled={isDemo}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Your Work is More Similar To:</Label>
                      <div className="space-y-2">
                        {["Electrical Work", "Mechanical/Engineering", "Construction/Building", "Specialist/Technical Services"].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`similar-${option}`}
                              name="similar-to"
                              value={option}
                              checked={otherTradeSimilarTo === option}
                              onChange={(e) => setOtherTradeSimilarTo(e.target.value)}
                              disabled={isDemo}
                              className="h-4 w-4"
                            />
                            <Label htmlFor={`similar-${option}`} className="cursor-pointer font-normal">{option}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Do You Work With:</Label>
                      <div className="space-y-2">
                        {[
                          { id: "high-value", label: "High-value equipment (£1000+)" },
                          { id: "specialized-tools", label: "Specialized tools/machinery" },
                          { id: "certified-materials", label: "Certified/regulated materials" },
                          { id: "hazardous", label: "Hazardous materials" }
                        ].map((attr) => (
                          <div key={attr.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={attr.id}
                              checked={otherTradeAttributes.includes(attr.label)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setOtherTradeAttributes([...otherTradeAttributes, attr.label]);
                                } else {
                                  setOtherTradeAttributes(otherTradeAttributes.filter(a => a !== attr.label));
                                }
                              }}
                              disabled={isDemo}
                            />
                            <Label htmlFor={attr.id} className="cursor-pointer font-normal">{attr.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Business Type</Label>
                    <Select 
                      value={businessType} 
                      onValueChange={(value: 'residential' | 'commercial' | 'both') => setBusinessType(value)}
                      disabled={isDemo}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Typical Job Size</Label>
                    <Select 
                      value={typicalJobSize} 
                      onValueChange={(value: 'small' | 'medium' | 'large' | 'all') => setTypicalJobSize(value)}
                      disabled={isDemo}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (under £500)</SelectItem>
                        <SelectItem value="medium">Medium (£500-£5k)</SelectItem>
                        <SelectItem value="large">Large (£5k+)</SelectItem>
                        <SelectItem value="all">All Sizes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Specializations */}
                {primaryTrade && primaryTrade !== "other" && TRADE_SPECIALIZATIONS[primaryTrade] && (
                  <div className="space-y-2">
                    <Label>Specializations</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {TRADE_SPECIALIZATIONS[primaryTrade].map((spec) => (
                        <div key={spec} className="flex items-center space-x-2">
                          <Checkbox
                            id={`spec-${spec}`}
                            checked={specializations.includes(spec)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSpecializations([...specializations, spec]);
                              } else {
                                setSpecializations(specializations.filter(s => s !== spec));
                              }
                            }}
                            disabled={isDemo}
                          />
                          <Label htmlFor={`spec-${spec}`} className="cursor-pointer font-normal text-sm">{spec}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {primaryTrade && (TRADE_CERTIFICATIONS[primaryTrade] || TRADE_CERTIFICATIONS['general']) && (
                  <div className="space-y-2">
                    <Label>Certifications</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[...(TRADE_CERTIFICATIONS[primaryTrade] || []), ...(TRADE_CERTIFICATIONS['general'] || [])].map((cert) => (
                        <div key={cert} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cert-${cert}`}
                            checked={certifications.includes(cert)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCertifications([...certifications, cert]);
                              } else {
                                setCertifications(certifications.filter(c => c !== cert));
                              }
                            }}
                            disabled={isDemo}
                          />
                          <Label htmlFor={`cert-${cert}`} className="cursor-pointer font-normal text-sm">{cert}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="trade-notes">Additional Notes (optional)</Label>
                  <Textarea
                    id="trade-notes"
                    value={tradeNotes}
                    onChange={(e) => setTradeNotes(e.target.value)}
                    placeholder="Any other context that might help generate more accurate quotes..."
                    rows={3}
                    disabled={isDemo}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preferred Suppliers */}
            <PreferredSuppliers
              primaryTrade={primaryTrade}
              preferredSuppliers={preferredSuppliers}
              onPreferredSuppliersChange={setPreferredSuppliers}
              disabled={isDemo}
            />

            {/* Quote Generation Settings */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading">Quote Generation Settings</CardTitle>
                <CardDescription>Configure AI quote generation preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-hourly-rate">Default Hourly Rate (£)</Label>
                  <Input
                    id="default-hourly-rate"
                    type="number"
                    value={defaultHourlyRate}
                    onChange={(e) => setDefaultHourlyRate(e.target.value)}
                    placeholder="45"
                    disabled={isDemo}
                  />
                  <p className="text-xs text-muted-foreground">This rate will be pre-filled when creating hourly quotes</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-day-rate">Default Day Rate (£)</Label>
                  <Input
                    id="default-day-rate"
                    type="number"
                    value={defaultDayRate}
                    onChange={(e) => setDefaultDayRate(e.target.value)}
                    placeholder="250"
                    disabled={isDemo}
                  />
                  <p className="text-xs text-muted-foreground">This rate will be pre-filled when creating day-rate quotes</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-callout-fee">Default Callout Fee (£)</Label>
                  <Input
                    id="default-callout-fee"
                    type="number"
                    value={defaultCalloutFee}
                    onChange={(e) => setDefaultCalloutFee(e.target.value)}
                    placeholder="50"
                    disabled={isDemo}
                  />
                  <p className="text-xs text-muted-foreground">Optional callout fee to include in quotes</p>
                </div>

                <div className="rounded-lg border p-4 space-y-4">
                  <div>
                    <h4 className="font-medium">Your pricing</h4>
                    <p className="text-sm text-muted-foreground">
                      How Quotable turns supplier prices into what you charge.
                      {includeVat
                        ? " You're VAT-registered, so materials are costed without VAT and VAT is added once on the total."
                        : " You're not VAT-registered, so materials are costed at the price you pay, VAT included."}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="markup">Materials markup (%)</Label>
                      <Input id="markup" type="number" inputMode="decimal" min={0} max={300} value={markupPercent}
                        onChange={(e) => setMarkupPercent(e.target.value)} placeholder="15" disabled={isDemo} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trade-discount">Your trade discount (%)</Label>
                      <Input id="trade-discount" type="number" inputMode="decimal" min={0} max={90} value={tradeDiscountPercent}
                        onChange={(e) => setTradeDiscountPercent(e.target.value)} placeholder="10" disabled={isDemo} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hours-per-day">Hours in a working day</Label>
                      <Input id="hours-per-day" type="number" inputMode="decimal" min={1} max={14} value={hoursPerDay}
                        onChange={(e) => setHoursPerDay(e.target.value)} placeholder="8" disabled={isDemo} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Trade discount is what you get off website prices at your merchant. Markup is added on top of your cost.
                    Day-rate jobs are charged in half days per person.
                  </p>
                  <label htmlFor="whole-packs" className="flex items-center justify-between gap-4 cursor-pointer">
                    <span>
                      <span className="block text-sm font-medium">Charge whole packs</span>
                      <span className="block text-xs text-muted-foreground">20 m from a 100 m drum is charged as the drum. Leave off if you keep stock.</span>
                    </span>
                    <Switch id="whole-packs" checked={chargeWholePacks} onCheckedChange={setChargeWholePacks} disabled={isDemo} />
                  </label>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Your overhead costs (£ per job)</span>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {([["transport", "Transport"], ["waste disposal", "Waste disposal"], ["parking", "Parking"]] as const).map(([key, label]) => (
                        <div key={key} className="space-y-1">
                          <Label htmlFor={`oh-${key}`} className="text-xs">{label}</Label>
                          <Input id={`oh-${key}`} type="number" inputMode="decimal" min={0} value={overheadRates[key]}
                            onChange={(e) => setOverheadRates((r) => ({ ...r, [key]: e.target.value }))}
                            placeholder={key === "transport" ? "25" : key === "parking" ? "15" : "35"} disabled={isDemo} />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Leave blank to use Quotable's typical figures.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-2 p-4 rounded-lg bg-muted/50">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="overhead-mode" className="text-base cursor-pointer">Overhead Detail Level</Label>
                    <p className="text-sm text-muted-foreground">
                      {quoteGenerationMode === 'minimal' 
                        ? 'Essential overheads only with suggestions' 
                        : 'All relevant overheads included automatically'}
                    </p>
                  </div>
                  <Select 
                    value={quoteGenerationMode} 
                    onValueChange={(value: 'minimal' | 'detailed') => setQuoteGenerationMode(value)}
                    disabled={isDemo}
                  >
                    <SelectTrigger id="overhead-mode" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between space-x-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="skip-pricing" className="text-base cursor-pointer">Generate Without Prices</Label>
                    <p className="text-sm text-muted-foreground">
                      Materials and labour will be listed without prices - add your own pricing manually after generation
                    </p>
                  </div>
                  <Switch
                    id="skip-pricing"
                    checked={skipAiPricing}
                    onCheckedChange={setSkipAiPricing}
                    disabled={isDemo}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Password Reset */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  Password
                </CardTitle>
                <CardDescription>Reset your password</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={handlePasswordReset}
                  disabled={isDemo || isResettingPassword}
                >
                  {isResettingPassword ? "Sending..." : "Reset Password"}
                </Button>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleSave} 
                disabled={loading || isDemo}
                className="flex-1 sm:flex-none"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save All Settings"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowTemplatePreview(true)}
                className="flex-1 sm:flex-none"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview Templates
              </Button>
            </div>

            {/* Log Out */}
            <Card className="shadow-smooth border-destructive/20">
              <CardHeader>
                <CardTitle className="font-heading text-destructive flex items-center gap-2">
                  <LogOut className="h-5 w-5" />
                  Log Out
                </CardTitle>
                <CardDescription>Sign out of your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  className="w-full sm:w-auto"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </CardContent>
            </Card>
          </div>
          <Footer />
        </main>
      </div>
      <BrandPreviewDialog
        open={showBrandPreview} 
        onOpenChange={setShowBrandPreview}
        brandSettings={brandSettings}
      />
      <PDFTemplatePreview
        open={showTemplatePreview}
        onOpenChange={setShowTemplatePreview}
        brandSettings={brandSettings}
        currentTemplate={pdfTemplate}
        onSelectTemplate={setPdfTemplate}
      />
    </SidebarProvider>
  );
};

export default Account;
