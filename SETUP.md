# Running Quotable on your own stack

Quotable is a React + Vite front end with a Supabase back end (Postgres, Auth,
Edge Functions). None of it depends on Lovable any more. You need:

- A free **Supabase** account → database, logins and server functions
- A free **Google AI Studio** key → AI quoting (Gemini)
- A free **Groq** key (optional) → backup AI if Gemini is busy
- A host for the front end → **Vercel** or **Netlify** (both free)
- Your existing **Stripe** and **Resend** keys, if you use payments and emails

Total time: about 30 minutes.

---

## 1. Create your Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**. Pick the London region.
2. Note the **project ref** (the `xxxx` in `https://xxxx.supabase.co`).
3. In **Project Settings → API**, note the **URL**, the **anon/publishable key**
   (safe for the browser) and the **service_role key** (secret — never put it in the
   front end or in Git).

## 2. Install the Supabase CLI and link the project

```sh
npm i -g supabase          # or: brew install supabase/tap/supabase
supabase login
cd quotable-it
supabase link --project-ref YOUR-PROJECT-REF
```

Then open `supabase/config.toml` and put your ref on the first line:
`project_id = "YOUR-PROJECT-REF"`.

## 3. Build the database

```sh
supabase db push
```

This replays every file in `supabase/migrations/` and creates all tables, security
rules and database functions exactly as they were on Lovable.

## 4. Add your secrets

Get the AI keys first:

- **Gemini:** <https://aistudio.google.com/apikey> → *Create API key* (free tier, no card).
- **Groq (optional backup):** <https://console.groq.com/keys> → *Create API key*.

Then set them on the server. Run these in your own terminal — don't paste keys into
chats or commit them:

```sh
supabase secrets set GEMINI_API_KEY=...
supabase secrets set GROQ_API_KEY=...                # optional backup
supabase secrets set STRIPE_SECRET_KEY=sk_live_...   # if you take payments
supabase secrets set RESEND_API_KEY=re_...           # for welcome/auth emails
supabase secrets set SEND_EMAIL_HOOK_SECRET=...      # from step 7
supabase secrets set SCRAPER_USER_AGENT="QuotableBot/1.0 (+https://your-domain.com/bot; you@your-domain.com)"
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided
automatically — don't set them.

### Optional tuning

| Secret | Default | What it does |
|---|---|---|
| `GEMINI_MODEL` | `gemini-3.5-flash` | Main AI model |
| `GEMINI_FALLBACK_MODEL` | `gemini-2.5-flash` | Tried if the main model fails. Set to empty to skip |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Backup model on Groq |
| `LIVE_PRICE_LOOKUPS` | on | Set to `off` to stop live supplier lookups during quoting |
| `LIVE_LOOKUPS_PER_QUOTE` | `4` | Max live supplier lookups per quote (each takes a few seconds) |
| `FIRECRAWL_API_KEY` | not set | Paid fallback for sites that block plain requests. Leave unset to stay free |
| `CRAWL_BATCHES_PER_RUN` | `5` | Nightly product pages crawled = this × 10 |
| `REFERENCE_LOOKUPS_PER_RUN` | `8` | Estimated prices checked against real suppliers each night |

> **Before charging customers:** switch your Google AI Studio project to the paid tier
> (add billing). On the free tier Google may use prompts — your customers' job
> descriptions — to improve its models. Paid usage costs pennies per quote.

## 5. Deploy the server functions

```sh
supabase functions deploy
```

## 6. Schedule the nightly price refresh

Open **SQL Editor** in the Supabase dashboard, paste
`supabase/setup/schedule-price-refresh.sql`, replace the two placeholders with your
project URL and service_role key, and run it. The key is stored in Supabase Vault,
not in the job.

## 7. Auth settings

In **Authentication → URL Configuration**, set **Site URL** to your live domain and
add it (plus `http://localhost:8080`) to **Redirect URLs**.

