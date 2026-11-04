import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

/**
 * A navigation utility for toast actions and button clicks.
 * Uses React Router's navigate to avoid full page reloads.
 */
export function useNavigateToAuth() {
  const navigate = useNavigate();
  
  const goToAuth = useCallback(() => {
    navigate("/auth");
  }, [navigate]);
  
  return { goToAuth, navigate };
}

/**
 * Creates a navigate function that can be used in toast actions.
 * Call this at component level and pass the returned function to toasts.
 */
export function createAuthNavigator(navigate: (path: string) => void) {
  return () => navigate("/auth");
}
