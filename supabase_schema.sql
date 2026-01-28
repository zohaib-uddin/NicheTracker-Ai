
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO ENSURE TABLES AND POLICIES ARE CORRECT

-- 1. Users Table
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  is_pro boolean default false,
  plan_interval text,
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  subscription_start_date timestamp with time zone,
  usage jsonb default '{"ai_analysis_used": 0, "monetization_checks_used": 0, "tracked_niches": 0}',
  saved_ids jsonb default '[]',
  settings jsonb default '{"email_notifications": true, "new_video_alerts": false, "language": "en-US"}',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Global Niches Table (This is where all cards are stored)
create table if not exists public.niches (
  id uuid default gen_random_uuid() primary key,
  content jsonb not null, 
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Dedicated Saved Niches Table (Private User Bookmarks)
create table if not exists public.saved_niches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  niche_id text not null,
  niche_data jsonb not null, -- Stores full copy of data for lifetime persistence
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, niche_id) -- Prevent duplicate saves for same user
);

-- 4. Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.niches enable row level security;
alter table public.saved_niches enable row level security;

-- 5. Policies
-- Niches (Global feed - Everyone can see)
drop policy if exists "Anyone can view niches" on public.niches;
create policy "Anyone can view niches" on public.niches for select using (true);

drop policy if exists "Auth users can insert niches" on public.niches;
create policy "Auth users can insert niches" on public.niches for insert with check (auth.role() = 'authenticated');

drop policy if exists "Admins can delete niches" on public.niches;
create policy "Admins can delete niches" on public.niches for delete using (auth.jwt() ->> 'email' = 'zohaibuddin376@gmail.com');

-- Saved Niches (Strictly Private)
drop policy if exists "Users can view own saved niches" on public.saved_niches;
create policy "Users can view own saved niches" on public.saved_niches for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved niches" on public.saved_niches;
create policy "Users can insert own saved niches" on public.saved_niches for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved niches" on public.saved_niches;
create policy "Users can delete own saved niches" on public.saved_niches for delete using (auth.uid() = user_id);
