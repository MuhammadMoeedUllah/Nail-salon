# US Nail Salon Market and How Salons Handle Technician Pay and Hours Today

*Research memo for the shared-tablet clock-in + ticket-log → weekly pay-record app. Compiled 2026-10-07.*

**Method note.** Web search worked for this session, but the network egress proxy blocked direct page fetches for every primary domain tried (labor.ucla.edu, dol.gov, governor.ny.gov, nailsmag.com, bls.gov, dir.ca.gov, ag.ny.gov, irs.gov, ctmirror.org, baonail.com, raovatnailsalon.com, reddit, etc.). Every figure below therefore comes from search-engine excerpts of the linked page rather than a first-hand read of it. Numbers are reproduced as the excerpt stated them; each should be spot-checked against the linked URL before being quoted in marketing or legal copy. Anything that could not be tied to a URL is marked **unverified**. The per-turn search quota ran out before the last few queries (tip-theft lawsuits 2023-25, booth-rent prevalence, NYC salon counts, NY task-force 2017-19 updates); those gaps are called out in place.

---

## 1. Market size and shape

### 1.1 Establishment and employment counts

| Metric | Figure | Year | Source |
|---|---|---|---|
| Employer nail-salon businesses (NAICS 812113) | 31,981 businesses / 32,078 establishments | 2020 Census | [naics.com 812113](https://www.naics.com/naics-code-description/?code=812113) |
| Employees at those establishments | 122,646 | 2020 Census | [naics.com 812113](https://www.naics.com/naics-code-description/?code=812113) |
| Implied employees per employer establishment | ~3.8 (122,646 / 32,078) | derived | derived from above |
| Active companies (commercial database) | 36,614 companies, est. 102,291 employees | current | [siccode.com NAICS 812113](https://siccode.com/naics-code/812113/nail-salons) |
| Nonemployer (owner-only / 1099-style) nail salons | 295,977 | latest NES | [startbusinessbystate.com salon statistics](https://startbusinessbystate.com/salon-industry-statistics/) |
| Nail salons per NAILS Magazine | ~130,000 salons | 2015 | [Daily Beast citing NAILS](https://www.thedailybeast.com/the-nail-diaspora-how-manicures-transformed-the-vietnamese-immigrant-experience-in-america/) |
| Licensed nail technicians | >250,000 | n.d. (NAILS) | [Bookedin stats page citing NAILS](https://bookedin.com/blog/nail-salon-industry-statistics/) |
| BLS employment, manicurists & pedicurists | 210,100 | 2024 | [BLS OOH Manicurists and Pedicurists](https://www.bls.gov/ooh/personal-care-and-service/manicurists-and-pedicurists.htm) |
| Projected growth / annual openings | +7% 2024-34; ~24,800 openings/yr | 2024 | [BLS OOH](https://www.bls.gov/ooh/personal-care-and-service/manicurists-and-pedicurists.htm) |
| IBISWorld "Personal Waxing & Nail Salons" businesses | 348,000 businesses | 2025 | [IBISWorld market size](https://www.ibisworld.com/united-states/market-size/personal-waxing-nail-salons/4411/) |

The 2023 County Business Patterns release (published 2025-06-26) is the authoritative current source for 812113 employer counts but could not be fetched in this session: [Census 2023 CBP press release](https://www.census.gov/newsroom/press-releases/2025/2023-county-business-patterns.html). The 32k-employer / 296k-nonemployer split is the single most important market fact: the overwhelming majority of "nail salons" in Census data are one-person filers, and the ~32k employer salons averaging under four W-2 employees are the real market for a payroll-records tool.

### 1.2 Revenue

| Metric | Figure | Source |
|---|---|---|
| Nail salons industry revenue | $12.9B (2022) | [Kentley Insights](https://www.kentleyinsights.com/nail-salons-industry-market-research-report/) |
| NAILS Magazine industry revenue | ~$8B/yr | [Bookedin citing NAILS](https://bookedin.com/blog/nail-salon-industry-statistics/) |
| IBISWorld Personal Waxing & Nail Salons | $25.5B (2025), +2.1% YoY, 9.1% CAGR 2020-25 | [IBISWorld](https://www.ibisworld.com/united-states/market-size/personal-waxing-nail-salons/4411/) |
| NAILS 2012-13 figure | $7.47B | [Trinitonian citing NAILS](https://trinitonian.com/2021/04/09/the-story-of-vietnamese-people-and-nail-salons-runs-deeper-than-a-comedy-skit/) |

### 1.3 Who owns and staffs salons

| Metric | Figure | Source |
|---|---|---|
| Nail techs of Vietnamese descent, US | 48% (NAILS 2012-13); 51% (NAILS, later); "over 50%" | [Trinitonian](https://trinitonian.com/2021/04/09/the-story-of-vietnamese-people-and-nail-salons-runs-deeper-than-a-comedy-skit/); [SNS Chairs citing NAILS](https://snschairs.com/blogs/news/what-percent-of-nail-salons-are-vietnamese/); [Daily Beast](https://www.thedailybeast.com/the-nail-diaspora-how-manicures-transformed-the-vietnamese-immigrant-experience-in-america/) |
| Vietnamese salons vs all others | "Vietnamese salons now outnumber all others" (NAILS Big Book 2017-18) | [NAILS: A Magazine for the "Other" 40%](https://www.nailsmag.com/390309/a-magazine-for-the-other-40) |
| California licensed manicurists Vietnamese | ~80% (NPR 2012); >82% Vietnamese, 85% women (2025 lawsuit coverage) | [NPR](https://npr.org/2012/06/14/154852394/with-polish-vietnamese-immigrant-community-thrives); [CalMatters 2025](https://calmatters.org/politics/2025/07/workers-nail-salons-labor-bill/) |
| Workforce foreign-born / women (UCLA Nail Files 2018) | 79% foreign-born; 81% women; of foreign-born, 82% born in Vietnam | [UCLA Labor Center Nail Files](https://labor.ucla.edu/publications/nail-files/); [Portside summary](https://portside.org/2018-12-17/ucla-releases-first-national-study-labor-conditions-nail-salon-industry) |
| Self-employed share | 30% (triple national average), with misclassification concerns | [ABC7 on UCLA 2024](https://abc7.com/nail-salon-industry-ucla-labor-center-study-poor-working-conditions-low-pay/14547140/) |

### 1.4 Geography

| Cluster | Figure | Source |
|---|---|---|
| California | >5,500 nail-salon locations (most of any state) | [naicslist.com 812113](https://naicslist.com/naics/812113) |
| Texas | >4,000 locations (second) | [naicslist.com 812113](https://naicslist.com/naics/812113) |
| New York City | count **unverified** this session (search quota exhausted); NYC/LI average manicure price $11.14 per NYNSWA | [TalkPoverty 2020](https://talkpoverty.org/2020/02/21/new-york-nail-salon-wage-theft/) |
| Connecticut | 91 salons/spas issued stop-work orders 2015-2019 | [CT Post 2019](https://www.ctpost.com/politics/article/As-nail-salons-multiply-state-struggles-to-13577022.php) |

### 1.5 Prices and technician earnings

| Metric | Figure | Source |
|---|---|---|
| Basic manicure / gel / acrylic full set (US averages) | $25-45 / $35-60 / $45-75; prices +12% in 2024 | [Zenoti price guide](https://zenoti.com/thecheckin/the-2024-insider-guide-to-nail-salon-prices) |
| NYC/Long Island average manicure | $11.14 (NYNSWA, 2020) | [TalkPoverty](https://talkpoverty.org/2020/02/21/new-york-nail-salon-wage-theft/) |
| BLS median wage, manicurists & pedicurists | $16.66/hr (May 2024); $17.19/hr = $35,760/yr (May 2025) | [BLS OOH](https://www.bls.gov/ooh/personal-care-and-service/manicurists-and-pedicurists.htm); [jobbls.com summary](https://jobbls.com/salary/manicurists-and-pedicurists) |
| 10th / 90th percentile | $13.90/hr ($28,920) / $24.10/hr ($50,140) | [jobbls.com](https://jobbls.com/salary/manicurists-and-pedicurists) |
| UCLA California 2024 median hourly | $10.94, below the $13.00 CA small-employer minimum (2021); 80% low-wage; 78% of employees low-wage vs 33% all industries | [UCLA press advisory](https://labor.ucla.edu/press-advisory/californias-fast-growing-nail-salon-workforce-faces-low-wages-misclassification-says-new-research-from-ucla-chnsc); [LAist](https://laist.com/brief/news/california-nail-salons-minimum-wage-ucla-healthy-collaborative) |
| Vietnamese-community income norms | $2,500-$4,000/month typical; up to $5,000+ in NYC/LA/SF | [SNS Chairs (Vietnamese)](https://snschairs.com/blogs/news/thu-nhap-nghe-nail-o-my) |
| Vietnamese job-ad weekly pay | "$1,800-2,500/tuần" common for experienced techs; "bao lương $1,700/tuần, bao quanh năm" | [KinhDoanhUSA CA wage survey](https://kinhdoanhusa.com/luong-tho-nail-california-khao-sat-moi-nhat/) |

Note the gap: BLS median ($17/hr) reflects reported W-2 wages; UCLA's survey median ($10.94) and the Vietnamese ad market ($1,500-2,500/week) describe the same workforce from different vantage points (reported wages vs surveyed take-home vs advertised gross including cash). A product must reconcile all three.

---

## 2. Pay structures actually used

### 2.1 The Vietnamese-salon vocabulary: *bao lương* and *ăn chia*

Vietnamese-language sources describe exactly two models, often combined as a floor-plus-upside:

- **Bao lương (guaranteed wage):** "the salon guarantees a fixed amount per day regardless of how busy it is, typically $130-$200/day depending on the type of tech" — [KinhDoanhUSA](https://kinhdoanhusa.com/luong-tho-nail-california-khao-sat-moi-nhat/). Weekly framing is equally common: "Bao lương $1,500 trở lên/tuần" — [KinhDoanhUSA ad](https://kinhdoanhusa.com/nguoi-viet-rao-vat-listing/can-tho-nail-gap-bao-luong-1500-tro-len-tuan-tiem-my-trang-khach-rat-lich-su-tip/).
- **Ăn chia (commission split):** "The most common method is the 6/4 split: technicians receive 60% of service revenue and the owner 40%." — [SNS Chairs](https://snschairs.com/blogs/news/thu-nhap-nghe-nail-o-my). "Most owners also work as a tech in the shop; their larger income is from the 6/4 split with the techs." — [KinhDoanhUSA](https://kinhdoanhusa.com/luong-tho-nail-california-khao-sat-moi-nhat/).
- **Guarantee vs. commission, whichever is higher:** BaoNail job ads in Pennsylvania read "guaranteed $150/day or 60/40 commission" and "guaranteed $200-$250/day depending on skill, commission split above base" — [BaoNail PA listings](https://baonail.com/index.php?city=Philadelphia&lat=40.0250897&lng=-75.0959023&mylang=en&orderby=time&radius=20&state=PA&stype=1&zipcode=). Raovatnailsalon ads: "guaranteed weekly $2,000 plus 6/4 profit share"; "$1,000-1,200/week or 6/4"; "guaranteed $1,600 with 6/4, tips over 20%, some techs earn $2,000+/week" — [raovatnailsalon.com Cần Thợ Nail](https://raovatnailsalon.com/ad-category/tim-tho-nail/can-tho-nail/).
- There is a Vietnamese-language owner-facing article literally titled "Owners guaranteeing wages for techs, and solutions for tax and labor law in the nails trade" — [raovatnailsalon.com](https://raovatnailsalon.com/chu%CC%89-bao-luong-cho-tho%CC%A3-va-gia%CC%89i-phap-cho-luat-thue-va-lao-dong-trong-nghe-nails/) (content not readable this session; title confirms the topic is live in the owner community).

### 2.2 The "check and cash" split

- "Typically, technician wages are paid 50% cash and 50% check." — [SNS Chairs (Vietnamese)](https://snschairs.com/blogs/news/thu-nhap-nghe-nail-o-my).
- Job-seeker advice in Vietnamese: "Ask clearly about wage or bao lương, tips, W-2/check/cash…" — [KinhDoanhUSA](https://kinhdoanhusa.com/luong-tho-nail-california-khao-sat-moi-nhat/). "W-2/check/cash" is a standard checklist item, which tells you the split is a negotiated term of employment, not a secret.
- Federal case, June 2026: owners of 60+ salons (Anthony Vince Nail Salons, Prive Nail Spas, Zen Nail & Spas) pleaded guilty after paying "over $116 million in cash compensation" to technicians 2016-2024 that was not reported, "prepared false Forms 1099" and "trained managers to conceal cash compensation"; estimated tax loss ≥ $32M — [IRS-CI release](https://www.irs.gov/compliance/criminal-investigation/owners-of-nationwide-nail-salon-business-plead-guilty-to-tax-crimes); [DOJ release](https://www.justice.gov/opa/pr/owners-nationwide-nail-salon-business-plead-guilty-tax-crimes); [NAILS coverage](https://www.nailsmag.com/news/defendants-made-more-than-116-m-in-unreported-cash-payments).

### 2.3 Mainstream (English-language) benchmarks

| Model | Range | Source |
|---|---|---|
| Hourly | $10-$18/hr + tips | [Zenoti: how nail salons pay](https://www.zenoti.com/thecheckin/how-do-nail-salons-pay-their-employees) |
| Commission | 40-60% of service revenue; "45-50% is the industry anchor" | [Zenoti](https://www.zenoti.com/thecheckin/how-do-nail-salons-pay-their-employees); [Mirelle commission benchmark](https://mirelleinspo.com/trend-reports/nail-salon-commission-splits-benchmarked) |
| New-tech starting split | 40/60 (40% to tech) | [Young Nails blog](https://www.youngnails.com/blogs/news/ynblog3) |
| Booth / chair rent | $200-$600/week flat | [Zenoti](https://www.zenoti.com/thecheckin/how-do-nail-salons-pay-their-employees) |
| Owner-forum practice | commission techs "typically classified as 1099," though some issue W-2 | [SalonGeek owner thread](https://www.salongeek.com/threads/nails-salon-owners-how-do-you-pay-your-technicians.335893/) |

### 2.4 Flat day rates in the enforcement record

- NYNSWA 2020 survey (~100 workers): "More than half were paid a flat daily or weekly rate, usually only about $80 to $100 a day" — [TalkPoverty](https://talkpoverty.org/2020/02/21/new-york-nail-salon-wage-theft/).
- NYT 2015: starting wages of "$30 and $40 a day" at an Upper East Side salon; an ad offering "$75 per day in base pay" with trainees at "$10 per day" — [Muckraker Farm summary of NYT](https://muckrakerfarm.com/2015/05/the-price-of-nice-nails-manicurists-are-routinely-underpaid-and-exploited/); [NYT original](https://www.nytimes.com/2015/05/10/nyregion/at-nail-salons-in-nyc-manicurists-are-underpaid-and-unprotected.html).
- Legal-blog framing: workers "are typically paid a flat rate – in cash – for each day they work, in an attempt to avoid both paying overtime and keeping accurate time records" — [Aegis Law Firm](https://www.aegislawfirm.com/blog/2019/09/workers-tell-all-the-truth-about-nail-salons/).
- California, 2018: 36 workers at Young's Nail Spa (Temecula) "were paid for each salon service performed instead of the total hours worked"; shifts 9.5-10 hrs, up to 50 hrs/week, no overtime — [CA Labor Commissioner via PRNewswire](https://www.prnewswire.com/news-releases/labor-commissioner-cites-nail-salon-1-2-million-for-misclassification-and-wage-theft-of-36-workers-300688627.html).

### 2.5 Tips, tip-outs, and deductions

- Card tips: "some salons pay technicians their credit card tips in cash at the end of every week … while reporting the amount on their paychecks" — [Beauty Launchpad](https://www.beautylaunchpad.com/business/nails/article/21415557/pro-advice-on-the-tipping-process). Customer-side distrust: "I have no way to know if the salon actually gives her the full amt of my tip" — [Glassdoor community post](https://www.glassdoor.com/Community/women-in-consulting/at-a-nail-salon-and-i-realized-halfway-through-my-pedicure-that-i-dont-have-cash-on-me-to-tip-and-i-left-my-debit-card-at-home-i).
- Supply charges: "Ten percent of salons forced workers to pay for manicure supplies, an illegal practice" (NY task-force findings as reported) — [AOL 2016](https://www.aol.com/article/2016/03/01/nail-salons-ordered-to-pay-workers-1-1-million/21321057/). An Ohio tech on a 60/40 split asked whether supply deductions from commission were legal — [JustAnswer](https://www.justanswer.com/employment-law/9lfw4-work-nail-technician-ohio-paid-60-40.html). Consultant view: some owners remove a product fee before computing commission (generally permissible if FLSA-compliant), others pull it out of the tech's cut without disclosure — [This Ugly Beauty Business](https://thisuglybeautybusiness.com/2014/12/shady-business-practices-salon-owners-charging-staff-for-product.html).
- Fines: NYT reported "tips, or entire wages, being stolen for spilling a bottle of polish or dropping the nail clippers" — [Muckraker Farm / NYT](https://muckrakerfarm.com/2015/05/the-price-of-nice-nails-manicurists-are-routinely-underpaid-and-exploited/).
- Tip-theft lawsuits 2023-25: **unverified** (search quota exhausted before this query).

### 2.6 1099 vs W-2

- 30% self-employed nationally (UCLA) with explicit misclassification concern — [ABC7 on UCLA](https://abc7.com/nail-salon-industry-ucla-labor-center-study-poor-working-conditions-low-pay/14547140/).
- Envy Nails (NYC chain) "routinely misclassified their employees as independent contractors" 2015-2021; $300,000 recovered — [NY AG 2023](https://ag.ny.gov/press-release/2023/attorney-general-james-recovers-300000-unpaid-wages-new-york-city-nail-salon); [The Chief](https://thechiefleader.com/stories/nyc-nail-salon-chain-must-pay-300k-in-unpaid-wages,50968).
- California: as of January 2025 manicurists lost their AB5 exemption and must be W-2 employees; Vietnamese owners sued in federal court alleging discrimination — [CalMatters](https://calmatters.org/politics/2025/07/workers-nail-salons-labor-bill/); [AsAmNews](https://asamnews.com/2025/06/03/independent-contractors-employee-classification-ab5-controversy/).

---

## 3. How hours and tickets are tracked today

- **Paper is still the default for turns.** "A paper sign-in sheet — still the most common system — gives clients no wait estimate, offers techs no visibility, and provides owners with no data." — [Zenoti software guide](https://www.zenoti.com/thecheckin/nail-salon-software-guide). Turn trackers in nail POS use "half-turn and full-turn rotation" to assign walk-ins — [Supaday](https://supaday.app/nail-salon-software); [Astra POS turn queue](https://astraposonline.com/salon-turn-queue.html).
- **Commission is tallied by hand nightly.** "Many nail salons still calculate commissions manually, often in a paper ledger or spreadsheet that the owner updates nightly." End-of-week payroll "used to take the owner 3-4 hours of spreadsheet work." Techs "trust printed reports more than handwritten records," so vendors recommend a printed per-tech Tip Report each night — [Rich Payment Solutions](https://richpaymentsolutions.com/point-of-sale-system-for-nail-salon-tip-payroll/).
- **Bookkeeper hand-off** is CSV "for QuickBooks, Gusto, ADP, or your accountant" when a POS exists — [Rich Payment Solutions](https://richpaymentsolutions.com/point-of-sale-system-for-nail-salon-tip-payroll/); specialist nail-salon accountants market to this gap — [Fiscal Insights](https://fiscalinsights.com/for/nail-salons). A standalone "Nail Tech Payroll & Commission" iPhone app (released 2025) exists for owners doing this without a POS — [App Store](https://apps.apple.com/us/app/nail-tech-payroll-commission/id6741119182).
- **Time clocks are rare; investigators notice.** Massachusetts: the Salem Nail Bar owner "did not keep accurate records … had to hire an accountant to reconstruct payroll records" — [Mass.gov decision](https://www.mass.gov/decision/salem-nail-bar-v-fair-labor-div-lb-22-0441-445-final-decision). Rhode Island: salons "did not maintain accurate work records, provided false information to investigators and compelled employees to sign documents that contained false information" — [US DOL](https://www.dol.gov/newsroom/releases/sol/sol20240529). Connecticut: of 91 salons shut temporarily since 2015, "every one … paid their employees in cash without withholding taxes … and none kept payroll records" — [CT Post](https://www.ctpost.com/politics/article/As-nail-salons-multiply-state-struggles-to-13577022.php). "When investigators inspect salons, the first document they will ask for is time cards." — [This Ugly Beauty Business](https://thisuglybeautybusiness.com/2014/03/common-misconceptions-laws-that-most-salon-owners-are-unaware-of-or-like-to-pretend-they-arent-aware-of.html). NY owners ask lawyers whether staff must clock in at all — [JustAnswer NY](https://www.justanswer.com/employment-law/puzl0-nail-salon-new-york-employees-clock.html).
- **Pay cadence.** Vietnamese ads quote pay per week ("/tuần") or per day ("/ngày") ([KinhDoanhUSA](https://kinhdoanhusa.com/luong-tho-nail-california-khao-sat-moi-nhat/); [BaoNail](https://baonail.com/index.php?mylang=vi&state=PA&stype=1)); NY survey workers were on "a flat daily or weekly rate" ([TalkPoverty](https://talkpoverty.org/2020/02/21/new-york-nail-salon-wage-theft/)); card tips handed over in cash weekly ([Beauty Launchpad](https://www.beautylaunchpad.com/business/nails/article/21415557/pro-advice-on-the-tipping-process)). The specific weekday owners settle up ("Sunday night with a calculator") is **unverified**; no source found this session named a day.
- Hours: two-thirds of NY workers report 10+ hour shifts ([CBS NY](https://cbsnews.com/newyork/news/nail-salon-workers-association-wage-theft-report)); CA citation found 9.5-10 hr shifts up to 50 hrs/week ([PRNewswire](https://www.prnewswire.com/news-releases/labor-commissioner-cites-nail-salon-1-2-million-for-misclassification-and-wage-theft-of-36-workers-300688627.html)).

---

## 4. Owner pains and fears

- **Not knowing the rules.** CT investigators "found a widespread lack of understanding about rules for keeping payroll records among salon owners who were predominantly Asian immigrants" — [CT Post](https://www.ctpost.com/politics/article/As-nail-salons-multiply-state-struggles-to-13577022.php).
- **Paying for idle time.** CA owner An Tra (Happy Nails & Spa): "We don't have customers all the time. That's going to cost us a lot more to pay them for the downtime when they don't have any customers." — [CalMatters](https://calmatters.org/politics/2025/07/workers-nail-salons-labor-bill/). Owners described lives "turned upside down overnight" by W-2 reclassification — [Yahoo/Moneywise](https://www.yahoo.com/news/articles/vietnamese-american-salon-owners-suing-103500925.html).
- **NY wage bond.** Required since 2015-10-06 as a licensing condition; $25,000 (2-5 FT employees), $40,000 (6-10), $75,000 (11-25) — [Surety1](https://surety1.com/bond_info/new-york-wage-bond-nail-salons/); [NY Governor release](https://www.governor.ny.gov/news/governor-cuomo-announces-wage-bond-requirements-nail-salon-owners-and-availability-new-nail). Owners planned a lawsuit; Assemblyman Ron Kim said bonds were not readily available and some owners were "quoted 'extremely high' premium rates" — [NBC News](https://www.nbcnews.com/news/asian-america/new-york-nail-salon-owners-plan-lawsuit-over-wage-bond-n426911).
- **Criminal exposure for cash payroll.** The $116M Anthony Vince case carries up to 10 years in prison — [DOJ](https://www.justice.gov/opa/pr/owners-nationwide-nail-salon-business-plead-guilty-tax-crimes).
- **Retaliation findings compound wage cases.** RI owner paid $168,000 in OSHA damages for firing a complaining worker on top of $550,000 in overtime back pay — [US DOL](https://www.dol.gov/newsroom/releases/sol/sol20240529).
- **Turnover and tech mobility.** BLS projects ~24,800 openings/year for 210,100 jobs (≈12%/yr churn from openings alone) — [BLS OOH](https://www.bls.gov/ooh/personal-care-and-service/manicurists-and-pedicurists.htm). Vendor guide: "good techs have options" given ~21,900 openings/yr and 23% self-employed — [Tilavon](https://tilavon.com/guides/manage-salon-employees). Secondary blogs claim 28%-40% annual turnover ([Gitnux](https://gitnux.org/nail-salon-industry-statistics/); [WiFiTalents](https://wifitalents.com/nail-salon-industry-statistics/)) but cite no primary data — treat as **unverified**.
- **Language.** NAILS runs a sister title for the Vietnamese majority ("A Magazine for the 'Other' 40%") — [NAILS](https://www.nailsmag.com/390309/a-magazine-for-the-other-40); UCLA notes "language barriers … deter workers from reporting" and calls for multilingual resources for workers and owners — [UCLA Nail Files](https://labor.ucla.edu/project/rework-research/publication/nail-files/). A precise LEP percentage was not found: **unverified**.

---

## 5. Worker pains and enforcement statistics

| Jurisdiction / action | Finding | Source |
|---|---|---|
| NYT investigation (2015) | 150+ interviews in 4 languages; "a vast majority of workers are paid below minimum wage; sometimes they are not even paid" | [Fortune](https://fortune.com/2015/05/15/nyc-nail-salon-workers-lawsuit); [NYT](https://www.nytimes.com/2015/05/10/nyregion/at-nail-salons-in-nyc-manicurists-are-underpaid-and-unprotected.html) |
| NY task force, Aug 2015 sweep | 901 violations in 182 salons; 42% violated wage/hour or overtime law | [NYCOSH](http://nycosh.org/2015/10/2072/) |
| NY task force cumulative (2016 release) | 450+ investigations opened, 383 completed; 143 salons ordered to pay $2M to 652 employees | [NY Governor](https://www.governor.ny.gov/news/governor-cuomo-directs-nail-salons-repay-2-million-unpaid-wages-and-damages-more-600-employees) |
| NYNSWA / Workers United survey (2020) | 82% of ~100 workers experienced wage theft; avg loss $181/week ($9,412/yr); 500+ interviewed by Workers United, none paid overtime | [Gothamist](https://gothamist.com/news/majority-nyc-nail-salon-workers-still-face-wage-theft-new-report-finds); [CBS NY](https://cbsnews.com/newyork/news/nail-salon-workers-association-wage-theft-report) |
| US DOL WHD, NYC (Apr 2016) | Ada Nails & Spa $23,704 OT to 12; Hai Hua Beauty Salon $23,643 OT to 9 | [US DOL](https://www.dol.gov/newsroom/releases/whd/whd20160407-0) |
| US DOL WHD, Long Island (Aug 2016) | $203K back wages, damages, penalties; 95 workers; 6 salons; OT + recordkeeping | [US DOL](https://www.dol.gov/newsroom/releases/whd/whd20160824) |
| US DOL, Rhode Island (consent judgment Feb 2024, announced May 2024) | $753,500 total; 70 employees, $275K back wages + $275K liquidated damages; false records; retaliation | [US DOL](https://www.dol.gov/newsroom/releases/sol/sol20240529) |
| CT DOL (2015) | 23 of 25 salons in violation (92%); one paid $4/hr vs $9.15 min; >$100K penalties; $47,350 wages recovered; 23 stop-work orders | [CT Mirror](https://ctmirror.org/2015/08/17/nail-salons-are-ubiquitous-and-so-are-labor-violations/) |
| CT DOL cumulative (2019) | 91 salons temporarily closed since 2015; all cash pay, no records, no workers' comp | [CT Post](https://www.ctpost.com/politics/article/As-nail-salons-multiply-state-struggles-to-13577022.php) |
| CA Labor Commissioner (2018) | Young's Nail Spa, Temecula: $1,242,227 ($670,040 to 36 workers + $572,187 penalties); 40-month audit; paid per service | [PRNewswire / DIR](https://www.prnewswire.com/news-releases/labor-commissioner-cites-nail-salon-1-2-million-for-misclassification-and-wage-theft-of-36-workers-300688627.html); [DIR PDF](https://www.dir.ca.gov/DIRNews/2018/2018-65.pdf) |
| NY AG (2023) | Envy Nails chain: $300,000; misclassification 2015-2021 | [NY AG](https://ag.ny.gov/press-release/2023/attorney-general-james-recovers-300000-unpaid-wages-new-york-city-nail-salon) |
| MA Fair Labor Division (2022 docket) | Salem Nail Bar: no accurate time/pay records; records reconstructed by accountant | [Mass.gov](https://www.mass.gov/decision/salem-nail-bar-v-fair-labor-div-lb-22-0441-445-final-decision) |
| IRS-CI / DOJ (June 2026) | 60+ salons; $116M unreported cash pay 2016-2024; false 1099s | [IRS-CI](https://www.irs.gov/compliance/criminal-investigation/owners-of-nationwide-nail-salon-business-plead-guilty-to-tax-crimes) |
| Context: WHD total recoveries | $259M+ back wages recovered in 2025 across all industries | [US DOL](https://www.dol.gov/newsroom/releases/whd/whd20260108) |

Worker-side housing/food stress (UCLA 2024 CA): 65% rent-burdened, 19% overcrowded, 15% on SNAP — [UCLA press advisory](https://labor.ucla.edu/press-advisory/californias-fast-growing-nail-salon-workforce-faces-low-wages-misclassification-says-new-research-from-ucla-chnsc). Workers "come in on time, leave on time, and follow the owner's rules" yet are 1099'd — [SalonGeek](https://www.salongeek.com/threads/nails-salon-owners-how-do-you-pay-your-technicians.335893/). No pay stubs and reconstructed records recur in every enforcement narrative above.

---

## 6. Implications for product design

1. **Target is the ~32k employer salons averaging <4 W-2 employees**, not the 296k nonemployer filers ([naics.com](https://www.naics.com/naics-code-description/?code=812113); [startbusinessbystate](https://startbusinessbystate.com/salon-industry-statistics/)). A 3-15 tech salon is above average size; design for 1-15.
2. **Model pay as max(day-rate guarantee × days, commission % × service revenue)**, because "bao lương $150/ngày or 6/4" is literally how jobs are advertised ([BaoNail](https://baonail.com/index.php?mylang=vi&state=PA&stype=1)). Default split 60/40; allow 50/50, 55/45, 40/60 ([SNS Chairs](https://snschairs.com/blogs/news/thu-nhap-nghe-nail-o-my); [Mirelle](https://mirelleinspo.com/trend-reports/nail-salon-commission-splits-benchmarked)).
3. **Support weekly AND daily guarantee framing** ($130-200/day; $1,500-2,500/week) since both appear in ads ([KinhDoanhUSA](https://kinhdoanhusa.com/luong-tho-nail-california-khao-sat-moi-nhat/)).
4. **Owners think in a "check vs cash" split of the same paycheck** (50/50 is the stated norm) and "W-2/check/cash" is a hiring checklist term ([SNS Chairs](https://snschairs.com/blogs/news/thu-nhap-nghe-nail-o-my); [KinhDoanhUSA](https://kinhdoanhusa.com/luong-tho-nail-california-khao-sat-moi-nhat/)). The product should record 100% of gross pay on the record regardless of payment medium, and make the compliant path (all pay on the statement) the default rather than offering a "cash column" that re-creates the $116M fact pattern ([IRS-CI](https://www.irs.gov/compliance/criminal-investigation/owners-of-nationwide-nail-salon-business-plead-guilty-to-tax-crimes)).
5. **FLSA overtime on day-rate/commission is the core unmet calculation**: enforcement cases turn on 9.5-10 hr shifts, 50 hr weeks, pay "per service instead of total hours" ([PRNewswire](https://www.prnewswire.com/news-releases/labor-commissioner-cites-nail-salon-1-2-million-for-misclassification-and-wage-theft-of-36-workers-300688627.html)) and "no overtime in every case" ([CBS NY](https://cbsnews.com/newyork/news/nail-salon-workers-association-wage-theft-report)).
6. **Minimum-wage top-up must be automatic**: surveyed CA median $10.94/hr vs $13 minimum ([LAist](https://laist.com/brief/news/california-nail-salons-minimum-wage-ucla-healthy-collaborative)); NY flat rates of $80-100/day over 10+ hr shifts ([TalkPoverty](https://talkpoverty.org/2020/02/21/new-york-nail-salon-wage-theft/)).
7. **Time records are the first thing an investigator asks for and the thing salons never have** ([Mass.gov](https://www.mass.gov/decision/salem-nail-bar-v-fair-labor-div-lb-22-0441-445-final-decision); [CT Post](https://www.ctpost.com/politics/article/As-nail-salons-multiply-state-struggles-to-13577022.php)). The PIN clock-in is the wedge; the audit binder should export time cards + pay statements per week per tech.
8. **Keep tips separate and show card tips paid out**, since weekly cash payout of card tips with paycheck reporting is a known good practice and customers already distrust card-tip pass-through ([Beauty Launchpad](https://www.beautylaunchpad.com/business/nails/article/21415557/pro-advice-on-the-tipping-process); [Glassdoor](https://www.glassdoor.com/Community/women-in-consulting/at-a-nail-salon-and-i-realized-halfway-through-my-pedicure-that-i-dont-have-cash-on-me-to-tip-and-i-left-my-debit-card-at-home-i)).
9. **Supply/product fees: make them explicit pre-commission line items with disclosure**, never silent deductions ([This Ugly Beauty Business](https://thisuglybeautybusiness.com/2014/12/shady-business-practices-salon-owners-charging-staff-for-product.html); 10% of NY salons charged for supplies, [AOL](https://www.aol.com/article/2016/03/01/nail-salons-ordered-to-pay-workers-1-1-million/21321057/)).
10. **Weekly is the pay period to design around**; daily cash and flat weekly rates are the legacy patterns ([TalkPoverty](https://talkpoverty.org/2020/02/21/new-york-nail-salon-wage-theft/); [KinhDoanhUSA](https://kinhdoanhusa.com/luong-tho-nail-california-khao-sat-moi-nhat/)). Which weekday owners settle is unverified; make it configurable.
11. **The owner's current tool is a nightly paper ledger/spreadsheet and 3-4 hours of weekend math** ([Rich Payment Solutions](https://richpaymentsolutions.com/point-of-sale-system-for-nail-salon-tip-payroll/)); the daily ticket log must be faster than that ledger, not just more compliant.
12. **Techs trust printed statements over handwritten tallies** ([Rich Payment Solutions](https://richpaymentsolutions.com/point-of-sale-system-for-nail-salon-tip-payroll/)); a printable/PDF bilingual statement is a retention feature in a market with ~24,800 openings a year ([BLS](https://www.bls.gov/ooh/personal-care-and-service/manicurists-and-pedicurists.htm)).
13. **Vietnamese UI for owners is table stakes, not a nicety**: >50% of techs and a majority of salons are Vietnamese; 79% of workers are foreign-born; NAILS publishes a Vietnamese-language edition ([NAILS](https://www.nailsmag.com/390309/a-magazine-for-the-other-40); [UCLA](https://labor.ucla.edu/publications/nail-files/)). Use the owners' own words: *bao lương*, *ăn chia 6/4*, *tiền tip*, *check/cash*.
14. **State add-ons matter for the three biggest clusters**: NY wage bond tiers keyed to employee count (2-5 / 6-10 / 11-25) ([Surety1](https://surety1.com/bond_info/new-york-wage-bond-nail-salons/)); CA mandatory W-2 status since 2025 plus meal/rest-break citations ([CalMatters](https://calmatters.org/politics/2025/07/workers-nail-salons-labor-bill/)); CT stop-work orders for cash pay with no records ([CT Post](https://www.ctpost.com/politics/article/As-nail-salons-multiply-state-struggles-to-13577022.php)). The employee-count field should drive the NY bond-tier reminder.
15. **Bookkeeper/CPA export (CSV for QuickBooks/Gusto/ADP)** is the expected hand-off format ([Rich Payment Solutions](https://richpaymentsolutions.com/point-of-sale-system-for-nail-salon-tip-payroll/)).

---

## Sources (all accessed 2026-10-07 via search excerpts; direct fetch blocked)

- https://labor.ucla.edu/publications/nail-files/
- https://labor.ucla.edu/project/rework-research/publication/nail-files/
- https://labor.ucla.edu/press-advisory/californias-fast-growing-nail-salon-workforce-faces-low-wages-misclassification-says-new-research-from-ucla-chnsc
- https://labor.ucla.edu/wp-content/uploads/2024/04/Nail-Files-California-3.18.2024.pdf
- https://abc7.com/nail-salon-industry-ucla-labor-center-study-poor-working-conditions-low-pay/14547140/
- https://laist.com/brief/news/california-nail-salons-minimum-wage-ucla-healthy-collaborative
- https://portside.org/2018-12-17/ucla-releases-first-national-study-labor-conditions-nail-salon-industry
- https://www.naics.com/naics-code-description/?code=812113
- https://siccode.com/naics-code/812113/nail-salons
- https://naicslist.com/naics/812113
- https://startbusinessbystate.com/salon-industry-statistics/
- https://www.census.gov/newsroom/press-releases/2025/2023-county-business-patterns.html
- https://www.ibisworld.com/united-states/market-size/personal-waxing-nail-salons/4411/
- https://www.kentleyinsights.com/nail-salons-industry-market-research-report/
- https://bookedin.com/blog/nail-salon-industry-statistics/
- https://www.thedailybeast.com/the-nail-diaspora-how-manicures-transformed-the-vietnamese-immigrant-experience-in-america/
- https://trinitonian.com/2021/04/09/the-story-of-vietnamese-people-and-nail-salons-runs-deeper-than-a-comedy-skit/
- https://snschairs.com/blogs/news/what-percent-of-nail-salons-are-vietnamese/
- https://www.nailsmag.com/390309/a-magazine-for-the-other-40
- https://www.nailsmag.com/page/598291/market-research
- https://npr.org/2012/06/14/154852394/with-polish-vietnamese-immigrant-community-thrives
- https://www.bls.gov/ooh/personal-care-and-service/manicurists-and-pedicurists.htm
- https://jobbls.com/salary/manicurists-and-pedicurists
- https://zenoti.com/thecheckin/the-2024-insider-guide-to-nail-salon-prices
- https://www.zenoti.com/thecheckin/how-do-nail-salons-pay-their-employees
- https://www.zenoti.com/thecheckin/nail-salon-software-guide
- https://mirelleinspo.com/trend-reports/nail-salon-commission-splits-benchmarked
- https://www.youngnails.com/blogs/news/ynblog3
- https://www.salongeek.com/threads/nails-salon-owners-how-do-you-pay-your-technicians.335893/
- https://www.nailsmag.com/390752/is-your-pay-structure-the-problem
- https://baonail.com/index.php?city=Philadelphia&lat=40.0250897&lng=-75.0959023&mylang=en&orderby=time&radius=20&state=PA&stype=1&zipcode=
- https://baonail.com/index.php?mylang=vi&state=PA&stype=1
- https://raovatnailsalon.com/ad-category/tim-tho-nail/can-tho-nail/
- https://raovatnailsalon.com/chu%CC%89-bao-luong-cho-tho%CC%A3-va-gia%CC%89i-phap-cho-luat-thue-va-lao-dong-trong-nghe-nails/
- https://snschairs.com/blogs/news/thu-nhap-nghe-nail-o-my
- https://kinhdoanhusa.com/luong-tho-nail-california-khao-sat-moi-nhat/
- https://kinhdoanhusa.com/nguoi-viet-rao-vat-listing/can-tho-nail-gap-bao-luong-1500-tro-len-tuan-tiem-my-trang-khach-rat-lich-su-tip/
- https://www.vietbf.com/forum/showthread.php?t=1586924
- https://viet.usdeltarealty.com/yeu-kem-ve-quan-ly-va-dieu-hanh-trong-nghanh-nails/
- https://www.nytimes.com/2015/05/10/nyregion/at-nail-salons-in-nyc-manicurists-are-underpaid-and-unprotected.html
- https://muckrakerfarm.com/2015/05/the-price-of-nice-nails-manicurists-are-routinely-underpaid-and-exploited/
- https://fortune.com/2015/05/15/nyc-nail-salon-workers-lawsuit
- https://talkpoverty.org/2020/02/21/new-york-nail-salon-wage-theft/
- https://gothamist.com/news/majority-nyc-nail-salon-workers-still-face-wage-theft-new-report-finds
- https://cbsnews.com/newyork/news/nail-salon-workers-association-wage-theft-report
- http://nycosh.org/2015/10/2072/
- https://www.governor.ny.gov/news/governor-cuomo-directs-nail-salons-repay-2-million-unpaid-wages-and-damages-more-600-employees
- https://www.governor.ny.gov/news/governor-cuomo-announces-wage-bond-requirements-nail-salon-owners-and-availability-new-nail
- https://surety1.com/bond_info/new-york-wage-bond-nail-salons/
- https://www.nbcnews.com/news/asian-america/new-york-nail-salon-owners-plan-lawsuit-over-wage-bond-n426911
- https://www.aol.com/article/2016/03/01/nail-salons-ordered-to-pay-workers-1-1-million/21321057/
- https://ag.ny.gov/press-release/2023/attorney-general-james-recovers-300000-unpaid-wages-new-york-city-nail-salon
- https://thechiefleader.com/stories/nyc-nail-salon-chain-must-pay-300k-in-unpaid-wages,50968
- https://www.dol.gov/newsroom/releases/sol/sol20240529
- https://www.dol.gov/newsroom/releases/whd/whd20160407-0
- https://www.dol.gov/newsroom/releases/whd/whd20160824
- https://www.dol.gov/newsroom/releases/whd/whd20260108
- https://ctmirror.org/2015/08/17/nail-salons-are-ubiquitous-and-so-are-labor-violations/
- https://www.ctpost.com/politics/article/As-nail-salons-multiply-state-struggles-to-13577022.php
- https://www.prnewswire.com/news-releases/labor-commissioner-cites-nail-salon-1-2-million-for-misclassification-and-wage-theft-of-36-workers-300688627.html
- https://www.dir.ca.gov/DIRNews/2018/2018-65.pdf
- https://www.mass.gov/decision/salem-nail-bar-v-fair-labor-div-lb-22-0441-445-final-decision
- https://www.irs.gov/compliance/criminal-investigation/owners-of-nationwide-nail-salon-business-plead-guilty-to-tax-crimes
- https://www.justice.gov/opa/pr/owners-nationwide-nail-salon-business-plead-guilty-tax-crimes
- https://www.nailsmag.com/news/defendants-made-more-than-116-m-in-unreported-cash-payments
- https://calmatters.org/politics/2025/07/workers-nail-salons-labor-bill/
- https://asamnews.com/2025/06/03/independent-contractors-employee-classification-ab5-controversy/
- https://www.yahoo.com/news/articles/vietnamese-american-salon-owners-suing-103500925.html
- https://www.aegislawfirm.com/blog/2019/09/workers-tell-all-the-truth-about-nail-salons/
- https://thisuglybeautybusiness.com/2014/03/common-misconceptions-laws-that-most-salon-owners-are-unaware-of-or-like-to-pretend-they-arent-aware-of.html
- https://thisuglybeautybusiness.com/2014/12/shady-business-practices-salon-owners-charging-staff-for-product.html
- https://www.justanswer.com/employment-law/9lfw4-work-nail-technician-ohio-paid-60-40.html
- https://www.justanswer.com/employment-law/puzl0-nail-salon-new-york-employees-clock.html
- https://www.beautylaunchpad.com/business/nails/article/21415557/pro-advice-on-the-tipping-process
- https://www.glassdoor.com/Community/women-in-consulting/at-a-nail-salon-and-i-realized-halfway-through-my-pedicure-that-i-dont-have-cash-on-me-to-tip-and-i-left-my-debit-card-at-home-i
- https://richpaymentsolutions.com/point-of-sale-system-for-nail-salon-tip-payroll/
- https://supaday.app/nail-salon-software
- https://astraposonline.com/salon-turn-queue.html
- https://fiscalinsights.com/for/nail-salons
- https://apps.apple.com/us/app/nail-tech-payroll-commission/id6741119182
- https://tilavon.com/guides/manage-salon-employees
- https://gitnux.org/nail-salon-industry-statistics/
- https://wifitalents.com/nail-salon-industry-statistics/
