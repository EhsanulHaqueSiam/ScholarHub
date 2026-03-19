# Pitfalls Research

**Domain:** Scholarship Aggregation Platform (scraping 1000+ international sources, deduplication, admin review, public directory)
**Researched:** 2026-03-20
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Silent Scraper Rot -- Spiders Break Without Anyone Noticing

**What goes wrong:**
Scholarship sites redesign their pages, change CSS classes, rename URL paths, or restructure their HTML. Your spider keeps running successfully (200 OK, no errors) but extracts zero scholarships or garbage data. Because the spider "ran" without crashing, no alert fires. Your database quietly fills with stale or corrupted records, or stops receiving updates from entire sources. With 1000+ spiders, manual inspection is impossible -- dozens can be silently broken at any time.

**Why it happens:**
Developers monitor "did the spider run?" not "did the spider extract valid data?". CSS selectors are brittle by nature. Scholarship sites are maintained by university IT departments with no obligation to maintain stable HTML structures. Redesigns happen without warning, often during semester transitions.

**How to avoid:**
- Track per-spider yield metrics: expected item count vs actual, expected fields populated vs actual. A spider that usually yields 50 scholarships but suddenly yields 0 or 3 is broken.
- Implement a "canary field" check: if a spider fails to extract the scholarship name or deadline (the most basic fields), flag it as broken immediately.
- Build a spider health dashboard that tracks yield counts over time. Alert on any spider that drops below 50% of its historical average.
- Use ScrapeOps or a custom stats pipeline in Scrapy to log per-spider stats to a monitoring endpoint.

**Warning signs:**
- Source count in database stops growing but no errors in logs
- "Last scraped" timestamp for a source is weeks/months old
- Admin review queue dries up but you haven't approved everything
- Users report outdated scholarships still showing as active

**Phase to address:**
Scraping infrastructure phase -- build monitoring into the pipeline from the very first spider, not as an afterthought.

---

### Pitfall 2: Deduplication is an Entity Resolution Problem, Not a String Matching Problem

**What goes wrong:**
The "Erasmus Mundus Joint Master" scholarship appears on 15 different aggregator sites, 8 university pages, and the official EU site -- each with slightly different names ("Erasmus Mundus Scholarships", "EM Joint Masters Programme", "Erasmus+ Mundus Scholarship 2026"), different descriptions, different listed amounts, and different deadlines. Naive deduplication (exact title match, or even fuzzy string match on title alone) either misses most duplicates or falsely merges distinct scholarships (e.g., "DAAD Research Grant - Masters" and "DAAD Research Grant - PhD" are different scholarships). You end up with either thousands of duplicate listings or incorrectly merged records.

**Why it happens:**
Deduplication feels simple ("just match the title") until you encounter real-world data. Scholarship names are not unique identifiers. The same scholarship can have legitimately different names in different languages or on different sites. Meanwhile, different scholarships from the same organization can have nearly identical names. Research shows ~40% of raw scraped data contains redundant records.

**How to avoid:**
- Use composite matching: combine normalized title + offering organization + country + degree level + approximate amount range as a matching key.
- Implement a two-tier system: automated high-confidence merges (>95% match across multiple fields) and a manual review queue for medium-confidence matches (70-95%).
- Store source-level records separately from the canonical merged record. Each source contributes data, and the canonical record picks the richest version of each field. This allows re-merging if you improve the algorithm later.
- Use the Python `dedupe` library for ML-based entity resolution rather than hand-rolling fuzzy matching.
- Never auto-merge scholarship records with different degree levels, even if titles match exactly.

**Warning signs:**
- Users searching for a well-known scholarship see 5+ listings for it
- Admin spends most review time manually merging duplicates
- Total scholarship count seems unrealistically high for the domain
- "View source" on a scholarship detail page shows only one source when you know it should have many

**Phase to address:**
Data modeling and ingestion phase. The schema must support multi-source records from day one. Deduplication logic should be built before scaling to many sources, not after.

---

### Pitfall 3: Convex Transaction Limits Will Block Bulk Data Ingestion

