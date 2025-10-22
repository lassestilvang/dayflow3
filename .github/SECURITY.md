# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Dayflow Planner, please report it to us privately before disclosing it publicly.

### How to Report

1. **Email**: Send an email to security@dayflow-planner.com
2. **GitHub Security Advisory**: Use the [GitHub Security Advisory](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) feature

### What to Include

Please include the following information in your report:

- **Type of vulnerability** (e.g., XSS, SQL injection, authentication bypass)
- **Affected versions** of the software
- **Steps to reproduce** the vulnerability
- **Potential impact** of the vulnerability
- **Proof of concept** (if available)

### Response Time

We will acknowledge receipt of your vulnerability report within **48 hours** and provide a detailed response within **7 days** indicating the next steps in handling your report.

### Security Updates

When a security vulnerability is fixed:

1. We will release a new version with the fix
2. We will publish a security advisory
3. We will update the documentation with mitigation steps

### Security Best Practices

We follow these security best practices:

- Regular dependency updates and security scanning
- Code reviews for all changes
- Automated security testing in CI/CD
- Principle of least privilege for all systems
- Regular security audits and penetration testing

### Security Features

Dayflow Planner includes these security features:

- Secure authentication with NextAuth.js
- Input validation and sanitization
- CSRF protection
- Secure headers (CSP, HSTS, etc.)
- Encrypted data transmission (HTTPS)
- Environment-based configuration management

### Responsible Disclosure Policy

We believe in responsible disclosure and will work with security researchers to ensure vulnerabilities are addressed appropriately before public disclosure.

### Security Hall of Fame

We acknowledge and thank security researchers who help us improve our security. Contributors who report valid security vulnerabilities will be recognized in our Security Hall of Fame.

---

Thank you for helping keep Dayflow Planner and our users safe!