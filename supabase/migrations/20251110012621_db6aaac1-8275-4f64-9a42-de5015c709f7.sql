-- Create user_theme_settings table
CREATE TABLE public.user_theme_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  theme TEXT NOT NULL DEFAULT 'light',
  color_palette TEXT NOT NULL DEFAULT 'Professional Blue',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_theme_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_theme_settings
CREATE POLICY "Users can view their own theme settings" 
ON public.user_theme_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own theme settings" 
ON public.user_theme_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own theme settings" 
ON public.user_theme_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_theme_settings_updated_at
BEFORE UPDATE ON public.user_theme_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create app_settings table
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  currency TEXT NOT NULL DEFAULT 'GBP',
  language TEXT NOT NULL DEFAULT 'en',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  invoice_reminders BOOLEAN NOT NULL DEFAULT true,
  pdf_theme TEXT NOT NULL DEFAULT 'classic',
  quote_expiry INTEGER NOT NULL DEFAULT 30,
  payment_terms INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for app_settings
CREATE POLICY "Users can view their own app settings" 
ON public.app_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own app settings" 
ON public.app_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own app settings" 
ON public.app_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();