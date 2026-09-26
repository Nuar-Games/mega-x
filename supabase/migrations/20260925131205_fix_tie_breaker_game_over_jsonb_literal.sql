-- Fix: decisive online tie-breaker picks crashed with "invalid input syntax for type json"
-- because submit_match_special_action contained the malformed literal '\"GAME_OVER\"'::jsonb
-- (introduced by migration 20260905074517 tie_breaker_player_choice).
-- Rewrites ONLY that literal in the live function body. Grants are preserved by CREATE OR REPLACE.
do $migration$
declare
  fn regprocedure := 'public.submit_match_special_action(uuid,bigint,text,jsonb)'::regprocedure;
  bad  text := $lit$'\"GAME_OVER\"'::jsonb$lit$;
  good text := $lit$'"GAME_OVER"'::jsonb$lit$;
  src  text;
begin
  src := pg_get_functiondef(fn);
  if position(bad in src) = 0 then
    if position(good in src) > 0 then
      raise notice 'submit_match_special_action already fixed; nothing to do';
      return;
    end if;
    raise exception 'Expected malformed GAME_OVER literal not found; refusing to guess';
  end if;
  if (length(src) - length(replace(src, bad, ''))) / length(bad) <> 1 then
    raise exception 'Expected exactly one malformed GAME_OVER literal';
  end if;
  execute replace(src, bad, good);
end
$migration$;
