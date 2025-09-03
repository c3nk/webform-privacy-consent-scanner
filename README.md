# form-scanner (Cursor Workspace)

Scan a list of URLs (e.g., 300) and detect whether they include **Google Forms** or **HubSpot forms**.

- **Static HTML pass**: fast, uses Node's built-in `fetch` and pattern matching.
- **Optional dynamic pass** (`--dynamic`): uses Playwright to render pages and catch forms injected by JavaScript (e.g., HubSpot `hbspt.forms.create` after consent).

## Quickstart

```bash
# Requires Node.js >= 18
npm i

# Put each URL on a separate line in urls.txt
node scanner.mjs --input urls.txt --out results.csv

# If forms load after consent / JS:
npm i -D playwright && npx playwright install
npm run scan:dynamic
