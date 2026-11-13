# GLOBAL EXPANSION OS — PREMIUM DESIGN SSOT V5.0

**Effective date:** 13 November 2026  
**Visual reference:** `global_expansion_os_built_for_worldwide_growth.png` (1448 × 1086).  
**Implementation:** `public/index.html`, `public/site-v5.css`, `public/app.js`, `public/premium-v3.js`.  
**Status:** coded; production readiness is determined by GitHub CI and Railway deployment, not by documentation alone.

## Founder thesis
An independent human + AI operating bridge that helps founders and businesses expand globally: market exploration, company setup coordination, provider and payments readiness, market entry, execution, professional staffing, ongoing operations and growth. Not merely an incorporation agent, investor introduction site or decorative dashboard.

## Visual foundation
- High contrast midnight/ink background, illuminated amber geographic arcs, architectural glass and warm metal.
- High-fashion, high-contrast *Bodoni Moda* editorial display typography for English headlines and section labels, modern DM Sans/Manrope UI, Vazirmatn for Arabic/Persian layouts where supported.
- Reference proportions at 1440–1450px desktop: 58px masthead; ~520px split hero; 67px scrolling markets; three ~186px photo-led solution cards; five-step ~122px operating workflow; detailed lower sections.
- Three purposeful headline lines **Built locally. / Ready to operate / globally.**; restrained gold gradient on final line. No wrapped, randomly sized sans-serif slogan.
- Photographic NASA night-Earth composite served as `public/earth-night.webp`; original fine route visualization `public/world-network-v4.svg`. These do not depict verified client work.
- Angular glass preview is an **illustrative concept**, explicitly labeled, with real interactive tabs and non-fabricated demonstration values; never display invented customer adoption, financing, partner counts or collected revenue.
- Photography must depict architecture, actual cities and collaborative work, never a rocket or weapon motif.
- Country flags are navigational examples of potential expansion markets, not proof of partnership, market availability or active customers.

## Product and conversion continuity
- All Get Started, Start your expansion, service, plans and lower-page conversion actions connect to the same genuine three-step intake.
- Intake has required fields, consent, form validation, rate limiting, idempotency key, durable PostgreSQL writes and a genuine case ID **only** following database success.
- Existing `/ops` desk remains protected by server-side `ADMIN_TOKEN` and tracks case owner, status, next action and follow-up.
- Plan comparison is interactive; nav links are real in-page anchors. No fake video link.
- EN/TR/AR/FA translations and logical RTL behavior must remain functional.
- Pricing is explicitly indicative and third-party/government costs are separate. No claims of payment collection until verified.

## Acceptance tests
1. No JS errors or horizontal overflow at 1440×950 or 390×844.
2. Navigation open/close on mobile, language switch for Persian/Arabic and Turkish, concept OS tabs and comparison modal function.
3. Required wizard errors are visible. A failed PostgreSQL save cannot display a fake success. A controlled 201 response may be tested in browser but is **not** live financial/CRM evidence.
4. Railway pre-deploy E2E creates a uniquely marked synthetic case, validates storage and CRM update, then deletes the test case.
5. All CI jobs green and Railway latest live deployment SUCCESS, both web and PostgreSQL online.
6. Visual screenshot review against the named 1448×1086 reference: typography/planet/cards/workflow are reviewed separately, not asserted pixel-identical.
7. CDN photographic images must have a documented source and fallback; localize to repo when stable and permitted.

## Operations and legal entity
The Global Expansion OS venture is independent. Noetfield technical assets may be integrated only through permissioned service arrangements. Global company registration, banking eligibility, loans or customer success cannot be guaranteed or represented as completed without proof.

## Deployment
Use existing `Noetfield-Systems/Global-Expansion-OS` GitHub, Railway `global-expansion-os` project, current web service and PostgreSQL; do not duplicate infrastructure. Current intended URL: https://global-expansion-web-production.up.railway.app/
