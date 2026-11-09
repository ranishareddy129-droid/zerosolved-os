# Zerosolved Reel Maker

This tool turns a Zerosolved problem or page into a **~35 s vertical promo reel** (6 scenes; 30–45 s hard limit) (1080×1920, 30 fps, H.264 MP4, music only). The look follows `../ZeroSolved-Promo-40s-1080x1920-v3.mp4` and `../brand/brand-context.md`.

The **Reel Maker agent** (`../.claude/agents/reel-maker.md`) drives it end to end, following the **`reel-playbook` skill** (`../.claude/skills/reel-playbook/SKILL.md`). The playbook is the rulebook for scene order, timing, motion, the brand checklist and export settings. You can also run the tool by hand.

## How it works
```
page / problem text ──► specs/<id>.json ──► template/ (HTML + CSS + JS scenes)
                                            │  headless Edge/Chrome seeks frame by frame
                                            ▼
                         lib/music.mjs ──► ffmpeg ──► ../output/video/<id>.mp4
```
- Every motion is a paused Web Animation or a function of time, so each frame is deterministic.
- The music is generated procedurally for each reel. It's royalty-free, with a whoosh into every cut and an impact on it, and is loudness-normalised to −14 LUFS.
- Fonts (Sora, Inter, JetBrains Mono) and icons (Lucide) are installed locally, so rendering needs no network.

## Commands
```bash
npm install                                            # once
node fetch-page.mjs https://zerosolved.com/today > sources/today.txt
node render.mjs specs/<id>.json --preview              # layout check + stills → previews/<id>/sheet.jpg
node render.mjs specs/<id>.json                        # full MP4 → ../output/video/<id>.mp4 (~2–4 min)
```
Options: `--out file.mp4`, `--at 4.2,10` (extra preview stills), `--no-music`, `--fps 30`.

## Spec format (`specs/<id>.json`)
```jsonc
{
  "id": "zs-0971-today",                // output filename
  "title": "…", "source": "URL + date read",   // for traceability
  "headerStat": "971 case files",        // top-right chrome
  "music": { "bpm": 120, "seed": 971, "progression": ["Am","F","C","G"] },
  "scenes": [ { "type": "…", "duration": 6, "glow": "lime|orange|both|none", … } ]
}
```
The total duration must be 30–45 s. Keep scene durations in multiples of 0.5 s so cuts land on the beat at 120 bpm.

**Text markup** (any text field): `[lime words]` `{orange words}` `**bold**` `\n` for a line break. Headlines should end with a period and have 1–3 lime words.

| type | fields | use for |
|---|---|---|
| `intro` | (`line1`, `line2` optional, not used by the playbook) | 1.5 s logo sting. No chrome. |
| `today` | `kicker`, `headline`, `card{badge, meta, title, score, bars[{label,value,color,suffix}], source, glow}` | The problem hook: case card, Zero Score ring and counting stat bars |
| `rows` | `kicker`, `headline`, `rows[{icon,color,label,labelColor,text}]`, `cardGlow` | "Case in 30 seconds": who bleeds / bleed / gap / wedge / window (max 4 rows) |
| `list` | `kicker`, `headline`, `items[{icon,color,tag,tagColor,title,id}]`, `benefits[{icon,color,text}]`, `footer` | Student or project ideas (max 4 items + 4 benefits) |
| `cards` | `kicker`, `headline`, `cards[{variant: navy\|orange\|light\|lime, tag, title, sub, foot, icon}]`, `footer` | Founder / business angle (4 cards; 6 only with very short text) |
| `compare` | `kicker`, `headline`, `left`, `right`, `rows[{k,chat,file}]`, `modules: true`, `footer` | Chatbot answer vs case file + 9-module sweep (max 3 rows). **Not in the default arc.** Use only on request. |
| `end` | `headline`, `sub`, `cta`, `stats` | End card. The CTA must be exactly "Explore Zerosolved.com →" (enforced). No chrome. |

**Colors:** `lime`, `orange`, `white`, `navy`, `violet`, `sky`. Lime means opportunity or proof; orange means pain, risk or the catch.
**Icons:** any file name in `node_modules/lucide-static/icons` (without `.svg`), e.g. `users`, `trending-down`, `search`, `lightbulb`, `graduation-cap`, `trophy`, `flask-conical`, `folder-open`, `target`, `triangle-alert`, `calendar`, `rocket`, `briefcase`, `shield-check`.

## Numbers check
**Every number must come from the case file, never invented.** Before rendering, `render.mjs` pulls every number out of the spec's on-screen text, bar values and scores. Each one must appear in the saved source, `sources/<id>.txt` (or `"sourceFile"` in the spec). If any is missing, or the source file itself is missing, the render stops. Numbers can't be estimated or rounded. Brand constants are the only exception: 971, 18, 9, and the 30 in "case in 30 seconds".

## Layout check
`--preview` prints a warning when content leaves the safe area: below y=1570 (Instagram caption zone), off the sides, or clipped. It also warns when a scene is under-filled. Fix every warning before the full render.
