---
name: reel-playbook
description: The Zerosolved house rules for vertical promo reels — scene order, timing per scene, animation rules, brand checklist and export settings (1080×1920, 30fps, MP4). Load before scripting, reviewing or rendering any Zerosolved reel or short video; the Reel Maker agent follows it on every run.
---

# Zerosolved Reel Playbook

These rules come from an owner review of the first reel (ZS-0971, 2026-11-09). The approved example is `reel-maker/specs/zs-0971-today.json`.

`reel-maker/render.mjs` enforces the **hard rules** (it stops with an error) and flags **targets** (it prints a warning). A warning still has to be fixed or explained in your report.

---

## 1. Scene order (the default arc)

Every reel has **6 scenes and runs about 35 s**:

| # | Scene (template type) | Duration | Job |
|---|---|---|---|
| 1 | **Logo sting** (`intro`) | **1.5 s** (max 2) | The lime dot appears and "zerosolved" types on. No text lines. The hook must land right after. |
| 2 | **The hook** (`today`) | **6 s** | Kicker + "Today's [Problem.]"-style headline, a case card with the title, the Zero Score ring, and 1–2 counting stat bars with their source. |
| 3 | **Case in 30 seconds** (`rows`) | **6.5 s** | Up to 4 rows: who bleeds · the bleed · the gap · the wedge (optionally the window). |
| 4 | **Audience A** (`cards` or `list`) | **7 s** | Whichever audience this case fits best (see the rule below). |
| 5 | **Audience B** (`list` or `cards`) | **7 s** | The other audience. |
| 6 | **End card** (`end`) | **6 s** | "Stop guessing. [Start solving.]", a sub line, the CTA, and the stats line. |

**Total: 34 s.** The allowed window is 32–37 s; the hard limit is 30–45 s.

**Audience order is picked per case:**
- **Founders first** (`cards`: wedge · catch · cost · window, footer = playbook test) when the case names a paying buyer *and* a cost or market figure.
- **Students first** (`list`: final-year / hackathon / research / portfolio ideas + 4 benefits + "proof, not another clone.") when the case is about skills, education or tech, or the buyer is unclear.
- Record the choice and the reason in the spec as `"audienceOrder"`.

**Not in the default arc:** the `compare` scene (chatbot vs case file + 9-module sweep). Use it only if the owner asks for it, and drop a scene to keep the length.

**Other sources:**
- A **library or category page** replaces scene 2 with a `cards`/`list` scene of real problems from that page (real `ZS-` IDs).
- **Non-case topics** (pricing, features) still follow intro → hook → proof → two audiences → end.

## 2. Timing rules
- Durations are **multiples of 0.5 s**: the music runs at 120 bpm, so cuts land on the beat.
- The hook headline must be readable by about **2.5 s** into the reel.
- Each scene's content should finish building in **≤ 3.5 s**, leaving at least 2.5 s of still reading time before the exit.
- Readability approved by the owner: about 6–7 s holds with the current text density. **Don't add more text per scene.** If a scene needs more, split the idea rather than speeding it up.
- Stagger rhythm: list rows 0.3 s apart, case rows 0.5 s, cards 0.28 s, headline words 0.055 s.

## 3. Animation rules: **calm, not flashy** (owner direction)
- **Headlines:** words rise out of a mask one by one (0.65 s each, ease-out). No bounce.
- **Kickers:** a lime bar grows, then a typewriter with a block cursor that blinks briefly and disappears.
- **Cards:** soft 3D entrance (≤ 8° tilt, ≤ 90 px travel, 0.9 s), then a barely visible drift (≤ 1.2°, 6 px) for the rest of the scene.
- **Rows and items:** fade in plus a 32 px slide. **Tiles and pills:** fade in plus a 3% scale. **No overshoot or spring easing.**
- **Stats:** bars fill and numbers count up together over 1.1 s. The Zero Score ring fills over 1.2 s.
- **Transitions:** the outgoing scene fades out with a 6 px blur and 24 px lift (0.4 s); the incoming scene fades in over 0.3 s. No zooms, whip-pans, flashes or glitch effects.
- **Glows:** one soft radial glow per scene (lime, or lime + orange when pain is on screen) with slow drift. Card glow is orange for problem cards and lime for opportunity.
- **Header:** the wordmark (top-left) and "971 case files" (top-right) stay on screen for every scene except the intro and end card.
- **One idea per scene.** Never two cards fighting for attention.
- **Music:** only the generated track (`lib/music.mjs`), with a whoosh into each cut and an impact on it. No voiceover and no third-party audio, so every meaning must work on screen with the sound off.