**What goes wrong:**
Your Python scraper finishes a run and tries to push 500 scholarships into Convex via HTTP mutations. Each mutation can scan at most 32,000 documents and write at most 16,000 documents per transaction, but more critically, mutations must complete within 1 second. A single mutation trying to do deduplication (scanning existing records to check for matches) while inserting new data will timeout. Alternatively, pushing records one-at-a-time from Python to Convex via individual HTTP calls is extremely slow and eats through your function call quota (1M calls/month on free tier, 25M on pro).

**Why it happens:**
Convex is optimized for real-time OLTP workloads -- small, fast, reactive mutations triggered by user actions. It is explicitly not designed for batch data processing. Developers coming from traditional databases (PostgreSQL, MySQL) expect to run bulk INSERT/UPDATE operations, but Convex's 1-second mutation timeout and per-transaction limits make this impossible in the conventional way.

**How to avoid:**
- Design the ingestion pipeline as a staging pattern: Python scraper writes raw JSON to a staging area (a simple file store, or a Convex table of raw blobs), then a Convex action (10-minute timeout) processes the staged data in batches of 50-100 records via separate `runMutation` calls.
- Use Convex HTTP actions as the ingestion endpoint. HTTP actions have a 20MB request/response size limit, so you can batch scholarships into reasonably sized payloads.
- Never try to deduplicate inside a mutation. Do lookups in a query, compute the merge in an action, then write the result in a mutation.
- Monitor your function call count and database bandwidth usage against your plan limits.
- Consider `npx convex import` for initial bulk data loads (supports JSON Lines format) rather than programmatic insertion.

**Warning signs:**
- Mutations timing out with "function execution took too long" errors
- Database bandwidth usage spiking near plan limits mid-month
- Function call count approaching monthly quota
- Scraping runs completing but data not appearing in Convex

**Phase to address:**
Data pipeline/integration phase. This must be architecturally solved before building the scraping pipeline, because the ingestion pattern shapes how spiders output data.

---

### Pitfall 4: International Date and Currency Parsing Corruption

**What goes wrong:**
A German scholarship site lists the deadline as "15.03.2026" (March 15), but your parser reads it as "03/15/2026" or worse, "15/03/2026" which gets misinterpreted as an invalid date. A Japanese scholarship lists the amount as "300,000 JPY" (about $2,000), while a European one shows "20.000 EUR" (twenty thousand euros, not 20 euros). Your parser sees the dot and treats it as a decimal point, storing 20.00 EUR instead of 20,000 EUR. Deadline dates are wrong by months, scholarship amounts are off by orders of magnitude, and users miss real deadlines or dismiss valuable scholarships.

**Why it happens:**
Different countries use different date formats (DD/MM/YYYY vs MM/DD/YYYY vs YYYY-MM-DD), different decimal separators (dot vs comma), and different thousands separators (comma, dot, space, or nothing). Scholarship amounts come in dozens of currencies with no standard format. Many scholarship pages express deadlines in relative terms ("apply by March" with no year) or use local calendar systems. Developers test with English-language sources and assume the parser works globally.

**How to avoid:**
- Use source-level locale configuration. Each spider should declare its expected date format and locale, not rely on auto-detection.
- Parse dates with `dateutil.parser` as a fallback but validate output ranges (if the parsed year is 2002, something went wrong).
- Store all dates as ISO 8601 UTC internally. Store the original text alongside the parsed value for admin verification.
- Store amounts as `{value: number, currency: "ISO-4217-code", original_text: string}`. Never convert currencies -- just normalize to the standard code.
- Build a validation layer that flags impossible values: deadlines in the past, amounts less than 0 or greater than $1M, dates more than 2 years in the future.

**Warning signs:**
- Scholarships showing deadlines in January 1970 or year 2099
- Scholarship amounts showing as 0 or absurdly small/large numbers
- Admin constantly correcting dates and amounts manually
- Scholarships from non-English sources having systematically wrong data

**Phase to address:**
Spider development phase. Each spider must encode its locale/format knowledge. A shared parsing library with validation should be built before writing individual spiders.

---

### Pitfall 5: GitHub Actions is Unreliable for Time-Sensitive Scheduling

