-- Backgammon app schema. Run this once against a fresh Supabase project
-- (SQL Editor -> New query -> paste -> Run). Safe to re-run: uses
-- "if not exists" / "or replace" where practical.

-- Profiles: one row per authenticated user, created automatically on signup.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  rating integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Games: one row per finished (or in-progress) game, used for history and leaderboard stats.
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  room_code text,
  white_player uuid references public.profiles (id) on delete set null,
  black_player uuid references public.profiles (id) on delete set null,
  winner text check (winner in ('white', 'black')),
  win_kind text check (win_kind in ('normal', 'gammon', 'backgammon')),
  moves_count integer not null default 0,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.games enable row level security;

drop policy if exists "Games are viewable by everyone" on public.games;
create policy "Games are viewable by everyone"
  on public.games for select
  using (true);

drop policy if exists "Players can insert their own games" on public.games;
create policy "Players can insert their own games"
  on public.games for insert
  with check (auth.uid() = white_player or auth.uid() = black_player);

drop policy if exists "Players can update their own games" on public.games;
create policy "Players can update their own games"
  on public.games for update
  using (auth.uid() = white_player or auth.uid() = black_player);

-- Chat messages, scoped per room code (a local pass-and-play game has no room).
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  sender_id uuid references public.profiles (id) on delete set null,
  sender_name text not null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "Messages are viewable by everyone" on public.messages;
create policy "Messages are viewable by everyone"
  on public.messages for select
  using (true);

drop policy if exists "Authenticated users can send messages" on public.messages;
create policy "Authenticated users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create index if not exists messages_room_code_idx on public.messages (room_code, created_at);

-- Leaderboard view: top players by rating, tie-broken by win count.
create or replace view public.leaderboard as
  select id, username, rating, wins, losses
  from public.profiles
  order by rating desc, wins desc
  limit 100;

-- Enable Realtime broadcast on the messages table for live chat.
alter publication supabase_realtime add table public.messages;
