import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Stripe product/price IDs
export const STRIPE_PRODUCTS = {
  monthly: {
    productId: 'prod_Tch128VW012Eti',
    priceId: 'price_1SfRczEbsySHJL70bX2oXV2R',
    price: 14.99,
    interval: 'month',
  },
  annual: {
    productId: 'prod_Tch1BZWFrWWxTo',
    priceId: 'price_1SfRdPEbsySHJL708DMVKQW6',
    price: 159.99,
    interval: 'year',
  },
} as const;

// Admin emails that bypass subscription checks
// Only used to skip the paywall screen in the browser; the server checks roles itself.
const ADMIN_EMAILS = ['harry@quotable-it.co.uk'];

interface SubscriptionStatus {
  subscribed: boolean;
  isTrialing: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  trialEnd: string | null;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
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
        subscriptionEnd: data.subscriptionEnd ?? null,
        trialEnd: data.trialEnd ?? null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
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

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
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
      window.open(data.url, '_blank');
    }
  };

  const getPlanName = () => {
    if (!subscription.subscribed) return null;
    if (subscription.productId === STRIPE_PRODUCTS.annual.productId) return 'Annual';
    if (subscription.productId === STRIPE_PRODUCTS.monthly.productId) return 'Monthly';
    return 'Pro';
  };

  return {
    ...subscription,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    getPlanName,
    isActive: isAdmin || subscription.subscribed,
    isAdmin,
  };
}