**What goes wrong:**
Your scraping workflows are scheduled via GitHub Actions cron jobs, but they run 15-45 minutes late, or don't run at all. Community reports show workflows being delayed by 20+ minutes routinely, with some being silently dropped during high-load periods. Workflows on inactive repositories get throttled or suspended entirely. A scholarship with a deadline at midnight gets scraped 45 minutes late, and your system shows it as "open" when it already closed. Or worse, an entire scraping cycle is silently skipped, and your data goes stale for a day without any alert.

**Why it happens:**
GitHub Actions does not guarantee cron execution timing. Workflows are queued globally and executed based on available runner capacity. Peak times (top of hour, midnight UTC) cause delays. Repositories without recent commits can have scheduled workflows throttled. There is no SLA for scheduled workflow timing.

**How to avoid:**
- Do not rely on GitHub Actions for deadline-precision operations. Use it for "run approximately daily" scraping, not "run at exactly midnight before the deadline closes."
- Build idempotent scrapers that can be re-run safely. If a run is skipped, the next run catches up.
- Add a manual trigger (`workflow_dispatch`) to every scheduled workflow so you can force-run missed scrapes.
- Monitor workflow execution: log when each scraping run actually starts vs when it was scheduled. Alert if a run is more than 2 hours late or doesn't run at all.
- For the free tier, keep the repo active (commits, issues, or PRs at least monthly) to avoid GitHub suspending scheduled workflows.
- Consider self-hosted runners if timing precision becomes critical.

**Warning signs:**
- Workflow run history shows gaps (days with no runs)
- Run start times drift significantly from cron schedule
- Repository has no commits for weeks and you notice scrapes stopped
- Deadline-sensitive scholarships showing as "open" after they closed

**Phase to address:**
Automation/scheduling phase. Design the scheduling layer with GitHub Actions' limitations in mind from the start, including manual override triggers and execution monitoring.

---

### Pitfall 6: Cloudflare and Anti-Bot Arms Race Makes Scrapling a Moving Target

**What goes wrong:**
Scrapling works today to bypass Cloudflare Turnstile on scholarship sites. Then Cloudflare updates their detection (they introduced per-customer ML-based detection in 2025 for Enterprise customers). Your Scrapling-based spiders start failing on 30% of sites simultaneously. Because Scrapling is a third-party tool with its own release cycle, you're dependent on their updates to keep bypassing evolving protections. The OpenClaw/Scrapling controversy in early 2026 brought increased scrutiny to bypass tools, potentially accelerating Cloudflare's countermeasures.

**Why it happens:**
Anti-bot detection is an arms race. Cloudflare continuously updates their detection algorithms. Scrapling works by mimicking browser behavior, but every mimicry technique has a shelf life. Enterprise customers get more aggressive protection that can change per-site. What works in testing may fail in production when Cloudflare observes unusual traffic patterns from your scraper IP ranges.

**How to avoid:**
- Treat Scrapling as ONE tool in a toolkit, not the only approach. Have fallback strategies: Nodriver, SeleniumBase UC Mode, or Camoufox as alternatives.
- Implement a fetcher abstraction layer in your spider framework. Each spider declares its required fetcher level (plain HTTP, Scrapy default, Scrapling stealth, full browser). If one fetcher fails, automatically try the next tier.
- Prioritize API-first scraping. Many scholarship aggregators (like some government portals) have RSS feeds, APIs, or structured data (JSON-LD, schema.org) embedded in their pages. Check for these before building a scraper.
- Pin Scrapling versions and test upgrades in staging before rolling out to all spiders.
- Keep headless browser fingerprints diverse -- don't run all spiders with identical browser profiles.

**Warning signs:**
- Sudden spike in 403/503 responses from previously working sites
- Scrapling changelog showing urgent bypass updates
- Multiple spiders for Cloudflare-protected sites failing on the same day
- Increasing solve times for Cloudflare challenges

**Phase to address:**
Scraping infrastructure phase. Build the fetcher abstraction layer before writing individual spiders, so swapping anti-bot strategies doesn't require rewriting every spider.

---

### Pitfall 7: Building 1000 Spiders Before Building 10 Good Ones

