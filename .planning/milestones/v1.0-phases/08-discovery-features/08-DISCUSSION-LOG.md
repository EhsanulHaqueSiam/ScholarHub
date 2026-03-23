# Phase 8: Discovery Features - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 08-discovery-features
**Areas discussed:** Collection structure, Collection browsing, Comparison interaction, Related scholarships, Admin collection UI design, Auto-tagging rules, Comparison page SEO, Performance & Convex free tier, Tag display on detail page, Collection page routing, Accessibility, Dark mode, Error handling, Loading states, Mobile responsiveness, Testing strategy, Predefined tag list, Seed collection ideas, Admin tags tab design, Related scoring weights, Admin view switching, Suggested tag UI in edit panel, Collection SEO for Phase 9 prep

---

## Collection Structure

### How should curated collections be stored?
| Option | Description | Selected |
|--------|-------------|----------|
| Convex table | New collections table, admin creates with criteria | |
| Hardcoded in code | Constants in TypeScript file | |
| Hybrid | Seed collections hardcoded, stored in Convex for admin editing | Yes |

### How should collections auto-populate?
| Option | Description | Selected |
|--------|-------------|----------|
| Tag-based rules | Each collection has tag criteria, matching scholarships auto-appear | Yes |
| Manual curation only | Admin manually adds specific scholarships | |
| Tag-based + manual overrides | Auto-populate by tags, admin can pin/exclude | |

### Admin UI for managing collections?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, in admin dashboard | Collections tab with create/edit/delete and preview | Yes |
| Seed data only | Pre-populate via seed script, no admin UI | |
| Simple form only | Basic create/edit form, no preview | |

### How should tags be managed on scholarships?
| Option | Description | Selected |
|--------|-------------|----------|
| Extend existing edit panel | Tags input in scholarship edit form | |
| Bulk tagging tool | Separate bulk tagging interface | |
| Both edit panel + bulk | Tags in individual edit AND bulk tagging | Yes |

### Tag format for collection criteria?
| Option | Description | Selected |
|--------|-------------|----------|
| Simple string tags | Flat tags, OR logic | |
| Tag groups with AND/OR | Structured criteria with AND/OR | |
| Filter-based criteria | Reuse directory filter system plus custom tags | Yes |

### Collection display order?
| Option | Description | Selected |
|--------|-------------|----------|
| Manual sort order | Admin sets display order | Yes |
| Alphabetical | Sorted by name | |
| By scholarship count | Dynamic by count | |

### Collection visuals?
| Option | Description | Selected |
|--------|-------------|----------|
| Emoji icon only | Admin picks emoji per collection | Yes |
| Color + emoji | Background color palette + emoji | |
| No visuals | Text-only cards | |

### Seed collection count?
| Option | Description | Selected |
|--------|-------------|----------|
| 8-12 collections | Covers key categories | Yes |
| 4-6 collections | Start small | |
| 15+ collections | Comprehensive from day one | |

### Filter logic between types?
| Option | Description | Selected |
|--------|-------------|----------|
| AND between types, OR within | Same as directory filters | Yes |
| All OR logic | Any matching filter includes | |
| Admin chooses per collection | Toggle AND/OR per group | |

### Live scholarship count?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, live count | Real-time via Convex reactive query | Yes |
| Static count | Cached, updated periodically | |
| No count | Students click to discover | |

### Multi-collection membership?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, naturally | Filter-based, natural multi-membership | Yes |
| Limit to 3 max | Cap at 3 collections | |

### Schema design?
| Option | Description | Selected |
|--------|-------------|----------|
| Structured fields | Explicit optional filter fields | Yes |
| Flexible criteria object | Generic criteria field | |
| You decide | | |

### Featured flag?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, featured flag | Admin marks 3-5 for homepage promotion | Yes |
| All collections equal | No featuring | |
| Top N by sort order | First N auto-featured | |

### Time-based criteria?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, optional date filters | deadline_before, deadline_after, added_since | Yes |
| No, static filters only | Static field filters only | |
| You decide | | |

### Description format?
| Option | Description | Selected |
|--------|-------------|----------|
| Plain text only | Short plain text | |
| Markdown | Supports bold, links, lists | Yes |
| You decide | | |

### SEO-friendly URLs?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, auto-generated slug | Generate from name, admin override | Yes |
| ID-based URLs only | Convex document ID | |
| You decide | | |

