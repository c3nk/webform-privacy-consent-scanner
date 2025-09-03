#!/usr/bin/env node
/**
 * form-scanner: Detect Google Forms or HubSpot forms on a list of URLs.
 * Requires Node.js >= 18 (built-in fetch). Optional: playwright for --dynamic.
 */
import fs from 'node:fs';
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
const out = getArg('out');
const concurrency = parseInt(getArg('concurrency', '8'), 10);
const timeoutMs = parseInt(getArg('timeout', '15000'), 10);
const dynamicFlag = !!getArg('dynamic', false);
const dynamicWaitMs = parseInt(getArg('wait', '6000'), 10);
const cmpFlag = !!getArg('cmp', false);

// Generate timestamp for output files if not specified
function generateTimestampedFilename(baseName) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-MM-SS format
  const extension = baseName.split('.').pop();
  const nameWithoutExt = baseName.replace('.' + extension, '');
  return `${nameWithoutExt}_${timestamp}.${extension}`;
}

// Determine output filenames
let outputCsv, outputJson;
if (out) {
  outputCsv = out;
  outputJson = out.replace(/\.csv$/i, '.json');
} else {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  outputCsv = `results_${timestamp}.csv`;
  outputJson = `results_${timestamp}.json`;
}

if (!input) {
  console.error('Usage: node scanner.mjs --input urls.txt [--out results.csv] [--concurrency 8] [--timeout 15000] [--dynamic] [--wait 6000] [--cmp]');
  console.error('Note: If --out is not specified, files will be saved with timestamp (e.g., results_2024-12-19T14-30-22.csv)');
  process.exit(1);
}

// Prepare patterns from config (will be loaded in main)
let patterns = {};
let cmpPatterns = [];
let globalConfig = null; // Global config for fetchDynamic

