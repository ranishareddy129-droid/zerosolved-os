# Reel scoring rubric

Every reel is scored after a verified render. Some runs re-make previews to test a change; those are scored the same way. **Judge only from the preview stills (`previews/<id>/sheet.jpg` and the `still_*.png` files) and the spec (`specs/<id>.json`).** Don't score from memory, the caption or how you expect the reel to look. Score what is on screen.

Use whole numbers 1–5 for each criterion. The total is out of 35. If you can't see the stills, don't score. Record "stills missing" as a failure instead.

| key | criterion | 5 = | 3 = | 1 = |
|---|---|---|---|---|
| `hook` | **Hook readable by ~2 s.** At the first still after the logo (about 2 s), can a viewer say what the problem is? | The problem is stated in ≤ 8 large words and readable at a glance | Readable, but needs a second look (long title, small type, competing elements) | No problem on screen by 2 s, or it's buried in a card |
| `one_idea` | **One idea per scene.** Each scene makes a single point that its headline names. | Every scene has one clear point | One scene mixes two points | Several scenes are lists of unrelated points |
| `density` | **Text density.** About 6–7 s holds with no more text than the approved ZS-0971 reel (`specs/zs-0971-today.json`). | Every line can be read in its hold time; no tiny type | One scene is crowded | Walls of text, or type too small to read on a phone |
| `lime` | **Lime-word use.** Each headline has 1–3 `[lime]` words on the key idea (opportunity or proof), never decoration. | Every headline: 1–3 lime words on the right idea | Some headlines missing lime, or > 3 lime words | Lime is missing or random |
| `catch` | **Honest catch shown.** The counter-case, risk or "the catch" from the case file is visible on screen. | A clear catch card or line that a viewer will notice | A catch is present but easy to miss | No catch or counter-evidence anywhere |
| `sources` | **Sources shown.** Every stat on screen has a named source and year next to it, and the case ID is visible. | Every stat sourced with year; case ID shown | Some stats lack a source or year | Stats shown with no sources |
| `variety` | **Visual variety.** Scenes use different layouts (card, rows, cards grid, list, end) and the stills don't look alike. | Every scene looks different from the one before | Two consecutive scenes look alike | Most scenes share one layout |

## Failures and warnings
These are recorded separately from the scores, and a reel can't hide them with high scores:
- **Failures:** any render error, the numbers check, CTA check or layout overflow failing, an ffprobe check that is off spec (not 1080×1920, 30 fps, 32–37 s), or a push that failed.
- **Preview warnings:** every `PLAYBOOK WARNINGS`, `LAYOUT WARNINGS` or `WARNING:` line from `node render.mjs <spec> --preview`. Save the preview output to `previews/<id>.log`, next to the stills folder, because the preview run clears the folder itself. Pass it with `--log`.

## Ranking reels (best vs worst)
Real Instagram results outrank rubric scores.
- When a reel has Instagram metrics (read 3+ days after posting), rank it by **% watched**, then by **(shares + saves) ÷ views**.
- Reels with Instagram metrics always rank as better evidence than reels without them. Compare best and worst using Instagram-ranked reels when at least 6 have metrics. Otherwise use the rubric total.
- `node scoring/score.mjs rank` prints the ranking this way.

## Improvement tests
When a self-improvement run tests a change, it re-makes previews of 3 past cases with the change, scores them with this rubric and records them with `score.mjs trial`. The change is proposed only if the trial average is higher than the same 3 cases' existing scores and no render check failed. Trial scores are the agent grading its own work, so they are advice, not approval: the change is **kept only when the owner merges its PR** (`check-protected` blocks direct commits of `reel-memory.md`, `auto-*` skills and `improvements.md`).
