# Neeyat Web App

Neeyat is a prototype web app for ethical money decisions. It helps users compare financial, shopping, energy, and giving choices using ethical preferences, affordability, transparency, and impact scoring.

## Free Hosting Options

### Recommended: GitHub Pages

Best when you want a free permanent public URL and simple updates.

1. Create a free GitHub account if needed.
2. Create a new repository named `neeyat-web-app`.
3. Upload the contents of this folder.
4. Go to `Settings > Pages`.
5. Under `Build and deployment`, select:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. GitHub will publish the app at:
   `https://YOUR-USERNAME.github.io/neeyat-web-app/`

### Alternative: Netlify Drop

Best for the fastest no-code deployment.

1. Go to Netlify Drop.
2. Drag this whole `neeyat-web-app` folder into the upload area.
3. Netlify gives you a free public link immediately.
4. You can rename the site after creating a free Netlify account.

### Alternative: Vercel

Best if the app later becomes a React/Next.js product.

1. Create a free Vercel account.
2. Import a GitHub repository containing this folder.
3. Use default static-site settings.

## Local Preview

Open `index.html` directly in a browser, or run a simple static server from this folder:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Current Prototype Features

- Ethical preference sliders
- Category filtering
- Recommendation scoring
- Shortlist and compare view
- Decision coach
- Personal impact view
- B2B insights screen
- Neeyat logo and favicon assets

