-- Admin ownership seed for launch.
insert into public.pending_admin_emails(email)
values (lower('hikaru4891@hotmail.com'))
on conflict(email) do nothing;
