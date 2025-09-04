# Maintainer Notes

This document contains important information for repository maintainers and contributors.

## Repository Management

### GitHub Repository Settings

#### About Panel Configuration
- **Description**: Advanced web form scanner detecting Google Forms, HubSpot Forms, Microsoft Forms with comprehensive CMP detection including Cookiebot, OneTrust, Efilli, and GDPR compliance auditing.
- **Website**: https://c3nk.com/
- **Topics**:
  - `privacy`
  - `gdpr`
  - `cmp`
  - `web-scanner`
  - `forms-detection`
  - `consent-management`
  - `cli-tool`
  - `node-js`

#### Features to Enable
- [ ] **Discussions**: Enable GitHub Discussions for community Q&A and feature discussions
- [ ] **Projects**: Create a GitHub Project for roadmap and issue tracking

### Release Process

#### Version Numbering
This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes and minor improvements

#### Pre-release Checklist
- [ ] Update `CHANGELOG.md` with new entries
- [ ] Update version in `package.json`
- [ ] Update `README.md` badges if needed
- [ ] Run tests and ensure CI passes
- [ ] Update live examples on c3nk.com if needed
- [ ] Test installation from npm

#### Post-release Tasks
- [ ] Create GitHub release with changelog
- [ ] Update npm package if published
- [ ] Announce on relevant communities/forums
- [ ] Monitor for issues and feedback

### Code Quality

#### Automated Checks
- **CodeQL**: Security scanning (weekly + on PR/push)
- **Dependabot**: Automated dependency updates
- **ESLint**: Code quality and style consistency
- **CI/CD**: Automated testing on multiple Node.js versions

#### Manual Review Requirements
- [ ] Security implications of new features
- [ ] Performance impact assessment
- [ ] Documentation updates required
- [ ] Breaking changes identified and documented

### Community Management

#### Issue Triage
- **Bug Reports**: Label with `bug`, assign priority, request reproduction steps
- **Feature Requests**: Label with `enhancement`, discuss feasibility, add to roadmap
- **Questions**: Direct to Discussions or provide quick answers
- **Security Issues**: Handle privately, follow responsible disclosure

#### PR Review Process
- [ ] Automated checks pass (CI, linting, tests)
- [ ] Code follows existing patterns and conventions
- [ ] Documentation updated if needed
- [ ] Tests added for new functionality
- [ ] Security review completed
- [ ] Changelog updated

### Dependencies

#### Critical Dependencies
- **Node.js**: Minimum version 18 (LTS)
- **Playwright**: For dynamic scanning (optional dependency)
- **Cheerio**: HTML parsing
- **P-limit**: Concurrency control

#### Update Strategy
- **Security updates**: Apply immediately
- **Major version updates**: Test thoroughly, plan migration
- **Minor/patch updates**: Batch weekly via Dependabot
- **Breaking changes**: Coordinate with major releases

### Documentation

#### Required Updates
- [ ] README.md (English and Turkish sections)
- [ ] CHANGELOG.md
- [ ] CLI help text
- [ ] Example files
- [ ] Live demo pages on c3nk.com

#### Translation Guidelines
- Keep English as primary language
- Turkish section should mirror English content structure
- Technical terms should be consistent
- Code examples should work in both languages

### Security Considerations

#### Scanning Guidelines
- Only scan websites with permission
- Respect robots.txt and terms of service
- Use ethical scanning practices
- Rate limiting to avoid DoS impact

#### Vulnerability Management
- Monitor security advisories for dependencies
- CodeQL alerts require immediate attention
- Security issues should be handled privately
- Responsible disclosure for external findings

### Performance Monitoring

#### Key Metrics
- Scan speed and concurrency limits
- Memory usage with large URL lists
- Error rates and failure patterns
- False positive/negative detection rates

#### Optimization Areas
- Concurrent request handling
- Memory usage with DOM parsing
- Network timeout management
- Browser instance management (Playwright)

### Future Roadmap

#### Planned Features
- [ ] Additional CMP platform support
- [ ] Advanced filtering options
- [ ] Web interface/dashboard
- [ ] API endpoints for integrations
- [ ] Docker containerization
- [ ] CI/CD platform integrations

#### Technical Debt
- [ ] Comprehensive test suite
- [ ] Performance benchmarking
- [ ] Error handling improvements
- [ ] Configuration file support

### Contact Information

#### Primary Maintainer
- **Name**: c3nk
- **Email**: me@c3nk.com
- **Website**: https://c3nk.com/

#### Emergency Contacts
- For security issues: security@c3nk.com
- For urgent repository issues: admin@c3nk.com

---

*This document should be kept current with repository practices and updated as processes evolve.*
