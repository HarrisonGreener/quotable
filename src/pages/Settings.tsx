import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSignedLogoUrl } from "@/hooks/useBrandSettings";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Footer } from "@/components/Footer";

const Settings = () => {
  const isMobile = useIsMobile();
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
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [swiftBic, setSwiftBic] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState(30);
  const [openSections, setOpenSections] = useState({
    company: true,
    contact: true,
    logo: true,
  });

  useEffect(() => {
    loadBrandSettings();
  }, []);

  const brandData = {
    company_name: companyName,
    email,
    phone,
    website,
    address,
    vat_number: vatNumber,
    account_name: accountName,
    bank_name: bankName,
    sort_code: sortCode,
    account_number: accountNumber,
    iban: iban,
    swift_bic: swiftBic,
    payment_notes: paymentNotes,
  };

  // Auto-save brand settings
  useAutoSave({
    data: brandData,
    onSave: async (data) => {
      if (!userId || !companyName) return; // Skip if no user or empty name
      
      await supabase
        .from('brand_settings')
        .upsert({
          user_id: userId,
          ...data,
          logo_url: logoUrl,
        }, { onConflict: 'user_id' });
    },
    enabled: !!userId,
  });

  const loadBrandSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from('brand_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCompanyName(data.company_name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setWebsite(data.website || "");
        setAddress(data.address || "");
        setVatNumber(data.vat_number || "");
        // Generate signed URL for the logo
        const signedLogoUrl = await getSignedLogoUrl(data.logo_url || "");
        setLogoUrl(signedLogoUrl);
        setAccountName(data.account_name || "");
        setBankName(data.bank_name || "");
        setSortCode(data.sort_code || "");
        setAccountNumber(data.account_number || "");
        setIban(data.iban || "");
        setSwiftBic(data.swift_bic || "");
        setPaymentNotes(data.payment_notes || "");
      }

      // Load payment terms from app_settings
      const { data: appData } = await supabase
        .from('app_settings')
        .select('payment_terms')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (appData) {
        setPaymentTerms(appData.payment_terms || 30);
      }
    } catch (error) {
      console.error('Error loading brand settings:', error);
    }
  };

  // Save payment terms when changed
  const handlePaymentTermsChange = async (value: string) => {
    const terms = parseInt(value);
    setPaymentTerms(terms);
    
    if (!userId) return;

    try {
      await supabase
        .from('app_settings')
        .upsert({
          user_id: userId,
          payment_terms: terms
        }, { onConflict: 'user_id' });
      
      toast.success("Payment terms updated");
    } catch (error) {
      console.error('Error saving payment terms:', error);
      toast.error("Failed to save payment terms");
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      setLogoUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleManualSave = async () => {
    if (!userId) {
      toast.error("Please log in to save settings");
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
        // Keep the local preview URL for immediate display
        // The signed URL will be generated on next page load

        // Save the logo URL to brand_settings
        const { error: updateError } = await supabase
          .from('brand_settings')
          .upsert({
            user_id: userId,
            logo_url: finalLogoUrl,
            company_name: companyName,
            email: email,
            phone: phone,
            website,
            address,
            vat_number: vatNumber,
            account_name: accountName,
            bank_name: bankName,
            sort_code: sortCode,
            account_number: accountNumber,
            iban: iban,
            swift_bic: swiftBic,
            payment_notes: paymentNotes
          }, {
            onConflict: 'user_id'
          });

        if (updateError) throw updateError;
      }

      toast.success("Settings saved successfully");
      setLogoFile(null);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto w-full">
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center gap-4 p-4 h-16">
              <SidebarTrigger />
              <h1 className="font-heading text-2xl">Settings</h1>
            </div>
          </header>

          <div className="p-6 space-y-6 max-w-3xl">
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
                    />
                    <Button variant="outline" size="sm" disabled>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo preview" className="h-20 object-contain mt-2" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Company Ltd"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@yourcompany.com"
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat-number">VAT Number</Label>
                  <Input
                    id="vat-number"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="GB123456789"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading">Bank Details</CardTitle>
                <CardDescription>Payment information for invoices only</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Account Name</Label>
                  <Input
                    id="account-name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <Input
                    id="bank-name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="HSBC Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort-code">Sort Code</Label>
                  <Input
                    id="sort-code"
                    value={sortCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setSortCode(value);
                    }}
                    placeholder="123456"
                    maxLength={6}
                  />
                  {sortCode && sortCode.length !== 6 && (
                    <p className="text-sm text-destructive">Sort code must be 6 digits</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-number">Account Number</Label>
                  <Input
                    id="account-number"
                    value={accountNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setAccountNumber(value);
                    }}
                    placeholder="12345678"
                    maxLength={8}
                  />
                  {accountNumber && accountNumber.length !== 8 && (
                    <p className="text-sm text-destructive">Account number must be 8 digits</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={iban}
                    onChange={(e) => setIban(e.target.value.toUpperCase())}
                    placeholder="GB29 NWBK 6016 1331 9268 19"
                  />
                  {iban && !/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban.replace(/\s/g, '')) && (
                    <p className="text-sm text-destructive">IBAN format: 2 letters, 2 digits, then alphanumeric</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="swift-bic">SWIFT/BIC</Label>
                  <Input
                    id="swift-bic"
                    value={swiftBic}
                    onChange={(e) => setSwiftBic(e.target.value.toUpperCase())}
                    placeholder="HBUKGB4B"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-notes">Payment Notes (Optional)</Label>
                  <Textarea
                    id="payment-notes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Include reference number in payment"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-terms">Payment Terms</Label>
                  <Select value={paymentTerms.toString()} onValueChange={handlePaymentTermsChange}>
                    <SelectTrigger id="payment-terms">
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Same day</SelectItem>
                      <SelectItem value="7">Within the week (7 days)</SelectItem>
                      <SelectItem value="15">15 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleManualSave} disabled={loading} className="w-full md:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Logo"}
            </Button>
            <p className="text-sm text-muted-foreground">Brand settings auto-save as you type</p>
          </div>
          <Footer compact />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings;