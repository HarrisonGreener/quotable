import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clearDemoData } from "@/utils/demoMode";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  needsCompliance: boolean;
  isFirstLogin: boolean;
  signOut: () => Promise<void>;
  markCompliant: () => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsCompliance, setNeedsCompliance] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  useEffect(() => {
    let hasCheckedCompliance = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Only check compliance once per session, and only on actual sign-in (not token refresh)
        if (event === 'SIGNED_IN' && !hasCheckedCompliance && session?.user) {
          hasCheckedCompliance = true;
          // Clear any lingering demo data when user signs in
          clearDemoData();
          // Defer any Supabase calls to avoid deadlock
          setTimeout(() => {
            initializeUserData(session.user);
            checkCompliance(session.user);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check compliance for existing session
      if (session?.user && !hasCheckedCompliance) {
        hasCheckedCompliance = true;
        setTimeout(() => {
          checkCompliance(session.user);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkCompliance = async (user: User | undefined) => {
    if (!user || isDemo) return;

    try {
      const { data: acceptance, error } = await supabase
        .from('user_terms_acceptance')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      // If no acceptance record or error (not found), user needs to accept
      if (error && error.code === 'PGRST116') {
        setNeedsCompliance(true);
        return;
      }

      // Check if user needs to accept updated terms/privacy
      const needsAcceptance = !acceptance || 
                              !acceptance.privacy_accepted || 
                              acceptance.terms_version !== '1.0' || 
                              acceptance.privacy_version !== '1.0';

      setNeedsCompliance(needsAcceptance);
    } catch (error) {
      console.error('Error checking compliance:', error);
    }
  };

  const markCompliant = () => {
    setNeedsCompliance(false);
  };

  const initializeUserData = async (user: User | undefined) => {
    if (!user) return;

    try {
      // Check if app settings exist first to determine if this is a NEW user
      const { data: appSettings } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      const isNewUser = !appSettings;

      // Use upsert for terms acceptance to prevent duplicates
      await supabase.from('user_terms_acceptance').upsert({
        user_id: user.id,
        terms_version: '1.0',
        privacy_accepted: true,
        privacy_version: '1.0',
        privacy_accepted_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
      }, {
        onConflict: 'user_id'
      });
      
      // Send welcome email ONLY for truly new Google OAuth users
      if (isNewUser) {
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              userEmail: user.email || '',
            }
          });
        } catch (emailError) {
          console.error('Welcome email failed for Google user:', emailError);
          // Don't block initialization if email fails
        }
      }

      // Check if brand settings exist, create default if not
      const { data: brandSettings } = await supabase
        .from('brand_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!brandSettings) {
        await supabase.from('brand_settings').insert({
          user_id: user.id,
          company_name: user.user_metadata?.business_name || '',
          email: user.email || '',
        });
      }

      // Create app settings if this is a new user (checked above)
      if (isNewUser) {
        // First-time user - show welcome tour
        setIsFirstLogin(true);
        await supabase.from('app_settings').insert({
          user_id: user.id,
          onboarding_completed: false,
          setup_checklist: {
            brand_added: false,
            quote_created: false,
            invoice_created: false,
            job_scheduled: false,
          },
        });
      } else if (appSettings.onboarding_completed === false) {
        // User hasn't completed onboarding yet
        setIsFirstLogin(true);
      }

      // Check if theme settings exist, create default if not
      const { data: themeSettings } = await supabase
        .from('user_theme_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!themeSettings) {
        await supabase.from('user_theme_settings').insert({
          user_id: user.id,
        });
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    navigate('/auth');
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    setIsFirstLogin(false);
    
    try {
      await supabase
        .from('app_settings')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      needsCompliance, 
      isFirstLogin,
      signOut, 
      markCompliant,
      completeOnboarding 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
