-- 04_months.sql  -  adds the Months (payment periods) table.
-- Run this ONCE in the Supabase SQL Editor (safe to run again).

create table if not exists public.month_period (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists month_period_created_idx on public.month_period (created_at desc, id desc);
alter table public.month_period enable row level security;
drop policy if exists "anon full access" on public.month_period;
revoke all on public.month_period from anon, authenticated;

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
