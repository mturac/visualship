---
name: visualship
description: Use before shipping, publishing, or open-sourcing a repo (making it public, tagging a release, posting it). Runs the visualship README hero gate.
---

# visualship — no hero, no ship

1. Before making a repo public / releasing / announcing it, run:
   `node <visualship>/bin/visualship.js check <repo-path>` (or `npx github:mturac/visualship check .`).
2. Read the last line `VERDICT<TAB>PASS|WARN|FAIL`.
3. **FAIL** → do not publish. Fix first:
   - no hero / only badges → capture a real screenshot or GIF of the tool working (terminal output, UI), save to `docs/hero.png`, embed it in the first 40 lines: `![name](docs/hero.png)`. If you can't capture, generate a clean product image or ask the user for one.
   - broken path → fix the path or commit the file.
4. **WARN** → fix if cheap: add a fenced install one-liner; delete or source (link on same line) any "used by 10k+" / "#1 on Product Hunt" claim. Never invent metrics.
5. Re-run until PASS or WARN, then publish. Report the verdict line as evidence.
