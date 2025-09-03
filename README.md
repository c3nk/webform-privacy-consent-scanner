# form-scanner (Cursor Workspace)

Scan a list of URLs (e.g., 300) and detect whether they include **Google Forms**, **HubSpot forms**, or **Microsoft Forms**.

- **Static HTML pass**: fast, uses Node's built-in `fetch` and pattern matching.
- **Optional dynamic pass** (`--dynamic`): uses Playwright to render pages and catch forms injected by JavaScript.
- **Optional CMP detection** (`--cmp`): detects Cookie Consent Management Platforms and can handle consent banners automatically.

## Quickstart

```bash
# Requires Node.js >= 18
npm i

# Put each URL on a separate line in urls.txt

# Basic scan (Google, HubSpot, Microsoft forms)
# Note: Automatic curl fallback for sites blocking Node.js fetch
node scanner.mjs --input urls.txt --out results.csv

# With CMP detection
node scanner.mjs --input urls.txt --out results.csv --cmp

# Full scan (dynamic + CMP)
npm i -D playwright && npx playwright install
npm run scan:full

# Available npm scripts:
npm run scan        # Basic static scan
npm run scan:cmp    # Static scan with CMP detection
npm run scan:full   # Dynamic scan with CMP handling

## CLI Options

- `--input <file>`: Input file with URLs (default: none, required)
- `--out <file>`: Output CSV file (default: `results_TIMESTAMP.csv` with timestamp)
- `--concurrency <n>`: Number of concurrent requests (default: `8`)
- `--timeout <ms>`: Request timeout in milliseconds (default: `15000`)
- `--dynamic`: Enable dynamic scanning with Playwright
- `--wait <ms>`: Wait time for dynamic content (default: `6000`)
- `--cmp`: Enable CMP detection and consent banner handling

## Supported Forms

The scanner can detect the following form types:

### Google Forms
- Direct URLs: `docs.google.com/forms/d/e/...`
- Embedded iframes
- Form action URLs

### HubSpot Forms
- Script: `js.hsforms.net/forms/v2.js`
- API endpoints: `api.hsforms.com/submissions/...`
- Inline JavaScript: `hbspt.forms.create()`
- Form containers: `hubspotForm` IDs

### Microsoft Forms
- Response pages: `forms.office.com/Pages/ResponsePage.aspx`
- Short URLs: `forms.office.com/r/...`
- Embedded iframes
- Office UI framework references

## Known Issues & Solutions

### Node.js Fetch Failures

**Problem**: Some websites block Node.js's built-in `fetch()` API, causing static mode to fail with "fetch failed" errors. This was observed on sites like `https://sea.ozyegin.edu.tr/` which uses HubSpot forms but couldn't be detected in static mode.

**Symptoms**:
```json
{
  "url": "https://example.com",
  "method": "static",
  "is_hubspot_form": false,
  "detected_types": [],
  "note": "static_error: fetch failed"
}
```

**Root Cause**:
- Node.js fetch API may be blocked by anti-bot protections
- SSL certificate chain issues in some Node.js versions
- System-level network configuration differences

**Solution**: The scanner includes an automatic **curl fallback** mechanism:

1. **Primary Method**: Tries Node.js `fetch()` with browser-like headers
2. **Fallback Method**: If fetch fails, automatically switches to system `curl`
3. **Result**: Successful detection even on problematic sites

**Example with curl fallback**:
```json
{
  "url": "https://sea.ozyegin.edu.tr/",
  "method": "static",
  "is_hubspot_form": true,
  "detected_types": ["hubspot"],
  "evidence": "hbspt.forms.create(",
  "status": 200
}
```

**Console output**:
```
STATIC_FETCH_ERROR for https://sea.ozyegin.edu.tr/: fetch failed, trying curl fallback...
CURL_FALLBACK_SUCCESS for https://sea.ozyegin.edu.tr/: 58200 bytes
[1/1] https://sea.ozyegin.edu.tr/ -> hubspot (static, 200)
```

**Technical Details**:
- Curl fallback uses the same browser-like User-Agent
- Maintains all security headers and timeout settings
- Only activates when Node.js fetch fails
- Requires `curl` to be available in system PATH (available on most Linux/macOS systems)

## CMP Detection Examples

### GTM-Loaded CMP Detection
When CMP scripts are loaded via Google Tag Manager:

```bash
# Detect CMP loaded through GTM
node scanner.mjs --input urls.txt --out results.csv --cmp

# Output shows:
# cmp_vendor: "Cookiebot" or "OneTrust" or "Efilli"
# cmp_evidence: Detection pattern match
```

### Efilli CMP Detection
Efilli is a popular Turkish CMP platform:

```bash
# Detect Efilli on Turkish websites
node scanner.mjs --input turkish-sites.txt --out results.csv --cmp

# Output shows:
# cmp_vendor: "Efilli"
# cmp_evidence: "efilli"
```

### Real-World Example
Testing on `https://www.ozyegin.edu.tr`:

```json
{
  "url": "https://www.ozyegin.edu.tr",
  "has_cmp": true,
  "cmp_vendor": "Efilli",
  "cmp_evidence": "efilli"
}
```

## CMP Detection

When `--cmp` flag is enabled, the scanner:

1. **Detects** Cookie Consent Management Platforms:
   - Cookiebot
   - OneTrust
   - Efilli
   - Google Tag Manager (GTM)
   - Generic GDPR/Cookie banners

2. **Handles** consent banners automatically:
   - Finds and clicks accept buttons
   - Waits for consent processing
   - **GTM Support**: Detects Google Tag Manager and waits for GTM-loaded CMP scripts
   - Continues with form detection

3. **Reports** CMP information in output:
   - `has_cmp`: Boolean indicating CMP presence
   - `cmp_vendor`: Detected CMP vendor name (including "Google Tag Manager")
   - `cmp_evidence`: Detection evidence

4. **GTM Integration**:
   - Detects GTM container IDs (GTM-XXXXXX)
   - Waits for GTM to initialize
   - Monitors for GTM-loaded CMP scripts
   - Handles consent banners loaded via GTM triggers

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