// Detection functions will be defined in main after config loading

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
  console.log('DYNAMIC_MODE_START for:', url);
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

    // Handle CMP banners if enabled
    console.log('CMP_FLAG_CHECK:', cmpFlag, 'GLOBAL_CONFIG_CMP_ENABLED:', globalConfig?.cmp?.enabled, 'GLOBAL_CONFIG_EXISTS:', !!globalConfig);
    if (cmpFlag && globalConfig?.cmp?.enabled) {
      console.log('CMP_CONDITION_MET');
      try {
        // Try to find and click common consent buttons
        const consentSelectors = globalConfig.cmp.selectors || [];
        for (const selector of consentSelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              const isVisible = await element.isVisible();
              if (isVisible) {
                await element.click();
                console.log(`Clicked consent button: ${selector}`);
                await delay(1000); // Wait for consent to be processed
                break;
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }

        // Wait a bit more after consent handling
        await delay(2000);

                // Enhanced CMP detection for GTM and Efilli
        console.log('CMP_START');
        console.log('CMP_CHECK');

                    // First check for immediate CMP presence
          const html = await page.content();
          const immediateCMP = {
            hasEfilli: html.includes('efilli') || html.includes('efilli.com'),
            hasGTM: html.includes('googletagmanager.com') || html.includes('GTM-'),
            hasCookieConsent: html.includes('cookie') && (html.includes('consent') || html.includes('gdpr'))
          };

          console.log(`📊 Immediate CMP check: Efilli=${immediateCMP.hasEfilli}, GTM=${immediateCMP.hasGTM}, Consent=${immediateCMP.hasCookieConsent}`);

          // Wait for GTM to be available
          if (immediateCMP.hasGTM) {
            await page.waitForFunction(() => {
              return window.google_tag_manager ||
                     window.gtag ||
                     document.querySelector('script[src*="googletagmanager.com"]') ||
                     document.querySelector('script[src*="gtm.start"]');
            }, { timeout: 8000 }).catch(() => {
              console.log('GTM initialization timeout');
            });
          }

          // Special handling for Efilli
          if (immediateCMP.hasEfilli || immediateCMP.hasGTM) {
            console.log('Waiting for Efilli/CMP initialization...');

            // Wait for Efilli script to be available
            await page.waitForFunction(() => {
              return document.querySelector('script[src*="efilli"]') ||
                     document.querySelector('script[src*="bundles.efilli.com"]') ||
                     window.Efilli ||
                     document.documentElement.innerHTML.includes('efilli.com');
            }, { timeout: 10000 }).catch(() => {
              console.log('Efilli script detection timeout');
            });

            // Wait for Efilli to initialize and show consent UI
            await delay(2000);

            // Check for Efilli-specific consent elements
            const efilliSelectors = [
              '[data-efilli]',
              '.efilli-consent',
              '.efilli-banner',
              '[class*="efilli"]',
              'button[onclick*="efilli"]',
              'button[onclick*="consent"]',
              'button[onclick*="cookie"]',
              '.cookie-consent',
              '.gdpr-banner',
              '.consent-modal',
              '#cookie-consent',
              '#gdpr-consent'
            ];

            console.log('Checking for Efilli consent elements...');
            for (const selector of [...globalConfig.cmp.selectors, ...efilliSelectors]) {
              try {
                const element = await page.$(selector);
                if (element) {
                  const isVisible = await element.isVisible();
                  const box = await element.boundingBox().catch(() => null);

                  if (isVisible && box) {
                    console.log(`Found visible consent element: ${selector}`);
                    await element.click();
                    console.log(`Clicked consent button: ${selector}`);
                    await delay(1500); // Wait for consent to be processed
                    break;
                  }
                }
              } catch (e) {
                // Continue to next selector
              }
            }
          }

          // Additional wait for any dynamic content
          await delay(2000);

        } catch (cmpError) {
          console.log(`Enhanced CMP detection failed: ${cmpError.message}`);
        }
    }

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
  // Load configuration
  let config;
  try {
    const configPath = path.resolve(process.cwd(), 'form-detection-config.json');
    const configContent = await fs.promises.readFile(configPath, 'utf8');
    config = JSON.parse(configContent);
    globalConfig = config; // Set global config for fetchDynamic
  } catch (err) {
    console.error('Error loading config file:', err.message);
    console.error('Make sure form-detection-config.json exists in the current directory');
    process.exit(1);
  }

  // Prepare patterns from config
  for (const [formType, formConfig] of Object.entries(config.forms)) {
    if (formConfig.enabled) {
      patterns[formType] = formConfig.patterns
        .filter(p => p.type !== 'url') // URL patterns are handled separately
        .map(p => new RegExp(p.pattern, 'i'));
    }
  }

  // Prepare CMP patterns
  cmpPatterns = config.cmp.enabled ?
    config.cmp.patterns.map(p => new RegExp(p.pattern, 'i')) : [];

  console.log('CONFIG_LOADED: cmp.enabled =', config.cmp.enabled, 'cmpFlag =', cmpFlag);

  // Define detection functions after config is loaded
  function detectCMP(html) {
    if (!cmpFlag || !config.cmp.enabled) {
      return { has_cmp: false, cmp_vendor: null, cmp_evidence: null };
    }

    const hay = html || '';
    for (const pattern of config.cmp.patterns) {
      if (pattern.type === 'url' && hay.includes(pattern.pattern.replace(/\\.*$/, ''))) {
        return {
          has_cmp: true,
          cmp_vendor: pattern.vendor,
          cmp_evidence: truncate(pattern.description)
        };
      } else if (pattern.type !== 'url') {
        const rx = new RegExp(pattern.pattern, 'i');
        const match = hay.match(rx);
        if (match) {
          return {
            has_cmp: true,
            cmp_vendor: pattern.vendor,
            cmp_evidence: truncate(match[0])
          };
        }
      }
    }

    return { has_cmp: false, cmp_vendor: null, cmp_evidence: null };
  }

  function detect(html, url = '') {
    const result = {
      detected_types: [],
      evidence: null,
      has_cmp: false,
      cmp_vendor: null,
      cmp_evidence: null
    };

    const hay = html || '';

    // Check for forms in enabled config
    for (const [formType, formConfig] of Object.entries(config.forms)) {
      if (!formConfig.enabled) continue;

      let formDetected = false;

      // Check URL patterns
      for (const pattern of formConfig.patterns) {
        if (pattern.type === 'url') {
          const rx = new RegExp(pattern.pattern, 'i');
          if (rx.test(url)) {
            formDetected = true;
            result.evidence = truncate(pattern.description);
            break;
          }
        }
      }

      // Check HTML patterns
      if (!formDetected) {
        for (const rx of patterns[formType] || []) {
          const match = hay.match(rx);
          if (match) {
            formDetected = true;
            result.evidence = truncate(match[0]);
            break;
          }
        }
      }

      if (formDetected) {
        result.detected_types.push(formType);
        result[formType] = true;
      }
    }

      // Check for CMP
  if (cmpFlag) {
    const cmpResult = detectCMP(hay);
    result.has_cmp = cmpResult.has_cmp;
    result.cmp_vendor = cmpResult.cmp_vendor;
    result.cmp_evidence = cmpResult.cmp_evidence;

    // Debug logging for CMP detection
    if (cmpResult.has_cmp) {
      console.log(`✅ CMP detected: ${cmpResult.cmp_vendor} (${cmpResult.cmp_evidence})`);
    }
  }

  return result;
  }

  const start = Date.now();
  const listRaw = await fs.promises.readFile(path.resolve(process.cwd(), input), 'utf8');
  const urls = listRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const limit = pLimit(concurrency);

  const headers = ['url','method','status','is_google_form','is_hubspot_form','is_microsoft_form','detected_types','evidence','has_cmp','cmp_vendor','cmp_evidence','note'];
  const rows = [toCsvRow(headers)];
  const resultsJson = [];

  let idx = 0;
  const tasks = urls.map(url => limit(async () => {
    const n = ++idx;
    const st = await fetchStatic(url);
    let det = detect(st.text, url);
    let method = 'static';
    let note = st.error ? `static_error: ${st.error}` : '';
    const shouldUseDynamic = (det.detected_types.length === 0 && dynamicFlag) || cmpFlag;
    console.log(`[${n}/${urls.length}] ${url} -> ${shouldUseDynamic ? 'will use dynamic' : 'static only'} (${cmpFlag ? 'CMP enabled' : 'CMP disabled'})`);

    if (shouldUseDynamic) {
      const dy = await fetchDynamic(url);
      const det2 = detect(dy.text, url);
      if (det2.detected_types.length > 0) {
        det = det2;
        method = 'dynamic';
      }
      if (dy.error) note = (note ? note + ' | ' : '') + `dynamic_error: ${dy.error}`;
      if (dy.status) st.status = dy.status;
    }
    const detectedTypes = det.detected_types.join(';');
    rows.push(toCsvRow([
      url,
      method,
      st.status || 0,
      det.google || false,
      det.hubspot || false,
      det.microsoft || false,
      detectedTypes,
      det.evidence || '',
      det.has_cmp || false,
      det.cmp_vendor || '',
      det.cmp_evidence || '',
      note || ''
    ]));
    resultsJson.push({
      url,
      method,
      status: st.status || 0,
      is_google_form: det.google || false,
      is_hubspot_form: det.hubspot || false,
      is_microsoft_form: det.microsoft || false,
      detected_types: det.detected_types,
      evidence: det.evidence,
      has_cmp: det.has_cmp || false,
      cmp_vendor: det.cmp_vendor,
      cmp_evidence: det.cmp_evidence,
      note
    });
    process.stderr.write(`[${n}/${urls.length}] ${url} -> ${detectedTypes || 'none'} (${method}, ${st.status || 0})\n`);
  }));

  await Promise.all(tasks);
  await fs.promises.writeFile(path.resolve(process.cwd(), outputCsv), rows.join('\n'), 'utf8');
  await fs.promises.writeFile(path.resolve(process.cwd(), outputJson), JSON.stringify(resultsJson, null, 2), 'utf8');

  const dur = ((Date.now() - start)/1000).toFixed(2);
  console.log(`\nSaved CSV to ${outputCsv}`);
  console.log(`Saved JSON to ${outputJson}`);
  console.log(`Done in ${dur}s`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
