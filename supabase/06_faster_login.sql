-- 06_faster_login.sql - speeds up sign-in (indexes on registration numbers, lighter login).
-- Run ONCE in the Supabase SQL Editor (safe to run again).

create index if not exists registered_user_reg_idx on public.registered_user ((public.app_norm(data->>'regNumber')));
create index if not exists admin_user_reg_idx      on public.admin_user      ((public.app_norm(data->>'regNumber')));
create index if not exists valid_user_reg_idx      on public.valid_user      ((public.app_norm(data->>'regNumber')));

create or replace function public.app_login(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  reg text := public.app_norm(args->>'reg');
  pw  text := coalesce(args->>'password', '');
  att record; k text; cred record; row_id uuid; row_data jsonb; tok text;
begin
  if reg = '' or pw = '' then perform public.app_fail('P0001', 'Enter your registration number and password'); end if;

  select * into att from public.app_login_attempts where reg_key = reg;
  if found and att.locked_until is not null and att.locked_until > now() then
    return jsonb_build_object('error', 'Too many failed attempts. Try again in ' ||
      greatest(1, ceil(extract(epoch from (att.locked_until - now())) / 60))::int || ' minute(s).', 'status', 429);
  end if;

  k := null;
  select c.* into cred from public.app_credentials c
    join public.admin_user a on public.app_norm(a.data->>'regNumber') = c.reg_key
   where c.kind = 'admin' and c.reg_key = reg;
  if found and cred.pw_hash = crypt(pw, cred.pw_hash) then
    k := 'admin';
    select id, data into row_id, row_data from public.admin_user where public.app_norm(data->>'regNumber') = reg;
  else
    select c.* into cred from public.app_credentials c
      join public.registered_user r on public.app_norm(r.data->>'regNumber') = c.reg_key
     where c.kind = 'student' and c.reg_key = reg;
    if found and cred.pw_hash = crypt(pw, cred.pw_hash) then
      k := 'student';
      select id, data into row_id, row_data from public.registered_user where public.app_norm(data->>'regNumber') = reg;
    end if;
  end if;

  if k is null then
    insert into public.app_login_attempts (reg_key, fails) values (reg, 1)
    on conflict (reg_key) do update set
      fails = case when public.app_login_attempts.locked_until is not null and public.app_login_attempts.locked_until <= now()
                   then 1 else public.app_login_attempts.fails + 1 end,
      locked_until = case when (case when public.app_login_attempts.locked_until is not null and public.app_login_attempts.locked_until <= now()
                                     then 1 else public.app_login_attempts.fails + 1 end) >= 5
                          then now() + interval '15 minutes' else null end;
    -- return (not raise) so the failed-attempt counter is saved instead of rolled back
    return jsonb_build_object('error', 'Incorrect registration number or password', 'status', 401);
  end if;

  delete from public.app_login_attempts where reg_key = reg;
  if random() < 0.05 then delete from public.app_sessions where expires_at < now(); end if;  -- cleanup now and then, not on every login
  tok := encode(gen_random_bytes(32), 'hex');
  insert into public.app_sessions (token_hash, kind, reg_key, obj_id, expires_at)
  values (encode(digest(tok, 'sha256'), 'hex'), k, reg, row_id, now() + interval '30 days');

  return jsonb_build_object('token', tok, 'kind', k, 'objectId', row_id, 'user', row_data - 'password');
end $$;
