# Feature Landscape

**Domain:** Scholarship Aggregation Platform (International Focus)
**Researched:** 2026-03-20
**Overall Confidence:** MEDIUM-HIGH (based on analysis of 15+ competitor platforms and UX case studies)

## Table Stakes

Features users expect. Missing = product feels incomplete or untrustworthy.

### Public Directory (Student-Facing)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Searchable scholarship directory** | Core product. Every competitor has this (Fastweb, Bold.org, Scholarships.com, ScholarshipPortal). Without it, there is no product. | Med | Full-text search across title, description, eligibility text. Convex supports this natively. |
| **Filter by country of study** | International students think "where do I want to study?" first. ScholarshipPortal, Scholars4Dev, IEFA all organize by destination country. | Low | Multi-select. Map to ISO country codes. |
| **Filter by degree level** | Bachelor/Master/PhD is the most fundamental eligibility criterion. Every platform has this. | Low | Enum: Bachelor, Master, PhD, Postdoc, Any. |
| **Filter by field of study** | DAAD, ScholarshipPortal, BigFuture all filter by academic discipline. Students look for scholarships in their field. | Low | Use a standardized list (ISCED fields or similar). Keep to 20-30 broad categories. |
| **Deadline display (prominent)** | Students' top concern is "can I still apply?" Expired scholarships showing up is the #1 complaint about aggregator sites (Scholarships.com called out for this). | Low | Show deadline prominently in listing cards. Color-code urgency (closing soon, open, closed). |
| **Scholarship detail page** | Each scholarship needs a dedicated page with full information. Every competitor has this. | Med | See "Detail Page Fields" section below. |
| **Direct link to official application** | Students need to actually apply. Fastweb, Scholarships.com, Scholars4Dev all link out. Not having this makes the site useless. | Low | Always link to the official source. Never dead-end students. |
| **Mobile-responsive design** | Students in developing countries primarily browse on mobile. Going Merry and Fastweb both have mobile apps; at minimum the web must be responsive. | Low | Tailwind handles this. Just design mobile-first. |
| **Expired scholarship handling** | Showing expired scholarships without marking them is the top user complaint across competitor reviews. ScholarshipsandGrants.us highlights "verified deadlines" as a selling point. | Med | Auto-archive past deadline. Show "applications closed" badge. Keep page live for SEO and "next cycle" info. |
| **Funding type indicator** | "Fully funded" vs "partial" vs "tuition only" is critical for international students from developing countries who cannot self-fund. | Low | Enum: Fully Funded, Partial, Tuition Waiver, Stipend Only, Varies. |

### Detail Page Fields (What Each Scholarship Page Must Show)

| Field | Why Required | Notes |
|-------|-------------|-------|
| Scholarship name | Identity | |
| Provider/organization | Trust, brand recognition | e.g., "DAAD", "Japanese Government (MEXT)" |
| Host country | Where you'll study | |
| Eligible nationalities | "Can I apply?" is first question | "International", "Developing countries", specific country lists |
| Degree level(s) | Eligibility | |
| Field(s) of study | Eligibility | |
| Funding coverage | What's included | Tuition, living allowance, travel, insurance -- list each |
| Award amount | If quantifiable | Range or fixed amount, currency |
| Application deadline | When to apply by | With timezone awareness |
| Application link | How to apply | Direct URL to official application page |
| Source/last verified date | Trust signal | "Data from daad.de, verified March 2026" |
| Description/overview | What the scholarship is about | Rich text, can include admin-added tips |

### Admin Dashboard

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Review queue** | Core admin workflow. Scraped data needs human review before publishing. The developer is a solo admin -- queue must be efficient. | Med | List of pending scholarships with approve/reject/edit actions. |
| **Edit scholarship data** | Scraped data is messy. Admin must fix errors, fill gaps, rewrite descriptions. | Med | Form with all scholarship fields, pre-filled from scraped data. |
| **Approve/reject actions** | Binary decision gate before publishing. | Low | Single click with optional rejection reason. |
| **Bulk actions** | Solo admin reviewing hundreds of scraped entries needs efficiency. Reviewing one-by-one is unsustainable at 1000+ sources. | Med | Select multiple, bulk approve (for trusted sources), bulk reject. |
| **Source trust levels** | Some sources (DAAD, Erasmus) are reliable enough to auto-publish. Others need manual review. PROJECT.md already identifies this need. | Med | Per-source config: auto-publish, needs-review, blocked. |

## Differentiators

Features that set the product apart. Not expected by every user, but create competitive advantage.

