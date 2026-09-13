-- Mega X 1.1 security hardening: landing metrics use SECURITY DEFINER RPCs,
-- so direct table privileges on lobby_visits are unnecessary for client roles.
-- Keep RLS enabled as defense in depth and remove direct table access.

revoke all privileges on table public.lobby_visits from anon, authenticated;
