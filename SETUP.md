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
bun supabase/tests/quote-accuracy/run.ts --lines  # older free-form bench, every priced line
```

- `recipes.test.ts` prices 9 real job descriptions through the recipe engine and checks each
  lands inside the range published UK cost guides give for that job (sources in
  `recipe-bench.ts`). The recipes were tuned against these guides, so treat this as a
  calibration check; real invoices from real jobs are the proper test — add them as you get them.
- The **Scrape check** GitHub workflow (Actions tab → Scrape check → Run workflow) tests,
  live, which supplier sites can be read and finds real prices for recipe items.

## How pricing works now

1. **The AI lists the materials for any job** — with quantities worked out from the
   measurements, in the units merchants sell them (m, m², bags, tubs…), plus the labour
   hours. It never sets prices. The measurements it used are shown on the quote; anything
   it had to assume can be corrected and re-quoted.
2. **Every item is priced from a real supplier product**, in this order:
   - your inventory
   - a recent price we've already read (searched by name, under 14 days old)
   - **live**: search our index of ~67,000 product pages (Toolstation, Wickes, Travis
     Perkins), open the best matches right now and read the current price
   - an older cached price
   - only then an estimate, always marked **Verify ↗**
3. **Matching is strict**: the product must be the same type (a cable stripper is not cable),
   the same size (600 × 600 is not 600 × 1400) and not a different variant (an AFDD is not an
   RCBO). Among good matches the cheapest per unit wins, with your preferred suppliers first.
4. **Packs are converted**: a 50 m drum becomes a price per metre, a pack of 5 sockets a
   price each, a 2.2 m² pack of flooring a price per m².
5. Your **markup, trade discount, hours per day, whole-pack charging and overhead costs**
   (Account → Quote Generation Settings) are applied on top. VAT-registered users get
   materials costed ex VAT with VAT added once on the total.

Up to `LIVE_LOOKUPS_PER_QUOTE` (default 8) items per quote are looked up live; each takes
about 2 seconds. Job recipes (`supabase/functions/_shared/recipes/`) are switched off; set
`USE_RECIPES=on` to have them work out quantities for the jobs they cover.

### Building the product index (once, after deploying)

```sh
for s in Toolstation Wickes "Travis Perkins"; do
  curl -s -X POST "https://YOUR-PROJECT-REF.supabase.co/functions/v1/discover-product-urls" \
    -H "Authorization: Bearer YOUR-SERVICE-ROLE-KEY" -H "Content-Type: application/json" \
    -d "{\"supplier\": \"$s\"}"
done
```

After that the nightly job refreshes the index every Sunday, and the hourly crawl (in
`supabase/setup/schedule-price-refresh.sql`) reads about 1,400 product pages a day,
common trade items first, so most quotes find a recent price without waiting.

### Where real prices come from

Live check from GitHub's servers (Nov 2026, Actions → Scrape check):

- **Readable product pages:** Toolstation (8k products), Wickes (37k), Travis Perkins (23k),
  TLC Direct. AI-style material lists for six common jobs got real prices for 26 of 30 items.
- **Search pages forbidden by robots.txt:** Toolstation, Wickes, Screwfix, Jewson — so we
  never scrape searches; we use their sitemaps instead.
- **Block automated requests:** B&Q, CEF, Plumbnation, Electrical Direct, Dulux Decorator
  Centre, Brewers.

For more suppliers, and prices you're allowed to use commercially without doubt, join the
merchants' affiliate programmes (Screwfix, Wickes and others are on Awin) and load their
product feeds.

Scraping obeys robots.txt and crawl delays, waits at least 2 seconds between requests
to a site, and identifies itself with `SCRAPER_USER_AGENT`. Some merchants' terms of
use prohibit automated collection even where robots.txt allows it — check before
charging customers.
