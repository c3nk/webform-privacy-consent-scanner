#!/usr/bin/env node
/**
 * form-scanner: Detect Google Forms or HubSpot forms on a list of URLs.
 * Requires Node.js >= 18 (built-in fetch). Optional: playwright for --dynamic.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import pLimit from 'p-limit';

const argv = process.argv.slice(2);
const getArg = (name, def = undefined) => {
  const idx = argv.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (idx === -1) return def;
  const val = argv[idx].includes('=') ? argv[idx].split('=').slice(1).join('=') : argv[idx + 1];
  return val === undefined ? true : val;
};

const input = getArg('input');
const out = getArg('out', 'results.csv');
const concurrency = parseInt(getArg('concurrency', '8'), 10);
const timeoutMs = parseInt(getArg('timeout', '15000'), 10);
const dynamicFlag = !!getArg('dynamic', false);
const dynamicWaitMs = parseInt(getArg('wait', '6000'), 10);

if (!input) {
  console.error('Usage: node scanner.mjs --input urls.txt --out results.csv [--concurrency 8] [--timeout 15000] [--dynamic] [--wait 6000]');
  process.exit(1);
}

// Detection patterns
const patterns = {
  google: [
    /https?:\/\/docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/(?:viewform|formResponse)/i,
    /<iframe[^>]+src=["']https?:\/\/docs\.google\.com\/forms\/[^"']+["']/i,
    /<form[^>]+action=["']https?:\/\/docs\.google\.com\/forms\/[^"']+["']/i
  ],
  hubspot: [
    /https?:\/\/js\.hsforms\.net\/forms\/(?:embed\/)?v2\.js/i,
    /hbspt\.forms\.create\s*\(/i,
    /https?:\/\/api\.hsforms\.com\/submissions\/v3\/integration\/submit\/\d+\/[0-9a-f-]+/i,
    /https?:\/\/forms\.hubspot\.com\/uploads\/form\/v2\/\d+\/[0-9a-f-]+/i,
    /<div[^>]+id=["']hubspotForm["'][^>]*>/i
  ]
};

function detect(html) {
  const res = { google: false, hubspot: false, evidence: null };
  const hay = html || '';
  for (const rx of patterns.google) {
    const m = hay.match(rx);
    if (m) { res.google = true; res.evidence = truncate(m[0]); break; }
  }
  if (!res.evidence) {
    for (const rx of patterns.hubspot) {
      const m = hay.match(rx);
      if (m) { res.hubspot = true; res.evidence = truncate(m[0]); break; }
    }
  } else {
    // Still check hubspot too
    for (const rx of patterns.hubspot) {
      if (hay.match(rx)) { res.hubspot = true; break; }
    }
  }
  return res;
}

function truncate(s, n = 220) { return s.length > n ? s.slice(0, n) + '…' : s; }

async function fetchStatic(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'form-scanner/1.1 (+https://example.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    const status = r.status;
    const contentType = r.headers.get('content-type') || '';
    const text = contentType.includes('text/') || contentType.includes('html')
      ? await r.text()
      : '';
    return { status, text, contentType };
  } catch (err) {
    return { status: 0, text: '', error: String(err && err.message || err) };
  } finally {
    clearTimeout(t);
  }
}

async function fetchDynamic(url) {
  let pw;
  try {
    pw = await import('playwright');
  } catch (e) {
    return { status: 0, text: '', error: 'playwright not installed. Run: npm i -D playwright && npx playwright install' };
  }
  const { chromium } = pw;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
      viewport: { width: 1366, height: 900 },
      userAgent: 'form-scanner/1.1'
    });
    const page = await ctx.newPage();
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await delay(dynamicWaitMs);
    const html = await page.content();
    const status = resp ? resp.status() : 0;
    await ctx.close();
    await browser.close();
    return { status, text: html, contentType: 'text/html' };
  } catch (err) {
    try { if (browser) await browser.close(); } catch {}
    return { status: 0, text: '', error: String(err && err.message || err) };
  }
}

function toCsvRow(values) {
  return values.map(v => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }).join(',');
}

import * as cheerio from 'cheerio'; // reserved for future selectors if needed

async function main() {
  const start = Date.now();
  const listRaw = await fs.readFile(path.resolve(process.cwd(), input), 'utf8');
  const urls = listRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const limit = pLimit(concurrency);

  const headers = ['url','method','status','is_google_form','is_hubspot_form','detected_types','evidence','note'];
  const rows = [toCsvRow(headers)];
  const resultsJson = [];

  let idx = 0;
  const tasks = urls.map(url => limit(async () => {
    const n = ++idx;
    const st = await fetchStatic(url);
    let det = detect(st.text);
    let method = 'static';
    let note = st.error ? `static_error: ${st.error}` : '';
    if (!det.google && !det.hubspot && dynamicFlag) {
      const dy = await fetchDynamic(url);
      const det2 = detect(dy.text);
      if (det2.google || det2.hubspot) {
        det = det2;
        method = 'dynamic';
      }
      if (dy.error) note = (note ? note + ' | ' : '') + `dynamic_error: ${dy.error}`;
      if (dy.status) st.status = dy.status;
    }
    const detectedTypes = [
      det.google ? 'google_form' : null,
      det.hubspot ? 'hubspot_form' : null,
    ].filter(Boolean).join(';');
    rows.push(toCsvRow([
      url,
      method,
      st.status || 0,
      det.google,
      det.hubspot,
      detectedTypes,
      det.evidence || '',
      note || ''
    ]));
    resultsJson.push({
      url,
      method,
      status: st.status || 0,
      is_google_form: det.google,
      is_hubspot_form: det.hubspot,
      detected_types: detectedTypes ? detectedTypes.split(';') : [],
      evidence: det.evidence,
      note
    });
    process.stderr.write(`[${n}/${urls.length}] ${url} -> ${detectedTypes || 'none'} (${method}, ${st.status || 0})\n`);
  }));

  await Promise.all(tasks);
  await fs.writeFile(path.resolve(process.cwd(), out), rows.join('\n'), 'utf8');
  await fs.writeFile(path.resolve(process.cwd(), out.replace(/\.csv$/i, '.json')), JSON.stringify(resultsJson, null, 2), 'utf8');

  const dur = ((Date.now() - start)/1000).toFixed(2);
  console.log(`\nSaved CSV to ${out}`);
  console.log(`Saved JSON to ${out.replace(/\.csv$/i, '.json')}`);
  console.log(`Done in ${dur}s`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
