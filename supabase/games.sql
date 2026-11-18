-- Online rooms for /games. Run once in the Supabase SQL editor.
--
-- Only the Next.js server touches this table, with the secret key. Row level
-- security is on with no policies, so the public key (used in the browser
-- just for realtime pings) can neither read nor change rooms — secret words
-- stay on the server.

create table if not exists public.game_rooms (
  code        text primary key,
  game        text not null,
  data        jsonb not null,
  version     integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists game_rooms_updated_at_idx on public.game_rooms (updated_at);

alter table public.game_rooms enable row level security;

-- «Связи»: custom puzzle packs made in /games/connections/admin, and the days
-- of the daily feed given to them (each row keeps its own copy of the puzzle).

create table if not exists public.connections_packs (
  id          text primary key,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.connections_days (
  date        text primary key,
  pack_id     text not null,
  pack_index  integer not null,
  puzzle      jsonb not null,
  created_at  timestamptz not null default now()
);

alter table public.connections_packs enable row level security;
alter table public.connections_days enable row level security;
