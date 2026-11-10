-- HashCLASS chat upgrade: "Viewers" (who read a message and when) and the gold CEO/admin messages.
-- Safe to run more than once.  Run it in the Supabase SQL Editor.

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
           when op = 'update' and p_keys <@ array['readBy','readers'] then true
           else public.app_norm(p_data->>'userId') = a->>'reg_key' end
    when 'password_request' then ceo
    when 'month_period' then auth in ('FOUNDER & CEO','Chief Financial Officer')
    else false end, false);
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
    d := d || jsonb_build_object('userId', a->>'reg_key', 'deleted', false, 'isAdmin', (a->>'kind') = 'admin');
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
