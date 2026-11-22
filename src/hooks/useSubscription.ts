import { useState, useEffect, useCallback } from 'react';
import { getPromo } from "@/utils/promo";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Stripe product/price IDs
export const STRIPE_PRODUCTS = {
  monthly: {
    productId: 'prod_VdrgDNMBgv7pnT',
    priceId: 'price_1UcZxJIlyZyID4OeJdFgtWyc',
    price: 14.99,
    interval: 'month',
  },
  annual: {
    productId: 'prod_VdrgDNMBgv7pnT',
    priceId: 'price_1UcZxKIlyZyID4OeQHFbHXLw',
    price: 159.99,
    interval: 'year',
  },
} as const;

// Admin emails that bypass subscription checks
// Only used to skip the paywall screen in the browser; the server checks roles itself.
const ADMIN_EMAILS = ['harrygreener01@gmail.com', 'harrison@quotable.uk'];

interface SubscriptionStatus {
  subscribed: boolean;
  isTrialing: boolean;
  productId: string | null;
  priceId?: string | null;
  cancelAtPeriodEnd?: boolean;
  subscriptionEnd: string | null;
  trialEnd: string | null;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  // True once the first check has finished. Later background re-checks don't count
  // as "loading", so they never blank the page mid-task.
  const [checked, setChecked] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    isTrialing: false,
    productId: null,
    subscriptionEnd: null,
    trialEnd: null,
  });

  // Check if user is an admin (bypasses subscription)
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setSubscription({
        subscribed: false,
        isTrialing: false,
        productId: null,
        subscriptionEnd: null,
        trialEnd: null,
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setSubscription({
        subscribed: data.subscribed ?? false,
        isTrialing: data.isTrialing ?? false,
        productId: data.productId ?? null,
        priceId: data.priceId ?? null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        subscriptionEnd: data.subscriptionEnd ?? null,
        trialEnd: data.trialEnd ?? null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
      setChecked(true);
    }
  }, [session?.access_token]);

  // Check subscription on mount and when session changes
  useEffect(() => {
    if (session?.access_token) {
      checkSubscription();
    }
  }, [session?.access_token, checkSubscription]);

  // Auto-refresh subscription status every minute
  useEffect(() => {
    if (!session?.access_token) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, [session?.access_token, checkSubscription]);

  const createCheckout = async (priceId: string) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const promoCode = getPromo();
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId, ...(promoCode ? { promoCode } : {}) },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    if (data?.url) {
      // Same tab: a new tab opened after a wait is often blocked on phones
      window.location.assign(data.url);
    }
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('customer-portal', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    if (data?.url) {
      window.location.assign(data.url);
    }
  };

  /** Cancel at the end of the paid period, or undo a pending cancel. */
  const setCancelled = async (cancel: boolean, reason?: string) => {
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: { action: cancel ? 'cancel' : 'resume', ...(reason ? { reason } : {}) },
    });
    if (error) throw error;
    setSubscription((s) => ({ ...s, cancelAtPeriodEnd: !!data?.cancelAtPeriodEnd }));
    return data as { cancelAtPeriodEnd: boolean; accessUntil: string | null };
  };

  const getPlanName = () => {
    if (!subscription.subscribed) return null;
    // Both plans are prices on one Stripe product, so tell them apart by price
    if (subscription.priceId === STRIPE_PRODUCTS.annual.priceId) return 'Annual';
    if (subscription.priceId === STRIPE_PRODUCTS.monthly.priceId) return 'Monthly';
    return 'Pro';
  };

  return {
    ...subscription,
    loading,
    /** Only true until the first check is done: use this to gate the page */
    initialLoading: !!session?.access_token && !checked && !isAdmin,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    setCancelled,
    getPlanName,
    isActive: isAdmin || subscription.subscribed,
    isAdmin,
  };
}