**What goes wrong:**
Eager to reach the "1000+ sources" goal, the team writes hundreds of spiders quickly with inconsistent data extraction, no validation, no error handling, and no monitoring. Each spider is a snowflake with its own extraction logic, field naming, and output format. When the data model changes, or a shared library needs updating, every spider must be individually fixed. Maintenance becomes overwhelming. The admin review queue is flooded with garbage data that takes more time to fix than it would to manually enter scholarships.

**Why it happens:**
The "1000+ sources" number is exciting and feels like progress. Writing a basic spider is quick -- you can knock out 20 in a day. But writing a spider that handles edge cases, validates output, uses the shared extraction pipeline, and integrates with monitoring takes 10x longer. The false sense of progress from spider count hides a growing maintenance nightmare.

**How to avoid:**
- Build 10-20 diverse spiders first (covering different site architectures: static HTML, JavaScript-rendered, API-backed, Cloudflare-protected, non-English). Use these to establish patterns and build shared infrastructure.
- Create a spider template/base class that enforces: required output fields, field validation, source metadata, and monitoring hooks.
- Define a "spider quality checklist" before a spider is considered production-ready: extracts all required fields, handles pagination, has error handling for missing fields, logs stats, and has been validated against live data.
- Track "quality-adjusted source count" not raw spider count. 50 high-quality sources that produce clean data are worth more than 500 that produce garbage.

**Warning signs:**
- Most admin review time spent on data quality fixes rather than editorial enrichment
- Spider-to-spider output format inconsistencies
- No shared base class or extraction utilities
- "It works for this one site" as the development philosophy
- High spider count but low usable-scholarship count

**Phase to address:**
Spider framework phase (early). Build the framework, base classes, and shared utilities before the spider-writing sprint.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip per-spider validation | Ship spiders faster | Garbage data floods admin queue, erodes user trust | Never -- basic field validation is minimal effort |
| Store scraped data directly in Convex (no staging) | Simpler pipeline | No way to replay/reprocess failed batches, no data audit trail | Early MVP with <10 sources, must migrate before scaling |
| Hardcode selectors without site-version tracking | Faster spider development | Can't tell when a spider broke vs when a site changed | Never -- always tag spiders with the site version they were written against |
| Use a single Convex table for all scholarship data | Simple schema | Deduplication logic becomes impossible, multi-source tracking breaks | Never -- source records and canonical records must be separate tables from day one |
| Skip robots.txt checking | Can scrape any page | Legal risk, potential IP bans, damaged reputation | Never |
| Auto-approve all sources without review | Faster to go live | Low-quality/spam scholarships in the directory erode user trust | Only for sources you have manually verified produce 100% clean data |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Python scraper to Convex | Calling individual mutations per record in a loop (slow, quota-burning) | Batch records into JSON payloads, send to an HTTP action that processes in controlled batches |
| GitHub Actions scheduling | Assuming cron runs precisely on time | Design for "approximately daily" with idempotent scrapers and manual trigger fallback |
| Scrapling + Cloudflare sites | Assuming Scrapling always works, no fallback | Use a fetcher abstraction with escalation levels (HTTP -> Scrapy -> Scrapling -> full browser) |
| Convex reactive queries for admin dashboard | Loading all scholarships for review in a single query | Use Convex pagination, filter by status, and index on review status fields |
| GitHub Actions secrets for Convex deploy key | Hardcoding the deploy key or committing it | Use GitHub Actions secrets, rotate the key periodically |
| Scrapy to file output | Writing all output to a single JSON file | Use JSON Lines (one record per line) for streaming, resumable output that works with `convex import` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all scholarships in a single Convex query | Admin dashboard freezes, 1-second query timeout hit | Use paginated queries with `.paginate()`, index on status fields | ~500+ scholarships in review queue |
| Running all 1000 spiders in a single GitHub Actions job | 6-hour job timeout hit, partial completion with no checkpointing | Split into parallel jobs by source category, each spider is independently runnable | ~100+ spiders in one job |
| Full-text search on scholarship descriptions without indexing | Search response time degrades linearly | Use Convex full-text search indexes, or offload to a search service | ~5,000+ scholarships |
| Storing full HTML of scraped pages alongside scholarship data | Convex document size limit (1 MiB) hit, bandwidth consumed | Store only extracted structured data, keep raw HTML in file storage or external blob store if needed | Any page with rich content |
| No index on deadline field | Filtering by "upcoming deadlines" scans entire table | Add Convex index on deadline field | ~2,000+ scholarships |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Convex deploy key in GitHub Actions logs or committed code | Anyone can write to your production database | Use GitHub Actions secrets, never log the key, rotate periodically |
| Scraping sites that require login without permission | Legal liability under CFAA (US) or equivalent laws, ToS violations | Never scrape behind authentication. Stick to publicly accessible pages |
| Storing personal data scraped from scholarship applications | GDPR violation (fines up to 20M EUR), especially for EU scholarships | Only scrape and store scholarship metadata (title, deadline, amount, link). Never scrape applicant or student data |
| Exposing admin dashboard without authentication | Anyone can approve/reject/modify scholarships | Implement auth on admin routes from day one, even if it's just a shared secret initially |
| Running Scrapling/browser-based scrapers with unrestricted network access in CI | Compromised dependency could exfiltrate secrets | Pin all dependencies, use GitHub Actions network restrictions where possible |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing expired scholarships without clear marking | Users waste time on dead links, lose trust in the platform | Automatically archive past-deadline scholarships, show "Deadline passed" badge, allow viewing but de-prioritize in search results |
| No "last verified" date on scholarship listings | Users don't know if information is current | Show "Last updated: X days ago" and "Verified from Y sources" on every listing |
| Displaying raw scraped text without normalization | Inconsistent formatting, HTML entities in descriptions, ALL CAPS titles | Normalize text casing, strip HTML artifacts, standardize field formatting in the ingestion pipeline |
| Country filter that doesn't distinguish "scholarship location" from "applicant nationality" | Users from Bangladesh searching "Bangladesh" get scholarships IN Bangladesh AND scholarships FOR Bangladeshi students abroad -- different intents | Separate "Study destination" from "Eligible nationalities" as distinct filter dimensions |
| No indication of scholarship competitiveness or amount relative to living costs | Users apply to tiny grants that won't cover expenses | Show amount context: "Full tuition + stipend" vs "Partial tuition only" vs "Travel grant" |
| Dumping 10,000 scholarships with no curation | Information overload, users give up | Prioritize by deadline proximity, relevance signals, and completeness of information. Show a curated "Featured" section |

