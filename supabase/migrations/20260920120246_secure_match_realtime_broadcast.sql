create schema if not exists private;

create or replace function private.is_match_broadcast_participant(p_topic text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.matches m
    where p_topic = 'mega-x-match:' || m.id::text
      and (select auth.uid()) in (m.player1_id, m.player2_id)
  );
$$;

revoke all on function private.is_match_broadcast_participant(text) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_match_broadcast_participant(text) to authenticated;

drop policy if exists "match participants receive match broadcasts" on realtime.messages;
create policy "match participants receive match broadcasts"
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and private.is_match_broadcast_participant((select realtime.topic()))
);

create or replace function private.broadcast_match_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'matchId', new.id::text,
      'stateVersion', new.state_version,
      'status', new.status,
      'phase', new.phase
    ),
    'match_updated',
    'mega-x-match:' || new.id::text,
    true
  );
  return new;
end;
$$;

revoke all on function private.broadcast_match_update() from public, anon, authenticated;

drop trigger if exists matches_realtime_broadcast on public.matches;
create trigger matches_realtime_broadcast
after update of state_version, status, phase on public.matches
for each row
when (
  old.state_version is distinct from new.state_version
  or old.status is distinct from new.status
  or old.phase is distinct from new.phase
)
execute function private.broadcast_match_update();
