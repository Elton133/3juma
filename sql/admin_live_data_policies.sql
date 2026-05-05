-- Needed for the admin dashboard to show real names/phones in joined views.
-- The helper avoids recursive public.users RLS checks inside a public.users policy.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where auth_id = auth.uid()
      and role = 'admin'
  );
$$;

drop policy if exists "Admins read all users" on public.users;
create policy "Admins read all users"
  on public.users for select
  using (public.is_admin());

