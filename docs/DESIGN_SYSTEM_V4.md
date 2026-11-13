# GLOBAL EXPANSION OS — PREMIUM DESIGN & PRODUCT SSOT V4.1
Status: Implementation baseline · 13 November 2026

## Product thesis
Global Expansion OS is an independent human + AI execution bridge for entrepreneurs and businesses entering, establishing and operating across borders. It is **not** simply a company-registration landing page, an investor directory, a visa service or a generic B2B consulting clone.

The product welcomes founders with or without teams; the initial commercial wedge prioritizes product-ready entrepreneurs and budgeted international business operators in Türkiye and UAE, with multilingual expansion. It may serve AI-native startups, digital businesses and other legitimate ventures; do not artificially narrow the operating thesis.

## Image reference and implementation rule
The latest Founder-approved 1448×1086 image named `global_expansion_os_dashboard.png` is the controlling visual reference. It is not the live site. Faithfully match its visible hierarchy and detail rather than merely using navy-and-gold.

Desktop visual skeleton (1440 wide):
- 64px compact header; logo left, navigation center-right, language and cream-gold CTA right.
- Approximately 447px split hero: headline left in exactly two primary lines, small marker, concise subtext, six icon capabilities, two operational CTA links; photorealistic night globe with gold route arcs and cinematic city, console preview at right.
- 58px country chips, 11 grounded example countries; avoid an Iran flag in campaign creative. Never imply existing partnerships or coverage from a country chip.
- 155px image-forward three-card capability row with curated architectural/Dubai/meeting photography.
- One compact row of five execution steps.
- One compact row of three pricing cards using approved commercial hypotheses; comparison modal interactive.
- Below the first screen: OS bridge explanation, destination model, actual FAQ, operational intake and document terms.

## Design tokens
- Background `#08111d`; cards `#152337`; body text `#f4f6fa`.
- Warm bronze `#e8a66a`, champagne `#ffd0a0`, muted ink `#b1bccb`.
- Fonts: Manrope for editorial headings, DM Sans for English UI and Vazirmatn for RTL.
- Medium-radius 10–12px panels, warm inner rim lighting, cinematic depth, restrained hover and focus.
- Never use giant emoji decorations, fake status badges, generic stock heroes, rocket/weapon motifs or fake founder counts.
- Hardware-console mockups must be explicitly described as **illustrative concept**, not real product KPIs.

## Visual media
- Earth image `public/earth-night.webp`, locally vendored and optimized from NASA/NOAA Black Marble imagery. See `public/IMAGE_CREDITS.md`.
- `public/world-network-v4.svg` provides original route arcs, nodes and skyline, intentionally separate from the globe photorealism.
- Remaining curated photographs: Unsplash URLs in `public/site-v4.css`; avoid depending on an unsourced URL for irreplaceable core visuals.

## Functional acceptance
1. Every Start/Get Started/Request CTA opens the same real, validated three-step founder intake.
2. A case ID is shown only after PostgreSQL confirms storage; failures stay visible and do not produce simulated success.
3. Admin desk at `/ops` requires a server-side token and supports case status, owner, next action and date.
4. Plan comparison modal, Console tabs and language selector work by keyboard and mouse.
5. EN/TR/AR/FA and RTL work at desktop and mobile without horizontal overflow.
6. Automated Chromium tests and Railway pre-deploy PostgreSQL E2E pass; synthetic test data is deleted.
7. Never claim incorporation, account opening, customer revenue, partners or payment checkout without evidence.

## Production paths
Site: https://global-expansion-web-production.up.railway.app
GitHub: https://github.com/Noetfield-Systems/Global-Expansion-OS
Railway project: `global-expansion-os` (reuse; do not duplicate).
