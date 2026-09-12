-- Matchmaking guard for suspended accounts.
create or replace function public.join_matchmaking()
returns uuid
language plpgsql security definer set search_path to 'public','pg_temp' as $$
declare
  me uuid:=auth.uid(); opponent uuid; v_season uuid; new_match uuid;
  p1_place bigint; p2_place bigint; p1_points int; p2_points int;
  first_lock text; second_lock text;
begin
  perform public.assert_account_active();
  if not exists(select 1 from public.profiles where id=me and fighter_handle is not null) then raise exception 'FIGHTER_HANDLE_REQUIRED'; end if;
  if exists(select 1 from public.matches where me in(player1_id,player2_id) and status in('COIN_TOSS','ACTIVE','PAUSED') and state->>'phase'<>'GAME_OVER') then raise exception 'PLAYER_ALREADY_IN_MATCH'; end if;
  if exists(select 1 from public.challenges where status='PENDING' and expires_at>now() and me in(challenger_id,target_id)) then raise exception 'CHALLENGE_PENDING'; end if;
  delete from public.matchmaking_queue where status='WAITING' and last_seen<now()-interval '12 seconds';
  insert into public.lobby_presence(player_id,status,last_seen) values(me,'ONLINE',now()) on conflict(player_id) do update set status='ONLINE',last_seen=now();
  insert into public.matchmaking_queue(player_id,joined_at,last_seen,status,match_id) values(me,now(),now(),'WAITING',null)
    on conflict(player_id) do update set joined_at=case when public.matchmaking_queue.status='WAITING' then public.matchmaking_queue.joined_at else now() end,last_seen=now(),status='WAITING',match_id=null;
  select q.player_id into opponent from public.matchmaking_queue q join public.lobby_presence lp on lp.player_id=q.player_id
  where q.player_id<>me and q.status='WAITING' and q.last_seen>now()-interval '12 seconds' and lp.status='ONLINE' and lp.last_seen>now()-interval '30 seconds'
    and not public.account_suspended(q.player_id)
    and not exists(select 1 from public.challenges c where c.status='PENDING' and c.expires_at>now() and q.player_id in(c.challenger_id,c.target_id))
    and not exists(select 1 from public.matches m where q.player_id in(m.player1_id,m.player2_id) and m.status in('COIN_TOSS','ACTIVE','PAUSED') and m.state->>'phase'<>'GAME_OVER')
  order by q.joined_at asc for update of q skip locked limit 1;
  if opponent is null then return null; end if;
  first_lock:=least(me::text,opponent::text); second_lock:=greatest(me::text,opponent::text);
  perform pg_advisory_xact_lock(hashtextextended(first_lock,0));
  perform pg_advisory_xact_lock(hashtextextended(second_lock,0));
  if not exists(select 1 from public.matchmaking_queue where player_id=opponent and status='WAITING' and last_seen>now()-interval '12 seconds') then return null; end if;
  if exists(select 1 from public.challenges where status='PENDING' and expires_at>now() and (me in(challenger_id,target_id) or opponent in(challenger_id,target_id))) then delete from public.matchmaking_queue where player_id=me and status='WAITING'; raise exception 'CHALLENGE_PENDING'; end if;
  if exists(select 1 from public.matches where (me in(player1_id,player2_id) or opponent in(player1_id,player2_id)) and status in('COIN_TOSS','ACTIVE','PAUSED') and state->>'phase'<>'GAME_OVER') then delete from public.matchmaking_queue where player_id=me and status='WAITING'; raise exception 'PLAYER_ALREADY_IN_MATCH'; end if;
  select id into v_season from public.seasons where is_active=true limit 1;
  if v_season is null then raise exception 'NO_ACTIVE_SEASON'; end if;
  p1_place:=public.current_season_place(v_season,opponent); p2_place:=public.current_season_place(v_season,me);
  select le.points into p1_points from public.leaderboard_entries le where le.season_id=v_season and le.player_id=opponent;
  select le.points into p2_points from public.leaderboard_entries le where le.season_id=v_season and le.player_id=me;
  insert into public.matches(season_id,player1_id,player2_id,status,phase,state,player1_last_seen,player2_last_seen,player1_start_place,player2_start_place,player1_start_points,player2_start_points)
  values(v_season,opponent,me,'COIN_TOSS','COIN_CHOICE',jsonb_build_object('coinChooser',opponent,'coinChoice',null,'coinResult',null,'firstPlayer',null),now(),now(),coalesce(p1_place,0),coalesce(p2_place,0),coalesce(p1_points,0),coalesce(p2_points,0)) returning id into new_match;
  update public.matchmaking_queue set status='MATCHED',match_id=new_match,last_seen=now() where player_id in(me,opponent);
  update public.lobby_presence set status='IN_MATCH',last_seen=now() where player_id in(me,opponent);
  return new_match;
end;
$$;
