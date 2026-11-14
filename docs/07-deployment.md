# Deployment instructions

## Requirements

- Node.js 20+ (built and tested on 22)
- PostgreSQL 14+ (tested on 16)
- Optional: an Anthropic API key, for the AI tutor, question generation and AI marking of written answers. Without it, everything else works and written answers are keyword-marked.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `SESSION_SECRET` | yes | ≥ 32 random characters for signing session cookies (`openssl rand -base64 32`) |
| `ANTHROPIC_API_KEY` | for AI | Claude API key |
| `CLAUDE_MODEL` | no | Defaults to `claude-opus-5-5` |
| `TEACHER_SIGNUP_CODE` | recommended | If set, teacher accounts need this code at sign-up |
| `COOKIE_SECURE` | no | Defaults to `true` in production. Set `false` **only** if the site is served over plain HTTP, e.g. on a closed school LAN; otherwise browsers drop the cookie and nobody can sign in |
| `SEED_DEMO` | no | `true` adds demo accounts and simulated history for trying the platform. Off by default; leave it off in production |

## Option A: local development

```bash
npm install
```

```bash
cp .env.example .env    # then edit DATABASE_URL and SESSION_SECRET
```

```bash
npx prisma migrate deploy
```

```bash
npx prisma db seed
```

```bash
npm run dev
```

Open http://localhost:3000. To try it with demo data, seed with `SEED_DEMO=true npx prisma db seed`. Demo logins: `teacher@demo.bt`, `karma@demo.bt`, `pema@demo.bt`, `sonam@demo.bt`, `dechen@demo.bt`, all with password `physics123`. Class join code `XIISCA`.

Checks:

```bash
npm test
```

```bash
npm run typecheck
```

## Option B: Docker Compose (single server)

```bash
export SESSION_SECRET="$(openssl rand -base64 32)"
```

```bash
export ANTHROPIC_API_KEY="..."   # optional
```

```bash
docker compose up -d --build
```

The app container runs `prisma migrate deploy` and `prisma db seed` on start, then serves on port 3000. Seeding is idempotent: the curriculum is upserted, and the question bank and demo data are only inserted once. Put a TLS-terminating reverse proxy (Caddy or nginx) in front, for example with Caddy:

```
physics.yourschool.bt {
    reverse_proxy localhost:3000
}
```

## Option C: managed hosting (e.g. Vercel + managed PostgreSQL)

1. Create a PostgreSQL database (Neon, Supabase, RDS, or a government-hosted instance) and copy its connection string.
2. Import the repository into the host. Build command `npm run build`; output is the Next.js app.
3. Set the environment variables above in the host's dashboard.
4. Deploy. On Vercel the `vercel-build` script runs `prisma migrate deploy` and `prisma db seed` before `next build`, so the database is created and filled automatically on the first deploy. Later deploys apply new migrations and leave existing data alone. On other hosts, run those two commands once against the production `DATABASE_URL`.

AI routes set `maxDuration` (300 s for generation, 120 s for the tutor). On serverless hosts, make sure your plan allows these function durations.

## Option D: plain VM with systemd (no Docker)

```bash
npm ci && npm run build
```

```bash
cp -r .next/static .next/standalone/.next/
```

Run `node .next/standalone/server.js` under systemd with the environment variables set and `PORT=3000`, behind nginx/Caddy for TLS.

## Operating the platform

- **First teacher:** register at `/register` → "I'm a teacher" (with `TEACHER_SIGNUP_CODE` if set). Create a class on the dashboard and share its join code.
- **Curriculum update:** edit `curriculum/build_curriculum.py`, run `python3 curriculum/build_curriculum.py curriculum/class-xii-physics.json`, then `npx prisma db seed` (upserts themes/topics/sub-topics/outcomes). Regenerate the analysis with `python3 curriculum/build_report.py curriculum/class-xii-physics.json docs/01-curriculum-analysis.md`.
- **Backups:** `pg_dump` the database daily; it holds all student progress.
- **AI cost:** generation uses effort `high` with at most 5 items per request; the tutor uses `medium` and grading `low`. The ~7k-token curriculum system prompt is cached for 1 hour, so repeat calls pay the cache-read rate for it.
- **Removing demo data:** if demo data was seeded, delete users whose emails end in `@demo.bt`; their attempts and mastery cascade.

## Security checklist

- [ ] `SESSION_SECRET` is long and random, and is not reused across environments
- [ ] HTTPS in front of the app (`COOKIE_SECURE=true`)
- [ ] `TEACHER_SIGNUP_CODE` set
- [ ] `SEED_DEMO` not set (or `false`) in production
- [ ] Database not exposed to the internet; least-privilege DB user
- [ ] Regular `pg_dump` backups tested by restoring
