-- Active match access guard for suspended accounts.
create or replace function public.get_my_active_match()
returns table(id uuid, player1_id uuid, player1_handle text, player2_id uuid, player2_handle text, status text, phase text, state_version bigint, state jsonb, reconnect_deadline timestamptz, disconnected_player uuid)
language plpgsql security definer set search_path to 'public','pg_temp' as $$
begin
  perform public.assert_account_active();
  return query
  select m.id,m.player1_id,p1.fighter_handle,m.player2_id,p2.fighter_handle,m.status,m.phase,m.state_version,
         public.redact_match_state(m.state,auth.uid(),m.player1_id,m.player2_id),m.reconnect_deadline,m.disconnected_player
  from public.matches m
  join public.profiles p1 on p1.id=m.player1_id
  join public.profiles p2 on p2.id=m.player2_id
  where m.status in('COIN_TOSS','ACTIVE','PAUSED','ABANDONED')
    and auth.uid() in(m.player1_id,m.player2_id)
    and case when auth.uid()=m.player1_id then not m.player1_result_seen else not m.player2_result_seen end
  order by m.created_at desc limit 1;
end;
$$;

create or replace function public.heartbeat_match(p_match uuid)
returns void
language plpgsql security definer set search_path to 'public','pg_temp' as $$
declare m public.matches; other_last_seen timestamptz; me uuid:=auth.uid();
begin
  perform public.assert_account_active();
  select * into m from public.matches where id=p_match for update;
  if not found then raise exception 'MATCH_NOT_FOUND'; end if;
  if me not in(m.player1_id,m.player2_id) then raise exception 'NOT_MATCH_PLAYER'; end if;
  if m.state->>'phase'='GAME_OVER' then return; end if;
  if m.status not in('COIN_TOSS','ACTIVE','PAUSED') then return; end if;
  if me=m.player1_id then update public.matches set player1_last_seen=now() where id=m.id; other_last_seen:=m.player2_last_seen;
  else update public.matches set player2_last_seen=now() where id=m.id; other_last_seen:=m.player1_last_seen; end if;
  select * into m from public.matches where id=p_match;
  if m.status='PAUSED' and m.disconnected_player=me and m.reconnect_deadline>now() then
    update public.matches set status=case when phase like 'COIN_%' then 'COIN_TOSS' else 'ACTIVE' end,disconnected_player=null,reconnect_deadline=null where id=m.id;
  elsif m.status in('COIN_TOSS','ACTIVE') and other_last_seen is not null and other_last_seen<now()-interval '20 seconds' then
    update public.matches set status='PAUSED',disconnected_player=case when me=m.player1_id then m.player2_id else m.player1_id end,reconnect_deadline=now()+interval '60 seconds' where id=m.id;
  end if;
end;
$$;
