# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2025-01-15

### Added
- **Mock example pages** under `examples/forms/` with HubSpot, Google, and Microsoft Forms
- **Live test pages** hosted on c3nk.com with mock signatures for testing
- **CodeQL workflow** for automated security scanning
- **Dependabot configuration** for automated dependency updates
- **GitHub issue templates** for bug reports and feature requests
- **Comprehensive documentation** updates with live example links
- **Package.json improvements** with expanded keywords and file listings

### Changed
- **README.md** updated with consistent CSV/JSON examples and improved accessibility
- **Hero image ALT text** enhanced for better SEO and accessibility
- **Dynamic scanning documentation** consolidated with default wait time (6000ms)
- **Package keywords** reorganized and expanded for better discoverability

### Fixed
- **Output format alignment** between CSV and JSON examples
- **Documentation consistency** between English and Turkish sections

### Technical
- **Workflow files** added for automated security and dependency management
- **Mock HTML pages** support `?cmp=` and `&mode=mock|live` parameters
- **Repository structure** improved with dedicated forms example directory

## [0.1.3] - 2024-12-XX

### Added
- Initial public release
- Core form detection for Google Forms, HubSpot Forms, Microsoft Forms
- CMP detection for Cookiebot, OneTrust, Efilli, and generic GDPR banners
- Static and dynamic scanning modes with Playwright integration
- CSV, JSON, and filtered text output formats
- CLI interface with comprehensive options
- Basic example files and documentation

### Features
- Multi-platform form detection
- Advanced CMP platform support
- Concurrent scanning with configurable limits
- Smart fallback mechanisms
- Privacy-focused scanning practices
- Extensive filtering and reporting options
