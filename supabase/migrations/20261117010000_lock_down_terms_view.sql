-- Security fix: the terms_acceptances_with_emails view ran with its owner's rights,
-- so anyone holding the public (anon) key could read every user's email, IP address
-- and browser. Make it respect the table's row rules, keep it away from anon, and
-- only reveal an email to that user or an admin.

alter view public.terms_acceptances_with_emails set (security_invoker = true);
revoke all on public.terms_acceptances_with_emails from anon, public;
grant select on public.terms_acceptances_with_emails to authenticated;

create or replace function public.get_user_email_for_acceptance(user_id_param uuid)
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select u.email::text
  from auth.users u
  where u.id = user_id_param
    and (auth.uid() = user_id_param or public.has_role(auth.uid(), 'admin'::public.app_role));
$$;
revoke execute on function public.get_user_email_for_acceptance(uuid) from anon, public;
grant execute on function public.get_user_email_for_acceptance(uuid) to authenticated;
