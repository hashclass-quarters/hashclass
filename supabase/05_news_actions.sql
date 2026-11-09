-- 05_news_actions.sql - safe likes/comments/replies + stricter news permissions.
-- Run ONCE in the Supabase SQL Editor (safe to run again).

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

revoke all on function public.app_news_action(jsonb) from public, anon, authenticated;
grant execute on function public.app_news_action(jsonb) to anon, authenticated;