## "Looks Done But Isn't" Checklist

- [ ] **Spider monitoring:** Spider runs without errors BUT verify it actually yields scholarships with populated fields -- zero-yield runs must trigger alerts
- [ ] **Deduplication:** Duplicate detection works for exact matches BUT verify it handles name variations, different sources for the same scholarship, and same-org different-program distinctions
- [ ] **Deadline handling:** Deadlines display correctly BUT verify timezone handling, rolling/annual deadline detection, and "deadline TBD" vs "no deadline" distinction
- [ ] **Search/filter:** Search returns results BUT verify it handles partial matches, diacritics (Universitat vs Universiteit vs University), and non-Latin script scholarship names
- [ ] **Data pipeline:** Scraper pushes to Convex successfully BUT verify Convex bandwidth/function-call usage stays within plan limits over a full month of automated runs
- [ ] **Admin review:** Admin can approve scholarships BUT verify the review queue surfaces the highest-priority items first (new deadlines approaching, high-value scholarships, broken data)
- [ ] **Cloudflare bypass:** Scrapling works in testing BUT verify it works from GitHub Actions runners (different IP ranges, no persistent browser state)
- [ ] **Auto-approve:** Trusted sources publish without review BUT verify there's a way to catch when a trusted source starts producing bad data (site redesign, compromised source)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Silent scraper rot (broken spiders) | LOW | Identify broken spiders from monitoring data, update selectors, backfill missing data from the last good scrape |
| Bad deduplication (thousands of duplicates live) | HIGH | Rebuild deduplication logic, run a one-time de-dupe sweep across all records, manually verify the merged results. May temporarily show "under maintenance" to users |
| Convex quota exhaustion | MEDIUM | Upgrade plan, optimize ingestion batching, reduce scraping frequency for low-priority sources, implement caching to reduce redundant queries |
| Date parsing corruption (wrong deadlines in production) | HIGH | Identify all affected records by source locale, re-parse with corrected locale settings, notify users who may have relied on wrong deadlines. Trust damage is hard to recover from |
| GitHub Actions schedules silently stopped | LOW | Re-enable workflows, add a commit or workflow_dispatch trigger, set up external monitoring to detect missed runs |
| Anti-bot blocking (Scrapling stopped working) | MEDIUM | Switch affected spiders to alternative fetcher, update Scrapling version, temporarily disable blocked sources and notify admin |
| Garbage data from rushed spider development | HIGH | Quarantine low-quality sources, rebuild spiders with proper validation, re-scrape and re-import. Lost development time is the main cost |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Silent scraper rot | Scraping infrastructure / monitoring | Per-spider yield metrics dashboard exists, alerts fire on zero-yield runs |
| Deduplication failures | Data modeling / schema design | Multi-source records stored separately from canonical records, merge logic tested with known duplicates |
| Convex ingestion limits | Data pipeline / integration | Staging pattern implemented, batch sizes tuned, function call and bandwidth usage tracked against monthly limits |
| Date/currency parsing corruption | Spider framework / shared libraries | Locale-aware parsing library with validation exists, tested against sample data from 10+ countries |
| GitHub Actions scheduling unreliability | Automation / scheduling | Manual trigger on all workflows, execution monitoring with missed-run alerts, idempotent spider design |
| Anti-bot arms race | Scraping infrastructure | Fetcher abstraction layer exists, at least 2 fallback fetcher strategies implemented, Scrapling version pinned |
| Premature spider scaling | Spider framework (before spider sprint) | Base class enforced, quality checklist defined, first 10-20 spiders validated before scaling |

