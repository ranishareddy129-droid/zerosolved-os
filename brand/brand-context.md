# Zerosolved — Brand Context

_Sources: zerosolved.com (homepage HTML + production CSS, read 2026-11-09), `logo.pdf`, `Library.docx`, three site screenshots, and `ZeroSolved-Promo-40s-1080x1920-v3.mp4` (sampled at 1 fps plus pixel color checks). Owner answers added 2026-11-09. Anything marked **[inferred]** is my reading, not something the brand has stated._

---

## 1. The business

**What it is:** Zerosolved is a research library of real, unsolved problems that people can build products, projects or companies around. Each problem is written up as a **case file**: graded sources, market size, competitors, timing, and the case *against* the problem.

**Company:** Scratch Point AI Private Limited, India. Named co-founder: **Dinesh Reddy**.
**Contact:** business@zerosolved.com (the site promises a human reply within 24 hours).

**Positioning line (site H1):** "Stop guessing what to build."
**Promo end line:** "Stop guessing. Start solving." / "Real Problems. Research-Backed Opportunities."

### The product
- **Library:** **971** case files across **18 categories**. Use 971 in all content (confirmed by owner). Examples: Construction & Trades, Family/Pets/Senior Care, Retail & E-commerce, Services & Agencies, Healthcare & Wellness, Finance & Insurance, Real Estate, Education, Food & Hospitality, Logistics, Manufacturing, Software & Dev Tools, Marketing & Sales, HR & Workplace, Legal & Compliance, Agriculture & Environment, Creative & Media, Community & Public Sector.
- **Case file IDs:** `ZS-0971` format.
- **Nine modules, always in this order:** 01 Overview · 02 Problem Strength · 03 Evidence · 04 Market · 05 Timing · 06 Customers · 07 Money & Moat · 08 Playbook · 09 Live Tracking.
- **Zero Score:** a 0–100 score per problem, shown as a ring (e.g. 67, "lower half of HR & workplace").
- **Source grading:** sources graded A / B / C. A claim needs two independent source classes. Estimates are tagged `[modeled]`. Counter-evidence stays visible.
- **Freshness metadata:** "verified 2026-10-14 · next check 2027-05-31", "7 of 7 sources checked and graded".
- **"The case in 30 seconds"** rows: *who bleeds · the bleed · the gap · the wedge · the endgame · the window*.
- **Live tracking:** competitor radar, complaint velocity, tripwires, same-day alerts.
- **Integrations:** MCP tools for Claude, ChatGPT custom GPT actions, Cursor and Perplexity.
- **Named research sources:** SEC EDGAR, Google Scholar, PubMed, Statista, World Bank, USPTO, Google Patents, Hacker News, GitHub, plus Deloitte, Gallup and WHO.

### Pricing (USD)
| Plan | Price | What you get |
|---|---|---|
| Free | $0, with email signup | One full case per day (`/today`) plus the full problem index. 8 of 9 modules are locked on other cases. |
| Year Pass | $69 one-time (~$5.75/mo) | All modules, watches and early access. **Never auto-renews.** |
| Founding Lifetime | $499 one-time | First 100 seats only. All current and future cases. |

Refunds: 14 days on both paid passes. Payments: Razorpay, Visa, Mastercard.
Site pricing headline: "Cheaper than one week of guessing."

---

## 2. Audience

The site says it is "Built for three kinds of people":

1. **First-time founders.** They want to "pick a problem people will actually pay to fix." Their main fear is building the wrong thing. The site's line: "A year of building the wrong thing is the most expensive thing you'll ever buy."
2. **Students / Gen Z.** Final-year projects, hackathons, interviews and portfolios. Video promise: "Turn real problems into career projects… Proof of your skills, not another clone."
3. **Side-builders with full-time jobs.** They have little time and need a vetted starting point.

Secondary groups: people the testimonials call "campus labs and venture desks" (universities, investors), and businesses. The video tags a section "for founders · businesses".

Geography: the company is India-based and prices in USD. The content is global (Deloitte 44-country data, etc.).

---

## 3. Voice and tone