### Data Quality Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Multi-source data enrichment** | ScholarHub scrapes the same scholarship from multiple sources and merges the richest data. No competitor does this systematically. Most just list what they scraped. This produces the most complete scholarship entries. | High | Core technical differentiator. Deduplication + merge logic. The hardest engineering problem. |
| **"Last verified" timestamp** | Show when data was last confirmed accurate. ScholarshipsandGrants.us markets "verified deadlines" -- ScholarHub can go further with per-field verification timestamps. Builds trust that no competitor meaningfully has. | Low | Track last_scraped_at per source. Display to user. |
| **Cyclical scholarship tracking** | Scholarships like DAAD, MEXT, Chevening recur annually. ScholarHub can track the program across years, auto-resurface when next cycle opens, and show historical data (last year's deadline as estimate). No aggregator does this well. | Med | Link scholarship entries across years via program_id. Show "expected to reopen [month]" for archived entries. |
| **Admin editorial notes/tips** | Add human value on top of scraped data: "this scholarship is highly competitive", "tip: apply early, they review rolling", "note: requires language certificate". Scholars4Dev does this with blog-style posts, but not integrated into listings. | Low | Rich text field on scholarship detail page, admin-only edit. |
| **Source attribution and transparency** | Show which sources contributed data ("compiled from daad.de, scholars4dev.com, and scholarshipportal.com"). Builds unique trust. Competitors don't show their sources. | Low | Store source URLs per scholarship. Display on detail page. |

### Discovery Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Filter by nationality/citizenship** | "Show me scholarships I'm eligible for as a Bangladeshi student." Most aggregators only filter by destination country, not origin country. IEFA and InternationalScholarships.com do this but poorly. | Med | Requires nationality eligibility data per scholarship (scraped or admin-tagged). Multi-select filter. |
| **"Open now" / "Closing soon" views** | Default view shows only currently-open scholarships, sorted by deadline urgency. Fastweb and Scholarships.com show expired listings mixed in -- this is a top complaint. | Low | Simple date filter + sort. High perceived value for low effort. |
| **Curated collections** | "Top 10 Fully Funded Scholarships for 2026", "Scholarships that don't require GRE/IELTS", "Scholarships for developing countries." Scholars4Dev and AfterSchoolAfrica do this as blog posts. ScholarHub can do it as dynamic, auto-updating collections based on tags/filters. | Med | Tag-based collections that auto-populate. Admin can create/name collections. Great for SEO too. |
| **Scholarship comparison** | Side-by-side comparison of 2-3 scholarships (deadline, amount, coverage, eligibility). No aggregator offers this. Students manually compare in spreadsheets. | Med | Select scholarships, render comparison table. |

### SEO and Growth Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **SEO-optimized scholarship pages** | Each scholarship gets a clean URL, proper meta tags, structured data. Most aggregator sites (Scholars4Dev, AfterSchoolAfrica) are WordPress blogs with poor technical SEO. ScholarHub can outrank them. | Med | SSR/SSG for scholarship pages. Schema.org markup. Proper H1/meta. |
| **Country landing pages** | "/scholarships/germany", "/scholarships/japan" -- auto-generated pages listing all scholarships for a country. Great for SEO. ScholarshipPortal does this well. | Med | Auto-generated from data. Unique meta descriptions per country. |
| **Degree-level landing pages** | "/scholarships/phd", "/scholarships/masters" -- similar pattern. | Low | Same pattern as country pages. |

## Anti-Features

Features to explicitly NOT build. These are traps.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Student accounts/profiles in v1** | PROJECT.md explicitly defers this. Adding auth before content quality is proven puts the cart before the horse. Bold.org, Going Merry, ScholarshipOwl all gate content behind accounts -- this hurts discovery and SEO. | Keep directory fully public. No login wall. Add Clerk auth later when there's a reason (saved searches, notifications). |
| **In-platform scholarship applications** | Going Merry and Bold.org try to be the application platform. This requires partnerships with scholarship providers, form builders, document handling. Massive scope. ScholarHub is an aggregator, not an application portal. | Always link to the official application page. Never try to replace the provider's application process. |
| **AI-powered "matching"** | ScholarshipOwl and Scholly market AI matching as a feature. It's mostly keyword filtering dressed up as AI. Requires student profiles (which we're deferring) and adds complexity without clear value for a directory site. | Good filters are better than bad AI. Invest in filter UX instead. |
| **Scholarship application tracking** | Going Merry, Fastweb, and Cirkled In offer application status tracking. Requires student accounts, per-scholarship status state, and ongoing user engagement features. Wrong focus for v1. | Defer entirely. Students use spreadsheets or Notion. Not our problem in v1. |
| **Email notifications/alerts** | Fastweb and Going Merry send deadline reminders. Requires student accounts, email infrastructure, preference management, and creates ongoing operational burden. | Defer until student accounts exist. Focus on the directory being so good students bookmark and return. |
| **Forum/community features** | Some scholarship sites add forums, Q&A, success stories. This is a community product, not a directory product. Different skill, different moderation burden. | A blog or tips section later (v2+) is fine. Forum never. |
| **Scholarship review/ratings by students** | User-generated reviews require moderation, anti-spam, and a critical mass of users to be useful. Premature for a new platform. | Admin editorial notes fill this gap better. |
| **Premium/paid tier** | ScholarshipOwl charges for premium features. Going Merry is free but ad-supported. Charging before proving value kills growth. | Stay free. Monetization is a later problem. Focus on traffic and trust. |
| **Mobile app** | PROJECT.md explicitly defers this. A responsive web app covers mobile use cases without app store overhead. Going Merry's mobile app is poorly reviewed. | Mobile-responsive web only. PWA later if justified. |
| **Domestic scholarships in v1** | PROJECT.md scopes v1 to international. Domestic scholarships have completely different data structures, sources, and user expectations. | Ship international first. Domestic is a separate phase. |

