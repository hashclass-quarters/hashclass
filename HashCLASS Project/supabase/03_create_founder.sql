-- Creates (or resets) the FOUNDER & CEO account.
-- 1) Change the password on the line marked  <<< CHANGE THIS  to a NEW strong password.
--    (The old password was visible in the website's source code, so do not reuse it.)
-- 2) Run in: Supabase Dashboard -> SQL Editor.   Run it again any time to reset the CEO password.
do $$
declare
  v_pw   text := 'CHANGE-ME-TO-A-NEW-STRONG-PASSWORD';   -- <<< CHANGE THIS
  v_reg  text := 'T22-03-05223';
  v_id   uuid;
begin
  if v_pw like 'CHANGE-ME%' or length(v_pw) < 8 then
    raise exception 'Edit v_pw first: choose a new password of at least 8 characters';
  end if;

  select id into v_id from public.admin_user where public.app_norm(data->>'regNumber') = v_reg;
  if v_id is null then
    insert into public.admin_user (data) values (jsonb_build_object(
      'regNumber', v_reg, 'name', 'HASHIMU SHABANI HALIFA', 'course', 'N/A', 'year', 'N/A',
      'email', 'hashclass.udom@gmail.com', 'phone', '+255617293971', 'profilePic', '',
      'authority', 'FOUNDER & CEO'));
  end if;
  perform public.app_set_cred('admin', v_reg, v_pw);
  delete from public.app_sessions where kind = 'admin' and reg_key = v_reg;
  raise notice 'Founder account ready. Sign in with % and your new password.', v_reg;
end $$;