If you use the custom auth emails (`send-auth-email`): **Authentication → Hooks →
Send Email Hook** → HTTPS → URL
`https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-auth-email`. Supabase
generates a secret there; save it with `supabase secrets set SEND_EMAIL_HOOK_SECRET=...`.

## 8. Run the front end locally

```sh
cp .env.example .env     # then fill in your URL, anon key and project ref
npm install
npm run dev              # http://localhost:8080
```

## 9. Host it

**Vercel:** *Add New → Project* → import the GitHub repo. Framework: Vite.
Add the four `VITE_…` variables from `.env.example` under *Environment Variables*.
Because the app uses client-side routing, add a `vercel.json` rewrite (already
included) so deep links work.

**Netlify:** same idea — build command `npm run build`, publish directory `dist`.
`public/_redirects` is included for client-side routing.

Point your domain at the host, then update the Site URL in step 7.

## 9b. Fill in your business details

Edit `src/config/company.ts` with your trading/legal name, company number,
registered office and support email. They appear in the site footer. A UK limited
company must show these on its website.

## 10. Bring your data across from Lovable

The old database can't be reached directly, so the data is pushed from Lovable into
your new project through a one-off, token-locked function:

1. Generate a random token: `openssl rand -hex 24`
2. `supabase secrets set IMPORT_TOKEN=<that token>` (the function was deployed in step 5)
3. Ask Claude to run the transfer, giving it **only your project ref and the import
   token** — never your service_role key. It copies, in order: suppliers and price
   data, compliance rules and quote templates, then your own account (your password
   keeps working) and its clients, quotes, invoices, schedules and settings. Other
   accounts on the old site are not copied.
4. Run `supabase/setup/clean-imported-prices.sql` in the SQL editor. It renames the
   old fake "Toolstation Public Catalogue" price list to **Quotable Reference Prices**
   (so its rows show as estimates), deletes its random-noise price history, and
   switches off scraped junk rows.
5. When it's done, switch the importer off:
   ```sh
   supabase secrets unset IMPORT_TOKEN
   supabase functions delete import-data
   ```

## 11. Switch off Lovable

Once the new site works:

- In Lovable, **unpublish** the project and disconnect GitHub.
- The old database runs two scheduled jobs every morning at 06:00
  (`daily-price-refresh` and `generate-recurring-invoices-daily`). They stop when the
  Lovable project is deleted.
- Delete the Lovable project to remove your users' data from Lovable.

---

## Checking quote accuracy

```sh
bun test supabase/tests/quote-accuracy          # pass/fail
bun supabase/tests/quote-accuracy/run.ts --lines  # full report, every priced line
```

Eight benchmark jobs (tap swap, sockets, consumer unit, tiling, decorating, boiler,
doors, fencing) run through the real pricing engine with a fixed AI output. Swap the
`truth` figures in `jobs.ts` for real invoices as you collect them.

## How pricing works now

1. The AI (Gemini, falling back to Groq) lists the materials, labour and overheads
   for a job. It never sets prices.
2. Set your **markup, trade discount, hours per day, whole-pack charging and overhead
   costs** in Account → Quote Generation Settings. VAT-registered users (Include VAT
   on) get materials costed ex VAT with VAT added once on the total.
3. Each material is priced in this order:
   **your inventory → real supplier products in the database → a live lookup at
   supplier sites → a reference estimate → a keyword guess**.
   The last two are marked **Verify ↗** in the quote so they're never passed off as real.
3. Live lookups read the supplier's search page, score every product on it against
   what the quote asked for (sizes like 15 mm or 32 A must agree), and cache the real
   product with its link so the next quote gets it instantly.
4. Every night the refresh job re-crawls product pages from supplier sitemaps and
   checks a batch of old estimates against real suppliers.

Scraping uses plain requests (free), obeys each site's robots.txt and crawl delay,
waits at least 2 seconds between requests to the same site, and identifies itself
with `SCRAPER_USER_AGENT`. Some merchants' terms of use prohibit automated
collection even where robots.txt allows it — check before charging customers, and
prefer official trade or affiliate feeds where a merchant offers one.