## Feature Dependencies

```
Search + Filters -----> Scholarship Directory (core, build first)
       |
       v
Scholarship Detail Page (needs data model defined)
       |
       v
Admin Review Queue (needs scholarship data model)
       |
       v
Scraping Pipeline Output ---> Deduplication/Merge ---> Admin Queue ---> Published Directory
       |
       v
Source Trust Levels ---> Auto-publish (trusted) or Queue (untrusted)
       |
       v
Deadline Tracking ---> Expired Handling ---> Cyclical Resurfacing
       |
       v
Country/Degree Landing Pages (needs sufficient data)
       |
       v
Curated Collections (needs tagging system)
```

**Critical path:**
1. Scholarship data model (everything depends on this)
2. Scraping pipeline -> deduplication -> admin review -> publish (the data flow)
3. Public directory with search + filters (the user-facing product)
4. SEO optimization (growth after launch)

**Independent tracks (can build in parallel):**
- Admin dashboard (only needs data model, not public frontend)
- Scraping infrastructure (Python, separate repo/pipeline)
- Public directory (needs data model + some seed data)

## MVP Recommendation

**Prioritize (Phase 1 -- minimum viable directory):**
1. Scholarship data model with all detail page fields
2. Scraping pipeline for 50-100 high-quality sources (DAAD, Erasmus, MEXT, Chevening, major universities)
3. Admin review queue (approve/reject/edit)
4. Public directory with search + filters (country, degree, field, open/closed)
5. Scholarship detail pages with all required fields
6. Expired scholarship handling (auto-archive, "closed" badge)

**Prioritize (Phase 2 -- quality and growth):**
1. Multi-source deduplication and data enrichment
2. Source trust levels + auto-publish for trusted sources
3. Bulk admin actions
4. SEO: country/degree landing pages, structured data, SSR
5. "Last verified" timestamps
6. Nationality/citizenship filter

**Defer (Phase 3+):**
1. Cyclical scholarship tracking (cross-year program linking)
2. Curated collections
3. Scholarship comparison tool
4. Admin editorial notes/tips
5. Student accounts (Clerk)
6. Saved searches and notifications
7. Domestic scholarships

**Rationale:** Phase 1 establishes the data pipeline end-to-end (scrape -> review -> publish -> browse). Phase 2 makes the data trustworthy and discoverable. Phase 3 adds features that require a critical mass of data to be useful.

## Sources

- [Scholarships360 -- Top 9 Scholarship Websites in 2026](https://scholarships360.org/scholarships/best-scholarship-websites/)
- [Bold.org -- Best Scholarship Websites for Students](https://bold.org/blog/best-scholarship-websites/)
- [Bold.org vs Scholarships.com Comparison](https://bold.org/blog/bold-vs-scholarships-com/)
- [Scholars4Dev -- International Scholarships](https://www.scholars4dev.com/)
- [ScholarshipsandGrants.us -- Verified Scholarships](https://scholarshipsandgrants.us/financial-aid-101/verified-scholarships/)
- [IEFA -- International Education Financial Aid](https://www.iefa.org/)
- [InternationalScholarships.com](https://www.internationalscholarships.com/)
- [Kimberly Tanny -- Scholarship Planner UX Case Study](https://www.kimberlytanny.com/scholarship-planner-case-study)
- [Yasmine PV -- UI/UX Research Case Study for Scholarship Website](https://yasminepv.medium.com/ui-ux-research-case-study-designing-a-scholarship-service-website-beasiswapadi-com-23e8273b1740)
- [CNBC -- 6 Best Websites to Find College Scholarships](https://www.cnbc.com/select/best-websites-for-college-scholarships/)
- [Empowerly -- Best Scholarship Websites in 2026](https://empowerly.com/applications/best-scholarship-websites-2026/)
- [InsideHigherEd -- Scholarship Providers Data-Sharing Issues](https://www.insidehighered.com/news/students/financial-aid/2025/10/07/scholarship-providers-say-data-sharing-confusion-delays-aid)
- [Fastweb -- Scholarship Organization Features](https://www.fastweb.com/college-scholarships/articles/new-fastweb-update-makes-scholarship-organization-easier)
- [GoingMerry -- Best Scholarship Websites](https://goingmerry.com/blog/best-scholarship-websites/)
