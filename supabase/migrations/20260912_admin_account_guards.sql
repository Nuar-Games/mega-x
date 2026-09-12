create or replace function public.claim_fighter_handle(p_handle text)
returns public.profiles
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $$
declare
  clean_handle text:=trim(p_handle);
  existing public.profiles;
  result_profile public.profiles;
  active_season_id uuid;
begin
  perform public.assert_account_active();
  if clean_handle !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'INVALID_FIGHTER_HANDLE'; end if;
  select * into existing from public.profiles where id=auth.uid() for update;
  if found and existing.fighter_handle is not null then
    if lower(existing.fighter_handle)=lower(clean_handle) then return existing; end if;
    raise exception 'HANDLE_ALREADY_CLAIMED';
  end if;
  if exists(select 1 from public.profiles where lower(fighter_handle)=lower(clean_handle) and id<>auth.uid()) then raise exception 'FIGHTER_HANDLE_TAKEN'; end if;
  insert into public.profiles(id,fighter_handle) values(auth.uid(),clean_handle)
  on conflict(id) do update set fighter_handle=excluded.fighter_handle,updated_at=now()
  returning * into result_profile;
  select id into active_season_id from public.seasons where is_active=true limit 1;
  if active_season_id is null then raise exception 'NO_ACTIVE_SEASON'; end if;
  insert into public.leaderboard_entries(season_id,player_id,points) values(active_season_id,auth.uid(),0) on conflict(season_id,player_id) do nothing;
  return result_profile;
end;
$$;

create or replace function public.heartbeat_lobby(p_status text default 'ONLINE')
returns void
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $$
begin
  perform public.assert_account_active();
  if p_status not in ('ONLINE','IN_MATCH','AWAY') then raise exception 'INVALID_STATUS'; end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and fighter_handle is not null) then raise exception 'PROFILE_REQUIRED'; end if;
  insert into public.lobby_presence(player_id,status,last_seen) values(auth.uid(),p_status,now())
  on conflict(player_id) do update set status=excluded.status,last_seen=excluded.last_seen;
end;
$$;

create or replace function public.get_matchmaking_status()
returns table(status text,match_id uuid,joined_at timestamptz)
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $$
begin
  perform public.assert_account_active();
  delete from public.matchmaking_queue where status='WAITING' and last_seen<now()-interval '12 seconds';
  update public.matchmaking_queue set last_seen=now() where player_id=auth.uid() and status='WAITING';
  return query select q.status,q.match_id,q.joined_at from public.matchmaking_queue q where q.player_id=auth.uid();
end;
$$;

create or replace function public.send_mail(p_recipient uuid,p_subject text,p_body text)
returns bigint
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $$
declare mid bigint;sub text:=trim(p_subject);msg text:=trim(p_body);begin
  perform public.assert_account_active();
  if public.account_silenced(auth.uid()) then raise exception 'ACCOUNT_SILENCED'; end if;
  if p_recipient=auth.uid() then raise exception 'CANNOT_MAIL_SELF'; end if;
  if not exists(select 1 from public.profiles where id=p_recipient and fighter_handle is not null) then raise exception 'RECIPIENT_NOT_FOUND'; end if;
  if char_length(sub) not between 1 and 80 then raise exception 'INVALID_SUBJECT'; end if;
  if char_length(msg) not between 1 and 1000 then raise exception 'INVALID_MESSAGE'; end if;
  if exists(select 1 from public.matches m where auth.uid() in(m.player1_id,m.player2_id) and m.status in('COIN_TOSS','ACTIVE','PAUSED') and m.state->>'phase'<>'GAME_OVER') then raise exception 'MAIL_DISABLED_DURING_MATCH'; end if;
  if exists(select 1 from public.mail_messages where sender_id=auth.uid() and created_at>now()-interval '5 seconds') then raise exception 'MAIL_RATE_LIMIT'; end if;
  insert into public.mail_messages(sender_id,recipient_id,subject,body) values(auth.uid(),p_recipient,sub,msg) returning id into mid;
  return mid;
end;
$$;
