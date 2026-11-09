# Zerosolved OS

This is the working folder for **Zerosolved** (zerosolved.com) content: Instagram posts, LinkedIn posts, and Reels/video. It is not a code repository.

**Read `brand/brand-context.md` before producing any copy, design or video.** It is the source of truth for the business, audience, voice, colors, fonts, video style and channel formats.

## Folder map
| Path | What it is |
|---|---|
| `brand/brand-context.md` | Full brand guide (business, audience, voice, palette, type, video beat sheet, channel specs) |
| `.claude/agents/reel-maker.md` | **Reel Maker agent**: turns a Zerosolved problem or page into a ~35s 1080×1920 MP4 promo, following the reel-playbook skill. Use it for any reel or video request. |
| `reel-memory.md` | Lasting feedback for future reels. The Reel Maker agent reads it before every job and saves only rules that apply to future reels, never one-off fixes. |
| `.claude/skills/reel-playbook/` | **reel-playbook skill**: scene order, timing, animation rules, brand checklist and export settings for every reel |
| `reel-maker/` | The renderer behind it (JSON spec → HTML scenes → headless Edge → ffmpeg). See `reel-maker/README.md`. |
| `output/video/` | Finished reels |
| `ZeroSolved-Promo-40s-1080x1920-v3.mp4` | **Reference promo video**: 40s, 9:16, 1080×1920, 30fps, music only. Match its style, but not its "966" count or its "ZeroSolved" casing. |
| `logo.pdf` | Low-res raster crop of the wordmark. Reference only; rebuild the logo in finished work (see below). |
| `Library.docx` | Screenshot of the Library's 18 categories (971 problems) |
| `Screenshot 2026-11-09 *.png` | Case-file UI: overview header, "case in 30 seconds", "what a chatbot can't tell you" table |

## Brand in 10 lines
1. Zerosolved is a library of **971** researched, unsolved problems in 18 categories. Each one is a **case file** with 9 modules, A/B/C-graded sources and a Zero Score.
2. Audience: first-time founders, students/Gen Z (career projects), and side-builders.
3. Core promise: "Stop guessing what to build." Sign-off: "Stop guessing. Start solving."
4. Voice: a direct, evidence-first analyst. Use specific numbers with named sources, show the counter-case, no hype, no exclamation marks.
5. In text, write the name as **Zerosolved** (CTA: "Explore Zerosolved.com →"). Only the logo wordmark is lowercase "zerosolved".
6. Headlines use sentence case, end with a period, and put 1–3 key words in lime. Kickers are lowercase JetBrains Mono with `·` separators.
7. Fonts: **Sora** for display, **Inter** for body, **JetBrains Mono** for labels and data.
8. Zerosolved theme in dark mode (video and social default): black background, lime `#88AE1B`, orange `#C94A05`, navy cards `#0D1426`. Lime means opportunity; orange means pain or risk.
9. Zerosolved theme in light mode (site look, data-heavy LinkedIn): background `#F1F4F8`, ink `#111A2C`, green `#497305`, amber `#D27100`, frosted glass cards.
10. Logo: no vector file exists. Rebuild it as "zerosolved" in Sora SemiBold with a glowing lime dot on the left. Use white text on dark, ink on light.

## Deliverable defaults
- **Reel/video:** follow the `reel-playbook` skill. 1080×1920, 30fps, ~35s, 6 scenes, CTA "Explore Zerosolved.com →", **music only** (royalty-free or licensed). All meaning goes in on-screen text, cut on the beat, ~5s per idea. Keep text out of the top 250px and bottom 350px.
- **Instagram post:** 1080×1350. Carousels run 5–10 slides; the first slide is a hook headline and the last is a CTA.
- **LinkedIn post:** 1080×1350 or 1200×1200 image, or a PDF document carousel. Analyst tone, stat-led.
- Every piece keeps the video chrome: small wordmark at top-left, a mono stat ("971 case files") at top-right, and a lime bar plus kicker above the headline.

## Working rules
- **Every number must come from the case file, never invented.** This is the "no unverified numbers" voice. Use real product UI and real data: actual case IDs (`ZS-0971`) and stats copied exactly as the source prints them, with source and year. No estimates, rounding or combined figures. If a number is needed and isn't in the source, leave it out or ask.
- Pricing: Free (1 case/day), Year Pass $69 one-time, Founding Lifetime $499 (first 100 seats). Always state "never auto-renews" when pricing appears.
- "Categories" (the 18 sectors) and "modules" (the 9 case-file sections) are different things. Keep them separate in copy.
- Tools available locally: ffmpeg/ffprobe (WinGet install) and Python 3.12. No python-docx or PDF libraries are installed.
- Put scratch output outside this folder. Final deliverables go in `output/instagram/`, `output/linkedin/` and `output/video/`.
