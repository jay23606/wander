-- Wander — Supabase backend (run once against the project the app points at)
--
-- Wander shares the SAME Supabase project as pool-masters/todayland/etc, so every object here is
-- wa_-prefixed to avoid collisions. One table: how many times each real piece has been "opened" into
-- its living-painting scene, community-wide, with no per-person tracking -- purely for a small bit of
-- "234 people have opened this one" atmosphere. The app is fully playable without this ever being
-- applied; every call in src/supabase.js is best-effort and no-ops if it is not there.

create table if not exists public.wa_opens (
  piece_id    text primary key,
  title       text,
  creator     text,
  opens       bigint not null default 0,
  updated_at  timestamptz not null default now()
);

create or replace function public.wa_record_open(p_piece_id text, p_title text, p_creator text)
returns bigint as $$
declare v bigint;
begin
  insert into public.wa_opens(piece_id, title, creator, opens) values (p_piece_id, p_title, p_creator, 1)
  on conflict (piece_id) do update set opens = wa_opens.opens + 1, updated_at = now()
  returning opens into v;
  return v;
end;
$$ language plpgsql security definer;

alter table public.wa_opens enable row level security;
drop policy if exists wa_opens_read on public.wa_opens;
create policy wa_opens_read on public.wa_opens for select using (true);
-- Writes only happen through wa_record_open() above, so no insert/update policy is needed for anon.
