# Reel self-improvement log

The weekly **Reel Self-Improve** routine writes here. Each run makes at most one change, either a `reel-memory.md` line or an `.claude/skills/auto-*` skill, and proposes it only if test previews of 3 past cases score higher with it. The change and its row here go to the owner as a PR; it is `kept` only once the owner merges it. The Reel Maker agent reads this file before every reel.

Rules: no protected file is ever edited (`.claude/protected-files.txt`), `reel-playbook` is never edited directly, and the numbers rule can never be weakened. `node reel-maker/scoring/score.mjs status` reads the table below.

`action` is one of: `kept` (change committed), `discarded` (tested, didn't help), `skipped` (fewer than 5 new scored reels, or no clear gap), `revert` (a kept change rolled back).

| date | action | change | evidence | before | after | commit |
|---|---|---|---|---|---|---|
