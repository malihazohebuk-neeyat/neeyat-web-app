const data = window.NEEYAT_DATA;
const app = document.querySelector("#app");

const state = {
  route: location.hash.replace("#", "") || "home",
  user: null,
  query: "",
  category: "All",
  maxPrice: 250,
  minScore: 0,
  sort: "match",
  compare: [],
  saved: ["prod-01", "prod-10"],
  preferences: {
    climate: 85,
    labour: 80,
    transparency: 88,
    packaging: 72,
    evidence: 76,
    affordability: 55,
  },
  demoStep: 0,
};

const weights = {
  environment: 0.3,
  labour: 0.25,
  governance: 0.2,
  responsibility: 0.15,
  evidence: 0.1,
};

function money(value) {
  return `£${Number(value).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
}

function ethicalScore(product) {
  const score =
    product.scores.environment * weights.environment +
    product.scores.labour * weights.labour +
    product.scores.governance * weights.governance +
    product.scores.responsibility * weights.responsibility +
    product.scores.evidence * weights.evidence;
  return Math.round(score);
}

function scoreBand(score) {
  if (score >= 80) return "Leading";
  if (score >= 65) return "Strong";
  if (score >= 50) return "Developing";
  if (score >= 35) return "Limited";
  return "High concern";
}

function confidence(product) {
  let value = 45 + product.dataPoints * 4;
  if (product.verified) value += 14;
  if (product.selfReported) value -= 10;
  if (product.reviewedDaysAgo < 45) value += 8;
  if (value >= 78) return "High confidence";
  if (value >= 58) return "Moderate confidence";
  return "Limited confidence";
}

function retailerListings(product) {
  return data.retailers.map((retailer, index) => {
    const price = Math.max(2, product.basePrice + ((index - 2) * 2.65) + (product.id.length % 3));
    const delivery = index % 2 === 0 ? 2.99 : 0;
    return {
      retailer,
      price,
      previous: price + 4 + index,
      delivery,
      total: price + delivery,
      estimate: `${2 + index}-${4 + index} days`,
      stock: index === 4 ? "Low stock" : "In stock",
      commission: `${4 + index}%`,
      updated: `${12 + index} mins ago`,
    };
  });
}

function personalMatch(product) {
  const prefs = state.preferences;
  const weighted =
    (100 - Math.abs(product.scores.environment - prefs.climate)) * 0.24 +
    (100 - Math.abs(product.scores.labour - prefs.labour)) * 0.21 +
    (100 - Math.abs(product.scores.governance - prefs.transparency)) * 0.18 +
    (100 - Math.abs(product.scores.responsibility - prefs.packaging)) * 0.15 +
    (100 - Math.abs(product.scores.evidence - prefs.evidence)) * 0.12;
  const cheapest = Math.min(...retailerListings(product).map((item) => item.total));
  const affordability = Math.max(0, 100 - (cheapest / Math.max(state.maxPrice, 1)) * 100);
  return Math.round(weighted + affordability * (prefs.affordability / 100) * 0.1);
}

function bestValueListing(product) {
  const listings = retailerListings(product).sort((a, b) => a.total - b.total);
  const ethicalValue = listings
    .map((listing, index) => ({
      ...listing,
      valueScore: Math.round(ethicalScore(product) - listing.total * 0.12 + (index === 0 ? 6 : 0)),
    }))
    .sort((a, b) => b.valueScore - a.valueScore)[0];
  return { cheapest: listings[0], ethicalValue };
}

function recommendationReason(product) {
  const strongest = Object.entries(product.scores).sort((a, b) => b[1] - a[1])[0];
  const labels = {
    environment: "environmental impact",
    labour: "fair labour and sourcing",
    governance: "transparency",
    responsibility: "packaging responsibility",
    evidence: "evidence quality",
  };
  if (product.match >= 88) return `Recommended because it closely matches your values and has strong ${labels[strongest[0]]}.`;
  if (product.lowest < 15) return "Recommended as a low-cost ethical swap with clear comparison value.";
  if (product.scores.governance >= 80) return "Recommended because it has stronger transparency than similar options.";
  return `Recommended because ${labels[strongest[0]]} is one of its strongest signals.`;
}

function intelligenceSummary(product) {
  const { cheapest, ethicalValue } = bestValueListing(product);
  return {
    cheapest,
    ethicalValue,
    signals: [
      `${product.reviewStatus}`,
      `${product.packaging}`,
      `${product.origin} supply route`,
      `${confidence(product)}`,
    ],
  };
}

function filteredProducts() {
  const q = state.query.toLowerCase();
  return data.products
    .map((product) => ({
      ...product,
      ethical: ethicalScore(product),
      match: personalMatch(product),
      lowest: Math.min(...retailerListings(product).map((item) => item.total)),
      confidence: confidence(product),
    }))
    .filter((product) => state.category === "All" || product.category === state.category)
    .filter((product) => !q || `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(q))
    .filter((product) => product.lowest <= state.maxPrice)
    .filter((product) => product.ethical >= state.minScore)
    .sort((a, b) => {
      if (state.sort === "price") return a.lowest - b.lowest;
      if (state.sort === "ethical") return b.ethical - a.ethical;
      if (state.sort === "popular") return b.dataPoints - a.dataPoints;
      return b.match - a.match;
    });
}

