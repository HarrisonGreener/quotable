-- Add summary field to quotes table for professional client-facing descriptions
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add summary field to invoices table for professional client-facing descriptions  
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS summary TEXT;