### Timestamps?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, created_at + updated_at | Track both | Yes |
| Created_at only | Just creation time | |
| You decide | | |

### Collection status?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, active/archived | Two states | |
| Delete only | No recovery | |
| Active/draft/archived | Three states | Yes |

### Seed collection ideas?
| Option | Description | Selected |
|--------|-------------|----------|
| Standard set | Claude picks final 8-12 | Yes |
| I have specific ideas | User specifies | |

### Admin live preview?
| Option | Description | Selected |
|--------|-------------|----------|
| Live matching list only | Show matching scholarships in edit form | |
| Full visual preview | Preview button to open public page | |
| Both | Matching list + preview link | Yes |

### Bulk tagging logic?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, filter-then-tag | Filter scholarships, apply tags to all matching | |
| Manual selection only | Check individual scholarships | |
| Both | Filter-based AND manual selection | Yes |

### Collection analytics?
| Option | Description | Selected |
|--------|-------------|----------|
| Deferred to v2 | Full analytics with PostHog later | |
| Basic view counter | Simple page view counter in Convex | Yes |
| You decide | | |

### Collection SEO?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, basic SEO | Proper meta title/description/OG | |
| Minimal | Just page title | |
| Full SEO in Phase 9 | Defer to Phase 9 | Yes |

### View counter type?
| Option | Description | Selected |
|--------|-------------|----------|
| Total page loads | Simple increment | |
| Unique visitors | localStorage ID tracking | Yes |
| You decide | | |

### Auto-tagging from scraped data?
| Option | Description | Selected |
|--------|-------------|----------|
| Future enhancement | Tags admin-assigned only | |
| Yes, basic auto-tags | Keyword matching in aggregation | Yes |
| You decide | | |

### Tag taxonomy?
| Option | Description | Selected |
|--------|-------------|----------|
| Predefined + freeform | Curated set + custom tags with autocomplete | Yes |
| Predefined only | Fixed list | |
| Freeform only | No predefined list | |

---

## Collection Browsing

### Where should collections be surfaced?
| Option | Description | Selected |
|--------|-------------|----------|
| Directory page + dedicated browse page | Featured row on /scholarships + /collections | Yes |
| Dedicated browse page only | /collections standalone | |
| Inline on directory only | No separate browse page | |
| You decide | | |

### Collection card design?
| Option | Description | Selected |
|--------|-------------|----------|
| Emoji + title + count + description | Neo-brutalism card, grid layout | Yes |
| Compact chips | Pill-shaped, more visible at once | |
| Full preview cards | Shows top 3 scholarship titles | |

### Navbar link?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add to navbar | Collections link next to Scholarships | Yes |
| Discoverable from directory only | No navbar link | |
| Dropdown under Scholarships | Sub-items dropdown | |

### Collection detail page layout?
| Option | Description | Selected |
|--------|-------------|----------|
| Collection header + directory listing | Reuses directory components | Yes |
| Simple list only | Header + simple card list | |
| Full directory with filters | Complete directory experience scoped | |

### Featured collections count on directory?
| Option | Description | Selected |
|--------|-------------|----------|
| 4-6 featured | Horizontal scrollable row | Yes |
| 3 featured | Minimal, focused | |
| All active collections | Show all | |

### Featured row position on directory?
| Option | Description | Selected |
|--------|-------------|----------|
| Below FeaturedRow, above results | Between highlights and listing | Yes |
| Above FeaturedRow | Collections first | |
| Below filters, above results | After filter controls | |
| You decide | | |

### Browse page filtering?
| Option | Description | Selected |
|--------|-------------|----------|
| No filtering | Simple grid by admin priority | Yes |
| Search only | Search by name | |
| Category filter | Filter by category | |

### Personalized featured row?
| Option | Description | Selected |
|--------|-------------|----------|
| Not personalized | Same for everyone | |
| Yes, personalized | By nationality | |
| You decide | Claude's discretion | Yes |

### Share collection?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, copy link | Same pattern as directory/detail | Yes |
| No share button | | |
| You decide | | |

### Collection header?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, prominent header | Large emoji, name, markdown description, count | Yes |
| Minimal header | Just name and count | |
| You decide | | |

### Mobile featured row?
| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal scroll | Swipeable, saves vertical space | Yes |
| Vertical stack (2 per row) | 2-column grid | |
| You decide | | |

