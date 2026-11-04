import { useState, useEffect } from "react";
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

const signupSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  confirmEmail: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long"),
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
        terms_version: '1.0',
        privacy_accepted: true,
        privacy_version: '1.0',
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="justify-center mb-4" size="lg" />
          <p className="text-muted-foreground">
            AI-powered quotes, invoices & insights
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              {isDemoMode ? "Try Demo Mode" : "Welcome"}
            </CardTitle>
            <CardDescription>
              {isDemoMode 
                ? "Explore Quotable with pre-filled example data" 
                : "Sign in to your account or create a new one"
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
                  Enter Demo Mode
                </Button>
                <Button 
                  onClick={() => navigate("/auth")}
                  variant="outline"
                  className="w-full"
                >
                  Back to Login
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
                              Back to Login
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
                              Back to Login
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
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <Button
                    onClick={() => navigate("/auth?demo=true")}
                    variant="ghost"
                    className="w-full"
                  >
                    Try Demo Mode Instead
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
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
