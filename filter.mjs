#!/usr/bin/env node
/**
 * filter.mjs: Filter results.json by attribute-value pairs and generate text reports.
 * Supports dot notation, case-insensitive matching, and array includes logic.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const argv = process.argv.slice(2);
const getArg = (name, def = undefined) => {
  const idx = argv.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (idx === -1) return def;
  const val = argv[idx].includes('=') ? argv[idx].split('=').slice(1).join('=') : argv[idx + 1];
  return val === undefined ? true : val;
};

// Parse CLI arguments
const inputFile = getArg('input', 'results.json');
const attr = getArg('attr');
const valueStr = getArg('value');
const caseInsensitive = !!getArg('ci', false);
const contains = !!getArg('contains', false);
const outputFile = getArg('out', 'results_fine_tuned.txt');

// Validate required arguments
if (!attr) {
  console.error('Usage: node filter.mjs --attr <attribute> --value <value> [--input results.json] [--ci] [--contains] [--out results_fine_tuned.txt]');
  console.error('Examples:');
  console.error('  node filter.mjs --attr is_hubspot_form --value true');
  console.error('  node filter.mjs --attr status --value 200');
  console.error('  node filter.mjs --attr detected_types --value hubspot_form --ci');
  console.error('  node filter.mjs --attr url --value university.edu --contains --ci');
  process.exit(1);
}

if (!valueStr) {
  console.error('Error: --value is required');
  process.exit(1);
}

// Convert value to appropriate type
function convertValue(str) {
  if (str === 'true') return true;
  if (str === 'false') return false;
  if (!isNaN(str) && !isNaN(parseFloat(str))) return Number(str);
  return str;
}

const targetValue = convertValue(valueStr);

// Get nested property value using dot notation
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Check if value matches (supports arrays, strings, case-insensitive)
function matchesValue(actualValue, targetValue, caseInsensitive = false, contains = false) {
  // Handle null/undefined
  if (actualValue == null) return targetValue == null;

  // Handle arrays
  if (Array.isArray(actualValue)) {
    if (contains) {
      return actualValue.some(item => {
        if (typeof item === 'string' && typeof targetValue === 'string') {
          return caseInsensitive
            ? item.toLowerCase().includes(targetValue.toLowerCase())
            : item.includes(targetValue);
        }
        return item === targetValue;
      });
    }
    return actualValue.includes(targetValue);
  }

  // Handle strings with case-insensitive and contains logic
  if (typeof actualValue === 'string' && typeof targetValue === 'string') {
    if (contains) {
      return caseInsensitive
        ? actualValue.toLowerCase().includes(targetValue.toLowerCase())
        : actualValue.includes(targetValue);
    }
    return caseInsensitive
      ? actualValue.toLowerCase() === targetValue.toLowerCase()
      : actualValue === targetValue;
  }

  // Default comparison
  return actualValue === targetValue;
}

async function main() {
  try {
    // Read and parse JSON file
    const jsonPath = path.resolve(process.cwd(), inputFile);
    const jsonContent = await fs.readFile(jsonPath, 'utf8');
    const results = JSON.parse(jsonContent);

    if (!Array.isArray(results)) {
      console.error('Error: Input file must contain an array of objects');
      process.exit(1);
    }

    console.log(`📊 Filtering ${results.length} results by ${attr} = ${targetValue}${caseInsensitive ? ' (case-insensitive)' : ''}${contains ? ' (contains)' : ''}...`);

    // Filter results
    const filtered = results.filter(item => {
      const actualValue = getNestedValue(item, attr);
      return matchesValue(actualValue, targetValue, caseInsensitive, contains);
    });

    console.log(`✅ Found ${filtered.length} matching results`);

    // Generate text report
    let report = `FILTER REPORT\n`;
    report += `=============\n\n`;
    report += `Input file: ${inputFile}\n`;
    report += `Filter: ${attr} = ${targetValue}${caseInsensitive ? ' (case-insensitive)' : ''}${contains ? ' (contains)' : ''}\n`;
    report += `Total results: ${results.length}\n`;
    report += `Filtered results: ${filtered.length}\n\n`;

    if (filtered.length === 0) {
      report += `No results match the filter criteria.\n`;
    } else {
      report += `RESULTS:\n`;
      report += `--------\n`;

      filtered.forEach((item, index) => {
        const typesStr = Array.isArray(item.detected_types)
          ? item.detected_types.join(', ')
          : item.detected_types || 'none';
        report += `${index + 1}. ${item.url} | status=${item.status} | method=${item.method} | types=${typesStr}\n`;
      });
    }

    // Write to output file
    const outputPath = path.resolve(process.cwd(), outputFile);
    await fs.writeFile(outputPath, report, 'utf8');

    console.log(`📄 Report saved to: ${outputFile}`);

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: Input file '${inputFile}' not found`);
    } else if (error instanceof SyntaxError) {
      console.error(`Error: Invalid JSON in '${inputFile}': ${error.message}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
