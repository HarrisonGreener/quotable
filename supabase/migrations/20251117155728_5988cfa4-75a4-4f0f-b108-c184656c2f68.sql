-- Create clients table for storing customer information
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients table
CREATE POLICY "Users can view their own clients"
ON public.clients
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients"
ON public.clients
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
ON public.clients
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
ON public.clients
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates on clients
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add client_id to quotes table (keep old client text field for migration)
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Add client_id to invoices table (keep old client text field for migration)
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;