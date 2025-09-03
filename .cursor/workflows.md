# Cursor Workflows — form-scanner

## “Add Consent Clicker”
1. Add a `--consent-selectors` flag (string, comma-separated).
2. In `fetchDynamic()`, after navigation and before `content()`, for each selector:
   - Wait up to 3000ms; if visible, click and wait 300–500ms.
3. Keep all clicks inside `try/catch`; never fail the run.

## “Pattern File Support”
1. Add `--pattern-file` flag pointing to a JSON file with keys `google` and `hubspot` containing arrays of regex strings.
2. On start, if provided, load and append to built-in patterns via `new RegExp(string, 'i')`.
3. Reject patterns that don’t compile; record in `note`.

## “Export NDJSON”
1. Add `--out-ndjson` optional flag.
2. In the loop, `fs.appendFile` each JSON line.
3. Ensure this does not impact CSV/JSON outputs.

## “Polite Delay”
1. Add `--delay` (ms) flag.
2. Between URL tasks (inside the p-limit block), `await new Promise(r => setTimeout(r, delayMs))` if provided.
