# Agora

Open-source forum where anything legal can be discussed. Illegal content is banned, and responsibility for every post lies with the person who posts it.

Yasalar çerçevesinde her şeyin konuşulabildiği açık kaynak forum. Suç oluşturan içerik yasak; paylaşılan içeriğin sorumluluğu paylaşana aittir.

## Features
- Communities, posts, comments, up/down votes
- Sign-up requires accepting rules, age 18+, and the responsibility statement
- `18+` flag: hidden by default, text/link only (no media upload yet)
- Public report / takedown form (no login), 48-hour process for CSAM and non-consensual intimate imagery
- Soft-delete moderation via SQL (see [docs/MODERATION.md](docs/MODERATION.md))

## Stack
Next.js 15 (App Router) · TypeScript · Supabase (Auth, Postgres, RLS)

## Quick start
```bash
git clone <your-fork> agora && cd agora
npm install
cp .env.example .env.local        # fill in Supabase URL, anon key, legal e-mail
# Run supabase/schema.sql in the Supabase SQL editor
npm run dev
```

## Not included yet (good first contributions)
- Image/video upload with age + identity verification and consent records
- Moderator role and admin UI for the report queue
- Search, user profiles, nested comments, notifications
- Rate limiting and spam protection

## Legal note
If you host an instance you are the operator and carry the legal obligations in your country (e.g. Turkey Law 5651, EU DSA, UK Online Safety Act, US Take It Down Act). This is not legal advice; see [docs/MODERATION.md](docs/MODERATION.md).

## License
MIT
