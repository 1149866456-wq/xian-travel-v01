# Dependency Security Audit — 2026-08-12

## Audit environment

- Application target: Node.js 22
- Audit registry: `https://registry.npmjs.org`
- The machine default `https://registry.npmmirror.com` was not used for audit because it returns HTTP 404 for npm's advisory API.
- Remediation rule: compatible upgrades only; no `npm audit fix --force`.

## Initial runtime audit

Command: `npm audit --omit=dev --json --registry=https://registry.npmjs.org`

Result: 5 high, 0 critical.

| Package | Advisory / dependency path | Production reachability | Disposition |
|---|---|---|---|
| `next@16.2.11` → `postcss<=8.5.22` | GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849, GHSA-fxqj-rqcc-2cmp | Runtime package; the current app does not accept attacker CSS or source maps, but the vulnerable parser ships in the production tree. | Upgrade Next and matching ESLint config to `16.3.0`, which pins PostCSS `8.5.23`. |
| `next@16.2.11` → `sharp<0.35.0` | GHSA-f88m-g3jw-g9cj | Runtime optional image dependency. The current source has no user-controlled image processing, but the vulnerable native package ships in the production tree. | Upgrade Next to `16.3.0`, whose audit fix path supplies the patched dependency. |
| `@playwright/test@1.54.2` → `playwright<1.55.1` | GHSA-7mvr-c777-76hp | Dev/CI only; affects browser binary download certificate validation and therefore supply-chain integrity. | Upgrade the direct test dependency to `1.62.1`. |

## Compatibility check

- `next@16.3.0`: Node `>=20.9.0`; accepts React/ReactDOM 19; accepts Playwright `^1.51.1`.
- `eslint-config-next@16.3.0`: accepts ESLint 9 and TypeScript 5.9.
- `@playwright/test@1.62.1`: Node `>=20`.
- All upgrades stay within the existing Next 16 and Playwright 1 release lines.

## Final audit

After upgrading and regenerating `package-lock.json`:

- `npm audit --omit=dev --json --registry=https://registry.npmjs.org`: 0 total, 0 high, 0 critical.
- `npm audit --json --registry=https://registry.npmjs.org`: 0 total, 0 high, 0 critical.

Fresh recheck on 2026-08-13 with Node.js 22 and the official npm registry:

- `npm audit --omit=dev --audit-level=high --registry=https://registry.npmjs.org`: 0 vulnerabilities.
- `npm audit --audit-level=high --registry=https://registry.npmjs.org`: 0 vulnerabilities.

The full local and browser verification gates remain required before delivery.
