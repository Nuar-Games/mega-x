create or replace function public.redact_match_state(p_state jsonb, p_viewer uuid, p_player1 uuid, p_player2 uuid)
returns jsonb
language plpgsql
stable
set search_path to 'public', 'pg_temp'
as $function$
declare
  s jsonb:=coalesce(p_state,'{}'::jsonb);
  hidden_key text;
  viewer_index int;
  hidden_count int:=0;
  deck_count int:=0;
  choice_count int:=0;
  choice jsonb;
  viewer_still_needs_vs boolean:=false;
  opponent_committed_vs boolean:=false;
  tie jsonb;
  tie_deck jsonb;
  tie_hands jsonb;
  tie_picks jsonb;
  tie_index int:=0;
  left_hand jsonb:='[]'::jsonb;
  right_hand jsonb:='[]'::jsonb;
begin
  if p_viewer=p_player1 then hidden_key:='player2'; viewer_index:=0;
  elsif p_viewer=p_player2 then hidden_key:='player1'; viewer_index:=1;
  else raise exception 'NOT_MATCH_PLAYER';
  end if;

  hidden_count:=coalesce(jsonb_array_length(s->hidden_key->'hand'),0);
  deck_count:=coalesce(jsonb_array_length(s->'deck'),0);
  opponent_committed_vs := s->hidden_key->'vs' is not null and s->hidden_key->'vs' <> 'null'::jsonb;
  s:=jsonb_set(s,array[hidden_key,'hand'],'[]'::jsonb,true);
  s:=jsonb_set(s,array[hidden_key,'handCount'],to_jsonb(hidden_count),true);
  s:=jsonb_set(s,'{deck}','[]'::jsonb,true);
  s:=jsonb_set(s,'{deckCount}',to_jsonb(deck_count),true);

  viewer_still_needs_vs := coalesce((s->'needsVS'->>viewer_index)::boolean,false);
  if coalesce((s->>'round')::int,0)=1 and s->>'phase'='SET_VS' and viewer_still_needs_vs then
    s:=jsonb_set(s,array[hidden_key,'vs'],'null'::jsonb,true);
    s:=jsonb_set(s,array[hidden_key,'vsCommitted'],to_jsonb(opponent_committed_vs),true);
    if opponent_committed_vs then s:=jsonb_set(s,'{message}',to_jsonb('OPPONENT VS LOCKED.'::text),true); end if;
  end if;

  if s ? 'tieBreaker' and s->'tieBreaker' <> 'null'::jsonb then
    tie:=s->'tieBreaker';
    tie_hands:=tie->'hands';
    tie_picks:=coalesce(tie->'picks','[null,null]'::jsonb);
    if tie_hands is null or tie_hands='null'::jsonb then
      tie_deck:=coalesce(tie->'deck','[]'::jsonb);
      tie_index:=coalesce((tie->>'index')::int,0);
      select coalesce(jsonb_agg(value order by ord),'[]'::jsonb) into left_hand
        from jsonb_array_elements(tie_deck) with ordinality a(value,ord)
        where ord>tie_index and ord<=tie_index+5;
      select coalesce(jsonb_agg(value order by ord),'[]'::jsonb) into right_hand
        from jsonb_array_elements(tie_deck) with ordinality a(value,ord)
        where ord>tie_index+5 and ord<=tie_index+10;
      tie_hands:=jsonb_build_array(left_hand,right_hand);
    end if;
    s:=jsonb_set(s,'{tieChoice}',jsonb_build_object(
      'hand',coalesce(tie_hands->viewer_index,'[]'::jsonb),
      'picked',coalesce(tie_picks->viewer_index,'null'::jsonb) <> 'null'::jsonb,
      'opponentPicked',coalesce(tie_picks->(1-viewer_index),'null'::jsonb) <> 'null'::jsonb,
      'pair',greatest(1,coalesce((tie->>'pair')::int,0))
    ),true);
    s:=s-'tieBreaker';
  end if;

  if s ? 'pendingChoice' and s->'pendingChoice' <> 'null'::jsonb then
    choice:=s->'pendingChoice';
    choice_count:=coalesce(jsonb_array_length(choice->'hiddenOrder'),0);
    choice:=(choice-'hiddenOrder')||jsonb_build_object('hiddenCount',choice_count);
    s:=jsonb_set(s,'{pendingChoice}',choice,true);
  end if;
  return s;
end;
$function$;

