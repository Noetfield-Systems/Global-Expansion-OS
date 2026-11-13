# Global Expansion OS

Independent human + AI cross-border business expansion operating platform.

## Live application

Production: https://global-expansion-web-production.up.railway.app
Operations: https://global-expansion-web-production.up.railway.app/ops (requires ADMIN_TOKEN)
Repository: https://github.com/Noetfield-Systems/Global-Expansion-OS

## What ships

- Premium responsive site with an illustrated global operations workspace.
- English, Turkish, Arabic and Persian translations and RTL layout.
- Three-step founder intake with consent, validation and source tracking.
- PostgreSQL persistence; each case has status, owner, next action and due date.
- Admin-protected operations desk for case ownership and follow-up.
- Public /healthz probe and GitHub Actions tests.
- Honest pricing indications, eligibility caveats, privacy information and terms.
- No invented user counts, country operations, partners, or payment results.

## Setup

Node.js 20+ and PostgreSQL required. Run npm install then npm start.
Set DATABASE_URL to a PostgreSQL URL and ADMIN_TOKEN to a securely generated secret of at least 24 characters.
Use PORT to override the default port 3000.
Check GET /healthz for live database health.
Run npm run check and npm test before shipping.

## API contract

POST /api/intakes accepts name, email, country, optional businessName and businessUrl, businessStage, destination, budget, service, description, goals, language, consent:true and submissionKey (UUID). The form sends these automatically.
Response 201 contains a caseId only after confirmed database write. Database failures return 503 rather than pretending the request is received.
GET /api/admin/leads requires Authorization: Bearer ADMIN_TOKEN.
PATCH /api/admin/leads/:id requires that token, plus status, owner and nextAction.

## Company and commercial boundaries

Global Expansion OS is an independent working brand; the signed engagement must identify the actual contracting legal entity. The platform currently accepts consultation requests, not customer payments. Do not use an unrelated business merchant, claim a company is incorporated without evidence, or misrepresent eligibility.
Human specialists carry out work requiring their professional authority. Integrations with Noetfield Company OS and WorkforceOS are not claimed active without tested credentials and receipts.

## Release policy

Production source is the GitHub main branch on the existing Railway service. Do not create duplicate infrastructure. Monitor Railway deployment health and keep /healthz healthy after every commit.