### Empty state on /collections?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, with illustration | Neo-brutalism styled | Yes |
| Redirect to directory | Auto-redirect | |
| You decide | | |

### View all link?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, link at end | 'View all collections' after featured cards | Yes |
| No link, navbar only | | |
| You decide | | |

### View toggle on collection detail?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, same toggle | Reuse ViewToggle component | Yes |
| Grid only | Always grid view | |
| You decide | | |

### Sort display on collection detail?
| Option | Description | Selected |
|--------|-------------|----------|
| Just apply the sort | Sort pills show active, no label | |
| Label the sort | 'Sorted by: Prestige' in header | |
| You decide | Claude's discretion | Yes |

### Cross-reference collections on detail page?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, as tags section | Clickable tag badges | Yes |
| No cross-reference | | |
| You decide | | |

### Browse page meta title?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, basic title | 'Scholarship Collections - ScholarHub' | Yes |
| Default title only | Just 'ScholarHub' | |
| You decide | | |

---

## Comparison Interaction

### Selection method?
| Option | Description | Selected |
|--------|-------------|----------|
| Compare checkbox on cards | Checkbox on directory cards | |
| Compare from detail page | Add to Compare on detail | |
| Both card + detail page | Both entry points | Yes |

### Comparison view location?
| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated /compare page | Full-page, shareable URL | Yes |
| Modal/overlay | Large modal on current page | |
| Slide-out panel | Side panel | |

### Comparison fields?
| Option | Description | Selected |
|--------|-------------|----------|
| Key decision fields | Funding, deadline, country, etc. | |
| All detail page fields | Everything in a table | |
| You decide | Claude picks most useful fields | Yes |

### Floating compare bar?
| Option | Description | Selected |
|--------|-------------|----------|
| Sticky bottom bar | Persistent bar with selections | |
| Toast-style notification | Brief toast per selection | |
| You decide | Claude designs the UX | Yes |

### Persistence?
| Option | Description | Selected |
|--------|-------------|----------|
| Session-only state | React context, cleared on refresh | Yes |
| localStorage persistence | Survives refresh | |
| URL state only | Encoded in URL | |

### Difference highlighting?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, highlight differences | Visual highlight for differing fields | Yes |
| No highlighting | Plain table | |
| You decide | | |

### Recommendation summary?
| Option | Description | Selected |
|--------|-------------|----------|
| No recommendation | Just facts side-by-side | |
| Visual indicators | Green checkmarks for better values | |
| You decide | Claude's discretion | Yes |

### Mobile comparison?
| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal scroll table | Sticky first column | Yes |
| Stacked cards | Vertical, loses side-by-side | |
| You decide | | |

### Apply buttons?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, per-scholarship Apply | Apply button in each column | |
| Link to detail page only | | |
| Both | Apply button + detail link | Yes |

### Add more from compare page?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, search to add | Search dropdown to add another | Yes |
| Navigate back to directory | | |
| You decide | | |

### Shareable compare URL?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, with copy link | Copy link button, slug-based URL | Yes |
| No sharing | | |
| You decide | | |

### Compare checkbox visibility?
| Option | Description | Selected |
|--------|-------------|----------|
| Always visible | Small icon always shown | |
| On hover (desktop) + always (mobile) | Hover desktop, always mobile | Yes |

### Suggestions below comparison?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, below table | 3-4 similar scholarships | Yes |
| No suggestions | | |
| You decide | | |

### Empty state?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, with guidance | Illustration + Browse link | Yes |
| Redirect to directory | | |
| You decide | | |

---

## Related Scholarships

### Matching algorithm?
| Option | Description | Selected |
|--------|-------------|----------|
| Multi-factor scoring | Country + degree + funding + provider + tags | Yes |
| Same country + degree | Simple two-field match | |
| Tag-based similarity | Most shared tags | |
| You decide | | |

### Count shown?
| Option | Description | Selected |
|--------|-------------|----------|
| 4-6 scholarships | Enough variety | Yes |
| 3 scholarships | Minimal | |
| 8-10 scholarships | Comprehensive | |

### Display format?
| Option | Description | Selected |
|--------|-------------|----------|
| Card grid section | Reused ScholarshipCards | Yes |
| Horizontal scroll row | FeaturedRow pattern | |
| Simple list | Text-based | |
| You decide | | |

### Position on detail page?
| Option | Description | Selected |
|--------|-------------|----------|
| After Sources, before footer | Last content section | Yes |
| After How to Apply | Between apply and sources | |
| You decide | | |

