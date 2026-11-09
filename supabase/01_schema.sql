-- =====================================================================
-- HashCLASS - secure database layer for Supabase
-- Run ONCE in: Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Safe to re-run (everything is "create or replace" / "if not exists").
--
-- How security works
--   * The browser never touches the tables directly. RLS is on and no
--     policies exist, so the anon key alone can read/write NOTHING.
--   * Every action goes through the app_* functions below. They check a
--     login session token and the user's role (FOUNDER & CEO, Chief
--     Financial Officer, ...), then read/write the tables.
--   * Passwords are stored only as bcrypt hashes in app_credentials,
--     which is unreachable from the browser.
-- =====================================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. Data tables (same flexible shape for all of them)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'valid_user','registered_user','admin_user','lesson_package',
    'news_post','attendance_record','chat_message','password_request','month_period'
  ] loop
    execute format($f$
      create table if not exists public.%I (
        id uuid primary key default gen_random_uuid(),
        data jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )$f$, t);
    execute format('create index if not exists %I on public.%I (created_at desc, id desc)', t || '_created_idx', t);
    execute format('alter table public.%I enable row level security', t);
    -- remove any open policy from the earlier version of this project
    execute format('drop policy if exists "anon full access" on public.%I', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- internal tables (never exposed)
create table if not exists public.app_credentials (
  kind       text not null check (kind in ('student','admin')),
  reg_key    text not null,
  pw_hash    text not null,
  updated_at timestamptz not null default now(),
  primary key (kind, reg_key)
);
create table if not exists public.app_sessions (
  token_hash text primary key,
  kind       text not null,
  reg_key    text not null,
  obj_id     uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists app_sessions_reg_idx on public.app_sessions (kind, reg_key);
create table if not exists public.app_login_attempts (
  reg_key      text primary key,
  fails        int  not null default 0,
  locked_until timestamptz
);
do $$
declare t text;
begin
  foreach t in array array['app_credentials','app_sessions','app_login_attempts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------
create or replace function public.app_norm(p text) returns text
language sql immutable as $$
  select upper(regexp_replace(coalesce(p, ''), '\s+', '', 'g'))
$$;

-- one registration number = one account
create unique index if not exists registered_user_reg_uq on public.registered_user ((public.app_norm(data->>'regNumber')));
create unique index if not exists valid_user_reg_uq      on public.valid_user      ((public.app_norm(data->>'regNumber')));
create unique index if not exists admin_user_reg_uq      on public.admin_user      ((public.app_norm(data->>'regNumber')));
create index if not exists registered_user_reg_idx on public.registered_user ((public.app_norm(data->>'regNumber')));
create index if not exists admin_user_reg_idx      on public.admin_user      ((public.app_norm(data->>'regNumber')));
create index if not exists valid_user_reg_idx      on public.valid_user      ((public.app_norm(data->>'regNumber')));
create index if not exists attendance_date_idx on public.attendance_record ((data->>'date'));
create index if not exists attendance_user_idx on public.attendance_record ((public.app_norm(data->>'userId')));
create index if not exists chat_ts_idx         on public.chat_message (((data->>'timestamp')::numeric) desc);
create index if not exists package_id_idx      on public.lesson_package ((data->>'packageId'));

create or replace function public.app_fail(p_code text, p_msg text) returns void
language plpgsql as $$
begin
  raise exception '%', p_msg using errcode = p_code;
end $$;

-- who is calling? returns null when the token is missing/expired/revoked
create or replace function public.app_actor(p_token text) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare s record; a jsonb;
begin
  if p_token is null or p_token = '' then return null; end if;
  select * into s from public.app_sessions
   where token_hash = encode(digest(p_token, 'sha256'), 'hex') and expires_at > now();
  if not found then return null; end if;
  if s.kind = 'admin' then
    select jsonb_build_object('kind','admin','reg_key',s.reg_key,'obj_id',s.obj_id,'authority',data->>'authority','recorder',false)
      into a from public.admin_user where id = s.obj_id;
  else
    select jsonb_build_object('kind','student','reg_key',s.reg_key,'obj_id',s.obj_id,'authority',null,
             'recorder', (data->>'attendanceRecorder') = 'true' or s.reg_key = 'T08-01-02001')
      into a from public.registered_user where id = s.obj_id;
  end if;
  return a;
end $$;

create or replace function public.app_need(p_token text) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare a jsonb := public.app_actor(p_token);
begin
  if a is null then perform public.app_fail('PT401', 'Session expired. Please sign in again.'); end if;
  return a;
end $$;

-- may this actor READ this row?
create or replace function public.app_can_read(a jsonb, tbl text, p_id uuid, p_data jsonb) returns boolean
language plpgsql stable set search_path = public, extensions, pg_temp as $$
declare is_admin boolean := a is not null and a->>'kind' = 'admin';
begin
  if a is null then return false; end if;
  return coalesce(case tbl
    when 'valid_user'        then is_admin
    when 'registered_user'   then is_admin or p_id = (a->>'obj_id')::uuid
    when 'admin_user'        then (a->>'authority') = 'FOUNDER & CEO' or p_id = (a->>'obj_id')::uuid
    when 'lesson_package'    then true
    when 'news_post'         then true
    when 'attendance_record' then is_admin or (a->>'recorder')::boolean
                                  or public.app_norm(p_data->>'userId') = a->>'reg_key'
    when 'chat_message'      then true
    when 'password_request'  then (a->>'authority') = 'FOUNDER & CEO'
    when 'month_period'      then true
    else false end, false);
end $$;

-- may this actor create / update / delete?  p_keys = fields being changed
create or replace function public.app_can_write(a jsonb, tbl text, op text, p_id uuid, p_data jsonb, p_keys text[]) returns boolean
language plpgsql stable set search_path = public, extensions, pg_temp as $$
declare
  is_admin boolean := a is not null and a->>'kind' = 'admin';
  auth text := a->>'authority';
  ceo boolean := a is not null and a->>'authority' = 'FOUNDER & CEO';
  own boolean;
begin
  if a is null then return false; end if;
  own := p_id is not null and p_id = (a->>'obj_id')::uuid;
  return coalesce(case tbl
    when 'valid_user' then auth in ('FOUNDER & CEO','Accountant')
    when 'registered_user' then
      case when auth in ('FOUNDER & CEO','Chief Financial Officer') then true
           when op = 'update' and own and a->>'kind' = 'student'
                then p_keys <@ array['email','phone','profilePic'] else false end
    when 'admin_user' then
      case when ceo then true
           when op = 'update' and own and a->>'kind' = 'admin'
                then p_keys <@ array['name','email','phone','profilePic','course','year'] else false end
    when 'lesson_package' then
      case when op = 'update' then auth in ('FOUNDER & CEO','Chief Financial Officer') else ceo end
    when 'news_post' then
      auth in ('FOUNDER & CEO','General Secretary')   -- likes/comments go through app_news_action
    when 'attendance_record' then is_admin or (a->>'recorder')::boolean
    when 'chat_message' then
      case when op = 'create' then true
           when ceo then true
           when op = 'update' and p_keys <@ array['readBy'] then true
           else public.app_norm(p_data->>'userId') = a->>'reg_key' end
    when 'password_request' then ceo
    when 'month_period' then auth in ('FOUNDER & CEO','Chief Financial Officer')
    else false end, false);
end $$;

create or replace function public.app_valid_table(tbl text) returns void
language plpgsql immutable as $$
begin
  if tbl is null or tbl <> all (array['valid_user','registered_user','admin_user','lesson_package',
       'news_post','attendance_record','chat_message','password_request','month_period']) then
    perform public.app_fail('P0001', 'Unknown table');
  end if;
end $$;

create or replace function public.app_row_json(tbl text, p_id uuid, p_data jsonb, p_created timestamptz, p_updated timestamptz) returns jsonb
language sql immutable as $$
  select jsonb_build_object('objectId', p_id, 'objectType', tbl, 'objectData', p_data - 'password',
                            'createdAt', p_created, 'updatedAt', p_updated)
$$;

create or replace function public.app_temp_password() returns text
language sql volatile set search_path = public, extensions, pg_temp as $$
  select substr(translate(encode(gen_random_bytes(12), 'base64'), '+/=Il0O1', 'xyzabcd'), 1, 10)
$$;

create or replace function public.app_set_cred(p_kind text, p_reg text, p_pw text) returns void
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if p_pw is null or length(p_pw) < 6 then
    perform public.app_fail('P0001', 'Password must be at least 6 characters');
  end if;
  insert into public.app_credentials (kind, reg_key, pw_hash)
  values (p_kind, public.app_norm(p_reg), crypt(p_pw, gen_salt('bf', 10)))
  on conflict (kind, reg_key) do update set pw_hash = excluded.pw_hash, updated_at = now();
end $$;

-- ---------------------------------------------------------------------
-- 3. Login / sessions
-- ---------------------------------------------------------------------
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

create or replace function public.app_logout(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  delete from public.app_sessions where token_hash = encode(digest(coalesce(args->>'token',''), 'sha256'), 'hex');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.app_me(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare a jsonb := public.app_need(args->>'token'); d jsonb;
begin
  if a->>'kind' = 'admin' then select data into d from public.admin_user where id = (a->>'obj_id')::uuid;
  else select data into d from public.registered_user where id = (a->>'obj_id')::uuid; end if;
  return jsonb_build_object('kind', a->>'kind', 'objectId', a->>'obj_id', 'user', d - 'password',
                            'recorder', a->'recorder');
end $$;

-- ---------------------------------------------------------------------
-- 4. Public (not logged in) helpers: sign-up and forgot password
-- ---------------------------------------------------------------------
create or replace function public.app_check_valid(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare r record;
begin
  select id, data into r from public.valid_user where public.app_norm(data->>'regNumber') = public.app_norm(args->>'reg') limit 1;
  if not found then return null; end if;
  return jsonb_build_object('objectId', r.id, 'regNumber', r.data->>'regNumber', 'name', r.data->>'name',
                            'course', r.data->>'course', 'year', r.data->>'year');
end $$;

create or replace function public.app_reg_exists(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  return to_jsonb(exists (select 1 from public.registered_user where public.app_norm(data->>'regNumber') = public.app_norm(args->>'reg')));
end $$;

-- SETTING: set to true to only allow sign-up for students listed in "Valid Users".
-- (false = anyone with a correctly formatted registration number can sign up, as before.)
create or replace function public.app_require_valid_reg() returns boolean
language sql immutable as $$ select false $$;

create or replace function public.app_register(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  d jsonb := coalesce(args->'data', '{}'::jsonb);
  reg text := public.app_norm(d->>'regNumber');
  pw text := d->>'password';
  clean jsonb; new_id uuid;
begin
  if reg !~ '^T[0-9]{2}-[0-9]{2}-[0-9]{5}$' then perform public.app_fail('P0001', 'Invalid registration number format'); end if;
  if public.app_require_valid_reg()
     and not exists (select 1 from public.valid_user where public.app_norm(data->>'regNumber') = reg) then
    perform public.app_fail('P0001', 'This registration number is not in the list of valid students');
  end if;
  if exists (select 1 from public.registered_user where public.app_norm(data->>'regNumber') = reg) then
    perform public.app_fail('P0001', 'This registration number is already registered');
  end if;
  if coalesce(d->>'name','') = '' then perform public.app_fail('P0001', 'Name is required'); end if;
  if coalesce(d->>'lessonPackage','') = '' then perform public.app_fail('P0001', 'At least one lesson package must be selected'); end if;
  if pw is null or length(pw) < 6 then perform public.app_fail('P0001', 'Password must be at least 6 characters'); end if;

  clean := jsonb_build_object(
    'regNumber', reg, 'name', d->>'name', 'course', coalesce(d->>'course','N/A'), 'year', coalesce(d->>'year','N/A'),
    'email', coalesce(d->>'email',''), 'phone', coalesce(d->>'phone',''), 'profilePic', coalesce(d->>'profilePic',''),
    'lessonPackage', d->>'lessonPackage', 'paid', false);
  if octet_length(clean::text) > 262144 then perform public.app_fail('P0001', 'Profile data too large'); end if;
  insert into public.registered_user (data) values (clean) returning id into new_id;
  perform public.app_set_cred('student', reg, pw);
  return jsonb_build_object('objectId', new_id);
end $$;

create or replace function public.app_request_password_reset(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare reg text := public.app_norm(args->>'reg'); u record;
begin
  select id, data into u from public.registered_user where public.app_norm(data->>'regNumber') = reg;
  if not found then return jsonb_build_object('status', 'notfound'); end if;
  if exists (select 1 from public.password_request
              where public.app_norm(data->>'regNumber') = reg and coalesce((data->>'approved')::boolean, false) = false) then
    return jsonb_build_object('status', 'pending');
  end if;
  insert into public.password_request (data) values (jsonb_build_object(
    'regNumber', u.data->>'regNumber', 'name', u.data->>'name', 'email', u.data->>'email', 'phone', u.data->>'phone',
    'timestamp', (extract(epoch from clock_timestamp()) * 1000)::bigint, 'approved', false));
  return jsonb_build_object('status', 'created');
end $$;

-- ---------------------------------------------------------------------
-- 5. Passwords (logged in)
-- ---------------------------------------------------------------------
create or replace function public.app_change_password(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare a jsonb := public.app_need(args->>'token'); c record; ntok text := encode(digest(args->>'token','sha256'),'hex');
begin
  select * into c from public.app_credentials where kind = a->>'kind' and reg_key = a->>'reg_key';
  if not found or c.pw_hash <> crypt(coalesce(args->>'old',''), c.pw_hash) then
    perform public.app_fail('P0001', 'Old password is incorrect');
  end if;
  perform public.app_set_cred(a->>'kind', a->>'reg_key', args->>'new');
  delete from public.app_sessions where kind = a->>'kind' and reg_key = a->>'reg_key' and token_hash <> ntok;
  return jsonb_build_object('ok', true);
end $$;

-- FOUNDER & CEO approves a password request: creates a temporary password
create or replace function public.app_approve_reset(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare a jsonb := public.app_need(args->>'token'); r record; tmp text;
begin
  if a->>'authority' is distinct from 'FOUNDER & CEO' then perform public.app_fail('PT403', 'Not allowed'); end if;
  select id, data into r from public.password_request where id = (args->>'id')::uuid;
  if not found then perform public.app_fail('P0001', 'Request not found'); end if;
  tmp := public.app_temp_password();
  perform public.app_set_cred('student', r.data->>'regNumber', tmp);
  delete from public.app_sessions where kind = 'student' and reg_key = public.app_norm(r.data->>'regNumber');
  update public.password_request set data = data || '{"approved": true}', updated_at = now() where id = r.id;
  return jsonb_build_object('tempPassword', tmp, 'name', r.data->>'name', 'email', r.data->>'email',
                            'phone', r.data->>'phone', 'regNumber', r.data->>'regNumber');
end $$;

-- ---------------------------------------------------------------------
-- 6. Generic object API (same shape the app already used)
-- ---------------------------------------------------------------------
create or replace function public.app_list(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  a jsonb := public.app_need(args->>'token');
  tbl text := args->>'table';
  lim int := least(greatest(coalesce((args->>'limit')::int, 50), 1), 1000);
  off int := greatest(coalesce((args->>'offset')::int, 0), 0);
  conds text := ''; k text; v jsonb; out jsonb;
begin
  perform public.app_valid_table(tbl);
  for k, v in select * from jsonb_each(coalesce(args->'filter', '{}'::jsonb)) loop
    if k = 'regNumber' then
      conds := conds || format(' and public.app_norm(t.data->>%L) = %L', k, public.app_norm(v #>> '{}'));
    else
      conds := conds || format(' and t.data->>%L = %L', k, v #>> '{}');
    end if;
  end loop;
  for k, v in select * from jsonb_each(coalesce(args->'gt', '{}'::jsonb)) loop
    conds := conds || format(' and (t.data->>%L)::numeric > %L::numeric', k, v #>> '{}');
  end loop;
  execute format($q$
    select coalesce(jsonb_agg(public.app_row_json(%L, s.id, s.data, s.created_at, s.updated_at)), '[]'::jsonb)
    from (select t.* from public.%I t
           where public.app_can_read($1, %L, t.id, t.data) %s
           order by %s limit %s offset %s) s$q$,
    tbl, tbl, tbl, conds,
    case when args->>'order' = 'asc' then 't.created_at asc, t.id asc' else 't.created_at desc, t.id desc' end,
    lim, off)
  into out using a;
  return jsonb_build_object('items', out, 'nextOffset',
           case when jsonb_array_length(out) = lim then to_jsonb(off + lim) else null end);
end $$;

create or replace function public.app_get(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare a jsonb := public.app_need(args->>'token'); tbl text := args->>'table'; r record;
begin
  perform public.app_valid_table(tbl);
  execute format('select * from public.%I where id = $1', tbl) into r using (args->>'id')::uuid;
  if r.id is null or not public.app_can_read(a, tbl, r.id, r.data) then return null; end if;
  return public.app_row_json(tbl, r.id, r.data, r.created_at, r.updated_at);
end $$;

create or replace function public.app_create(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  a jsonb := public.app_need(args->>'token');
  tbl text := args->>'table';
  d jsonb := coalesce(args->'data', '{}'::jsonb);
  pw text; gen text; v_kind text; r record;
begin
  perform public.app_valid_table(tbl);
  if not public.app_can_write(a, tbl, 'create', null, d, array(select jsonb_object_keys(d))) then
    perform public.app_fail('PT403', 'You are not allowed to do this');
  end if;

  if tbl in ('registered_user','admin_user','valid_user') then
    if coalesce(d->>'regNumber','') = '' then perform public.app_fail('P0001', 'Registration number is required'); end if;
    d := jsonb_set(d, '{regNumber}', to_jsonb(public.app_norm(d->>'regNumber')));
  end if;
  if tbl = 'chat_message' then
    d := d || jsonb_build_object('userId', a->>'reg_key', 'deleted', false);
    if not (d ? 'timestamp') then d := d || jsonb_build_object('timestamp', (extract(epoch from clock_timestamp()) * 1000)::bigint); end if;
  end if;

  pw := d->>'password'; d := d - 'password';
  if octet_length(d::text) > 262144 then
    perform public.app_fail('P0001', 'Record too large. Upload images through storage.');
  end if;

  begin
    execute format('insert into public.%I (data) values ($1) returning *', tbl) into r using d;
  exception when unique_violation then
    perform public.app_fail('P0001', 'This registration number already exists');
  end;

  if tbl in ('registered_user','admin_user') then
    v_kind := case when tbl = 'admin_user' then 'admin' else 'student' end;
    if pw is null or pw = '' then gen := public.app_temp_password(); pw := gen; end if;
    perform public.app_set_cred(v_kind, d->>'regNumber', pw);
  end if;

  return public.app_row_json(tbl, r.id, r.data, r.created_at, r.updated_at)
         || case when gen is not null then jsonb_build_object('generatedPassword', gen) else '{}'::jsonb end;
end $$;

create or replace function public.app_update(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  a jsonb := public.app_need(args->>'token');
  tbl text := args->>'table';
  id_ uuid := (args->>'id')::uuid;
  patch jsonb := coalesce(args->'data', '{}'::jsonb);
  cur record; pw text; merged jsonb; old_reg text; new_reg text; v_kind text; pw_ok boolean;
begin
  perform public.app_valid_table(tbl);
  execute format('select * from public.%I where id = $1 for update', tbl) into cur using id_;
  if cur.id is null then perform public.app_fail('P0001', 'Record not found'); end if;

  pw := patch->>'password'; patch := patch - 'password';
  pw_ok := (tbl = 'registered_user' and coalesce(a->>'authority','') in ('FOUNDER & CEO','Chief Financial Officer'))
        or (tbl = 'admin_user' and coalesce(a->>'authority','') = 'FOUNDER & CEO');
  if not public.app_can_write(a, tbl, 'update', id_, cur.data, array(select jsonb_object_keys(patch)))
     or (pw is not null and not pw_ok) then
    perform public.app_fail('PT403', 'You are not allowed to do this');
  end if;

  if tbl in ('registered_user','admin_user','valid_user') and patch ? 'regNumber' then
    patch := jsonb_set(patch, '{regNumber}', to_jsonb(public.app_norm(patch->>'regNumber')));
  end if;
  merged := cur.data || patch;
  if octet_length(merged::text) > 262144 then
    perform public.app_fail('P0001', 'Record too large. Upload images through storage.');
  end if;

  begin
    execute format('update public.%I set data = $1, updated_at = now() where id = $2', tbl) using merged, id_;
  exception when unique_violation then
    perform public.app_fail('P0001', 'This registration number already exists');
  end;

  if tbl in ('registered_user','admin_user') then
    v_kind := case when tbl = 'admin_user' then 'admin' else 'student' end;
    old_reg := public.app_norm(cur.data->>'regNumber'); new_reg := public.app_norm(merged->>'regNumber');
    if old_reg <> new_reg then
      update public.app_credentials c set reg_key = new_reg where c.kind = v_kind and c.reg_key = old_reg;
      update public.app_sessions s2 set reg_key = new_reg where s2.kind = v_kind and s2.reg_key = old_reg;
    end if;
    if pw is not null and pw <> '' then
      perform public.app_set_cred(v_kind, new_reg, pw);
      delete from public.app_sessions s3 where s3.kind = v_kind and s3.reg_key = new_reg;
    end if;
  end if;

  execute format('select * from public.%I where id = $1', tbl) into cur using id_;
  return public.app_row_json(tbl, cur.id, cur.data, cur.created_at, cur.updated_at);
end $$;

-- Atomic news actions (likes, views, comments, replies). Each call locks the post row,
-- so two students acting at the same moment can never overwrite each other.
create or replace function public.app_news_action(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  a jsonb := public.app_need(args->>'token');
  id_ uuid := (args->>'id')::uuid;
  act text := args->>'action';
  cur record; d jsonb;
  me_reg text; me_name text; me_pic text;
  v_likes text[]; v_views text[]; v_comments jsonb; v_text text; v_cid bigint;
  v_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_staff boolean := coalesce(a->>'authority', '') in ('FOUNDER & CEO', 'General Secretary');
  v_found boolean := false;
begin
  select * into cur from public.news_post where id = id_ for update;
  if cur.id is null then perform public.app_fail('P0001', 'Post not found'); end if;
  d := cur.data;

  if a->>'kind' = 'admin' then
    select u.data->>'regNumber', u.data->>'name', coalesce(u.data->>'profilePic', '')
      into me_reg, me_name, me_pic from public.admin_user u where u.id = (a->>'obj_id')::uuid;
  else
    select u.data->>'regNumber', u.data->>'name', coalesce(u.data->>'profilePic', '')
      into me_reg, me_name, me_pic from public.registered_user u where u.id = (a->>'obj_id')::uuid;
  end if;
  if me_reg is null then perform public.app_fail('PT403', 'You are not allowed to do this'); end if;

  v_likes := array(select x from unnest(string_to_array(coalesce(d->>'likes', ''), ',')) x where x <> '');
  v_views := array(select x from unnest(string_to_array(coalesce(d->>'views', ''), ',')) x where x <> '');
  v_comments := case jsonb_typeof(d->'comments')
                  when 'string' then (d->>'comments')::jsonb
                  when 'array' then d->'comments'
                  else '[]'::jsonb end;

  if act = 'like' then
    if me_reg = any(v_likes) then v_likes := array_remove(v_likes, me_reg);
    else v_likes := v_likes || me_reg; end if;
    d := d || jsonb_build_object('likes', array_to_string(v_likes, ','));

  elsif act = 'view' then
    if not (me_reg = any(v_views)) then
      v_views := v_views || me_reg;
      d := d || jsonb_build_object('views', array_to_string(v_views, ','));
    end if;

  elsif act = 'comment' then
    v_text := left(btrim(coalesce(args->>'text', '')), 1000);
    if v_text = '' then perform public.app_fail('P0001', 'Write a comment first'); end if;
    v_comments := v_comments || jsonb_build_array(jsonb_build_object(
      'id', v_ms, 'userId', me_reg, 'userName', me_name, 'userProfilePic', me_pic,
      'text', v_text, 'timestamp', v_ms, 'replies', '[]'::jsonb, 'notifiedUsers', '[]'::jsonb));
    d := d || jsonb_build_object('comments', v_comments::text);

  elsif act = 'reply' then
    v_cid := (args->>'commentId')::bigint;
    v_text := left(btrim(coalesce(args->>'text', '')), 1000);
    if v_text = '' then perform public.app_fail('P0001', 'Write a reply first'); end if;
    select coalesce(jsonb_agg(
      case when (c.value->>'id')::bigint = v_cid then
        (c.value
          || jsonb_build_object('replies', coalesce(c.value->'replies', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
               'userId', me_reg, 'userName', me_name, 'userProfilePic', me_pic, 'text', v_text, 'timestamp', v_ms)))
          || jsonb_build_object('notifiedUsers', (
               select coalesce(jsonb_agg(distinct u), '[]'::jsonb) from (
                 select jsonb_array_elements_text(coalesce(c.value->'notifiedUsers', '[]'::jsonb)) as u
                 union select c.value->>'userId'
                 union select r->>'userId' from jsonb_array_elements(coalesce(c.value->'replies', '[]'::jsonb)) r
               ) n where u is not null and u <> me_reg)))
      else c.value end order by c.ord), '[]'::jsonb),
      coalesce(bool_or((c.value->>'id')::bigint = v_cid), false)
      into v_comments, v_found
      from jsonb_array_elements(v_comments) with ordinality as c(value, ord);
    if not v_found then perform public.app_fail('P0001', 'Comment not found'); end if;
    d := d || jsonb_build_object('comments', v_comments::text);

  elsif act = 'clear_notification' then
    v_cid := (args->>'commentId')::bigint;
    select coalesce(jsonb_agg(
      case when (c.value->>'id')::bigint = v_cid then
        c.value || jsonb_build_object('notifiedUsers', (
          select coalesce(jsonb_agg(u), '[]'::jsonb)
            from jsonb_array_elements_text(coalesce(c.value->'notifiedUsers', '[]'::jsonb)) u where u <> me_reg))
      else c.value end order by c.ord), '[]'::jsonb)
      into v_comments from jsonb_array_elements(v_comments) with ordinality as c(value, ord);
    d := d || jsonb_build_object('comments', v_comments::text);

  elsif act = 'delete_comment' then
    v_cid := (args->>'commentId')::bigint;
    select coalesce(jsonb_agg(c.value order by c.ord), '[]'::jsonb) into v_comments
      from jsonb_array_elements(v_comments) with ordinality as c(value, ord)
     where not ((c.value->>'id')::bigint = v_cid and (v_staff or c.value->>'userId' = me_reg));
    d := d || jsonb_build_object('comments', v_comments::text);

  else
    perform public.app_fail('P0001', 'Unknown action');
  end if;

  update public.news_post set data = d, updated_at = now() where id = id_;
  return public.app_row_json('news_post', id_, d, cur.created_at, now());
end $$;


create or replace function public.app_delete(args jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  a jsonb := public.app_need(args->>'token');
  tbl text := args->>'table';
  id_ uuid := (args->>'id')::uuid;
  cur record; v_kind text;
begin
  perform public.app_valid_table(tbl);
  execute format('select * from public.%I where id = $1', tbl) into cur using id_;
  if cur.id is null then return jsonb_build_object('ok', true); end if;
  if not public.app_can_write(a, tbl, 'delete', id_, cur.data, null) then
    perform public.app_fail('PT403', 'You are not allowed to do this');
  end if;
  if tbl = 'admin_user' and public.app_norm(cur.data->>'regNumber') = 'T22-03-05223' then
    perform public.app_fail('PT403', 'The founder account cannot be deleted');
  end if;
  execute format('delete from public.%I where id = $1', tbl) using id_;
  if tbl in ('registered_user','admin_user') then
    v_kind := case when tbl = 'admin_user' then 'admin' else 'student' end;
    delete from public.app_credentials c where c.kind = v_kind and c.reg_key = public.app_norm(cur.data->>'regNumber');
    delete from public.app_sessions s2 where s2.kind = v_kind and s2.reg_key = public.app_norm(cur.data->>'regNumber');
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------
-- 7. Permissions: only the app_* entry points are callable from the browser
-- ---------------------------------------------------------------------
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname
             from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname like 'app\_%' loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
  for f in select p.oid::regprocedure as sig
             from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname in (
              'app_login','app_logout','app_me','app_check_valid','app_reg_exists','app_register',
              'app_request_password_reset','app_change_password','app_approve_reset',
              'app_list','app_get','app_create','app_update','app_delete','app_news_action') loop
    execute format('grant execute on function %s to anon, authenticated', f.sig);
  end loop;
end $$;
