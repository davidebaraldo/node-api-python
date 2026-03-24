# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| latest | Yes |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Instead, please report them privately via [GitHub Security Advisories](https://github.com/davidebaraldo/node-api-python/security/advisories/new).

You should receive a response within 72 hours. If the vulnerability is confirmed, a fix will be released as soon as possible.

## Scope

This project embeds CPython in a native Node.js addon. Security-relevant areas include:

- **Type marshaling** — malformed data crossing the JS/Python boundary
- **Memory safety** — buffer overflows in the C++ bridge
- **Code execution** — unintended Python code execution via crafted module paths
