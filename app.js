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

function confidenceReasons(product) {
  const lowest = Math.min(...retailerListings(product).map((item) => item.total));
  const marketAverage = product.basePrice + 6.5;
  const saving = Math.max(3, Math.round(((marketAverage - lowest) / marketAverage) * 100));
  return [
    `Price is ${saving}% below the estimated category average.`,
    `Brand transparency is ${product.scores.governance >= 80 ? "high" : "improving"} based on the demo evidence profile.`,
    `${product.packaging} packaging signal supports the product responsibility score.`,
    `Estimated impact is below category average with an environment score of ${product.scores.environment}/100.`,
    `Matches your preference profile at ${personalMatch(product)}/100.`,
    `${confidence(product)} because ${product.dataPoints} evidence points are available.`,
  ];
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

function journeyCard(stage, title, text, items = []) {
  return `<article class="journey-card">
    <span>${stage}</span>
    <h3>${title}</h3>
    <p>${text}</p>
    ${items.length ? `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
  </article>`;
}

function moduleList(title, items) {
  return `<article class="module-panel"><h3>${title}</h3><div>${items.map((item) => `<span>${item}</span>`).join("")}</div></article>`;
}

function insightPanel(title, copy, items) {
  return `<article class="insight-panel"><h3>${title}</h3><p>${copy}</p><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul></article>`;
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
  return `<div class="notice"><strong>Demo notice:</strong> Product, retailer, certification, pricing, score, analytics and earnings data are illustrative. Neeyat does not provide regulated financial advice.</div>`;
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
      <strong>Aisha</strong>
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
        <h1>How confident are you about your next purchase?</h1>
        <p>Neeyat helps shoppers compare price, purchase confidence, sustainability signals, brand trust and personal values before buying from a retailer.</p>
        <div class="brand-principles">
          <span>AI purchase confidence</span><span>Price comparison</span><span>Brand trust insights</span><span>Personalised recommendations</span>
        </div>
        <div class="hero-actions">
          <button class="primary" data-route="products">Compare Smarter</button>
          <button class="secondary" data-route="login">Try Demo Accounts</button>
          <button class="secondary" data-route="business">For Businesses</button>
        </div>
      </div>
      ${heroMockup()}
    </section>
    ${disclaimer()}
    <section class="grid three">
      ${featureCard("AI Purchase Confidence", "Every result explains price, evidence, transparency, packaging, origin and values-fit in plain English.")}
      ${featureCard("E-Consumer Intelligence", "Consumer behaviour, preferences, retailer data and brand transparency combine into actionable recommendations.")}
      ${featureCard("Connected Commerce", "Consumers, brands and creators each get focused tools powered by the same purchase-confidence engine.")}
    </section>
    <section class="section">
      <div class="section-head"><div><span class="eyebrow">Platform experience</span><h2>One confidence engine, three public journeys.</h2><p>Neeyat connects ethical product discovery, business transparency tools and trusted creator recommendations in one public-facing experience.</p></div><button class="secondary" data-route="ecosystem">View platform</button></div>
      <div class="ecosystem-grid">
        ${moduleList("Consumers", ["Search", "Compare", "Saved products", "Price alerts", "Confidence analytics", "Preferences"])}
        ${moduleList("Businesses", ["Product management", "Consumer intelligence", "Campaigns", "Reports", "Influencer partnerships"])}
        ${moduleList("Influencers", ["Collections", "AI suggestions", "Revenue", "Audience analytics", "Verification"])}
        ${moduleList("Trust Layer", ["Evidence quality", "Transparent scoring", "Affiliate disclosure", "Clear limitations", "User control"])}
      </div>
    </section>
    <section class="section">
      <div class="section-head"><div><h2>How Neeyat Works</h2><p>A guided journey from search to value-aligned purchasing.</p></div></div>
      <div class="steps">
        ${["Discover", "Build profile", "Search", "Understand score", "Buy through retailer", "Track impact"].map((item, i) => `<div><span>${i + 1}</span><strong>${item}</strong></div>`).join("")}
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
      <h1>From discovery to confident purchase.</h1>
      <p>Neeyat shows how a shopper moves from search, registration and personal values setup into product comparison, AI explanation, purchase redirection and post-purchase impact tracking.</p>
      ${disclaimer()}
      <div class="journey-map">
        ${journeyCard("01", "Discovery", "Entry through search, social, creator links, referrals, ads, browser extension or app store.", ["Product search", "Purchase Confidence Score", "Price comparison", "Sustainability and brand trust"])}
        ${journeyCard("02", "Registration", "Users create an account and identify country, shopping interests and preferred categories.", ["Email", "Google", "Apple", "Microsoft"])}
        ${journeyCard("03", "Personal Intelligence Profile", "The user weights financial, environmental, ethical, geographic, lifestyle and trust priorities.", ["Lowest price", "Fair labour", "Made in UK", "Vegan", "Verified certifications"])}
        ${journeyCard("04", "Dashboard", "Neeyat becomes a personalised shopping command centre.", ["Recent searches", "Saved products", "Price alerts", "Impact dashboard"])}
        ${journeyCard("05", "Product Search", "Results combine product images, retailers, price, confidence, carbon estimate, trust and delivery.", ["Price", "Origin", "Packaging", "Certifications", "Brand trust"])}
        ${journeyCard("06", "AI Explanation", "The score is explained in practical reasons so users understand trade-offs before buying.", ["Below market price", "High transparency", "Recyclable packaging", "Strong satisfaction"])}
        ${journeyCard("07", "Purchase", "Buy buttons redirect to the retailer and affiliate tracking can begin in a production build.", ["Retailer redirect", "Disclosure", "Commission tracking"])}
        ${journeyCard("08", "After Purchase", "Users receive a purchase summary, savings report, recommendation history and impact view.", ["Savings", "Confidence report", "Wishlist updates", "Shopping history"])}
      </div>
    </section>`,
  );
}

