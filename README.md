# art-museum

[![CI](https://github.com/gitmanfel/art-museum/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/gitmanfel/art-museum/actions/workflows/ci.yml)
[![Security](https://github.com/gitmanfel/art-museum/actions/workflows/security.yml/badge.svg?branch=main)](https://github.com/gitmanfel/art-museum/actions/workflows/security.yml)

> **👉 [View Project Portfolio & Demo](PORTFOLIO.md)** — Comprehensive showcase of features, architecture, and technical implementation without source code exposure.

> **🌐 GitHub Page:** https://gitmanfel.github.io/art-museum/

> **🧭 Full Architecture Map:** [ARCHITECTURE.md](ARCHITECTURE.md)

## Demo day quick commands

- From repo root, run seeded-data validation:
	- `npm run demo:health`
	- Fails with a non-zero exit code if any demo category drops below minimum thresholds.
- Run complete demo verification in one command:
	- `npm run verify:demo`
- Run backend tests:
	- `npm run test:backend`
- Run frontend tests:
	- `npm run test:frontend`
- Run full regression check:
	- `npm run test:all`
- Start backend from root:
	- `npm run start:backend`
- Start frontend web from root:
	- `npm run start:frontend:web`
	- Uses fixed port `8096` for stable demo startup.
- GitHub Page publication:
	- Pushed updates to `docs/` auto-deploy via `.github/workflows/pages.yml`.

## Repository privacy switch (manual)

I cannot change repository visibility from this workspace, but these are the exact steps:

1. GitHub repository -> Settings -> General.
2. Scroll to Danger Zone -> Change repository visibility.
3. Select Make private and confirm repository name.
4. Verify workflows still run in Actions tab.
5. Verify Pages in Settings -> Pages (Source: GitHub Actions).

## Environment variables

### Password reset URL
- `FRONTEND_RESET_URL`: Frontend route used to build reset links.
	- Default: `http://localhost:19006/reset-password`

### SMTP (production email delivery)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `REQUIRE_SMTP_IN_PRODUCTION` (optional): Set to `true` to enforce SMTP config as a production startup/CI requirement.

### Admin access control
- `ADMIN_EMAILS`: Comma-separated list of emails that should receive `admin` role claims in JWT tokens.

### JWT security (production)
- `JWT_SECRET`: Required in production. Backend startup fails fast if missing or using fallback secret.

### Frontend Stripe payment sheet
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key used by the Expo app to open Payment Sheet.
	- When omitted, the frontend falls back to the non-live checkout review/status flow.

## CI preflight check

- Run `npm run check:config` in `backend/` to validate production-critical runtime configuration.
- Typical CI usage example:
	- `NODE_ENV=production npm run check:config`

## Security automation

- `.github/workflows/security.yml` runs:
	- Dependency review on pull requests when dependency manifests change.
	- Baseline-aware `npm audit` on scheduled (weekly) and manual runs for both `backend/` and `frontend/`.
	  - Scheduled runs also enforce **zero criticals** via `STRICT_CRITICAL` mode.
- `.github/security/audit-baseline.json` defines the currently-accepted `high` and `critical` counts per project.
	- The workflow fails when current counts exceed baseline values (regression gate).

### Refreshing the audit baseline

After an intentional dependency upgrade that changes vulnerability counts:

```bash
# from repo root (node_modules must be installed in both projects)
node .github/security/update-audit-baseline.js
git add .github/security/audit-baseline.json
git commit -m "chore(security): update audit baseline after dependency upgrade"
```

In non-production environments, reset links are logged and returned in API responses for local testing.


## Operational status endpoint

- `GET /api/auth/email-status`: Returns non-sensitive email delivery readiness.
	- Example shape:
		- `emailDelivery.mode`: `development` or `smtp`
		- `emailDelivery.smtpConfigured`: `true` or `false`

## Protected diagnostics endpoint

- `GET /api/auth/diagnostics` (requires admin bearer token): Returns non-sensitive runtime diagnostics.
	- Includes environment, JWT fallback-secret posture, auth rate-limit values, and email delivery readiness.