### Computation timing?
| Option | Description | Selected |
|--------|-------------|----------|
| Query time | Compute on page load | |
| Write-time precompute | Store related_ids via triggers | Yes (hybrid) |

### Exclude expired?
| Option | Description | Selected |
|--------|-------------|----------|
| Exclude expired | Only actionable alternatives | Yes |
| Include with badge | Shows full landscape | |
| You decide | | |

### Compare integration?
| Option | Description | Selected |
|--------|-------------|----------|
| Individual compare buttons | Same checkbox as directory cards | Yes |
| Compare current + related | Bulk compare shortcut | |
| No compare integration | | |
| You decide | | |

### Card size?
| Option | Description | Selected |
|--------|-------------|----------|
| Compact cards | Title, flag, deadline, funding, prestige | Yes |
| Full-size cards | Same as directory listing | |
| You decide | | |

### Section heading?
| Option | Description | Selected |
|--------|-------------|----------|
| Similar Scholarships | Implies algorithmic matching | Yes |
| Related Scholarships | Broader | |
| You Might Also Like | Conversational | |
| You decide | | |

### Same provider priority?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, prioritize same provider | Students want full provider offering | Yes |
| No provider bias | Equal weight | |
| You decide | | |

### Randomization?
| Option | Description | Selected |
|--------|-------------|----------|
| Deterministic | Same results each visit | Yes |
| Slight randomization | Different each visit | |
| You decide | | |

---

## Admin Collection UI Design

### Layout?
| Option | Description | Selected |
|--------|-------------|----------|
| Table list with actions | Sortable table, consistent with review queue | Yes |
| Card grid | Visual but less data-dense | |
| You decide | | |

### Create/edit form?
| Option | Description | Selected |
|--------|-------------|----------|
| Slide-out sheet | Same as EditPanel pattern | Yes |
| Full page form | Dedicated page | |
| Modal dialog | Limited space | |
| You decide | | |

### Ordering method?
| Option | Description | Selected |
|--------|-------------|----------|
| Numeric input | Simple number field | |
| Drag-and-drop | Intuitive but complex | |
| You decide | Claude's discretion | Yes |

### Admin preview?
| Option | Description | Selected |
|--------|-------------|----------|
| Live matching list only | WHAT's in the collection | |
| Full visual preview | Open public page | |
| Both | Matching list + preview link | Yes |

### Bulk actions?
| Option | Description | Selected |
|--------|-------------|----------|
| No bulk actions | Individual actions sufficient | |
| Yes, same pattern as review queue | Checkbox + bulk bar | Yes |

### Tag creation flow?
| Option | Description | Selected |
|--------|-------------|----------|
| Inline creation | Type + Enter to create | Yes |
| Separate tag management page | Dedicated page | |
| You decide | | |

### Bulk tagging location?
| Option | Description | Selected |
|--------|-------------|----------|
| Integrated into review queue | Tag bulk action | |
| Separate Tags tab | Dedicated tab | |
| Both | Quick via queue + power via Tags tab | Yes |

---

## Auto-tagging Rules

### Auto-detect categories?
All selected: no_gre, women_only/women_priority, stem, developing_countries

### Confidence level?
| Option | Description | Selected |
|--------|-------------|----------|
| High confidence only | Exact phrase matching | |
| Include lower confidence | Aggressive matching | |
| Flag for review | Suggested with admin confirm/reject | Yes |

### Tag behavior?
| Option | Description | Selected |
|--------|-------------|----------|
| Additive only | Never removes manual tags | Yes |
| Full sync | Re-evaluates each run | |
| You decide | | |

### Backfill?
| Option | Description | Selected |
|--------|-------------|----------|
| Both backfill + ongoing | One-time + aggregation-time | Yes |
| Ongoing only | New/updated only | |
| You decide | | |

### Review flow?
| Option | Description | Selected |
|--------|-------------|----------|
| Badge on scholarship in review queue | Tags to review indicator | |
| Dedicated tag review section | Separate section | |
| Both | Badge + dedicated section | Yes |

### Audit trail?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, store match reason | Text snippet that triggered suggestion | Yes |
| No audit trail | | |
| You decide | | |

### Schema for suggested tags?
| Option | Description | Selected |
|--------|-------------|----------|
| Separate suggested_tags field | Clean separation from confirmed tags | Yes |
| Status flag on tags | Tags array becomes objects | |
| You decide | | |