## 4. Brand checklist (tick every box before rendering)
**Facts: the numbers rule (non-negotiable)**
> **Every number must come from the case file, never invented.** This is what keeps Zerosolved's "no unverified numbers" voice.
- Never estimate, round, convert, add up or "approximately" a figure. Copy it as the case file prints it ("22,500+", "about 9% of GDP").
- If a scene needs a number the case file doesn't have, cut the number, not the rule.
- `render.mjs` checks every number in the spec against `reel-maker/sources/<id>.txt` and **refuses to render** if one is missing. The only numbers allowed without a source are the brand constants: 971 case files, 18 categories, 9 modules, and the "30" in "case in 30 seconds".

- [ ] Every number on screen is in the saved source (`reel-maker/sources/<id>.txt`) and is shown with its source and year.
- [ ] Derived ideas (student projects, founder angles) add no new facts.
- [ ] The case ID, category and Zero Score match the page.

**Words**
- [ ] The name is written **Zerosolved** (never "ZeroSolved"). The logo stays lowercase "zerosolved".
- [ ] The library count is **971 case files**; 18 categories, 9 modules.
- [ ] Headlines are sentence case, end with a period, and have 1–3 `[lime]` words. No exclamation marks or hype words (revolutionary, game-changing, unlock).
- [ ] Kickers are lowercase mono with ` · ` separators (`for founders · businesses`).
- [ ] The honest catch or counter-case appears somewhere (usually the orange "the catch" card).
- [ ] The **CTA is exactly "Explore Zerosolved.com →"** on every reel (owner decision). The end-card sub line can carry the page-specific nudge ("Today's case is [free to read.]").

**Look**
- [ ] Dark-mode Zerosolved theme only: black background, lime `#88AE1B` (opportunity/proof), orange `#C94A05` (pain/risk/catch), navy cards `#0D1426`, white and light-glass cards.
- [ ] Fonts are Sora (display), Inter (body) and JetBrains Mono (labels), loaded locally.
- [ ] The logo is rebuilt from type by the template. Never use `logo.pdf`.
- [ ] `--preview` reports **no layout warnings**: nothing below y = 1570, off the sides or clipped, and no under-filled scenes. Fix by cutting words, never by shrinking type.
- [ ] You have looked at `previews/<id>/sheet.jpg`. If it reads like a slideshow of text walls, cut words.

## 5. Export settings (fixed; `render.mjs` produces exactly this)
| Setting | Value |
|---|---|
| Resolution | **1080×1920** (9:16), square pixels |
| Frame rate | **30 fps** constant |
| Container | **MP4**, `+faststart` |
| Video | H.264 High profile, yuv420p, CRF 16, preset medium |
| Audio | AAC-LC 192 kbps, 44.1 kHz stereo, loudness **−14 LUFS** integrated, true peak −1.5 dBTP |
| Length | 32–37 s target (30–45 s hard limit) |
| Safe area | Content at y 250–1570 and x 48–1032. The header sits at y ≈ 150. |
| Output | `output/video/<id>.mp4` (about 12–17 MB) |

**Verify after rendering:**
```bash
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact output/video/<id>.mp4
```
The expected output is `h264 1080x1920 30/1`, `aac`, and a duration of 32–37 s. Then pull 3 frames (hook ≈ 4 s, a mid scene, end ≈ last − 1 s) and look at them.

## 6. Report back with
- The MP4 path, duration, and the scene list with timings.
- The audience order and why.
- Every on-screen stat with its source.
- Any checklist item you couldn't satisfy.
- One caption per channel: Instagram (1–3 short lines + CTA + 3–5 hashtags) and LinkedIn (stat-led, the catch, the link, 0–3 hashtags).
