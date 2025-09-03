# v0.1.0 - Initial Release

## ✨ Features
- 🔍 **Multi-Platform Form Detection**: Google Forms, HubSpot Forms, Microsoft Forms
- 🍪 **Comprehensive CMP Detection**: Cookiebot, OneTrust, Efilli, GTM, Generic GDPR
- 🌐 **Advanced Scanning**: Static HTML + optional Playwright dynamic rendering
- 🔄 **Smart Fallback**: Automatic curl fallback for blocked requests
- 📊 **Multiple Outputs**: CSV, JSON, filtered text reports
- ⚡ **High Performance**: Concurrent scanning with configurable limits
- 🔒 **Privacy Focused**: Respects robots.txt, ethical scanning practices
- 🎯 **CLI First**: Powerful command-line interface with extensive options

## 📦 npm Package
- Published as `webform-privacy-consent-scanner@0.1.0`
- Install globally: `npm install -g webform-privacy-consent-scanner`
- Use: `webform-scanner --input urls.txt --cmp`

## 🏗️ Installation Examples
```bash
# Global installation
npm install -g webform-privacy-consent-scanner

# Basic scan with CMP detection
webform-scanner --input urls.txt --cmp

# Full scan with dynamic rendering
webform-scanner --input urls.txt --dynamic --cmp --wait 8000
```

name: Release Drafter
on:
  push:
    branches:
      - main
jobs:
  update_release_draft:
    runs-on: ubuntu-latest
    steps:
      - uses: release-drafter/release-drafter@v6
        with:
          config-name: release-draft.md
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