**In short:** a sharp research analyst who refuses to bluff. Direct, evidence-first, a little wry, never hype.

**Traits**
- **Honest to the point of self-critique.** Every case includes the case *against* it. There's a section called "Why some of our dials are amber." Verdicts name the catch: "The catch: the person who burns out won't pay."
- **Specific and numeric.** "71% needed time off for stress, 41% took it (Gen Z, Deloitte 2026)." Name the source, the year and the sample size. Never write "studies show".
- **Short declarative lines.** "Stop guessing what to build." "One verdict left." "The whole case on one page."
- **Plain English.** It explains with a worked example ("A simple example: A 24-year-old analyst feels exhausted by Thursday…").
- **Confident about AI, not against it.** "A model can imitate our format. It cannot produce a single number in our case files." It sets a "chat answer" side by side with "this case file".
- **Reassuring on money.** It repeats "One payment. Never auto-renews."

**Mechanics**
- Headlines use sentence case and end with a period: "Explore the Library." "Today's Problem."
- **Section labels are lowercase mono "kickers"** with a `·` separator: `section 12 · the decision`, `module 01 of 09 · overview`, `the library · 18 categories`, `/today · free to read`.
- **Name casing (confirmed):** write **Zerosolved** in all running text, captions and CTAs (e.g. "Explore Zerosolved.com →"). Never "ZeroSolved" or "Zero Solved". The logo wordmark alone stays lowercase **zerosolved**. The v3 promo's "ZeroSolved.com" CTA is outdated and should not be copied.
- Use the em dash (—) for asides, the middle dot (·) as a metadata separator, and ✓ for verified claims.
- Recurring vocabulary: case file, bleed / who bleeds, wedge, endgame, window, seal, verdict, tripwire, graded, modeled, zero score, watch.

**Avoid:** hype words (revolutionary, game-changing, unlock), exclamation marks, vague claims without a source, fake urgency, and emoji in body copy.

---

## 4. Logo

- **Wordmark:** "zerosolved" in lowercase, set in a geometric sans (Sora-like, semibold), dark ink. A **glowing lime-green dot** sits to its left. On dark backgrounds the wordmark turns white and the dot keeps its glow.
- No vector logo exists. `logo.pdf` is only a raster screenshot of the site nav pill. **Rebuild the logo live** whenever it's needed: "zerosolved" set in Sora SemiBold (tight tracking), with a lime circle about 0.3× the cap height to its left. The circle has a soft outer glow in the same lime. Use ink `#111A2C` text on light backgrounds and white on dark. Never place the low-res crop from `logo.pdf` in finished work.

---

## 5. Colors

### Website (light UI). These are the exact CSS tokens from production.
| Token | OKLCH | ≈ Hex | Use |
|---|---|---|---|
| `--ink` | 21.9% .038 264.2 | `#111A2C` | Headlines, primary button, body text |
| `--slate` | 44.6% .03 256.8 | `#4A5565` | Secondary text |
| `--muted-ink` | 55.4% .034 257.4 | `#667487` | Mono labels, metadata |
| `--deep` (brand green) | 50.5% .135 130.6 | `#497305` | Links, active states, "verified" chips, focus ring |
| `--deep-soft` | — | `#4C750B` @ 18% | Green chip backgrounds |
| `--amber` | 64.6% .163 61.1 | `#D27100` | Warning / "amber dial" states |
| `--amber-deep` | 55.2% .147 60.2 | `#AE5800` | Amber text |
| `--background` | 96.6% .006 258.3 | `#F1F4F8` | Page background |
| `--border` | 90.6% .012 258 | `#DBE0E8` | Card borders |
| `--hairline` | — | `#0F172A` @ 7% | Row dividers |
| `--accent` / glass | — | `#FFFFFF` @ 75% | Frosted glass cards |

The page background is a soft gradient wash: pale blue at the top-left, lavender/pink at the bottom-right. Glassmorphism cards sit on it.