function renderEcosystem() {
  page(
    "Platform",
    `<section class="section">
      <span class="eyebrow">Neeyat platform</span>
      <h1>More confident shopping for consumers. Better trust signals for businesses.</h1>
      <p>Neeyat is designed as a connected decision layer for ethical product discovery, brand transparency and creator-led recommendations.</p>
      ${disclaimer()}
      <div class="grid two">
        ${insightPanel("Purchase Confidence Engine", "Neeyat combines practical shopping information with ethical and transparency signals.", ["Retailer price and delivery", "Brand and product data", "Consumer preferences", "Country and packaging", "Reviews and certifications"])}
        ${insightPanel("Decision Outputs", "The platform explains what matters before a user leaves to buy from a retailer.", ["Purchase Confidence Score", "Alternative products", "Business improvement insights", "Influencer suggestions", "Personalised recommendations"])}
      </div>
      <section class="section flush">
        <h2>Public demo areas</h2>
        <div class="ecosystem-grid">
          ${moduleList("Consumer App", ["Home", "Search", "Compare", "Saved Products", "Recommendations", "Shopping History", "Preferences", "Subscription"])}
          ${moduleList("Business SaaS", ["Overview", "Products", "Analytics", "Consumer Intelligence", "Campaigns", "Reports", "Settings"])}
          ${moduleList("Influencer Hub", ["Dashboard", "Collections", "Products", "AI Recommendations", "Analytics", "Revenue"])}
          ${moduleList("Trust Experience", ["Score explanation", "Evidence quality", "Affiliate disclosure", "Data limitations", "User control"])}
        </div>
      </section>
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
          <h2>Purchase confidence breakdown</h2>
          ${scoreBar("Environmental impact", product.scores.environment, 30)}
          ${scoreBar("Labour and sourcing", product.scores.labour, 25)}
          ${scoreBar("Governance and transparency", product.scores.governance, 20)}
          ${scoreBar("Product and packaging", product.scores.responsibility, 15)}
          ${scoreBar("Certification and evidence", product.scores.evidence, 10)}
        </article>
        <article class="card">
          <h2>Why Neeyat recommends this</h2>
          <ul class="reason-list">${confidenceReasons(product).map((reason) => `<li>${reason}</li>`).join("")}</ul>
        </article>
      </div>
      <div class="grid two">
        <article class="card">
          <h2>Influencer recommendations</h2>
          ${data.influencers.slice(0, 3).map((i) => `<p><strong>${i.name}</strong> recommends this for ${i.focus.toLowerCase()}. Creator fit: ${product.creatorFit}. Affiliate disclosure applies.</p>`).join("")}
        </article>
        <article class="card">
          <h2>Alternative products</h2>
          ${filteredProducts().filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3).map((item) => `<button class="alternative-row" data-detail="${item.id}"><span>${item.name}</span><strong>${ethicalScore(item)}/100</strong></button>`).join("")}
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
      <section class="section flush">
        <h2>Post-purchase intelligence preview</h2>
        <div class="grid three">
          ${featureCard("Purchase summary", `Estimated delivered price: ${money(intel.cheapest.total)} through ${intel.cheapest.retailer}.`)}
          ${featureCard("Confidence report", `${confidence(product)} with ${product.dataPoints} evidence points and ${product.reviewStatus.toLowerCase()} status.`)}
          ${featureCard("Impact dashboard", `This item would update savings, category impact, wishlist and recommendation history.`)}
        </div>
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
      <div class="grid four">
        ${metric("Price alerts", 6)}
        ${metric("Recent searches", 14)}
        ${metric("CO2 saved", "2.4kg")}
        ${metric("Favourite brands", 9)}
      </div>
      <section class="card">
        <h2>Personal Consumer Intelligence Profile</h2>
        <p>Adjust the priorities below to simulate how Neeyat creates a unique decision profile for every shopper.</p>
        <div class="value-grid">
          ${Object.entries(state.preferences).map(([key, value]) => `<label>${key}<input type="range" min="0" max="100" value="${value}" data-pref="${key}" /><span>${value}</span></label>`).join("")}
        </div>
      </section>
      <section class="section flush">
        <h2>Dashboard modules</h2>
        <div class="ecosystem-grid">
          ${moduleList("Shopping", ["Recent searches", "Saved products", "Price alerts", "Shopping history"])}
          ${moduleList("Intelligence", ["Recommendations", "Purchase Confidence Analytics", "Impact trends", "Favourite retailers"])}
          ${moduleList("Account", ["Preferences", "Notifications", "Subscription", "Settings"])}
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
      <section class="section flush">
        <h2>Creator journey</h2>
        <div class="journey-map compact">
          ${journeyCard("01", "Registration", "Profile, bio, categories, audience, social links and verification.")}
          ${journeyCard("02", "Collections", "Build curated storefronts such as Eco Living, Budget Beauty and UK Brands.")}
          ${journeyCard("03", "AI Suggestions", "Receive high-confidence product suggestions and alternative picks.")}
          ${journeyCard("04", "Revenue", "Track affiliate sales, pending commission, paid revenue and monthly growth.")}
        </div>
      </section>
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
      <div class="ecosystem-grid">
        ${moduleList("Creator Modules", ["Dashboard", "Collections", "Products", "Recommendations", "Analytics", "Revenue", "Settings"])}
        ${moduleList("AI Suggestions", ["Trending products", "High-confidence products", "Undiscovered brands", "Alternative products"])}
        ${moduleList("Revenue Dashboard", ["Affiliate sales", "Estimated commission", "Pending revenue", "Paid revenue", "Monthly growth"])}
      </div>
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
      <section class="section flush">
        <h2>Business onboarding flow</h2>
        <div class="journey-map compact">
          ${journeyCard("01", "Register", "Choose brand, manufacturer, retailer, SME or enterprise profile.")}
          ${journeyCard("02", "Build profile", "Add company, industry, country, website, certifications and sustainability commitments.")}
          ${journeyCard("03", "Upload products", "Add specifications, materials, manufacture country, assembly country, packaging and transparency documents.")}
          ${journeyCard("04", "Improve confidence", "Use AI recommendations to improve transparency, packaging and purchase confidence.")}
        </div>
      </section>
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
      <section class="section flush">
        <h2>Consumer intelligence dashboard</h2>
        <div class="grid four">${metric("Purchase confidence", "82/100")}${metric("Brand trust", "78/100")}${metric("Price competitiveness", "Good")}${metric("Drop-off reason", "Origin missing")}</div>
        <div class="ecosystem-grid">
          ${moduleList("Analytics", ["Search ranking", "Carbon perception", "Saved products", "Consumer demographics", "Purchase drivers"])}
          ${moduleList("Marketing Centre", ["Sponsor products", "Launch campaigns", "Partner with influencers", "Promote collections"])}
          ${moduleList("Reports", ["Monthly reports", "Brand trust", "Top products", "Improvement areas", "Purchase journey"])}
        </div>
      </section>
      <div class="mobile-only">${mobileBottomNav("profile")}</div>
    </section>`,
  );
}

