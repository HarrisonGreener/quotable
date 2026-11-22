import { useState, useEffect, useCallback } from "react";
import { TERMS_VERSION, PRIVACY_VERSION } from "@/config/legal";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsDialog } from "@/components/TermsDialog";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import { z } from "zod";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { OFFER } from "@/config/offer";

const signupSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  confirmEmail: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long")
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
  name: z.string().min(2, "Name is required").max(100, "Name too long").trim(),
  business: z.string().min(2, "Business name is required").max(200, "Business name too long").trim(),
}).refine((data) => data.email === data.confirmEmail, {
  message: "Email addresses don't match",
  path: ["confirmEmail"],
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  password: z.string().min(1, "Password is required"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (user && !isDemoMode) {
      navigate("/dashboard");
    }
  }, [user, isDemoMode, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate input
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    toast.success("Welcome back!");
    navigate("/dashboard");
    setIsLoading(false);
  };

  const recordTermsAcceptance = async (userId: string) => {
    try {
      await supabase.from('user_terms_acceptance').insert({
        user_id: userId,
        terms_version: TERMS_VERSION,
        privacy_accepted: true,
        privacy_version: PRIVACY_VERSION,
        privacy_accepted_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      // Error recording terms acceptance - log server-side only
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!termsAccepted) {
      toast.error("Please accept the Terms and Conditions to continue");
      setIsLoading(false);
      return;
    }
    
    if (!privacyAccepted) {
      toast.error("Please accept the Privacy Policy to continue");
      setIsLoading(false);
      return;
    }
    
    // Validate input with zod
    const validation = signupSchema.safeParse({
      email,
      confirmEmail,
      password,
      name,
      business,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { data, error } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: validation.data.name,
          business_name: validation.data.business,
          // Ticked on the sign-up form; saved properly on first sign-in
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_VERSION,
          terms_accepted_at: new Date().toISOString(),
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      await recordTermsAcceptance(data.user.id);
      
      // Send welcome email (non-blocking)
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            userName: validation.data.name,
            userEmail: validation.data.email,
          }
        });
      } catch (emailError) {
        console.error('Welcome email failed:', emailError);
        // Don't block signup if email fails
      }
    }

    toast.success("Account created successfully!");
    navigate("/dashboard");
    setIsLoading(false);
  };

  const goToDashboard = useCallback(() => navigate("/dashboard"), [navigate]);

  const handleDemo = () => {
    toast.success("Entering demo mode with example data");
    navigate("/dashboard?demo=true");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate email
    const emailValidation = z.string().email("Invalid email format").safeParse(resetEmail);
    if (!emailValidation.success) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    setResetSent(true);
    toast.success("Password reset email sent! Check your inbox.");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] bg-background">
      {/* Brand panel */}
      <aside className="hidden lg:flex flex-col justify-between bg-primary text-white p-12 xl:p-16">
        <Logo inverted size="lg" />
        <div>
          <p className="font-heading text-4xl xl:text-5xl leading-[1.05] max-w-md">
            Type the job.
            <br />
            Get a priced quote.
          </p>
          <p className="mt-5 text-white/70 max-w-sm leading-relaxed">
            Materials priced live at UK merchants, your labour worked out, ready to send from the van.
          </p>
        </div>
        <p className="text-sm text-white/50">Quotes, jobs and invoices for UK tradespeople.</p>
      </aside>

      <div className="flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="lg:hidden mb-8">
          <Logo size="lg" />
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              {isDemoMode ? "Look around with sample data" : "Log in or sign up"}
            </CardTitle>
            <CardDescription>
              {isDemoMode
                ? "A sample account with example quotes, jobs and invoices."
                : `${OFFER.badge ? OFFER.badge + ": your " : "Your "}${OFFER.short}.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDemoMode ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Demo mode includes sample quotes, invoices, and financial data. 
                  Your changes won't be saved.
                </p>
                <Button 
                  onClick={handleDemo}
                  variant="accent"
                  className="w-full"
                  size="lg"
                >
                  Open the sample account
                </Button>
                <Button 
                  onClick={() => navigate("/auth")}
                  variant="outline"
                  className="w-full"
                >
                  Back to log in
                </Button>
              </div>
            ) : (
              <>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    {showForgotPassword ? (
                      <div className="space-y-4">
                        {!resetSent ? (
                          <>
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold">Reset Password</h3>
                              <p className="text-sm text-muted-foreground">
                                Enter your email address and we'll send you a link to reset your password.
                              </p>
                            </div>
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="reset-email">Email</Label>
                                <Input 
                                  id="reset-email" 
                                  type="email" 
                                  placeholder="you@example.com"
                                  value={resetEmail}
                                  onChange={(e) => setResetEmail(e.target.value)}
                                  required 
                                />
                              </div>
                              <Button 
                                type="submit" 
                                className="w-full"
                                disabled={isLoading}
                                variant="default"
                              >
                                {isLoading ? "Sending..." : "Send Reset Link"}
                              </Button>
                            </form>
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(false)}
                              className="text-sm text-primary hover:underline w-full text-center"
                            >
                              Back to log in
                            </button>
                          </>
                        ) : (
                          <div className="space-y-4 text-center py-4">
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-primary">Check Your Email</h3>
                              <p className="text-sm text-muted-foreground">
                                We've sent a password reset link to <strong>{resetEmail}</strong>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                The link will expire in 10 minutes.
                              </p>
                            </div>
                            <Button
                              onClick={() => {
                                setShowForgotPassword(false);
                                setResetSent(false);
                                setResetEmail("");
                              }}
                              variant="outline"
                              className="w-full"
                            >
                              Back to log in
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Input 
                              id="password" 
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required 
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-sm text-primary hover:underline"
                            >
                              Forgot your password?
                            </button>
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={isLoading}
                          variant="default"
                        >
                          {isLoading ? "Logging in..." : "Login"}
                        </Button>
                      </form>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          type="text" 
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business">Business Name</Label>
                        <Input 
                          id="business" 
                          type="text" 
                          placeholder="Your Business Ltd"
                          value={business}
                          onChange={(e) => setBusiness(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input 
                          id="signup-email" 
                          type="email" 
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-email">Confirm Email</Label>
                        <Input 
                          id="confirm-email" 
                          type="email" 
                          placeholder="you@example.com"
                          value={confirmEmail}
                          onChange={(e) => setConfirmEmail(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Input 
                            id="signup-password" 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            aria-describedby="signup-password-hint"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        <p id="signup-password-hint" className="text-xs text-muted-foreground">At least 8 characters, with a letter and a number.</p>
                      </div>
                      
                      <div className="space-y-3 pt-2">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="terms"
                            checked={termsAccepted}
                            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                          />
                          <Label
                            htmlFor="terms"
                            className="text-sm leading-tight cursor-pointer"
                          >
                            I agree to the{" "}
                            <button
                              type="button"
                              onClick={() => setShowTermsDialog(true)}
                              className="text-primary hover:underline font-medium"
                            >
                              Terms and Conditions
                            </button>
                          </Label>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="privacy"
                            checked={privacyAccepted}
                            onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                          />
                          <Label
                            htmlFor="privacy"
                            className="text-sm leading-tight cursor-pointer"
                          >
                            I agree to the{" "}
                            <button
                              type="button"
                              onClick={() => setShowPrivacyDialog(true)}
                              className="text-primary hover:underline font-medium"
                            >
                              Privacy Policy
                            </button>
                          </Label>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isLoading}
                        variant="accent"
                      >
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <GoogleSignIn onSignedIn={goToDashboard} disabled={isLoading} />
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <Button
                    onClick={() => navigate("/auth?demo=true")}
                    variant="ghost"
                    className="w-full"
                  >
                    Look around with sample data
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      </div>

      <TermsDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        onAccept={() => setTermsAccepted(true)}
      />
      
      <PrivacyDialog
        open={showPrivacyDialog}
        onOpenChange={setShowPrivacyDialog}
        onAccept={() => setPrivacyAccepted(true)}
      />
    </div>
  );
};

export default Auth;
