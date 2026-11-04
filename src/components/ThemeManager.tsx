import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserTheme } from '@/hooks/useUserTheme';
import { useSearchParams } from 'react-router-dom';

export const ThemeManager = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { resetToDefault } = useUserTheme();

  useEffect(() => {
    // Reset theme to default when in demo mode or on landing page (no user)
    if (isDemo || !user) {
      resetToDefault();
    }
  }, [user, isDemo]);

  return <>{children}</>;
};
