import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrandSettings {
  company_name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  vat_number: string;
  logo_url: string;
  account_name: string;
  bank_name: string;
  sort_code: string;
  account_number: string;
  iban: string;
  swift_bic: string;
  payment_notes: string;
}

const DEMO_BRAND_SETTINGS: BrandSettings = {
  company_name: 'Demo Construction Ltd',
  email: 'demo@democonstruction.com',
  phone: '+44 20 1234 5678',
  website: 'https://www.democonstruction.com',
  address: '123 Demo Street, London, UK, SW1A 1AA',
  vat_number: 'GB123456789',
  logo_url: '',
  account_name: '',
  bank_name: '',
  sort_code: '',
  account_number: '',
  iban: '',
  swift_bic: '',
  payment_notes: ''
};

// Helper function to generate signed URL for logo
const getSignedLogoUrl = async (logoPath: string): Promise<string> => {
  if (!logoPath) return '';
  
  // If it's already a full URL (legacy data), extract the path
  if (logoPath.startsWith('http')) {
    // Try to extract the file path from old public URLs
    const match = logoPath.match(/logos\/(.+)$/);
    if (match) {
      logoPath = match[1];
    } else {
      // Can't extract path, return empty (user will need to re-upload)
      return '';
    }
  }
  
  try {
    const { data, error } = await supabase.storage
      .from('logos')
      .createSignedUrl(logoPath, 3600); // 1 hour expiry
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return '';
    }
    
    return data?.signedUrl || '';
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return '';
  }
};

export const useBrandSettings = (isDemo: boolean = false) => {
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(
    isDemo ? DEMO_BRAND_SETTINGS : null
  );
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    if (!isDemo) {
      loadBrandSettings();
    }
  }, [isDemo]);

  const loadBrandSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBrandSettings(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('brand_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Generate signed URL for the logo
        const signedLogoUrl = await getSignedLogoUrl(data.logo_url || '');
        
        setBrandSettings({
          company_name: data.company_name || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          address: data.address || '',
          vat_number: data.vat_number || '',
          logo_url: signedLogoUrl,
          account_name: data.account_name || '',
          bank_name: data.bank_name || '',
          sort_code: data.sort_code || '',
          account_number: data.account_number || '',
          iban: data.iban || '',
          swift_bic: data.swift_bic || '',
          payment_notes: data.payment_notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading brand settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { brandSettings, loading, refetch: loadBrandSettings };
};

// Export helper for use in other components
export { getSignedLogoUrl };