### Video (dark UI). Sampled from the promo.
| Role | ≈ Hex | Notes |
|---|---|---|
| Background | `#000000` → `#0F1207` | Near-black with a faint green/orange radial glow behind the content |
| Lime accent | `#88AE1B` | Highlighted headline words, logo dot, progress bars, CTA outline glow |
| Orange accent | `#C94A05` (pill highlight ~`#FF9357`) | "Problem" / risk / "why it matters" signals, orange category cards, orange card glow |
| Navy card | `#0D1426` | Dark case-file card surface |
| White / off-white | `#FFFFFF`, ~`#E6EAF0` | Headlines; light glass cards |
| Muted mono gray | ~`#8A93A0` | Kickers, "971 case files" header |

**Color logic:** lime = verified / positive / opportunity. Orange or amber = risk / pain / the bleed. Navy and white = neutral surfaces. The video's lime (`#88AE1B`) is brighter than the site's `--deep` (`#497305`) so it reads on black.

**One theme, two modes (owner direction: use the Zerosolved theme and colors in all video).** Both tables above are the official Zerosolved palette. There is no separately named palette.
- **Dark mode** (default for Reels/video and most social posts): black background, lime highlights, orange for risk, navy cards.
- **Light mode** (site screenshots, LinkedIn data posts, carousels where readability matters): `--background` wash, glass cards, ink text, `--deep` green and `--amber` accents.
- Never introduce colors outside these tables. Keep it to one accent per idea: lime for the good news, orange for the pain.

---

## 6. Typography

All three fonts come from the site CSS:
| Role | Font | Where |
|---|---|---|
| Display / headlines | **Sora** (semibold–bold, tight tracking) | H1/H2, card titles, wordmark-like text |
| Body / UI | **Inter** (400/500/600) | Paragraphs, buttons, table text |
| Labels / data | **JetBrains Mono** (lowercase, wide tracking ~0.12em, small) | Kickers, IDs, metadata, nav in case files, stats footers |

The video uses the same three fonts **[inferred from frames]**.

---

## 7. Video style (reference: `ZeroSolved-Promo-40s-1080x1920-v3.mp4`)

**Specs:** 1080×1920 (9:16 vertical), 30 fps, H.264 + AAC, 40.0 s. Audio is loud and mastered (mean −11.4 dB, peak −0.4 dB).

**Audio: music only, no voiceover (confirmed).** Every message has to land through on-screen text, so the text must stay readable with the sound off. Cut scene changes on the beat. Use modern, driving electronic or minimal tech music, and only royalty-free or licensed tracks.

### Structure (beat by beat)
| Time | Beat | On-screen |
|---|---|---|
| 0–3s | **Logo reveal** | A glowing lime dot on black. "zerosolved" types on letter by letter. Subline: "a library of 966 real, unsolved problems · each researched like a case file" (mono, with the number in lime). *(Use 971 in new work.)* |
| 3–6s | **Product in context** | A laptop with the homepage ("Stop guessing **what to build.**") pushes in. The keyboard has lime-lit keys. |
| 6–11s | **Explore the Library.** | Kicker `the library · 18 categories`. A 3×6 grid of category tiles in navy, white, lime and orange, each with an icon and a problem count. Footer: "971 case files · every one graded, sourced and continuously updated." |
| 11–16s | **Problems from every corner of the economy.** | Kicker `inside every category`. One large tilted 3D card per category (Healthcare, Education, Finance, Dev Tools, Logistics, Manufacturing, Agriculture, Retail). Each shows a numbered problem list with `ZS-` IDs and a pagination dot strip. Cards alternate light and dark. |
| 16–22s | **Today's Problem.** | Kicker `/today · free to read`. A navy case-file card with an orange glow: title, Zero Score ring (67), and **animated stat bars** (lime 71% vs orange 41%). Rows build in: "what the problem is · who bleeds", "why it matters · the bleed", "the opportunity · the wedge". |
| 22–29s | **Turn real problems into career projects.** | Kicker `for students · gen z`. List rows slide in one at a time (final-year, hackathon, AI, cybersecurity, research, portfolio project). Then pill buttons: Build real-world projects / Develop practical skills / Strengthen your portfolio / Improve career opportunities. Line: "you walk away with → Proof of your skills, not another clone." |
| 29–34s | **Pick a problem people will actually pay to fix.** | Kicker `for founders · businesses`. A 2×3 grid of tagged problem cards (unsolved business problem, market gap, customer pain point, startup opportunity, product idea, industry challenge). Then a 9-module grid where each module highlights in lime in turn. Footer: "every source graded a–c · counter-evidence kept visible." |
| 34–40s | **End card** | Logo, then "Stop guessing. **Start solving.**" Then "Real Problems. **Research-Backed** Opportunities." Then a white pill CTA with a lime glow: "• Explore ZeroSolved.com →" *(new work: "Explore Zerosolved.com →")*. Mono stats line: "971 case files · 18 categories · 9 modules · sources graded a–c". |