function renderAdmin() {
  renderHome();
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
      <div class="grid two">
        ${priceCard("Professional", "Future", ["Advanced reports", "More product records", "Campaign optimisation"])}
        ${priceCard("Enterprise", "Future", ["API access", "Benchmarking", "Dedicated success support"])}
      </div>
    </section>`,
  );
}

function renderBrand() {
  renderHome();
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
        <header><button class="icon-button" data-route="home">←</button><strong>Ethical Impact Score</strong><button class="icon-button">i</button></header>
      </div>
      <span class="eyebrow">E-Consumer Intelligence Engine</span><h1>Purchase confidence methodology.</h1>
      <p>The overall score is calculated from weighted ethical, commercial and evidence components. It is a demonstration output, not a legal certification, audit, or guarantee.</p>
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
      <div class="grid two">${featureCard("Engine inputs", "Retailer data, brand data, consumer behaviour, preferences, price, country, carbon estimate, packaging, reviews, transparency, certifications and delivery.")}${featureCard("Engine outputs", "Purchase confidence, alternative products, business insights, recommendations, influencer suggestions and consumer personalisation.")}</div>
      <div class="mobile-only">${mobileBottomNav("impact")}</div>
    </section>`,
  );
}

function renderRoadmap() {
  renderHome();
}