function route(to) {
  state.route = to;
  location.hash = to;
  document.querySelector("#siteNav")?.classList.remove("open");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function page(title, body) {
  app.innerHTML = body;
  app.focus();
  document.title = `${title} | Neeyat`;
}

function disclaimer() {
  return `<div class="notice"><strong>Prototype notice:</strong> Product, retailer, certification, pricing, score, analytics and earnings data are illustrative demonstration data. Neeyat does not provide regulated financial advice.</div>`;
}

function appStatus() {
  return `<div class="mobile-status"><span>9:41</span><span></span><span>•••</span></div>`;
}

function mobileIcon(key) {
  const icons = {
    home: "⌂",
    search: "⌕",
    impact: "♧",
    wishlist: "♡",
    profile: "♙",
  };
  return icons[key] || "•";
}

function mobileBottomNav(active = "home") {
  const items = [
    ["home", "Home", "home"],
    ["products", "Search", "search"],
    ["methodology", "Impact", "impact"],
    ["consumer", "Wishlist", "wishlist"],
    ["businessDashboard", "Profile", "profile"],
  ];
  return `<nav class="mobile-bottom-nav" aria-label="Mobile app navigation">
    ${items.map(([target, label, key]) => `<button class="${active === key ? "active" : ""}" data-route="${target}"><span>${mobileIcon(key)}</span>${label}</button>`).join("")}
  </nav>`;
}

function mobileHomeExperience() {
  const recommended = filteredProducts().slice(0, 3);
  const categories = [
    ["Fashion", "Coat"],
    ["Beauty", "Bottle"],
    ["Home", "Chair"],
    ["Electronics", "Audio"],
  ];
  return `<section class="mobile-app-screen mobile-only">
    ${appStatus()}
    <header class="mobile-app-header">
      <button class="icon-button" aria-label="Menu">☰</button>
      <img src="assets/neeyat-logo-web.png" alt="Neeyat" />
      <button class="icon-button" aria-label="Notifications">♧</button>
    </header>
    <div class="mobile-greeting">
      <span>Good morning,</span>
      <strong>Aisha 👋</strong>
    </div>
    <label class="mobile-search">
      <span class="sr-only">Search products, brands or categories</span>
      <input placeholder="Search products, brands or categories" />
      <button data-route="products" aria-label="Search">⌕</button>
    </label>
    <article class="mobile-impact-card">
      <div>
        <h3>Your Impact Today</h3>
        <p>Your choices are creating a better tomorrow.</p>
        <div class="mobile-impact-metrics">
          <span><strong>2.4 kg</strong> CO2 Saved</span>
          <span><strong>4.6 /5</strong> Ethical Score Avg.</span>
        </div>
      </div>
      <div class="leaf-mark" aria-hidden="true"></div>
    </article>
    <div class="mobile-section-row"><h3>Popular Categories</h3><button data-route="products">See all</button></div>
    <div class="mobile-category-row">
      ${categories.map(([label, text]) => `<button data-route="products"><span>${text}</span>${label}</button>`).join("")}
    </div>
    <div class="mobile-section-row"><h3>Recommended for You</h3><button data-route="products">See all</button></div>
    <div class="mobile-product-row">
      ${recommended.map((product) => `<button class="mobile-product-tile" data-detail="${product.id}"><img src="${product.image}" alt="${product.name}" /><span>${product.name}</span></button>`).join("")}
    </div>
    ${mobileBottomNav("home")}
  </section>`;
}

function heroMockup() {
  const products = filteredProducts().slice(0, 3);
  return `<div class="app-mockup" aria-label="App interface mockup">
    <div class="mock-header"><span></span><span></span><span></span></div>
    ${products
      .map(
        (product) => `<div class="mock-row"><strong>${product.name}</strong><span>${money(product.lowest)}</span><meter min="0" max="100" value="${product.ethical}"></meter></div>`,
      )
      .join("")}
  </div>`;
}

function renderHome() {
  page(
    "Home",
    `${mobileHomeExperience()}
    <section class="hero desktop-hero">
      <div class="hero-copy">
        <span class="eyebrow">AI-Powered Ethical Commerce Intelligence</span>
        <h1>Compare the Price. Understand the Impact.</h1>
        <p>Neeyat combines shopping value, ethical scoring, price comparison, influencer recommendations and B2B transparency tools in one demonstration platform.</p>
        <div class="brand-principles">
          <span>Transparent</span><span>Values-led</span><span>Commercially practical</span>
        </div>
        <div class="hero-actions">
          <button class="primary" data-route="login">Explore the Demo</button>
          <button class="secondary" data-route="business">For Businesses</button>
        </div>
      </div>
      ${heroMockup()}
    </section>
    ${disclaimer()}
    <section class="grid three">
      ${featureCard("Price comparison", "Compare simulated retailer prices, delivery charges, stock and total checkout estimates.")}
      ${featureCard("Ethical intelligence", "Review programmatically calculated environmental, labour, governance, packaging and evidence scores.")}
      ${featureCard("Personalisation", "Adjust your values and watch match scores change without claiming production-trained machine learning.")}
    </section>
    <section class="section">
      <div class="section-head"><div><h2>How Neeyat Works</h2><p>A guided journey from search to value-aligned purchasing.</p></div></div>
      <div class="steps">
        ${["Search for a product", "Compare prices", "Review ethical score", "Personalise values", "Select a retailer", "Track impact"].map((item, i) => `<div><span>${i + 1}</span><strong>${item}</strong></div>`).join("")}
      </div>
    </section>
    <section class="grid two">
      ${featureCard("Influencer commerce", "Fictional creators curate transparent collections with illustrative click, conversion and commission metrics.")}
      ${featureCard("B2B dashboard", "Brands can review consumer interest, profile completeness, sponsored listings and improvement suggestions.")}
    </section>`,
  );
}

function featureCard(title, text) {
  return `<article class="card"><h3>${title}</h3><p>${text}</p></article>`;
}

function renderHow() {
  page(
    "How It Works",
    `<section class="section narrow">
      <span class="eyebrow">Customer journey</span>
      <h1>From product search to more transparent choices.</h1>
      <p>Neeyat’s demo shows how a consumer can compare price, ethical indicators, certifications, retailer options and personal priorities in a single flow.</p>
      ${disclaimer()}
      <div class="journey">
        ${[
          ["Search", "Find products across categories using filters for price, ethics, retailer and certification."],
          ["Compare", "Review simulated retailer listings, delivery charges, stock status and affiliate disclosures."],
          ["Score", "Understand weighted ethical components and data-confidence limitations."],
          ["Personalise", "Change priorities such as climate, labour, transparency, packaging and affordability."],
          ["Choose", "Open a retailer option with clear disclosure that links and prices are demonstration data."],
          ["Track", "Review illustrative savings, saved products and impact trends."],
        ].map(([h, p]) => `<article class="card"><h3>${h}</h3><p>${p}</p></article>`).join("")}
      </div>
    </section>`,
  );
}

function productCard(product) {
  const intel = intelligenceSummary(product);
  return `<article class="product-card">
    <img src="${product.image}" alt="Illustrative image for ${product.name}" />
    <div class="product-body">
      <div class="product-top"><span>${product.category}</span><strong>${product.brand}</strong></div>
      <h3>${product.name}</h3>
      <p>${product.summary}</p>
      <div class="ai-reason"><strong>Neeyat insight</strong><span>${recommendationReason(product)}</span></div>
      <div class="score-row">
        <span><strong>${product.ethical}</strong> ${scoreBand(product.ethical)}</span>
        <span><strong>${product.match}</strong> match</span>
        <span><strong>${money(intel.cheapest.total)}</strong> delivered</span>
      </div>
      <div class="signal-row">
        ${intel.signals.slice(0, 3).map((signal) => `<span>${signal}</span>`).join("")}
      </div>
      <div class="pill-row">${product.certifications.map((item) => `<span>${item}</span>`).join("")}</div>
      <div class="card-actions">
        <button class="secondary" data-detail="${product.id}">Details</button>
        <button class="secondary" data-compare="${product.id}">${state.compare.includes(product.id) ? "In compare" : "Compare"}</button>
        <button class="secondary" data-save="${product.id}">${state.saved.includes(product.id) ? "Saved" : "Save"}</button>
      </div>
    </div>
  </article>`;
}

function renderProducts() {
  const products = filteredProducts();
  page(
    "Product Search",
    `<section class="section app-page search-page">
      <div class="mobile-page-top mobile-only">
        ${appStatus()}
        <header><button class="icon-button" data-route="home">←</button><strong>Search Neeyat</strong><button class="icon-button">♡</button></header>
      </div>
      <div class="section-head">
        <div><span class="eyebrow">Consumer application</span><h1>Search and compare ethical products.</h1></div>
        <button class="primary" data-route="consumer">Consumer Dashboard</button>
      </div>
      ${disclaimer()}
      <div class="intelligence-strip">
        ${metric("Products scored", data.products.length)}
        ${metric("Retailer listings", data.products.length * data.retailers.length)}
        ${metric("Scoring components", 5)}
        ${metric("AI-ready signals", "Price + Ethics + Values")}
      </div>
      <div class="filters">
        <label>Search<input id="searchInput" value="${state.query}" placeholder="Search products, brands or categories" /></label>
        <label>Category<select id="categoryFilter"><option>All</option>${data.categories.map((cat) => `<option ${cat === state.category ? "selected" : ""}>${cat}</option>`).join("")}</select></label>
        <label>Max delivered price<input id="priceFilter" type="range" min="4" max="250" value="${state.maxPrice}" /><span>${money(state.maxPrice)}</span></label>
        <label>Minimum ethical score<input id="scoreFilter" type="range" min="0" max="100" value="${state.minScore}" /><span>${state.minScore}</span></label>
        <label>Sort<select id="sortFilter"><option value="match">Values match</option><option value="price">Lowest price</option><option value="ethical">Ethical score</option><option value="popular">Popularity</option></select></label>
      </div>
      <div class="results-meta">${products.length} products shown from 30 seeded demo products.</div>
      <div class="product-grid">${products.map(productCard).join("")}</div>
    </section>
    ${comparePanel()}
    <div class="mobile-only">${mobileBottomNav("search")}</div>`,
  );
  document.querySelector("#sortFilter").value = state.sort;
}

function comparePanel() {
  const items = state.compare.map((id) => data.products.find((p) => p.id === id)).filter(Boolean);
  return `<section class="section">
    <div class="section-head"><div><h2>Comparison tray</h2><p>Compare up to four products side by side.</p></div></div>
    <div class="table-wrap"><table><thead><tr><th>Product</th><th>Lowest delivered</th><th>Ethical</th><th>Environment</th><th>Labour</th><th>Governance</th><th>Confidence</th></tr></thead>
    <tbody>${items.length ? items.map((p) => `<tr><td>${p.name}</td><td>${money(Math.min(...retailerListings(p).map((l) => l.total)))}</td><td>${ethicalScore(p)}</td><td>${p.scores.environment}</td><td>${p.scores.labour}</td><td>${p.scores.governance}</td><td>${confidence(p)}</td></tr>`).join("") : `<tr><td colspan="7">Add products to compare.</td></tr>`}</tbody></table></div>
  </section>`;
}

function renderProductDetail(id) {
  const product = data.products.find((p) => p.id === id) || data.products[0];
  const listings = retailerListings(product).sort((a, b) => a.total - b.total);
  const intel = intelligenceSummary(product);
  page(
    product.name,
    `<section class="section app-page detail-page">
      <div class="mobile-page-top mobile-only">
        ${appStatus()}
        <header><button class="icon-button" data-route="products">←</button><strong>Product Details</strong><button class="icon-button">♡</button></header>
      </div>
      <button class="secondary" data-route="products">Back to search</button>
      <div class="detail-layout">
        <img class="detail-image" src="${product.image}" alt="Illustrative product image for ${product.name}" />
        <div>
          <span class="eyebrow">${product.category} / ${product.brand}</span>
          <h1>${product.name}</h1>
          <p>${product.summary}</p>
          <div class="score-cards">
            ${metric("Ethical score", `${ethicalScore(product)} - ${scoreBand(ethicalScore(product))}`)}
            ${metric("Personal match", personalMatch(product))}
            ${metric("Data confidence", confidence(product))}
          </div>
          <div class="commerce-intelligence">
            <h2>Neeyat Commerce Intelligence</h2>
            <div class="intel-grid">
              <span><strong>Lowest delivered</strong>${money(intel.cheapest.total)} via ${intel.cheapest.retailer}</span>
              <span><strong>Best ethical value</strong>${intel.ethicalValue.retailer} (${intel.ethicalValue.valueScore}/100)</span>
              <span><strong>Review status</strong>${product.reviewStatus}</span>
              <span><strong>Origin</strong>${product.origin}</span>
            </div>
            <p>${recommendationReason({ ...product, lowest: intel.cheapest.total, match: personalMatch(product) })}</p>
          </div>
          <div class="pill-row">${product.certifications.map((item) => `<span>${item}</span>`).join("")}</div>
        </div>
      </div>
      ${disclaimer()}
      <div class="grid two">
        <article class="card">
          <h2>Ethical score breakdown</h2>
          ${scoreBar("Environmental impact", product.scores.environment, 30)}
          ${scoreBar("Labour and sourcing", product.scores.labour, 25)}
          ${scoreBar("Governance and transparency", product.scores.governance, 20)}
          ${scoreBar("Product and packaging", product.scores.responsibility, 15)}
          ${scoreBar("Certification and evidence", product.scores.evidence, 10)}
        </article>
        <article class="card">
          <h2>Influencer recommendations</h2>
          ${data.influencers.slice(0, 3).map((i) => `<p><strong>${i.name}</strong> recommends this for ${i.focus.toLowerCase()}. Creator fit: ${product.creatorFit}. Affiliate disclosure applies.</p>`).join("")}
        </article>
      </div>
      <section class="section flush">
        <h2>Evidence and Transparency</h2>
        <div class="grid three">
          ${featureCard("Supply route", `${product.origin} route shown as demonstration data for future source-chain records.`)}
          ${featureCard("Packaging", `${product.packaging} indicator used in the product responsibility score.`)}
          ${featureCard("Data status", `${product.reviewStatus}. Confidence is based on demo evidence-point logic.`)}
        </div>
      </section>
      <section class="section flush">
        <h2>Retailer price comparison</h2>
        <div class="table-wrap"><table><thead><tr><th>Retailer</th><th>Price</th><th>Delivery</th><th>Total</th><th>Stock</th><th>Commission</th><th>Updated</th><th></th></tr></thead><tbody>
          ${listings.map((l, index) => `<tr><td>${l.retailer}</td><td>${money(l.price)}</td><td>${money(l.delivery)}</td><td><strong>${money(l.total)}</strong></td><td>${l.stock}</td><td>${l.commission}</td><td>${l.updated}</td><td><button class="primary small">Demo buy</button></td></tr>`).join("")}
        </tbody></table></div>
      </section>
      <div class="mobile-only">${mobileBottomNav("search")}</div>
    </section>`,
  );
}

function scoreBar(label, value, weight) {
  return `<div class="score-bar"><div><strong>${label}</strong><span>${value}/100 - ${weight}% weight</span></div><meter min="0" max="100" value="${value}"></meter></div>`;
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderLogin() {
  page(
    "Login",
    `<section class="section narrow">
      <span class="eyebrow">Demo access</span>
      <h1>Choose a role to explore Neeyat.</h1>
      <p>These quick-login buttons simulate authentication for the GitHub Pages prototype. A production build would use secure server-side authentication.</p>
      <div class="grid two">${data.accounts.map((account) => `<article class="card"><h3>${account.role}</h3><p>${account.email}<br />Password: ${account.password}</p><button class="primary" data-login="${account.email}">Quick Login</button></article>`).join("")}</div>
    </section>`,
  );
}

function renderConsumer() {
  const saved = state.saved.map((id) => data.products.find((p) => p.id === id)).filter(Boolean);
  page(
    "Consumer Dashboard",
    `<section class="section app-page wishlist-page">
      <div class="mobile-page-top mobile-only">
        ${appStatus()}
        <header><button class="icon-button" data-route="home">←</button><strong>Wishlist</strong><button class="icon-button">♧</button></header>
      </div>
      <div class="section-head"><div><span class="eyebrow">Consumer dashboard</span><h1>Welcome back, ${state.user?.name || "Maliha"}.</h1></div><button class="secondary" data-route="products">Search products</button></div>
      ${disclaimer()}
      <div class="grid four">
        ${metric("Purchases reviewed", 18)}
        ${metric("Estimated savings", "£124")}
        ${metric("Average ethical score", 82)}
        ${metric("Saved products", saved.length)}
      </div>
      <section class="card">
        <h2>Personal values profile</h2>
        <div class="value-grid">
          ${Object.entries(state.preferences).map(([key, value]) => `<label>${key}<input type="range" min="0" max="100" value="${value}" data-pref="${key}" /><span>${value}</span></label>`).join("")}
        </div>
      </section>
      <section class="section flush"><h2>Saved products</h2><div class="product-grid">${saved.map((p) => productCard({ ...p, ethical: ethicalScore(p), match: personalMatch(p), lowest: Math.min(...retailerListings(p).map((l) => l.total)) })).join("")}</div></section>
      <div class="mobile-only">${mobileBottomNav("wishlist")}</div>
    </section>`,
  );
}

function renderInfluencers() {
  page(
    "Influencers",
    `<section class="section app-page influencer-page">
      <div class="mobile-page-top mobile-only">
        ${appStatus()}
        <header><button class="icon-button" data-route="home">←</button><strong>Influencer Picks</strong><button class="icon-button">♡</button></header>
      </div>
      <div class="section-head"><div><span class="eyebrow">Influencer marketplace</span><h1>Ethical storefronts and tracked recommendations.</h1></div><button class="primary" data-route="influencerDashboard">Influencer dashboard</button></div>
      ${disclaimer()}
      <article class="mobile-creator-card mobile-only">
        <img src="${creatorImage()}" alt="Illustrative ethical influencer recommendation" />
        <div>
          <h3>Sustainable Skincare</h3>
          <p>By @greenwithsara</p>
          <button class="primary small" data-route="products">Shop Now</button>
        </div>
      </article>
      <div class="grid four">${data.influencers.map((i) => `<article class="card"><h3>${i.name}</h3><p>${i.focus}</p><p>${i.followers} followers - ${i.engagement} engagement</p><span class="tag">${i.verified ? "Verified for platform display" : "Application review pending"}</span><p><strong>Collection:</strong> ${i.collection}</p></article>`).join("")}</div>
      <div class="mobile-only">${mobileBottomNav("home")}</div>
    </section>`,
  );
}

function renderInfluencerDashboard() {
  page(
    "Influencer Dashboard",
    `<section class="section">
      <span class="eyebrow">Influencer dashboard</span><h1>Recommendation performance.</h1>${disclaimer()}
      <div class="grid four">${metric("Clicks", "12,480")}${metric("Conversions", 386)}${metric("Estimated commission", "£1,840")}${metric("Neeyat retained share", "25%")}</div>
      <div class="grid two">${featureCard("Top collection", "Plastic-light weekly shop generated the highest click-through rate this month.")}${featureCard("Ethical-score alert", "Two products need stronger evidence before being promoted more widely.")}</div>
    </section>`,
  );
}

function renderBusiness() {
  page(
    "For Businesses",
    `<section class="section">
      <span class="eyebrow">B2B SaaS</span><h1>Ethical visibility and consumer intelligence for brands.</h1>
      <p>Neeyat helps SMEs submit product transparency data, understand consumer interest, and improve ESG positioning without claiming external certification.</p>
      <div class="grid three">${featureCard("Brand profile management", "Maintain product categories, certifications, labour policies and packaging practices.")}${featureCard("Consumer analytics", "Review searches, saves, clicks and ethical priorities from demonstration data.")}${featureCard("Sponsored listings", "Preview sponsored visibility with clear consumer-facing labels.")}</div>
      <button class="primary" data-route="businessDashboard">View Business Dashboard</button>
    </section>`,
  );
}

function renderBusinessDashboard() {
  const a = data.businessAnalytics;
  page(
    "Business Dashboard",
    `<section class="section app-page business-mobile-page">
      <div class="mobile-page-top mobile-only">
        ${appStatus()}
        <header><strong>Neeyat for Business</strong><button class="icon-button">⋯</button></header>
      </div>
      <span class="eyebrow">Business dashboard</span><h1>KindThread Co. profile.</h1>${disclaimer()}
      <div class="grid four">${metric("Product views", a.views.toLocaleString())}${metric("Saves", a.saves)}${metric("Retailer clicks", a.retailerClicks.toLocaleString())}${metric("CTR", a.ctr)}</div>
      <div class="grid two">
        <article class="card"><h2>Profile completeness</h2><meter min="0" max="100" value="${a.profileCompleteness}"></meter><p>${a.profileCompleteness}% complete. Add product-level origin information to improve transparency.</p></article>
        <article class="card"><h2>Ethical improvement recommendations</h2><ul><li>Improve supply-chain disclosure.</li><li>Add evidence supporting labour policies.</li><li>Provide packaging data by SKU.</li><li>Renew expired certification references.</li></ul></article>
      </div>
      <div class="mobile-only">${mobileBottomNav("profile")}</div>
    </section>`,
  );
}

function renderAdmin() {
  const s = data.adminStats;
  page(
    "Admin",
    `<section class="section">
      <span class="eyebrow">Administrator</span><h1>Platform operations and moderation.</h1>${disclaimer()}
      <div class="grid four">${metric("Users", s.users.toLocaleString())}${metric("Products", s.products)}${metric("Retailer listings", s.retailerListings.toLocaleString())}${metric("Affiliate clicks", s.affiliateClicks.toLocaleString())}</div>
      <div class="grid two">
        <article class="card"><h2>Product moderation</h2><p>Approve, reject, request evidence, flag claims and record moderation notes.</p><button class="primary">Approve selected demo record</button></article>
        <article class="card"><h2>Commercial model</h2><p>Consumer plans, affiliate commissions, B2B SaaS and sponsored campaign values are shown as illustrative revenue logic.</p><ul><li>Basic+: £3.99/mo</li><li>Premium: £7.99/mo</li><li>Business Growth: £99/mo</li><li>Neeyat commission retention: 20%-30%</li></ul></article>
      </div>
    </section>`,
  );
}

function renderPricing() {
  page(
    "Pricing",
    `<section class="section">
      <span class="eyebrow">Commercial model</span><h1>Pricing designed for consumers, brands and sponsored visibility.</h1>
      ${disclaimer()}
      <div class="grid three">
        ${priceCard("Free", "£0", ["Search", "Basic ethical overview", "Save limited products"])}
        ${priceCard("Basic+", "£3.99/mo", ["Expanded scoring", "Watchlist", "Price-change simulation"])}
        ${priceCard("Premium", "£7.99/mo", ["Advanced personalisation", "Impact trends", "Ad-free browsing"])}
      </div>
      <div class="grid three">
        ${priceCard("Starter", "£49/mo", ["Brand profile", "Basic analytics", "5 product records"])}
        ${priceCard("Growth", "£99/mo", ["Consumer insights", "Sponsored preview", "25 product records"])}
        ${priceCard("Advanced", "£199/mo", ["Deeper ESG tools", "Campaign analytics", "Priority review"])}
      </div>
    </section>`,
  );
}

function renderBrand() {
  page(
    "Brand Guidelines",
    `<section class="section">
      <div class="section-head">
        <div>
          <span class="eyebrow">Brand system</span>
          <h1>Neeyat brand guidelines.</h1>
          <p>A premium ethical-commerce identity built around trust, clarity, restraint and intelligent decision-making.</p>
        </div>
        <img class="brand-sample-logo" src="assets/neeyat-logo-web.png" alt="Neeyat logo" />
      </div>
      <div class="grid three">
        ${featureCard("Brand promise", "Make ethical money decisions easier by combining price, transparency, evidence and personal values.")}
        ${featureCard("Personality", "Calm, intelligent, transparent, practical and quietly premium. Avoid preachy or exaggerated sustainability language.")}
        ${featureCard("Voice", "Use plain English, explain trade-offs, disclose limitations and guide users towards informed choices.")}
      </div>
      <section class="section flush">
        <h2>Colour Palette</h2>
        <div class="swatch-grid">
          ${swatch("Neeyat Ivory", "#fbfaf4", "Primary background")}
          ${swatch("Soft Cream", "#f3eddf", "Section warmth")}
          ${swatch("Trust Green", "#254536", "Primary action and authority")}
          ${swatch("Muted Sage", "#8da58b", "Support and calm states")}
          ${swatch("Restrained Gold", "#c8a24b", "Premium accent")}
          ${swatch("Aqua Signal", "#54c2b2", "Data and positive insight")}
          ${swatch("Rose Caution", "#c96d5c", "Warnings and risk")}
          ${swatch("Ink Black", "#151613", "Text and logo contrast")}
        </div>
      </section>
      <div class="grid two">
        <article class="card">
          <h2>Logo Usage</h2>
          <p>Use the cropped transparent web logo in headers and formal product screens. Use the circular favicon mark for browser tabs, compact identity, and social previews.</p>
          <div class="logo-usage">
            <img src="assets/neeyat-logo-web.png" alt="Neeyat web logo" />
            <img src="assets/favicon.png" alt="Neeyat favicon" />
          </div>
        </article>
        <article class="card">
          <h2>Product UI Rules</h2>
          <ul>
            <li>Show disclaimers wherever data is simulated or evidence quality varies.</li>
            <li>Always pair ethical scores with explanation and confidence.</li>
            <li>Use premium restraint: fewer colours, generous spacing and clear hierarchy.</li>
            <li>Never claim certification, live pricing or regulated financial advice unless implemented and evidenced.</li>
          </ul>
        </article>
      </div>
      <section class="card">
        <h2>Messaging Pillars</h2>
        <div class="steps brand-steps">
          <div><span>1</span><strong>Price clarity</strong><p>Help users understand total cost, delivery and value.</p></div>
          <div><span>2</span><strong>Ethical evidence</strong><p>Surface score components, confidence and limitations.</p></div>
          <div><span>3</span><strong>Personal fit</strong><p>Respect that ethical priorities differ by person and budget.</p></div>
          <div><span>4</span><strong>Commercial maturity</strong><p>Show B2B, affiliate and sponsored models transparently.</p></div>
        </div>
      </section>
    </section>`,
  );
}

function swatch(name, value, usage) {
  return `<article class="swatch"><span style="background:${value}"></span><strong>${name}</strong><code>${value}</code><p>${usage}</p></article>`;
}

function priceCard(name, price, items) {
  return `<article class="card price-card"><h3>${name}</h3><strong>${price}</strong><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul><button class="secondary">Demo only</button></article>`;
}

function renderMethodology() {
  page(
    "Methodology",
    `<section class="section narrow app-page impact-page">
      <div class="mobile-page-top mobile-only">
        ${appStatus()}
        <header><button class="icon-button" data-route="home">←</button><strong>Ethical Impact Score</strong><button class="icon-button">ⓘ</button></header>
      </div>
      <span class="eyebrow">Ethical-score methodology</span><h1>Transparent prototype scoring.</h1>
      <p>The overall score is calculated programmatically from weighted components. It is a demonstration output, not a legal certification, audit, or guarantee.</p>
      <div class="mobile-score-summary mobile-only">
        <div class="score-donut"><strong>4.7</strong><span>/5</span></div>
        <h2>Great Choice</h2>
        <p>This product has a positive impact.</p>
      </div>
      ${disclaimer()}
      <div class="card">
        ${scoreBar("Environmental impact", 86, 30)}
        ${scoreBar("Labour and sourcing", 80, 25)}
        ${scoreBar("Governance and transparency", 78, 20)}
        ${scoreBar("Product and packaging responsibility", 84, 15)}
        ${scoreBar("Certification and evidence quality", 74, 10)}
      </div>
      <div class="grid two">${featureCard("Confidence logic", "Confidence depends on data points, evidence recency, third-party verification, missing information and self-reported data.")}${featureCard("Limitations", "Future integrations may include affiliate networks, retailer feeds, certification databases, carbon-data providers and Stripe billing.")}</div>
      <div class="mobile-only">${mobileBottomNav("impact")}</div>
    </section>`,
  );
}

const demoSteps = [
  ["Consumer search", "Search products and apply price or ethical filters.", "products"],
  ["Retailer comparison", "Open a product detail page to review retailer price options.", "detail:prod-01"],
  ["Ethical breakdown", "Review weighted score components and confidence labels.", "methodology"],
  ["Personal values", "Change consumer sliders and observe match-score recalculation.", "consumer"],
  ["Influencer collection", "View fictional influencer storefronts and affiliate disclosures.", "influencers"],
  ["Business dashboard", "Review B2B analytics and ethical improvement recommendations.", "businessDashboard"],
  ["Admin moderation", "Inspect moderation, commercial model and platform metrics.", "admin"],
  ["Future roadmap", "Review future integrations and prototype limitations.", "sources"],
];

function renderDemo() {
  const [title, copy, target] = demoSteps[state.demoStep];
  page(
    "Neeyat Product Demonstration",
    `<section class="section narrow">
      <span class="tag">Functional Prototype - Demonstration Data</span>
      <h1>Neeyat Product Demonstration</h1>
      <div class="card demo-card">
        <span class="eyebrow">Step ${state.demoStep + 1} of ${demoSteps.length}</span>
        <h2>${title}</h2>
        <p>${copy}</p>
        <button class="primary" data-demo-target="${target}">Open this step</button>
      </div>
      <div class="demo-controls">
        <button class="secondary" id="prevDemo" ${state.demoStep === 0 ? "disabled" : ""}>Previous step</button>
        <button class="primary" id="nextDemo" ${state.demoStep === demoSteps.length - 1 ? "disabled" : ""}>Next step</button>
      </div>
    </section>`,
  );
}

function renderPolicy(kind) {
  const content = {
    privacy: ["Privacy Policy", "This prototype does not collect real personal data. A production version would require clear consent, data minimisation, retention controls and user rights handling."],
    terms: ["Terms of Use", "This demonstration is for product-development evidence and should not be treated as financial, legal, tax, investment or sustainability advice."],
    affiliate: ["Affiliate Disclosure", "Retailer links, commissions and influencer earnings are illustrative. Sponsored placements must be labelled clearly in production."],
    sources: ["Data Sources and Limitations", "Seeded product, retailer, ESG, certification, carbon, pricing and analytics data are simulated. Future APIs can replace these fixtures."],
  }[kind];
  page(content[0], `<section class="section narrow"><h1>${content[0]}</h1><p>${content[1]}</p>${disclaimer()}${featureCard("IP and security note", "Source code ownership should be contractually assigned to Neeyat. Third-party developers should work under NDA and IP-assignment terms. No secrets should be committed to a repository.")}</section>`);
}

function renderContact() {
  page("Contact", `<section class="section narrow"><h1>Contact and Early Access</h1><form class="contact-form"><label>Name<input required /></label><label>Email<input type="email" required /></label><label>Interest<select><option>Consumer early access</option><option>Business interest</option><option>Influencer interest</option></select></label><label>Message<textarea required></textarea></label><button class="primary">Submit demo enquiry</button></form></section>`);
}

function render() {
  const routeName = state.route;
  if (routeName === "home") return renderHome();
  if (routeName === "how") return renderHow();
  if (routeName === "products") return renderProducts();
  if (routeName.startsWith("detail:")) return renderProductDetail(routeName.split(":")[1]);
  if (routeName === "login") return renderLogin();
  if (routeName === "consumer") return renderConsumer();
  if (routeName === "influencers") return renderInfluencers();
  if (routeName === "influencerDashboard") return renderInfluencerDashboard();
  if (routeName === "business") return renderBusiness();
  if (routeName === "businessDashboard") return renderBusinessDashboard();
  if (routeName === "admin") return renderAdmin();
  if (routeName === "pricing") return renderPricing();
  if (routeName === "brand") return renderBrand();
  if (routeName === "methodology") return renderMethodology();
  if (routeName === "demo") return renderDemo();
  if (["privacy", "terms", "affiliate", "sources"].includes(routeName)) return renderPolicy(routeName);
  if (routeName === "contact") return renderContact();
  return renderHome();
}

document.addEventListener("click", (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    event.preventDefault();
    route(routeButton.dataset.route);
  }
  const detail = event.target.closest("[data-detail]");
  if (detail) route(`detail:${detail.dataset.detail}`);
  const compare = event.target.closest("[data-compare]");
  if (compare) {
    const id = compare.dataset.compare;
    if (state.compare.includes(id)) state.compare = state.compare.filter((item) => item !== id);
    else if (state.compare.length < 4) state.compare.push(id);
    render();
  }
  const save = event.target.closest("[data-save]");
  if (save) {
    const id = save.dataset.save;
    state.saved = state.saved.includes(id) ? state.saved.filter((item) => item !== id) : [...state.saved, id];
    render();
  }
  const login = event.target.closest("[data-login]");
  if (login) {
    state.user = data.accounts.find((account) => account.email === login.dataset.login);
    route(state.user.route);
  }
  const target = event.target.closest("[data-demo-target]");
  if (target) route(target.dataset.demoTarget);
});

document.addEventListener("input", (event) => {
  if (event.target.id === "searchInput") state.query = event.target.value;
  if (event.target.id === "categoryFilter") state.category = event.target.value;
  if (event.target.id === "priceFilter") state.maxPrice = Number(event.target.value);
  if (event.target.id === "scoreFilter") state.minScore = Number(event.target.value);
  if (event.target.id === "sortFilter") state.sort = event.target.value;
  if (event.target.dataset.pref) {
    state.preferences[event.target.dataset.pref] = Number(event.target.value);
  }
  if (["searchInput", "categoryFilter", "priceFilter", "scoreFilter", "sortFilter"].includes(event.target.id) || event.target.dataset.pref) render();
});

document.addEventListener("submit", (event) => {
  if (event.target.matches(".contact-form")) {
    event.preventDefault();
    event.target.innerHTML = `<div class="success"><strong>Demo submission received.</strong><p>This message is not sent to a server in the static prototype.</p></div>`;
  }
});

document.addEventListener("click", (event) => {
  if (event.target.id === "nextDemo") {
    state.demoStep = Math.min(demoSteps.length - 1, state.demoStep + 1);
    renderDemo();
  }
  if (event.target.id === "prevDemo") {
    state.demoStep = Math.max(0, state.demoStep - 1);
    renderDemo();
  }
  if (event.target.id === "menuToggle") {
    document.querySelector("#siteNav").classList.toggle("open");
  }
});

window.addEventListener("hashchange", () => {
  state.route = location.hash.replace("#", "") || "home";
  render();
});

render();