## Sources

- [Convex Limits Documentation](https://docs.convex.dev/production/state/limits) -- document size, function timeouts, transaction limits, plan quotas
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) -- batch processing, action design, mutation patterns
- [ScrapeOps: How to Monitor Scrapy Spiders](https://scrapeops.io/python-scrapy-playbook/how-to-monitor-scrapy-spiders/) -- spider monitoring best practices
- [GitHub Actions Limits](https://docs.github.com/en/actions/reference/limits) -- timeout, cron reliability, runner constraints
- [GitHub Community: Unexpected Delays in Scheduled Workflows](https://github.com/orgs/community/discussions/156282) -- cron unreliability evidence
- [WebAutomation: Mistakes to Avoid When Scaling Web Scraping](https://webautomation.io/blog/mistakes-to-avoid-when-scaling-your-web-scraping/) -- large-scale scraping pitfalls
- [AIMultiple: Large-Scale Web Scraping Challenges](https://research.aimultiple.com/large-scale-web-scraping/) -- data quality at scale
- [TechStrong: OpenClaw Users Using Scrapling to Bypass Cloudflare](https://techstrong.ai/features/openclaw-users-are-using-scrapling-to-bypass-cloudflare-and-other-anti-bot-systems/) -- Scrapling controversy and Cloudflare arms race
- [ScrapeFly: How to Bypass Cloudflare (2026)](https://scrapfly.io/blog/posts/how-to-bypass-cloudflare-anti-scraping) -- current anti-bot bypass landscape
- [Crawlbase: Guide to Matching Web-Scraped Data](https://crawlbase.com/blog/guide-to-matching-web-scraped-data/) -- deduplication and entity resolution
- [Dedupe Python Library](https://github.com/dedupeio/dedupe) -- ML-based fuzzy matching for entity resolution
- [Browserless: Is Web Scraping Legal in 2025](https://www.browserless.io/blog/is-web-scraping-legal) -- legal considerations for scraping
- [ShoppingScraper: Data Freshness in Web Scraping](https://shoppingscraper.com/blog/how-to-ensure-data-freshness-in-web-scraping) -- stale data monitoring
- [Arman Hossain: The Silent Data Quality Crisis](https://arman-bd.medium.com/web-scraping-monitoring-the-silent-data-quality-crisis-no-one-talks-about-9949a2b5a361) -- silent failures in scraping pipelines

---
*Pitfalls research for: ScholarHub -- Scholarship Aggregation Platform*
*Researched: 2026-03-20*