### Additional categories?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, Claude can add more | Starting 4 + more during planning | Yes |
| Stick to these 4 | | |
| Up to 8 total | | |

### Backfill execution?
| Option | Description | Selected |
|--------|-------------|----------|
| One-time migration script | Batch process, same as seed scripts | Yes |
| Convex cron job | Scheduled until complete | |
| You decide | | |

---

## Comparison Page SEO

### Indexable?
| Option | Description | Selected |
|--------|-------------|----------|
| Noindex | Ephemeral user-generated views | |
| Indexable | Long-tail search traffic potential | Yes |
| You decide | | |

### URL format?
| Option | Description | Selected |
|--------|-------------|----------|
| Slugs | Human-readable, better for sharing | Yes |
| Convex IDs | Simpler but ugly | |
| You decide | | |

### OG tags?
| Option | Description | Selected |
|--------|-------------|----------|
| Basic title only | Minimal effort | |
| Dynamic OG with scholarship names | Full title + description | Yes |
| No OG | Default tags | |
| You decide | | |

### Schema.org?
| Option | Description | Selected |
|--------|-------------|----------|
| Defer to Phase 9 | | |
| Basic structured data now | ComparisonAction or ItemList markup | Yes |
| You decide | | |

### Title format?
| Option | Description | Selected |
|--------|-------------|----------|
| X vs Y Scholarship Comparison - ScholarHub | SEO-friendly | Yes |
| Compare: X vs Y - ScholarHub | Shorter | |
| You decide | | |

### 3-way title?
| Option | Description | Selected |
|--------|-------------|----------|
| Full names | All 3 in title | Yes |
| First 2 + and more | Truncated | |
| You decide | | |

---

## Performance & Convex Free Tier

### View counter optimization?
| Option | Description | Selected |
|--------|-------------|----------|
| Debounced mutation | Once per session per collection, localStorage | Yes |
| Batch updates | Queue and flush | |
| You decide | | |

### Scholarship count caching?
| Option | Description | Selected |
|--------|-------------|----------|
| Live Convex query | Real-time reactive | |
| Cached count field | Stored on collection, trigger-updated | Yes |
| You decide | | |

### Related scholarships caching?
| Option | Description | Selected |
|--------|-------------|----------|
| No caching, simple query | Query at page load | |
| Precompute on write | Store related_ids via triggers | Yes |
| You decide | | |

### Free tier concern?
| Option | Description | Selected |
|--------|-------------|----------|
| Not concerned | Monitor and optimize if needed | |
| Minimize queries aggressively | Caching, precomputation, batch strategies | Yes |
| You decide | | |

### Related_ids recompute timing?
| Option | Description | Selected |
|--------|-------------|----------|
| On scholarship write (trigger) | Same pattern as prestige | |
| Periodic cron job | Daily recalculation | |
| Hybrid | Trigger + daily cron for reverse updates | Yes |

### Count update method?
| Option | Description | Selected |
|--------|-------------|----------|
| Triggers | Always accurate | Yes |
| Periodic cron | Simpler but stale | |
| You decide | | |

### Comparison query?
| Option | Description | Selected |
|--------|-------------|----------|
| Single query with IDs | One round-trip batch | Yes |
| Parallel individual queries | Separate per scholarship | |
| You decide | | |

### Browse page query?
| Option | Description | Selected |
|--------|-------------|----------|
| Single query | All collections + cached counts | Yes |
| Separate count queries | Per-collection reactive | |
| You decide | | |

### Featured row loading?
| Option | Description | Selected |
|--------|-------------|----------|
| Eager with SSR | Server-side via TanStack Start | Yes |
| Lazy client-side | Skeleton first | |
| You decide | | |

---

## Tag Display on Detail Page

### Position?
| Option | Description | Selected |
|--------|-------------|----------|
| In hero section | Below degree levels | Yes |
| Separate section | Between Eligibility and Funding | |
| After Similar Scholarships | Low prominence | |
| You decide | | |

### Style?
| Option | Description | Selected |
|--------|-------------|----------|
| Subtle outline badges | Thin border, no fill, clickable | Yes |
| Filled color badges | Category-colored | |
| You decide | | |

### Tag limit?
| Option | Description | Selected |
|--------|-------------|----------|
| Show first 5, expand for more | Prevents overwhelm | Yes |
| Show all tags | | |
| Show first 3 | Very compact | |
| You decide | | |

