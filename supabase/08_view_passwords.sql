-- Lets the FOUNDER & CEO view passwords (eye icon) on Registered Users and Administration.
-- NOTE: this stores a readable copy of each password saved from now on. Existing users show
-- "not available" until their password is next set/reset/changed.  Safe to run more than once.

alter table public.app_credentials add column if not exists pw_plain text;

create or replace function public.app_set_cred(p_kind text, p_reg text, p_pw text) returns void
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if p_pw is null or length(p_pw) < 6 then
    perform public.app_fail('P0001', 'Password must be at least 6 characters');
  end if;
  insert into public.app_credentials (kind, reg_key, pw_hash, pw_plain)
  values (p_kind, public.app_norm(p_reg), crypt(p_pw, gen_salt('bf', 10)), p_pw)
  on conflict (kind, reg_key) do update set pw_hash = excluded.pw_hash, pw_plain = excluded.pw_plain, updated_at = now();
end $$;

-- the FOUNDER & CEO can view a password (only passwords saved after this upgrade are readable)
create or replace function public.app_view_password(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare a jsonb := public.app_need(args->>'token'); p text;
begin
  if coalesce(a->>'authority','') <> 'FOUNDER & CEO' then
    perform public.app_fail('PT403', 'Only the FOUNDER & CEO can view passwords');
  end if;
  select c.pw_plain into p from public.app_credentials c
   where c.kind = case when args->>'kind' = 'admin' then 'admin' else 'student' end
     and c.reg_key = public.app_norm(args->>'reg');
  return jsonb_build_object('password', p);
end $$;

revoke all on function public.app_view_password(jsonb) from public, anon, authenticated;
grant execute on function public.app_view_password(jsonb) to anon, authenticated;
