-- Create quote_templates table for saving reusable quote configurations
CREATE TABLE public.quote_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  job_description TEXT NOT NULL,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  labour JSONB NOT NULL DEFAULT '[]'::jsonb,
  overheads JSONB NOT NULL DEFAULT '[]'::jsonb,
  equipment_rental BOOLEAN DEFAULT false,
  num_workers INTEGER DEFAULT 1,
  payment_type TEXT DEFAULT 'job'::text,
  hourly_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own templates" 
ON public.quote_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
ON public.quote_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.quote_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.quote_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quote_templates_updated_at
BEFORE UPDATE ON public.quote_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();