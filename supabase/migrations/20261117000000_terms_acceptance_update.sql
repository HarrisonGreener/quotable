-- Let people update their own terms acceptance (needed when the terms change).
-- Without this, accepting new terms silently failed and people were asked every visit.
drop policy if exists "Users can update their own terms acceptance" on public.user_terms_acceptance;
create policy "Users can update their own terms acceptance"
  on public.user_terms_acceptance for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