### Tooltip?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, brief description | Helpful for unfamiliar terminology | Yes |
| No tooltip | | |
| You decide | | |

### Label?
| Option | Description | Selected |
|--------|-------------|----------|
| No label | Clean, badges self-explanatory | |
| Small label | 'Tags:' before badges | |
| You decide | Claude's discretion | Yes |

---

## Collection Page Routing

### Route structure?
| Option | Description | Selected |
|--------|-------------|----------|
| /collections and /collections/$slug | Top-level routes | Yes |
| /scholarships/collections/... | Nested under /scholarships | |
| You decide | | |

### Comparison route?
| Option | Description | Selected |
|--------|-------------|----------|
| /scholarships/compare | Nested, registered before /$slug | Yes |
| /compare | Top-level | |
| You decide | | |

### Tag filter URL?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, /scholarships?tags=stem,no_gre | Consistent with filter URL pattern | Yes |
| No tag filter on directory | Tags only through collections | |
| You decide | | |

### Route files?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, file-based | collections/index.tsx, collections/$slug.tsx | Yes |
| Code-based route | Programmatic | |
| You decide | | |

---

## Accessibility

### Comparison table?
| Option | Description | Selected |
|--------|-------------|----------|
| WCAG AA with proper table semantics | Semantic table, ARIA labels | Yes |
| Basic a11y | Semantic HTML only | |
| You decide | | |

### Compare checkbox keyboard?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, full keyboard support | Tab + Space/Enter | Yes |
| Mouse/touch only | | |
| You decide | | |

### Compare bar announcements?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, live region | aria-live='polite' | Yes |
| No announcements | | |
| You decide | | |

### Collection card focus?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, focusable cards | Focus indicators, Enter navigates | Yes |
| You decide | | |

### Reduced motion?
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, respect prefers-reduced-motion | Disable/reduce animations | Yes |
| No animations to worry about | | |
| You decide | | |

---

## Dark Mode

### Comparison table: Inverted with existing CSS vars (muted difference highlights)
### Compare bar: Matches sticky bar and FilterPanel dark mode
### Tag badges: Light border on dark background
### Emojis: Stay the same (system-rendered)

---

## Error Handling

### Error pattern: Inline error + retry (consistent with directory)
### Missing compare scholarships: Show available + warning banner

---

## Loading States

### All new pages: Content-shaped skeletons matching final content

---

## Mobile

### Compare bar: Fixed bottom bar
### Collection browse: Single column
### Tags in hero: Wrap (flex-wrap)

---

## Testing

### Coverage: Full coverage -- backend logic tests + UI component tests

---

## Predefined Tag List

### Categories: 5 (Eligibility, Subject, Duration, Funding, Region), 4-6 per category
### Naming: snake_case + display labels
### Descriptions: Yes, for tooltips and admin reference
### Region auto-assign: Yes, from host_country via existing region mapping

---

## Seed Collections

### Set: 10 confirmed (Top Fully Funded, Study in Europe/Asia/Americas, No GRE, STEM, Government, For Women, Closing This Month, Recently Added)
### Default sorts: Context-appropriate per collection
### Featured: First 5-6 marked featured

---

## Admin Tags Tab

### Layout: Tag list + bulk operations (grouped tags with counts, filter-then-tag)
### Suggested tag review: Yes, in Tags tab
### Tag management: Delete/rename with impact warning, untagged filter

---

## Related Scoring Weights

### Weights: Provider 35%, Country 25%, Degree 15%, Funding 15%, Tags 10%
### Configurable: Admin-configurable via dashboard
### Overlap scoring: Proportional for both degree and tag overlap

---

## Admin View Switching

### Navigation: Tabs at top (extend existing React state pattern)

---

## Suggested Tag UI in Edit Panel

### Display: Yellow/amber outline badges with accept/reject buttons, matched snippet on hover

---

## Collection SEO for Phase 9 Prep

### Scope: Route structure + basic meta titles only. Full SEO deferred to Phase 9.

---

## Claude's Discretion

- Collection ordering method (drag-and-drop vs numeric input)
- Comparison fields selection and compare bar design
- Winner/recommendation summary on compare page
- Featured collections row personalization by nationality
- Sort display label on collection detail page
- Tags section label in hero
- Empty state for no related scholarships
- Additional auto-tag categories
