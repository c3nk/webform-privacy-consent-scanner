# Contributing to Webform Privacy Consent Scanner

Thank you for your interest in contributing to the webform-privacy-consent-scanner project!

## Development Setup

1. **Prerequisites**
   - Node.js >= 18
   - npm

2. **Clone and Setup**
   ```bash
   git clone https://github.com/c3nk/webform-privacy-consent-scanner.git
   cd webform-privacy-consent-scanner
   npm install
   ```

3. **Optional: Playwright Setup**
   ```bash
   npm install -D playwright
   npx playwright install
   ```

## Testing

Run the smoke test:
```bash
npm run start
```

Run example scans:
```bash
npm run scan:static
npm run scan:full
```

## Pull Request Guidelines

- **Fork** the repository
- Create a **feature branch** from `main`
- **Test your changes** thoroughly
- **Update documentation** if needed
- **Follow the existing code style**
- **Write clear commit messages**
- Submit a **pull request** with a detailed description

## Code Style

- Use **ES modules** (ESM)
- Follow **consistent naming conventions**
- Add **comments** for complex logic
- Maintain **error handling** best practices

## Good First Issues

Look for issues labeled `good first issue` or `help wanted` in the GitHub repository.

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## Questions?

If you have questions about contributing, please open an issue or contact the maintainers.
