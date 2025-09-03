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

## Filter Results

After scanning, filter the `results.json` by any attribute-value pair and generate a text report:

```bash
# Filter by boolean values
node filter.mjs --attr is_hubspot_form --value true

# Filter by status codes
node filter.mjs --attr status --value 200

# Filter by detected types (case-insensitive)
node filter.mjs --attr detected_types --value hubspot_form --ci

# Filter URLs containing text (case-insensitive, contains)
node filter.mjs --attr url --value university.edu --contains --ci

# Custom input/output files
node filter.mjs --input my-results.json --attr method --value dynamic --out custom-report.txt
```

### Filter Options

- `--input`: Input JSON file (default: `results.json`)
- `--attr`: Attribute to filter by (supports dot notation, e.g., `foo.bar`)
- `--value`: Value to match (auto-converts to number/boolean)
- `--ci`: Case-insensitive string comparison
- `--contains`: String/array includes matching
- `--out`: Output text file (default: `results_fine_tuned.txt`)

### Output Format

The filter generates a human-readable text report with:
- Summary header (input file, filter criteria, counts)
- Numbered list of matching results
- Each line shows: URL, status, method, and detected types

Example output:
```
FILTER REPORT
=============

Input file: results.json
Filter: is_hubspot_form = true
Total results: 4664
Filtered results: 127

RESULTS:
--------
1. https://example.com/form | status=200 | method=static | types=hubspot_form
2. https://another.com/contact | status=200 | method=dynamic | types=hubspot_form, google_form
...
```
