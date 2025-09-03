# v0.1.0 - Initial Release

## Features
- Static scan for Google Forms, HubSpot Forms, Microsoft Forms
- CMP detection: Cookiebot, OneTrust, Efilli (via --cmp flag)
- curl fallback for blocked fetches
- Optional Playwright dynamic scan
- Outputs: JSON, CSV, text report

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
