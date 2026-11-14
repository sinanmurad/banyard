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

-- Not meant to be called through the API; the trigger runs as the function owner.
revoke execute on function handle_new_user() from public, anon, authenticated;

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
create or replace function limit_posts() returns trigger language plpgsql set search_path = public as $$
begin
  if (select count(*) from posts where author_id = new.author_id
        and created_at > now() - interval '1 minute') >= 3 then
    raise exception 'You are posting too fast, please wait a moment.';
  end if;
  return new;
end $$;
create trigger posts_rate_limit before insert on posts
  for each row execute function limit_posts();

create or replace function limit_comments() returns trigger language plpgsql set search_path = public as $$
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

-- ===== v0.3: profiles, settings, memberships, replies =====

alter table profiles
  add column if not exists display_name text check (char_length(display_name) <= 40),
  add column if not exists bio text not null default '' check (char_length(bio) <= 300),
  add column if not exists show_nsfw boolean not null default false,
  add column if not exists default_sort text not null default 'hot' check (default_sort in ('hot','new','top'));

-- Users may only edit their own harmless profile columns (never is_admin).
drop policy if exists "profiles insert own" on profiles;
revoke insert, update on profiles from anon, authenticated;
grant update (display_name, bio, show_nsfw, default_sort) on profiles to authenticated;
create policy "profiles update own" on profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists memberships (
  user_id uuid not null references profiles(id) on delete cascade,
  community_id uuid not null references communities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, community_id)
);
alter table memberships enable row level security;
create policy "memberships read own" on memberships for select using (auth.uid() = user_id);
create policy "memberships insert own" on memberships for insert with check (auth.uid() = user_id);
create policy "memberships delete own" on memberships for delete using (auth.uid() = user_id);

alter table comments add column if not exists parent_id uuid references comments(id) on delete cascade;

alter table posts add column if not exists edited_at timestamptz;
create policy "posts update own" on posts for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
revoke update on posts from anon, authenticated;
grant update (title, body, is_nsfw, edited_at) on posts to authenticated;
revoke update on comments from anon, authenticated;

-- Only admins may change the "removed" flag (also grants the column for admin updates).
grant update (removed) on posts to authenticated;
grant update (removed) on comments to authenticated;
create or replace function guard_removed() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.removed is distinct from old.removed and not is_admin() then
    raise exception 'Only admins can remove or restore content.';
  end if;
  return new;
end $$;
create trigger posts_guard_removed before update on posts
  for each row execute function guard_removed();
create trigger comments_guard_removed before update on comments
  for each row execute function guard_removed();

-- Self-service account deletion (cascades to profile, posts, comments, votes).
create or replace function delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;

create or replace view feed with (security_invoker = true) as
select p.id, p.title, p.is_nsfw, p.created_at,
       c.slug as community_slug, pr.username,
       coalesce(s.score, 0) as score,
       (coalesce(s.score, 0) + 1) /
         power(extract(epoch from now() - p.created_at) / 3600 + 2, 1.5) as hot,
       pr.display_name
from posts p
join communities c on c.id = p.community_id
join profiles pr on pr.id = p.author_id
left join post_scores s on s.post_id = p.id;

-- ===== v0.4: transparency, appeals, saved, blocks, notifications, search =====
-- v0.4: transparency, appeals, saved, blocks, notifications, search

-- Public moderation log (no shadow removals: every removal has a reason).
create table if not exists modlog (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('post','comment')),
  target_id uuid not null,
  target_author uuid references profiles(id) on delete set null,
  post_id uuid,
  title text not null default '',
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now()
);
alter table modlog enable row level security;
create policy "modlog public read" on modlog for select using (true);

