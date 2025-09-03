# Cursor Workspace Rules — form-scanner

## Project Context
- **Goal**: Detect presence of Google Forms and HubSpot forms on a list of URLs and output a CSV/JSON report.
- **CLI Contract**: Do not break existing flags or outputs without creating a new flag and updating README:
  - `--input`, `--out`, `--concurrency`, `--timeout`, `--dynamic`, `--wait`.

## Coding Standards
- **Node**: >= 18, ESM modules.
- **Style**: Keep single-file CLI (`scanner.mjs`) simple. Prefer small pure helpers over classes.
- **Error handling**: Never throw on a single URL failure. Record errors into `note` and continue.
- **Output**: Keep columns stable: `url, method, status, is_google_form, is_hubspot_form, detected_types, evidence, note`.
- **Performance**: Default `--concurrency 8`, `--timeout 15000`. Allow tuning via flags.

## Detection Rules (must remain intact unless adding test cases)
### Google Forms
- Matches when any of these is present:
  - `<iframe src="https://docs.google.com/forms/...">`
  - Links/actions including `https://docs.google.com/forms/d/e/{id}/viewform` or `/formResponse`
### HubSpot
- Matches when any of these is present:
  - Script `https://js.hsforms.net/forms/v2.js` (or `/embed/v2.js`)
  - Inline `hbspt.forms.create(...)`
  - Submit endpoints `https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formId}`
  - Known containers like `<div id="hubspotForm">`

> Hint: Pages behind a consent tool (e.g., Efilli) may require `--dynamic` to detect injected forms. Consider adding a targeted clicker in dynamic mode (see Tasks).

## Safe Refactor Checklist (before/after)
- [ ] Unit run on a sample set: at least 10 URLs (with/without forms).
- [ ] No change to CSV header order.
- [ ] Evidence string present when a type is detected.
- [ ] Error text recorded in `note`, not thrown.
- [ ] Concurrency respected; slow domains do not block entire run.

## Tasks the AI Can Do
1. **Consent clicker (optional dynamic enhancement)**
   - Add a `--consent-selectors` flag (CSV of selectors). When provided, in Playwright mode:
     - Wait for each selector up to 3s and click if visible (`try/catch`, no hard fail).
2. **Custom patterns**
   - Add `--pattern-file pattern.json` allowing users to inject additional regex strings for detection.
3. **Rate limiting / politeness**
   - Introduce `--delay 200` (ms) between launches of new page tasks inside the concurrency gate.
4. **JUnit-like summary**
   - After run, print a short summary: counts per detected type, failures, total time.
5. **Export NDJSON**
   - `--out-ndjson results.ndjson` writing one JSON per line.

## Guardrails
- Do not auto-crawl beyond the provided URLs.
- Do not execute arbitrary page scripts; only wait/click consent in dynamic mode if explicitly requested.
- Avoid storing full HTML to disk by default; evidence must be short and truncated.
- Respect robots.txt for bulk scans if adding recursive features (not in scope by default).

## Commit Style
- Conventional commits (e.g., `feat: add consent clicker`, `fix: robust hubspot regex`).
- PR description must note any changes to detection patterns or CLI flags.

## Testing Notes
- Add minimal fixtures (an HTML with an iframe Google Form, and an HTML with `hbspt.forms.create`). Validate `detect()` matches both.
- In dynamic mode, test that a delayed script insertion is detected after `--wait`.
