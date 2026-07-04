-- Profiles table
create table profiles (
  id uuid primary key references auth.users(id),
  email text,
  display_name text,
  avatar_url text,
  is_enabled boolean default false,
  available_points int default 0,
  created_at timestamptz default now()
);

-- Matches table with last known state backup
create table matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  stage text,
  group_name text,
  home_team text,
  away_team text,
  home_flag text,
  away_flag text,
  home_score int,
  away_score int,
  home_final_score int,
  away_final_score int,
  winner text,
  status text,
  scheduled_at timestamptz,
  utc_minus_5_at timestamptz,
  last_synced_at timestamptz default now()
);

-- Predictions table
create table predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  match_id uuid references matches(id),
  home_score int,
  away_score int,
  extra_time_home int,
  extra_time_away int,
  penalties_home int,
  penalties_away int,
  locked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, match_id)
);

-- Match points table
create table match_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  match_id uuid references matches(id),
  points int,
  exact_score boolean default false,
  trend boolean default false,
  created_at timestamptz default now(),
  unique(user_id, match_id)
);

-- Row Level Security
alter table profiles enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;
alter table match_points enable row level security;

create policy "Public profiles are viewable"
on profiles for select using (true);

create policy "Users can update own profile"
on profiles for update using (auth.uid() = id);

create policy "Matches are viewable"
on matches for select using (true);

create policy "Users can view own predictions"
on predictions for select using (auth.uid() = user_id);

create policy "Users can insert own predictions"
on predictions for insert with check (auth.uid() = user_id);

create policy "Users can update own predictions"
on predictions for update using (auth.uid() = user_id);

create policy "Match points are viewable"
on match_points for select using (true);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, is_enabled)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Jugador'),
    new.raw_user_meta_data->>'avatar_url',
    (new.email = 'andresdmf55@gmail.com')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Users can upload their own avatar"
on storage.objects for insert
with check (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Users can update their own avatar"
on storage.objects for update
using (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Avatars are publicly viewable"
on storage.objects for select
using (bucket_id = 'avatars');

-- Teams table
create table if not exists teams (
  id text primary key,
  name text not null,
  group_name text,
  flag_emoji text
);

-- Players table
create table if not exists players (
  id text primary key,
  team_id text references teams(id),
  name text not null,
  position text,
  is_goalkeeper boolean default false
);

-- Award predictions table
create table if not exists award_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  award_type text not null check (award_type in ('champion', 'top_scorer', 'best_goalkeeper')),
  prediction text not null,
  points_wagered int not null check (points_wagered >= 2 and points_wagered <= 5),
  is_winner boolean default null,
  settled_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, award_type)
);

-- Row Level Security for new tables
alter table teams enable row level security;
alter table players enable row level security;
alter table award_predictions enable row level security;

create policy "Teams are publicly viewable"
on teams for select using (true);

create policy "Players are publicly viewable"
on players for select using (true);

create policy "Users can view own award predictions"
on award_predictions for select using (auth.uid() = user_id);

create policy "Users can insert own award predictions"
on award_predictions for insert with check (auth.uid() = user_id);

create policy "Users can update own award predictions"
on award_predictions for update using (auth.uid() = user_id);
