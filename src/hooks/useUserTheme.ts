import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';

export interface ColorPalette {
  name: string;
  light: {
    primary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  dark: {
    primary: string;
    accent: string;
    background: string;
    foreground: string;
  };
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    name: 'Professional Blue',
    light: {
      primary: '210 78% 16%',
      accent: '24 80% 42%',
      background: '0 0% 97.3%',
      foreground: '0 0% 10%'
    },
    dark: {
      primary: '210 60% 25%',
      accent: '24 80% 42%',
      background: '210 78% 8%',
      foreground: '0 0% 98%'
    }
  },
  {
    name: 'Modern Purple',
    light: {
      primary: '270 60% 40%',
      accent: '340 80% 50%',
      background: '0 0% 98%',
      foreground: '0 0% 10%'
    },
    dark: {
      primary: '270 50% 50%',
      accent: '340 70% 55%',
      background: '270 40% 8%',
      foreground: '0 0% 98%'
    }
  },
  {
    name: 'Fresh Green',
    light: {
      primary: '150 60% 30%',
      accent: '45 85% 50%',
      background: '0 0% 97%',
      foreground: '0 0% 10%'
    },
    dark: {
      primary: '150 50% 40%',
      accent: '45 75% 55%',
      background: '150 40% 8%',
      foreground: '0 0% 98%'
    }
  },
  {
    name: 'Bold Red',
    light: {
      primary: '0 70% 40%',
      accent: '210 80% 50%',
      background: '0 0% 97%',
      foreground: '0 0% 10%'
    },
    dark: {
      primary: '0 60% 50%',
      accent: '210 70% 55%',
      background: '0 40% 8%',
      foreground: '0 0% 98%'
    }
  }
];

export const useUserTheme = () => {
  const { theme, setTheme } = useTheme();
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette>(COLOR_PALETTES[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserTheme();
    
    // Listen for auth changes to reset theme on logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        resetToDefault();
      } else if (event === 'SIGNED_IN' && session?.user) {
        loadUserTheme();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const resetToDefault = () => {
    setTheme('light');
    const defaultPalette = COLOR_PALETTES[0];
    applyColorPalette(defaultPalette, 'light');
    setSelectedPalette(defaultPalette);
  };

  const loadUserTheme = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        resetToDefault();
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_theme_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTheme(data.theme || 'light');
        const palette = COLOR_PALETTES.find(p => p.name === data.color_palette) || COLOR_PALETTES[0];
        applyColorPalette(palette, data.theme || 'light');
        setSelectedPalette(palette);
      } else {
        resetToDefault();
      }
    } catch (error) {
      console.error('Error loading user theme:', error);
      resetToDefault();
    } finally {
      setLoading(false);
    }
  };

  const applyColorPalette = (palette: ColorPalette, mode: string) => {
    const root = document.documentElement;
    const colors = mode === 'dark' ? palette.dark : palette.light;

    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
  };

  const updateTheme = async (newTheme: string, palette?: ColorPalette) => {
    setTheme(newTheme);
    const paletteToApply = palette || selectedPalette;
    applyColorPalette(paletteToApply, newTheme);

    if (palette) {
      setSelectedPalette(palette);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_theme_settings')
        .upsert({
          user_id: user.id,
          theme: newTheme,
          color_palette: paletteToApply.name
        }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return {
    theme,
    selectedPalette,
    loading,
    updateTheme,
    resetToDefault,
    palettes: COLOR_PALETTES
  };
};