### Style rules to reuse
- **Persistent frame chrome:** small wordmark at top-left, `971 case files` in mono at top-right, and a lime vertical bar plus mono kicker above each headline.
- **Headline pattern:** a white Sora headline with **1–3 key words in lime**, ending with a period. Left-aligned in content scenes, centered on the end card.
- **Motion:** typewriter/glitch type-ons for kickers and headlines. Staggered slide-up reveals for list rows and tiles. Slow 3D tilt and push-in on cards. Soft focus pulls. One idea per scene, about 5 s each.
- **Lighting:** black background with soft radial glows (lime or orange) behind the hero element. Cards carry a subtle outer glow in the accent color of the scene's mood.
- **Product truth:** every screen uses real UI and real data (real case IDs, real stats with sources). No stock footage, no people, no mockup lorem ipsum.
- **Density:** mobile-legible. Big headline at the top third, content card in the middle, mono footer line at the bottom.
- **Format:** vertical 9:16 for Instagram Reels (and LinkedIn vertical video). See section 8.

---

## 8. Channels and formats

Zerosolved content goes out as **Instagram posts, LinkedIn posts, and Reels/video**. All of it uses the same theme, fonts and voice.

| Deliverable | Size | Notes |
|---|---|---|
| Reel / vertical video | 1080×1920 (9:16), 30 fps, MP4 H.264 + AAC | 15–45 s. Music only. Keep text out of the top ~250px and bottom ~350px, where the Instagram UI sits. |
| Instagram feed post | 1080×1350 (4:5) | The default single image. |
| Instagram carousel | 1080×1350 per slide, 5–10 slides | Slide 1 is the hook headline. The last slide is a CTA ("Read today's case free → Zerosolved.com/today"). |
| LinkedIn image post | 1080×1350 (4:5) or 1200×1200 | More data-led. Light mode works well here. |
| LinkedIn document carousel | 1080×1350 pages exported as PDF | Best fit for "case in 30 seconds" breakdowns. |
| LinkedIn video | 1080×1920 or 1080×1350 | The Reel can be reused, but give it a 4:5 crop when needed. |

**Shared layout for static posts** (taken from the video chrome): small wordmark at top-left, mono stat at top-right ("971 case files"), lime bar plus lowercase mono kicker, a Sora headline with 1–3 lime words ending in a period, a real UI card or data block in the middle, and a mono source/footer line at the bottom.

**Channel voice**
- **Instagram:** short and punchy, aimed at students and young founders. Lead with the problem ("Gen Z needs a break from work. Most don't take one."). Keep the caption to 1–3 short lines, a CTA, and 3–5 relevant hashtags.
- **LinkedIn:** analyst tone for founders, operators and investors. Open with a specific stat and its source, give the gap and the wedge, end with the catch (the honest counter-case), then the link. Keep paragraphs short and avoid hashtag stuffing (0–3).
- **Both:** every number cites its source and year. Content series that fit the product: *Today's Problem* (daily free case), *Case in 30 seconds*, *Chat answer vs case file*, *Category spotlight*, *Student project ideas*, *Problems people will actually pay to fix*.

---

## 9. Quick-reference facts
- Case count: **971** (confirmed). Categories: 18. Modules: 9.
- Free daily case lives at `/today`. The library is at `/library` and the index at `/problems`.
- `Library.docx` contains the Library category list (owner note: "all are modules"). On the site, the 18 items are *categories* and the 9 case-file sections are *modules*. Keep those two terms separate in copy.
