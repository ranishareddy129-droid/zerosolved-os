# Zerosolved OS

The brand, content and video workspace for [Zerosolved](https://zerosolved.com), a research library of 971 real, unsolved problems. Each problem is written up as a graded, sourced case file.

## What's here
| Path | What it is |
|---|---|
| `CLAUDE.md` | Working instructions for Claude Code in this folder |
| `brand/brand-context.md` | Brand guide: business, audience, voice, colors, fonts, video style, channel specs |
| `reel-memory.md` | Lasting feedback that applies to every future reel |
| `.claude/agents/reel-maker.md` | **Reel Maker agent**: turns a Zerosolved case or page into a ~35s 1080×1920 MP4 promo |
| `.claude/skills/reel-playbook/` | Reel rules: scene order, timing, motion, brand checklist, export settings |
| `reel-maker/` | The renderer (JSON spec → HTML scenes → headless Edge/Chrome → ffmpeg) |
| `output/video/` | Finished reels |
| `ZeroSolved-Promo-40s-1080x1920-v3.mp4` | Reference promo video |

## Render a reel
Requires Node 18+, ffmpeg on PATH, and Microsoft Edge or Google Chrome.
```bash
cd reel-maker
npm install
node render.mjs specs/zs-0971-today.json --preview   # layout + numbers check, stills
node render.mjs specs/zs-0971-today.json             # → ../output/video/zs-0971-today.mp4
```
Every number on screen must come from the saved case file in `reel-maker/sources/`. The renderer refuses to render a spec with an unsourced number.
