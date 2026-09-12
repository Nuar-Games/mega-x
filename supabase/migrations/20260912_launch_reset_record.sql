-- Launch reset was executed directly against production before release.
-- Keep this file as a record of the tables intentionally reset for launch.
-- It is not wired into the build and should not be re-run automatically.

-- reset scope:
-- auth.users
-- profiles, leaderboard_entries, matches, match_actions, match_results,
-- challenges, matchmaking_queue, lobby_presence, lobby_visits,
-- global_chat_messages, mail_messages, player_controls, admin_users
