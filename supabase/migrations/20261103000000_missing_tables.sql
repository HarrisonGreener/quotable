-- Tables that exist in the old Lovable database but were never captured in a
-- migration. Recreated here so a fresh Supabase project matches it exactly.

CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text NOT NULL,
  description text,
  amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client text NOT NULL,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL,
  frequency text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_invoice_date date,
  next_invoice_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own invoice templates" ON public.invoice_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own recurring invoices" ON public.recurring_invoices
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
