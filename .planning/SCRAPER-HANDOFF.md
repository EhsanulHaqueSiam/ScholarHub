# Scraper Build Handoff

## Resume Command
```
/gsd:resume-work
```
Or manually: read this file, check which sites are done, continue with the next batch.

## What's Already Done (in Convex)
- Study Australia Scholarships (~1,048)
- Study Australia Providers (~1,855)
- Study in Japan CSV (539)
- EducationUSA Financial Aid (~150)
- ScholarshipRoar (100)
- Erasmus Mundus (~88)
- OpportunitiesCircle (72)
- OpportunitiesCorners (66)
- Commonwealth Scholarships UK (10)
- Scholars4Dev (7)
- Swedish Institute (1)
Total: ~3,936

## What's Already Configured (configs exist, need selector tuning or testing)
- DAAD (scrapling, selectors don't match AJAX DOM)
- Stipendium Hungaricum (scrapling, DreamApply selectors need tuning)
- Chevening (scrape, 3 programmes)
- GKS Korea (scrape, few programmes)
- Turkiye Burslari (scrape, few programmes)
- CSC China (scrapling, DNS/anti-bot issues)
- InternationalScholarships (scrape, title not extracted from table)
- IEFA (same as InternationalScholarships)
- WeMakeScholars (scrape, 15K+ records, pagination untested)
- Bold.org (scrape, 3K+ records, Next.js SSR)
- EduCanada (api, JSON structure needs fixing)
- SHED Bangladesh (scrapling, govt SSL)
- ICCR India (scrape, 20 schemes)

## Sites Without Configs Yet
- erd.gov.bd, study-uk.britishcouncil.org, australiaawards.gov.au
- campusfrance.org, moe.gov.sg, scholarships.govt.nz
- fastweb.com, scholarships.com, bigfuture.collegeboard.org
- edupass.org, mastersportal.com, findamasters.com
- buddy4study.com, worldbank.org, adb.org
- gatescambridge.org, knight-hennessy.stanford.edu
- akdn.org, mastercardfdn.org, rotary.org
- dutchbanglabank.com, ibfbd.org, opensocietyfoundations.org
- goingmerry.com, petersons.com, globalscholarships.com
- studentscholarships.org, collegescholarships.org
- careeronestop.org, internationalstudent.com
- goabroad.com, gooverseas.com, studyabroad.com
- studyabroadfunding.org, unienrol.com, theglobalscholarship.org
- iie.org, beglobalii.com, vliruos.be, sbfi.admin.ch
- gov.ie, myscholly.com, scholarshipscanada.com
- scholarshipowl.com, niche.com, raise.me
- scholarshiptab.com, youthop.com, scholarshipportal.com
- scholarships360.org, bold.org, profellow.com, wemakescholars.com

## Config Backup
Original config at: .planning/config.json.backup
Restore with: cp .planning/config.json.backup .planning/config.json

## Approach Per Site
1. WebFetch the page to examine actual HTML/API structure
2. Determine method: api (JSON/CSV), scrape (HTML), scrapling (JS/anti-bot)
3. Create config with correct CSS selectors from actual DOM
4. Dry-run test
5. Live scrape to Convex
6. Commit
