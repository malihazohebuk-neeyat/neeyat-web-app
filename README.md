# Neeyat Web-App Demo

Neeyat is an AI-ready ethical commerce intelligence platform prototype for the UK market.

Business positioning: **AI-Powered Ethical Commerce Intelligence Platform**  
Tagline: **Ethical Money Decisions**  
Purpose: proof of product development for Innovator Founder endorsement evidence.

## What This Version Is

This repository is a **static GitHub Pages demonstration**. It is designed to be easy to host for free and to show the proposed product journey, commercial logic, ethical scoring concept, role dashboards and future technical direction.

It does **not** connect to a live database, payment system, retailer feed, affiliate network, certification database or authentication server.

## Main Features

- Public homepage with Neeyat positioning.
- Product search across 30 seeded demo products.
- Category, price, ethical-score and sort filters.
- Programmatic ethical-score calculation.
- Programmatic personal-match calculation.
- Simulated retailer price comparisons.
- Product detail pages with score breakdowns.
- Compare up to four products.
- Consumer dashboard with values sliders.
- Influencer marketplace and influencer dashboard.
- Business dashboard with analytics and improvement recommendations.
- Admin dashboard with moderation and commercial model examples.
- Pricing page for consumer and B2B plans.
- Ethical-score methodology page.
- Legal/disclosure pages.
- Guided Envestors demonstration mode.
- Visible prototype disclaimers.

## Demo Accounts

These are simulated quick-login accounts:

| Role | Email | Password |
| --- | --- | --- |
| Consumer | consumer@neeyat.demo | Demo123! |
| Influencer | influencer@neeyat.demo | Demo123! |
| Business | business@neeyat.demo | Demo123! |
| Administrator | admin@neeyat.demo | Demo123! |

## Local Preview

Open `index.html` directly in a browser.

Or run a simple local server:

```powershell
cd "C:\Users\USER\Downloads\Codex\neeyat-web-app"
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Deploy to GitHub Pages

1. Upload all files in this folder to the GitHub repository.
2. Go to repository `Settings > Pages`.
3. Select `Deploy from a branch`.
4. Select branch `main` and folder `/root`.
5. Wait for GitHub Pages to rebuild.

Live site:

```text
https://malihazohebuk-neeyat.github.io/neeyat-web-app/
```

## Simulated Data and Disclaimers

The following are illustrative only:

- Product data.
- Retailer prices.
- Delivery charges.
- Affiliate commission rates.
- Ethical scores.
- Certifications.
- Influencer metrics.
- Business analytics.
- Admin platform metrics.
- Subscription and commercial calculations.

The prototype does not provide regulated financial advice and does not claim that products are certified ethical, guaranteed sustainable, independently audited or connected to real-time data.

## Future Full-Stack Build

The supplied master prompt describes a future full-stack version using:

- Next.js with TypeScript.
- React.
- Tailwind CSS.
- Prisma ORM.
- PostgreSQL.
- Auth.js / NextAuth.
- Zod.
- React Hook Form.
- Recharts.
- Seeded database records.
- API routes or server actions.
- Vercel deployment.

That full-stack version would add secure authentication, database persistence, protected role routes, forms connected to server-side validation, real deployment environment variables and automated tests.

## Suggested Demo Sequence

1. Homepage: explain the problem and product positioning.
2. Guided demo: open the Envestors demonstration mode.
3. Product search: show filters and product ranking.
4. Product detail: show retailer price comparison and ethical-score breakdown.
5. Consumer dashboard: change values and explain personal-match scoring.
6. Influencer marketplace: show creator-led commerce.
7. Business dashboard: show B2B SaaS value.
8. Admin dashboard: show moderation and commercial model.
9. Methodology: explain transparency and limitations.

