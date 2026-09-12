create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.pending_admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);
create table if not exists public.player_controls (
  user_id uuid primary key references auth.users(id) on delete cascade,
  silenced_until timestamptz,
  suspended_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.pending_admin_emails enable row level security;
alter table public.player_controls enable row level security;
revoke all on public.admin_users from anon, authenticated;
revoke all on public.pending_admin_emails from anon, authenticated;
revoke all on public.player_controls from anon, authenticated;

create or replace function public.is_admin(p_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path to 'public','pg_temp' as $$
  select p_user is not null and exists(select 1 from public.admin_users a where a.user_id=p_user)
$$;
create or replace function public.account_silenced(p_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path to 'public','pg_temp' as $$
  select coalesce((select c.silenced_until is not null and c.silenced_until>now() from public.player_controls c where c.user_id=p_user),false)
$$;
create or replace function public.account_suspended(p_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path to 'public','pg_temp' as $$
  select coalesce((select c.suspended_until is not null and c.suspended_until>now() from public.player_controls c where c.user_id=p_user),false)
$$;
create or replace function public.assert_account_active() returns void
language plpgsql security definer set search_path to 'public','pg_temp' as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if public.account_suspended(auth.uid()) then raise exception 'ACCOUNT_SUSPENDED'; end if;
end;
$$;

create or replace function public.assign_pending_admin() returns trigger
language plpgsql security definer set search_path to 'public','pg_temp' as $$
begin
  if new.email is not null and exists(select 1 from public.pending_admin_emails p where lower(p.email)=lower(new.email)) then
    insert into public.admin_users(user_id) values(new.id) on conflict(user_id) do nothing;
    delete from public.pending_admin_emails where lower(email)=lower(new.email);
  end if;
  return new;
end;
$$;
drop trigger if exists mega_x_assign_pending_admin on auth.users;
create trigger mega_x_assign_pending_admin after insert or update of email on auth.users
for each row execute function public.assign_pending_admin();

create or replace function public.get_my_admin_status()
returns table(is_admin boolean, silenced boolean, suspended boolean, silenced_until timestamptz, suspended_until timestamptz)
language plpgsql security definer set search_path to 'public','pg_temp' as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  return query select public.is_admin(auth.uid()), public.account_silenced(auth.uid()), public.account_suspended(auth.uid()), c.silenced_until, c.suspended_until
  from (select 1) q left join public.player_controls c on c.user_id=auth.uid();
end;
$$;

create or replace function public.admin_list_players()
returns table(user_id uuid, fighter_handle text, email text, silenced boolean, suspended boolean, silenced_until timestamptz, suspended_until timestamptz)
language plpgsql security definer set search_path to 'public','auth','pg_temp' as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;
  return query
  select u.id,p.fighter_handle,u.email::text,
         coalesce(c.silenced_until is not null and c.silenced_until>now(),false),
         coalesce(c.suspended_until is not null and c.suspended_until>now(),false),
         c.silenced_until,c.suspended_until
  from auth.users u
  left join public.profiles p on p.id=u.id
  left join public.player_controls c on c.user_id=u.id
  where not exists(select 1 from public.admin_users a where a.user_id=u.id)
  order by coalesce(p.fighter_handle,u.email::text,'') asc;
end;
$$;

create or replace function public.admin_set_silenced(p_player uuid,p_enabled boolean) returns void
language plpgsql security definer set search_path to 'public','pg_temp' as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;
  if p_player=auth.uid() then raise exception 'CANNOT_MODERATE_SELF'; end if;
  if not exists(select 1 from auth.users where id=p_player) then raise exception 'PLAYER_NOT_FOUND'; end if;
  insert into public.player_controls(user_id,silenced_until,updated_at)
  values(p_player,case when p_enabled then 'infinity'::timestamptz else null end,now())
  on conflict(user_id) do update set silenced_until=excluded.silenced_until,updated_at=now();
end;
$$;

create or replace function public.admin_set_suspended(p_player uuid,p_enabled boolean) returns void
language plpgsql security definer set search_path to 'public','pg_temp' as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;
  if p_player=auth.uid() then raise exception 'CANNOT_MODERATE_SELF'; end if;
  if not exists(select 1 from auth.users where id=p_player) then raise exception 'PLAYER_NOT_FOUND'; end if;
  insert into public.player_controls(user_id,suspended_until,updated_at)
  values(p_player,case when p_enabled then 'infinity'::timestamptz else null end,now())
  on conflict(user_id) do update set suspended_until=excluded.suspended_until,updated_at=now();
  if p_enabled then
    delete from public.lobby_presence where player_id=p_player;
    delete from public.matchmaking_queue where player_id=p_player;
    update public.challenges set status='CANCELLED',responded_at=now() where status='PENDING' and p_player in(challenger_id,target_id);
    update public.matches set status='PAUSED',disconnected_player=p_player,reconnect_deadline=now() where status in('COIN_TOSS','ACTIVE') and p_player in(player1_id,player2_id) and state->>'phase'<>'GAME_OVER';
  end if;
end;
$$;

grant execute on function public.get_my_admin_status() to authenticated;
grant execute on function public.admin_list_players() to authenticated;
grant execute on function public.admin_set_silenced(uuid,boolean) to authenticated;
grant execute on function public.admin_set_suspended(uuid,boolean) to authenticated;

create or replace function public.get_match_engine_state(p_match uuid,p_actor uuid)
returns table(id uuid,player1_id uuid,player2_id uuid,status text,phase text,state_version bigint,state jsonb)
language plpgsql security definer set search_path to 'public','pg_temp' as $$
begin
  if p_actor is null then raise exception 'ACTOR_REQUIRED'; end if;
  if public.account_suspended(p_actor) then raise exception 'ACCOUNT_SUSPENDED'; end if;
  return query select m.id,m.player1_id,m.player2_id,m.status,m.phase,m.state_version,m.state
  from public.matches m where m.id=p_match and p_actor in(m.player1_id,m.player2_id);
end;
$$;

create or replace function public.send_global_chat(p_message text) returns bigint
language plpgsql security definer set search_path to 'public','pg_temp' as $$
declare clean_message text:=btrim(p_message); inserted_id bigint; previous_time timestamptz;
begin
  perform public.assert_account_active();
  if public.account_silenced(auth.uid()) then raise exception 'ACCOUNT_SILENCED'; end if;
  if char_length(clean_message)<1 or char_length(clean_message)>240 then raise exception 'INVALID_CHAT_LENGTH'; end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and fighter_handle is not null) then raise exception 'PROFILE_REQUIRED'; end if;
  if not exists(select 1 from public.lobby_presence where player_id=auth.uid() and last_seen>now()-interval '30 seconds' and status<>'IN_MATCH') then raise exception 'LOBBY_ONLY_CHAT'; end if;
  select max(created_at) into previous_time from public.global_chat_messages where sender_id=auth.uid();
  if previous_time is not null and previous_time>now()-interval '2 seconds' then raise exception 'CHAT_RATE_LIMIT'; end if;
  insert into public.global_chat_messages(sender_id,message) values(auth.uid(),clean_message) returning id into inserted_id;
  return inserted_id;
end;
$$;
