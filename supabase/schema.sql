-- Banyard: Supabase schema. Paste into the SQL Editor and run (or apply as a migration).

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (username ~ '^[a-zA-Z0-9_]{3,24}$'),
  accepted_terms_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists communities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9_]{3,24}$'),
  title text not null,
  description text not null default '',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  body text not null default '' check (char_length(body) <= 40000),
  is_nsfw boolean not null default false,
  removed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  removed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists votes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  primary key (post_id, user_id)
);

-- Reports / takedown requests. Anyone (even logged out) can file a report.
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete set null,
  comment_id uuid references comments(id) on delete set null,
  category text not null check (category in
    ('csam','non_consensual_intimate','illegal','violence','drugs_weapons','other')),
  details text not null default '',
  reporter_email text,
  status text not null default 'open' check (status in ('open','actioned','dismissed')),
  created_at timestamptz not null default now(),
  check (post_id is not null or comment_id is not null)
);

create view post_scores with (security_invoker = true) as
  select p.id as post_id, coalesce(sum(v.value), 0)::int as score
  from posts p left join votes v on v.post_id = p.id
  group by p.id;

-- A profile is created automatically at sign-up (works with email confirmation on).
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- RLS
alter table profiles enable row level security;
alter table communities enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table votes enable row level security;
alter table reports enable row level security;

create policy "profiles read" on profiles for select using (true);
create policy "profiles insert own" on profiles for insert with check (auth.uid() = id);

create policy "communities read" on communities for select using (true);
create policy "communities insert" on communities for insert
  with check (auth.uid() = created_by);

create policy "posts read" on posts for select using (not removed);
create policy "posts insert own" on posts for insert with check (auth.uid() = author_id);
create policy "posts delete own" on posts for delete using (auth.uid() = author_id);

create policy "comments read" on comments for select using (not removed);
create policy "comments insert own" on comments for insert with check (auth.uid() = author_id);
create policy "comments delete own" on comments for delete using (auth.uid() = author_id);

create policy "votes read" on votes for select using (true);
create policy "votes upsert own" on votes for insert with check (auth.uid() = user_id);
create policy "votes update own" on votes for update using (auth.uid() = user_id);
create policy "votes delete own" on votes for delete using (auth.uid() = user_id);

-- Reports: anyone can insert; only admins / service role can read.
create policy "reports insert anyone" on reports for insert with check (true);

-- Removal: admins use the /admin page, or SQL as the Supabase dashboard / service role:
--   update posts set removed = true where id = '...';
-- Reports in the csam / non_consensual_intimate categories must be actioned
-- within 48 hours (see docs/MODERATION.md).

-- ===== v0.2: admin, rate limits, ranking =====

alter table profiles add column if not exists is_admin boolean not null default false;

create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;

-- Admins can also see removed content and update content / report status.
create policy "posts admin read" on posts for select using (is_admin());
create policy "posts admin update" on posts for update using (is_admin());
create policy "comments admin read" on comments for select using (is_admin());
create policy "comments admin update" on comments for update using (is_admin());
create policy "reports admin read" on reports for select using (is_admin());
create policy "reports admin update" on reports for update using (is_admin());

-- Rate limits: reduce spam.
create or replace function limit_posts() returns trigger language plpgsql as $$
begin
  if (select count(*) from posts where author_id = new.author_id
        and created_at > now() - interval '1 minute') >= 3 then
    raise exception 'You are posting too fast, please wait a moment.';
  end if;
  return new;
end $$;
create trigger posts_rate_limit before insert on posts
  for each row execute function limit_posts();

create or replace function limit_comments() returns trigger language plpgsql as $$
begin
  if (select count(*) from comments where author_id = new.author_id
        and created_at > now() - interval '1 minute') >= 10 then
    raise exception 'You are commenting too fast, please wait a moment.';
  end if;
  return new;
end $$;
create trigger comments_rate_limit before insert on comments
  for each row execute function limit_comments();

-- Feed view: score and "hot" ranking.
create or replace view feed with (security_invoker = true) as
select p.id, p.title, p.is_nsfw, p.created_at,
       c.slug as community_slug, pr.username,
       coalesce(s.score, 0) as score,
       (coalesce(s.score, 0) + 1) /
         power(extract(epoch from now() - p.created_at) / 3600 + 2, 1.5) as hot
from posts p
join communities c on c.id = p.community_id
join profiles pr on pr.id = p.author_id
left join post_scores s on s.post_id = p.id;

-- To make the first admin (use your own username):
--   update profiles set is_admin = true where username = 'kullanici_adi';