const demoSteps = [
  ["Consumer search", "Search products and apply price or ethical filters.", "products"],
  ["Consumer profile", "Adjust values across price, climate, labour, transparency, packaging and evidence.", "consumer"],
  ["Retailer comparison", "Open a product detail page to review retailer price options.", "detail:prod-01"],
  ["AI explanation", "Review the plain-English reasons behind the Purchase Confidence Score.", "detail:prod-01"],
  ["Influencer collection", "View fictional influencer storefronts and affiliate disclosures.", "influencers"],
  ["Business dashboard", "Review B2B analytics and ethical improvement recommendations.", "businessDashboard"],
  ["Platform overview", "See how the Purchase Confidence Engine supports consumers, businesses and creators.", "ecosystem"],
];

function renderDemo() {
  const [title, copy, target] = demoSteps[state.demoStep];
  page(
    "Neeyat Product Demonstration",
    `<section class="section narrow">
      <span class="tag">Public Demo - Illustrative Data</span>
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
  page(content[0], `<section class="section narrow"><h1>${content[0]}</h1><p>${content[1]}</p>${disclaimer()}${featureCard("Public demo note", "This version is intended to demonstrate the user experience and platform logic using illustrative data. Live retailer feeds, billing, user accounts and claim verification would be connected in a production build.")}</section>`);
}

function renderContact() {
  page("Contact", `<section class="section narrow"><h1>Contact and Early Access</h1><form class="contact-form"><label>Name<input required /></label><label>Email<input type="email" required /></label><label>Interest<select><option>Consumer early access</option><option>Business interest</option><option>Influencer interest</option></select></label><label>Message<textarea required></textarea></label><button class="primary">Submit demo enquiry</button></form></section>`);
}

function render() {
  const routeName = state.route;
  if (routeName === "home") return renderHome();
  if (routeName === "how") return renderHow();
  if (routeName === "ecosystem") return renderEcosystem();
  if (routeName === "products") return renderProducts();
  if (routeName.startsWith("detail:")) return renderProductDetail(routeName.split(":")[1]);
  if (routeName === "login") return renderLogin();
  if (routeName === "consumer") return renderConsumer();
  if (routeName === "influencers") return renderInfluencers();
  if (routeName === "influencerDashboard") return renderInfluencerDashboard();
  if (routeName === "business") return renderBusiness();
  if (routeName === "businessDashboard") return renderBusinessDashboard();
  if (routeName === "admin") return renderHome();
  if (routeName === "pricing") return renderPricing();
  if (routeName === "brand") return renderHome();
  if (routeName === "methodology") return renderMethodology();
  if (routeName === "roadmap") return renderHome();
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



