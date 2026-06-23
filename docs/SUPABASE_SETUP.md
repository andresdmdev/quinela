# Supabase Configuration

## 1. Create Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Create a new project.
3. Save the **Project URL** and the **anon public** key in your `.env`.

## 2. Enable Google OAuth

1. Go to **Authentication → Providers**.
2. Find **Google** and enable it.
3. Paste the **Client ID** and **Client Secret** generated in Google Cloud Console.
4. Save the configuration.

## 3. Configure Storage for Avatars

1. Go to **Storage → New bucket**.
2. Name: `avatars`.
3. Select **Public bucket**.
4. Disable **Restrict file size** or set it to 2MB.
5. Save.

### RLS Policies for `avatars`

Allow each user to upload and view their own avatar:

```sql
create policy "Users can upload their own avatar"
on storage.objects for insert
with check (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Users can view avatars"
on storage.objects for select
using (bucket_id = 'avatars');
```

## 4. Create Tables

Run the following SQL in the SQL Editor:

```sql
create table profiles (
  id uuid primary key references auth.users(id),
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

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
  status text,
  scheduled_at timestamptz,
  utc_minus_5_at timestamptz,
  last_synced_at timestamptz default now()
);

create table predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  match_id uuid references matches(id),
  home_score int,
  away_score int,
  locked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, match_id)
);

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
```

## 5. Row Level Security Policies

```sql
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
```

## 6. Environment Variables in Vercel

Add these variables in Vercel → Project Settings → Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FOOTBALL_DATA_API_KEY`
