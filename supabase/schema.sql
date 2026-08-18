-- Fallow Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Activities Table
create table public.activities (
    id text primary key, -- Using the hyphenated string id
    name text not null,
    category text not null,
    subcategory text,
    short_description text,
    hook text,
    
    -- Dimensions (stored as JSONB for flexibility, or we could flatten them)
    dimensions jsonb not null,
    practical_constraints jsonb not null,
    progression jsonb not null,
    social_profile jsonb not null,
    experiment jsonb not null,
    tags text[] not null default '{}',
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Profiles Table (User DNA)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text,
    scores jsonb not null default '{"sociality": 0, "structure": 0, "physicality": 0, "expression": 0, "environment": 0, "barrier": 0}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Interactions Table (Swipes/Saves)
create table public.interactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    activity_id text references public.activities(id) on delete cascade not null,
    status text not null check (status in ('interested', 'pass', 'saved')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, activity_id) -- A user can only have one active interaction per activity
);

-- Row Level Security (RLS) setup

alter table public.activities enable row level security;
alter table public.profiles enable row level security;
alter table public.interactions enable row level security;

-- Policies

-- Activities: Anyone can read activities
create policy "Activities are viewable by everyone." 
on public.activities for select using (true);

-- Profiles: Users can only read and update their own profile
create policy "Users can view own profile." 
on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile." 
on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile." 
on public.profiles for insert with check (auth.uid() = id);

-- Interactions: Users can only CRUD their own interactions
create policy "Users can view own interactions." 
on public.interactions for select using (auth.uid() = user_id);

create policy "Users can insert own interactions." 
on public.interactions for insert with check (auth.uid() = user_id);

create policy "Users can update own interactions." 
on public.interactions for update using (auth.uid() = user_id);

create policy "Users can delete own interactions." 
on public.interactions for delete using (auth.uid() = user_id);

-- Trigger to create a profile automatically when a user signs up (including anon)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