create or replace function public.submit_match_special_action(p_match uuid, p_expected_version bigint, p_action text, p_payload jsonb default '{}'::jsonb)
returns table(state jsonb, state_version bigint, phase text, status text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  m public.matches;
  actor_idx int;
  target_idx int;
  target_key text;
  choice jsonb;
  effects jsonb;
  new_effects jsonb;
  removed_card int;
  remaining int;
  hidden_count int;
  tie jsonb;
  tie_deck jsonb;
  tie_hands jsonb;
  tie_picks jsonb;
  tie_index int;
  left_hand jsonb;
  right_hand jsonb;
  chosen_id int;
  left_id int;
  right_id int;
  left_atk int;
  right_atk int;
  pair_no int;
  winner uuid;
  loser uuid;
  action_upper text:=upper(trim(p_action));
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into m from public.matches where id=p_match for update;
  if not found then raise exception 'MATCH_NOT_FOUND'; end if;
  if auth.uid() not in (m.player1_id,m.player2_id) then raise exception 'NOT_MATCH_PLAYER'; end if;
  if m.state_version<>p_expected_version then raise exception 'STALE_MATCH_STATE'; end if;
  if m.status='PAUSED' then raise exception 'MATCH_PAUSED'; end if;
  if m.status<>'ACTIVE' then raise exception 'MATCH_NOT_ACTIVE'; end if;
  actor_idx:=case when auth.uid()=m.player1_id then 0 else 1 end;

  if action_upper='RESOLVE_VISIBLE_EFFECT_CHOICE' then
    choice:=m.state->'pendingChoice';
    if choice is null or choice='null'::jsonb then raise exception 'NO_VISIBLE_EFFECT_CHOICE_PENDING'; end if;
    if choice->>'kind'<>'PELUNCUR' or coalesce((choice->>'chooser')::int,-1)<>actor_idx then raise exception 'NO_VISIBLE_EFFECT_CHOICE_PENDING'; end if;
    target_idx:=coalesce((choice->>'target')::int,-1);
    if target_idx not in (0,1) then raise exception 'INVALID_TARGET'; end if;
    target_key:=case when target_idx=0 then 'player1' else 'player2' end;
    removed_card:=nullif(p_payload->>'cardId','')::int;
    if removed_card is null then raise exception 'INVALID_EFFECT_CHOICE'; end if;
    effects:=coalesce(m.state->target_key->'effects','[]'::jsonb);
    if not exists(select 1 from jsonb_array_elements(effects) e where (e->>'card')::int=removed_card) then raise exception 'INVALID_EFFECT_CHOICE'; end if;
    select coalesce(jsonb_agg(e order by ord),'[]'::jsonb) into new_effects
      from jsonb_array_elements(effects) with ordinality a(e,ord)
      where (e->>'card')::int<>removed_card;
    m.state:=jsonb_set(m.state,array[target_key,'effects'],new_effects,true);
    m.state:=jsonb_set(m.state,array[target_key,'discard'],coalesce(m.state->target_key->'discard','[]'::jsonb)||jsonb_build_array(removed_card),true);
    remaining:=greatest(0,coalesce((choice->>'remaining')::int,1)-1);
    hidden_count:=coalesce(jsonb_array_length(choice->'hiddenOrder'),0);
    if remaining=0 or (hidden_count=0 and jsonb_array_length(new_effects)=0) then
      m.state:=jsonb_set(m.state,'{pendingChoice}','null'::jsonb,true);
      m.state:=jsonb_set(m.state,'{message}',to_jsonb(coalesce(choice->>'sourceCardName','PELUNCUR FROST')||': pemilihan 2 kad lawan selesai.'),true);
    else
      choice:=jsonb_set(choice,'{remaining}',to_jsonb(remaining),true);
      m.state:=jsonb_set(m.state,'{pendingChoice}',choice,true);
    end if;

  elsif action_upper='TIE_PICK' then
    if m.phase<>'TIE_BREAKER' or m.state->>'phase'<>'TIE_BREAKER' then raise exception 'NO_TIE_BREAKER'; end if;
    tie:=m.state->'tieBreaker';
    if tie is null or tie='null'::jsonb then raise exception 'NO_TIE_BREAKER'; end if;
    tie_deck:=coalesce(tie->'deck','[]'::jsonb);
    tie_index:=coalesce((tie->>'index')::int,0);
    tie_hands:=tie->'hands';
    tie_picks:=coalesce(tie->'picks','[null,null]'::jsonb);

    if tie_hands is null or tie_hands='null'::jsonb then
      if jsonb_array_length(tie_deck)-tie_index < 10 then
        select coalesce(jsonb_agg(id order by random()),'[]'::jsonb) into tie_deck from public.card_catalog;
        tie_index:=0;
      end if;
      select coalesce(jsonb_agg(value order by ord),'[]'::jsonb) into left_hand
        from jsonb_array_elements(tie_deck) with ordinality a(value,ord)
        where ord>tie_index and ord<=tie_index+5;
      select coalesce(jsonb_agg(value order by ord),'[]'::jsonb) into right_hand
        from jsonb_array_elements(tie_deck) with ordinality a(value,ord)
        where ord>tie_index+5 and ord<=tie_index+10;
      tie_hands:=jsonb_build_array(left_hand,right_hand);
      tie_picks:='[null,null]'::jsonb;
      pair_no:=greatest(1,coalesce((tie->>'pair')::int,0));
      tie:=tie||jsonb_build_object('deck',tie_deck,'index',tie_index+10,'hands',tie_hands,'picks',tie_picks,'pair',pair_no,'status','CHOOSING');
    else
      pair_no:=greatest(1,coalesce((tie->>'pair')::int,1));
    end if;

    chosen_id:=nullif(p_payload->>'cardId','')::int;
    if chosen_id is null then raise exception 'INVALID_TIE_PICK'; end if;
    if coalesce(tie_picks->actor_idx,'null'::jsonb) <> 'null'::jsonb then raise exception 'TIE_PICK_ALREADY_LOCKED'; end if;
    if not exists(select 1 from jsonb_array_elements(tie_hands->actor_idx) e where (e#>>'{}')::int=chosen_id) then raise exception 'TIE_CARD_NOT_IN_YOUR_HAND'; end if;

    tie_picks:=jsonb_set(tie_picks,array[actor_idx::text],to_jsonb(chosen_id),true);
    tie:=jsonb_set(tie,'{picks}',tie_picks,true);
    m.state:=jsonb_set(m.state,'{tieBreaker}',tie,true);

    if coalesce(tie_picks->(1-actor_idx),'null'::jsonb)='null'::jsonb then
      m.state:=m.state-'tiePublic';
      m.state:=jsonb_set(m.state,'{message}',to_jsonb(format('X Fighter %s sudah kunci kad. Menunggu lawan.',actor_idx+1)),true);
    else
      left_id:=(tie_picks->>0)::int;
      right_id:=(tie_picks->>1)::int;
      select atk into left_atk from public.card_catalog where id=left_id;
      select atk into right_atk from public.card_catalog where id=right_id;
      m.state:=jsonb_set(m.state,'{tiePublic}',jsonb_build_object('left',left_id,'right',right_id,'pair',pair_no,'status',case when left_atk=right_atk then 'TIED' else 'DECIDED' end),true);
      if left_atk=right_atk then
        tie_deck:=coalesce(tie->'deck','[]'::jsonb);
        tie_index:=coalesce((tie->>'index')::int,0);
        if jsonb_array_length(tie_deck)-tie_index < 10 then
          select coalesce(jsonb_agg(id order by random()),'[]'::jsonb) into tie_deck from public.card_catalog;
          tie_index:=0;
        end if;
        select coalesce(jsonb_agg(value order by ord),'[]'::jsonb) into left_hand
          from jsonb_array_elements(tie_deck) with ordinality a(value,ord)
          where ord>tie_index and ord<=tie_index+5;
        select coalesce(jsonb_agg(value order by ord),'[]'::jsonb) into right_hand
          from jsonb_array_elements(tie_deck) with ordinality a(value,ord)
          where ord>tie_index+5 and ord<=tie_index+10;
        tie:=tie||jsonb_build_object('deck',tie_deck,'index',tie_index+10,'hands',jsonb_build_array(left_hand,right_hand),'picks','[null,null]'::jsonb,'pair',pair_no+1,'status','CHOOSING');
        m.state:=jsonb_set(m.state,'{tieBreaker}',tie,true);
        m.state:=jsonb_set(m.state,'{message}',to_jsonb(format('PENENTUAN SERI %s: ATK %s-%s — SERI. Pilih kad baharu.',pair_no,left_atk,right_atk)),true);
      else
        winner:=case when left_atk>right_atk then m.player1_id else m.player2_id end;
        loser:=case when winner=m.player1_id then m.player2_id else m.player1_id end;
        m.phase:='GAME_OVER';
        m.state:=jsonb_set(m.state,'{phase}','"GAME_OVER"'::jsonb,true);
        m.state:=jsonb_set(m.state,'{winner}',to_jsonb(winner::text),true);
        m.state:=jsonb_set(m.state,'{effectTurn}','null'::jsonb,true);
        m.state:=jsonb_set(m.state,'{attackTurn}','null'::jsonb,true);
        m.state:=jsonb_set(m.state,'{message}',to_jsonb(format('Penentuan Seri: %s (%s) vs %s (%s). %s menang.',(select name from public.card_catalog where id=left_id),left_atk,(select name from public.card_catalog where id=right_id),right_atk,case when winner=m.player1_id then 'X Fighter 1' else 'X Fighter 2' end)),true);
      end if;
    end if;
  else
    raise exception 'UNSUPPORTED_SPECIAL_ACTION';
  end if;

  update public.matches set state=m.state,phase=m.phase,state_version=m.state_version+1
    where id=m.id returning matches.state,matches.state_version,matches.phase,matches.status into state,state_version,phase,status;
  insert into public.match_actions(match_id,actor_id,action_type,payload,state_version)
    values(m.id,auth.uid(),action_upper,p_payload,state_version);

  if action_upper='TIE_PICK' and m.phase='GAME_OVER' and winner is not null then
    perform public.finalize_competitive_match(m.id,winner,loser,'TIE_BREAKER');
  end if;
  state:=public.redact_match_state(state,auth.uid(),m.player1_id,m.player2_id);
  return next;
end;
$function$;