create table if not exists appeals (
  id uuid primary key default gen_random_uuid(),
  modlog_id uuid not null references modlog(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  message text not null check (char_length(message) between 3 and 2000),
  status text not null default 'open' check (status in ('open','granted','denied')),
  created_at timestamptz not null default now(),
  unique (modlog_id, user_id)
);
alter table appeals enable row level security;
create policy "appeals own insert" on appeals for insert to authenticated
  with check (user_id = auth.uid());
create policy "appeals own read" on appeals for select to authenticated
  using (user_id = auth.uid() or is_admin());

-- Authors can still see their own removed items (so they know what happened).
create policy "posts author sees removed" on posts for select to authenticated
  using (author_id = auth.uid());
create policy "comments author sees removed" on comments for select to authenticated
  using (author_id = auth.uid());

create or replace function remove_content(p_kind text, p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare a uuid; t text := ''; pid uuid;
begin
  if not is_admin() then raise exception 'admin only'; end if;
  if p_kind = 'post' then
    update posts set removed = true where id = p_id returning author_id, title, id into a, t, pid;
  else
    update comments set removed = true where id = p_id returning author_id, left(body, 80), post_id into a, t, pid;
  end if;
  insert into modlog (kind, target_id, target_author, post_id, title, reason)
  values (p_kind, p_id, a, pid, coalesce(t, ''), p_reason);
end $$;
revoke execute on function remove_content(text, uuid, text) from public, anon;
grant execute on function remove_content(text, uuid, text) to authenticated;

create or replace function resolve_appeal(p_id uuid, p_grant boolean)
returns void language plpgsql security definer set search_path = public as $$
declare m modlog;
begin
  if not is_admin() then raise exception 'admin only'; end if;
  update appeals set status = case when p_grant then 'granted' else 'denied' end
    where id = p_id;
  if p_grant then
    select ml.* into m from modlog ml join appeals ap on ap.modlog_id = ml.id where ap.id = p_id;
    if m.kind = 'post' then update posts set removed = false where id = m.target_id;
    else update comments set removed = false where id = m.target_id; end if;
  end if;
end $$;
revoke execute on function resolve_appeal(uuid, boolean) from public, anon;
grant execute on function resolve_appeal(uuid, boolean) to authenticated;

-- Saved posts (unlimited).
create table if not exists saved (
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table saved enable row level security;
create policy "saved own" on saved for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Block users.
create table if not exists blocks (
  user_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  primary key (user_id, blocked_id),
  check (user_id <> blocked_id)
);
alter table blocks enable row level security;
create policy "blocks own" on blocks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- In-app notifications only (no email spam).
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  from_user uuid references profiles(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table notifications enable row level security;
create policy "notif own read" on notifications for select to authenticated using (user_id = auth.uid());
create policy "notif own update" on notifications for update to authenticated using (user_id = auth.uid());
revoke update on notifications from authenticated;
grant update (read) on notifications to authenticated;

create or replace function notify_reply() returns trigger
language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  if new.parent_id is not null then
    select author_id into target from comments where id = new.parent_id;
  else
    select author_id into target from posts where id = new.post_id;
  end if;
  if target is not null and target <> new.author_id
     and not exists (select 1 from blocks where user_id = target and blocked_id = new.author_id) then
    insert into notifications (user_id, post_id, from_user) values (target, new.post_id, new.author_id);
  end if;
  return new;
end $$;
revoke execute on function notify_reply() from public, anon, authenticated;
create trigger comments_notify after insert on comments
  for each row execute function notify_reply();

-- Full-text search (RLS applies: security invoker).
create index if not exists posts_fts on posts using gin (to_tsvector('english', title || ' ' || body));
create index if not exists comments_fts on comments using gin (to_tsvector('english', body));
create or replace function search_posts(q text)
returns table (id uuid, title text, snippet text, created_at timestamptz)
language sql stable security invoker set search_path = public as $$
  select p.id, p.title, left(p.body, 200), p.created_at from posts p
  where not p.removed and to_tsvector('english', p.title || ' ' || p.body) @@ websearch_to_tsquery('english', q)
  union
  select c.post_id, 'Comment', left(c.body, 200), c.created_at from comments c
  where not c.removed and to_tsvector('english', c.body) @@ websearch_to_tsquery('english', q)
  order by created_at desc limit 50
$$;

create or replace view feed with (security_invoker = true) as
select p.id, p.title, p.is_nsfw, p.created_at,
       c.slug as community_slug, pr.username,
       coalesce(s.score, 0) as score,
       (coalesce(s.score, 0) + 1) /
         power(extract(epoch from now() - p.created_at) / 3600 + 2, 1.5) as hot,
       pr.display_name, p.author_id
from posts p
join communities c on c.id = p.community_id
join profiles pr on pr.id = p.author_id
left join post_scores s on s.post_id = p.id
where not p.removed;
