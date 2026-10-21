# Oryx – deploy guide (all free tiers)

## 1. GitHub
Create a free account, then a new repo called `oryx`. Upload everything in this folder (drag and drop works, include the hidden `.github` folder).

## 2. Supabase (backend)
1. supabase.com > New project (free). Save the database password.
2. SQL Editor > paste `supabase/schema.sql` > Run.
3. Authentication > Providers: Email enabled. Later, set Site URL and Redirect URLs to your Cloudflare address.
4. Project Settings > API: copy the Project URL and anon key into `config.js`, then commit.
5. Deploy the function (needs Node): `npx supabase login`, `npx supabase link --project-ref YOUR-REF`, `npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`, `npx supabase functions deploy generate`.

## 3. Cloudflare Pages (front-end)
Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git > choose `oryx`. Framework: none. Build command: empty. Output directory: `/`. You get `oryx.pages.dev`.

## 4. Keep-alive
GitHub repo > Settings > Secrets and variables > Actions: add `SUPABASE_URL` and `SUPABASE_ANON_KEY`. The workflow pings every 3 days so the free project doesn't pause.

## 5. Safety
Set a monthly spend limit on your Anthropic API key. Payments are not wired in yet; upgrade users manually by setting `plan = 'pro'` in the `profiles` table.
