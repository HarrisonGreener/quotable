import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppSettings {
  include_vat: boolean;
  pdf_theme: string;
  payment_terms: number;
  default_hourly_rate?: number | null;
  default_callout_fee?: number | null;
  default_day_rate?: number | null;
  quote_generation_mode?: 'minimal' | 'detailed';
  skip_ai_pricing?: boolean;
  primary_trade?: string | null;
  secondary_trades?: string[] | null;
  business_type?: 'residential' | 'commercial' | 'both' | null;
  typical_job_size?: 'small' | 'medium' | 'large' | 'all' | null;
  specializations?: string[] | null;
  certifications?: string[] | null;
  trade_notes?: string | null;
  other_trade_name?: string | null;
  other_trade_description?: string | null;
  other_trade_similar_to?: string | null;
  other_trade_attributes?: string[] | null;
  preferred_suppliers?: string[] | null;
}

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>({ 
    include_vat: true,
    pdf_theme: 'minimalist',
    payment_terms: 30,
    default_hourly_rate: null,
    default_callout_fee: null,
    default_day_rate: null,
    quote_generation_mode: 'minimal',
    skip_ai_pricing: false,
    primary_trade: null,
    secondary_trades: null,
    business_type: 'both',
    typical_job_size: 'all',
    specializations: null,
    certifications: null,
    trade_notes: null,
    other_trade_name: null,
    other_trade_description: null,
    other_trade_similar_to: null,
    other_trade_attributes: null,
    preferred_suppliers: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('app_settings')
        .select('include_vat, pdf_theme, payment_terms, default_hourly_rate, default_callout_fee, default_day_rate, quote_generation_mode, skip_ai_pricing, primary_trade, secondary_trades, business_type, typical_job_size, specializations, certifications, trade_notes, other_trade_name, other_trade_description, other_trade_similar_to, other_trade_attributes, preferred_suppliers')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          include_vat: data.include_vat !== false,
          pdf_theme: data.pdf_theme || 'minimalist',
          payment_terms: data.payment_terms || 30,
          default_hourly_rate: data.default_hourly_rate,
          default_callout_fee: data.default_callout_fee,
          default_day_rate: data.default_day_rate,
          quote_generation_mode: (data.quote_generation_mode as 'minimal' | 'detailed') || 'minimal',
          skip_ai_pricing: data.skip_ai_pricing || false,
          primary_trade: data.primary_trade,
          secondary_trades: data.secondary_trades as string[] | null,
          business_type: (data.business_type as 'residential' | 'commercial' | 'both') || 'both',
          typical_job_size: (data.typical_job_size as 'small' | 'medium' | 'large' | 'all') || 'all',
          specializations: data.specializations as string[] | null,
          certifications: data.certifications as string[] | null,
          trade_notes: data.trade_notes,
          other_trade_name: data.other_trade_name,
          other_trade_description: data.other_trade_description,
          other_trade_similar_to: data.other_trade_similar_to,
          other_trade_attributes: data.other_trade_attributes as string[] | null,
          preferred_suppliers: data.preferred_suppliers as string[] | null,
        });
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refetch: loadSettings };
};
