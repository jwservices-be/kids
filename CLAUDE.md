# CLAUDE.md

## Cache-busting

Run `git config core.hooksPath .githooks` once per clone (already done in this workspace). A pre-commit hook then auto-updates the `?v=...` query string on `style.css`/`script.js` in `index.html` based on a hash of their contents, so the version never has to be bumped by hand.

## Workflow reminder

After committing and pushing changes to this repo, and everything is in order on the website, say exactly: "Klaar om te testen"
