# Technical Architecture

## Current GitHub Pages Demo

The current Neeyat demo is a static single-page application:

- `index.html` provides the shell, navigation and script loading.
- `styles.css` provides responsive styling and brand presentation.
- `data.js` contains seeded demo data.
- `app.js` contains routing, rendering, scoring, filtering, comparison and role dashboard logic.
- `assets/` contains Neeyat logo and favicon assets.

No backend services are active in this static version.

## Future Full-Stack Architecture

Recommended production/demo architecture:

- Next.js with TypeScript.
- PostgreSQL hosted on Neon or Supabase.
- Prisma ORM.
- Auth.js for authentication.
- Zod and React Hook Form for validation.
- Recharts for analytics.
- Vercel for deployment.
- Server-side role authorisation for consumer, influencer, business and admin users.

## Future Integration Points

- Affiliate network APIs.
- Retailer product feeds.
- Certification databases.
- Carbon-data providers.
- Stripe billing.
- Email notifications.
- Analytics providers.
- AI-assisted ethical-data interpretation.
- Browser extension and mobile apps.

