# Form Scanner - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Basic Usage](#basic-usage)
4. [Advanced Features](#advanced-features)
5. [Output Formats](#output-formats)
6. [Filtering and Reporting](#filtering-and-reporting)
7. [Troubleshooting](#troubleshooting)
8. [Examples](#examples)
9. [Performance Tips](#performance-tips)

## Introduction

Form Scanner is a powerful CLI tool designed to detect Google Forms, HubSpot Forms, Microsoft Forms, and other form types on websites. It also includes Cookie Consent Management Platform (CMP) detection to identify cookie consent banners.

### Key Features
- ✅ Google Forms, HubSpot Forms, Microsoft Forms detection
- ✅ Cookie Consent Management Platform detection
- ✅ Static and dynamic scanning modes
- ✅ High-performance concurrent scanning
- ✅ Detailed reporting (CSV/JSON)
- ✅ Google Tag Manager (GTM) support

## Installation

### Requirements
- Node.js >= 18
- npm

### Installation Steps

```bash
# 1. Clone or download the project
cd /path/to/scanner-form

# 2. Install dependencies
npm install

# 3. (Optional) Install Playwright for dynamic mode
npm install -D playwright
npx playwright install
```

### Configuration
You can customize detection patterns using the `form-detection-config.json` file.

## Basic Usage

### 1. Prepare URL List
Create a text file with one URL per line:

```txt
https://example.com/contact
https://example.com/feedback
https://forms.google.com/example
```

### 2. Basic Scanning
```bash
# Basic static scanning
node scanner.mjs --input urls.txt

# Output: results_2024-12-19T14-30-22.csv
#         results_2024-12-19T14-30-22.json
```

### 3. Custom Output File
```bash
# Custom filename
node scanner.mjs --input urls.txt --out my-results.csv

# Output: my-results.csv
#         my-results.json
```

## Advanced Features

### Dynamic Scanning
To detect forms loaded by JavaScript:

```bash
# Dynamic mode
node scanner.mjs --input urls.txt --dynamic

# Custom wait time
node scanner.mjs --input urls.txt --dynamic --wait 10000
```

### CMP Detection
To detect cookie consent platforms:

```bash
# CMP detection
node scanner.mjs --input urls.txt --cmp

# Dynamic + CMP
node scanner.mjs --input urls.txt --dynamic --cmp
```

### Performance Settings
```bash
# Concurrency setting
node scanner.mjs --input urls.txt --concurrency 4

# Timeout setting
node scanner.mjs --input urls.txt --timeout 30000
```

## Output Formats

### CSV Format
```csv
url,method,status,is_google_form,is_hubspot_form,is_microsoft_form,detected_types,evidence,has_cmp,cmp_vendor,cmp_evidence,note
https://example.com,static,200,true,false,false,google,"Google Forms direct URL pattern",false,,,
https://site.com,dynamic,200,false,true,false,hubspot,"HubSpot forms script",true,Efilli,efilli,
```

### JSON Format
```json
[
  {
    "url": "https://example.com",
    "method": "static",
    "status": 200,
    "is_google_form": true,
    "is_hubspot_form": false,
    "is_microsoft_form": false,
    "detected_types": ["google"],
    "evidence": "Google Forms direct URL pattern",
    "has_cmp": false,
    "cmp_vendor": null,
    "cmp_evidence": null,
    "note": ""
  }
]
```

### Field Descriptions

| Field | Description |
|-------|-------------|
| `url` | Scanned URL |
| `method` | Scanning method (static/dynamic) |
| `status` | HTTP status code |
| `is_google_form` | Google Forms detected |
| `is_hubspot_form` | HubSpot Forms detected |
| `is_microsoft_form` | Microsoft Forms detected |
| `detected_types` | List of detected form types |
| `evidence` | Detection evidence |
| `has_cmp` | CMP detected |
| `cmp_vendor` | CMP provider name |
| `cmp_evidence` | CMP detection evidence |
| `note` | Additional notes/error messages |

## Filtering and Reporting

Use the `filter.mjs` script to filter scan results and generate custom reports.

### Basic Filtering

```bash
# Filter Google forms
node filter.mjs --attr is_google_form --value true

# Filter HubSpot forms
node filter.mjs --attr is_hubspot_form --value true

# Filter Microsoft forms
node filter.mjs --attr is_microsoft_form --value true

# List successful requests
node filter.mjs --attr status --value 200
```

### Advanced Filtering

#### Case-Insensitive Search
```bash
# Search "hubspot" in detected_types array (case-insensitive)
node filter.mjs --attr detected_types --value hubspot --ci --contains
```

#### Contains Search
```bash
# Find URLs containing "university"
node filter.mjs --attr url --value university --contains --ci
```

#### Different Input/Output Files
```bash
# Use different input file
node filter.mjs --input final-test.json --attr status --value 200 --out final-filtered.txt
```

### NPM Script Usage
```bash
# Use ready script
npm run filter
```

### Supported Attribute Types

| Type | Examples | Usage |
|------|----------|-------|
| **Boolean** | `is_google_form`, `is_hubspot_form`, `has_cmp` | `--value true/false` |
| **String** | `url`, `method`, `evidence`, `cmp_vendor` | `--value "search_value"` |
| **Number** | `status` | `--value 200` |
| **Array** | `detected_types` | `--value hubspot --contains` |

### Report Format

The filter script generates a text report in the following format:

```
FILTER REPORT
=============

Input file: results.json
Filter: is_google_form = true
Total results: 4664
Filtered results: 13

RESULTS:
--------
https://hsri.ozyegin.edu.tr/en/design-thinking-in-the-age-of-ai-comparing-traditional-and-ai-assisted-creativity-in-architectural-design
https://hsri.ozyegin.edu.tr/en/carbon-negative-recycled-concrete-solutions
https://hsri.ozyegin.edu.tr/en/sustainable-biocemented-3d-printing
https://www.ozyegin.edu.tr/tr/sektorel-egitim/dersler/sec-101
...
```

**Note:** Report filenames include automatic timestamps (e.g., `results_fine_tuned_2025-09-03T11-14-55.txt`)

### Features

- ✅ **Automatic type conversion**: String values are automatically converted to correct types
- ✅ **Dot notation support**: `foo.bar` style nested properties
- ✅ **Case-insensitive search**: Using `--ci` flag
- ✅ **Contains search**: Using `--contains` flag
- ✅ **Array support**: Includes logic for array fields
- ✅ **Error tolerance**: Meaningful messages for JSON errors

## Troubleshooting

### Common Issues

#### 1. Playwright Error
```
Error: Executable doesn't exist at /path/to/chromium
```

**Solution:**
```bash
npx playwright install
```

#### 2. Config File Error
```
Error loading config file: ENOENT
```

**Solution:**
Make sure the `form-detection-config.json` file exists.

## Conclusion

Form Scanner is a powerful and flexible tool for web form detection. It supports both basic and advanced scanning scenarios. For performance needs, adjust settings and use dynamic mode only when necessary.

For more help, check README.md or open an issue.

---

*This guide covers the main features and usage of Form Scanner. For detailed API documentation, see the source code comments.*
