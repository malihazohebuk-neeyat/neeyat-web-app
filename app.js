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
  view: "grid",
  verifiedOnly: false,
  dealsOnly: false,
  compare: [],
  saved: ["prod-01", "prod-10"],
  alerts: ["prod-10"],
  purchases: [
    { id: "prod-10", paid: 179, benchmark: 209, co2Avoided: 18.4, wasteAvoided: 0.38, confirmed: "12 Apr 2026" },
    { id: "prod-05", paid: 7.5, benchmark: 10.5, co2Avoided: 0.6, wasteAvoided: 0.08, confirmed: "03 May 2026" },
    { id: "prod-01", paid: 39, benchmark: 48, co2Avoided: 2.1, wasteAvoided: 0.22, confirmed: "28 May 2026" },
  ],
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

function productIndex(product) {
  return Number(product.id.split("-")[1]) || 1;
}

function marketSnapshot(product) {
  const index = productIndex(product);
  const listings = retailerListings(product).sort((a, b) => a.total - b.total);
  const current = listings[0].total;
  const drop = 7 + ((index * 5) % 24);
  const average90 = current / (1 - drop / 100);
  const low90 = current * (0.94 + (index % 3) * 0.015);
  const history = Array.from({ length: 12 }, (_, point) => {
    const wave = Math.sin((point + index) * 0.72) * 0.055;
    const descent = (11 - point) * 0.008;
    return Math.max(current * 0.96, average90 * (1 + wave + descent));
  });
  history[history.length - 1] = current;
  return {
    listings,
    current,
    drop,
    average90,
    low90,
    history,
    offerCount: listings.length,
    timing: drop >= 20 ? "Strong time to buy" : drop >= 12 ? "Good time to buy" : "Fair market price",
  };
}

function historyBars(product, compact = false) {
  const market = marketSnapshot(product);
  const min = Math.min(...market.history);
  const max = Math.max(...market.history);
  return `<div class="price-history ${compact ? "compact" : ""}" aria-label="Illustrative 12-week price history">
    ${market.history.map((value) => {
      const height = 22 + ((value - min) / Math.max(max - min, 1)) * 58;
      return `<span style="height:${Math.round(height)}%" title="${money(value)}"></span>`;
    }).join("")}
  </div>`;
}

function categoryMark(category) {
  return {
    Fashion: "Wear",
    Beauty: "Care",
    Household: "Home",
    Electronics: "Tech",
    "Food & Drink": "Pantry",
    "Personal Care": "Daily",
    Accessories: "Carry",
  }[category] || "Shop";
}

function applyQuickSearch(query, category = "All") {
  state.query = query;
  state.category = category;
  state.route = "products";
  location.hash = "products";
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
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

function productEvidenceScore(product) {
  return ethicalScore(product);
}

function purchaseConfidenceScore(product) {
  const market = marketSnapshot(product);
  const priceConfidence = Math.min(100, 56 + market.drop * 1.4);
  const retailerConfidence = 84;
  return Math.round(priceConfidence * 0.3 + productEvidenceScore(product) * 0.3 + retailerConfidence * 0.2 + personalMatch(product) * 0.2);
}

function personalImpactSummary() {
  return state.purchases.reduce(
    (summary, purchase) => {
      summary.savings += purchase.benchmark - purchase.paid;
      summary.co2Avoided += purchase.co2Avoided;
      summary.wasteAvoided += purchase.wasteAvoided;
      return summary;
    },
    { purchases: state.purchases.length, savings: 0, co2Avoided: 0, wasteAvoided: 0 },
  );
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
    `Environmental evidence is ${product.scores.environment}/100 in the current product record.`,
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
    .filter((product) => !q || `${product.name} ${product.brand} ${product.category} ${product.summary} ${product.certifications.join(" ")} ${product.packaging} ${product.origin}`.toLowerCase().includes(q))
    .filter((product) => product.lowest <= state.maxPrice)
    .filter((product) => product.ethical >= state.minScore)
    .filter((product) => !state.verifiedOnly || product.verified)
    .filter((product) => !state.dealsOnly || marketSnapshot(product).drop >= 15)
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
  initialiseRevealMotion();
}

function initialiseRevealMotion() {
  const elements = [...app.querySelectorAll("[data-reveal]")];
  if (!elements.length) return;
  elements.forEach((element) => element.classList.add("reveal-ready"));
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 },
  );
  elements.forEach((element) => observer.observe(element));
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
  const accountRoute = !state.user
    ? "login"
    : state.user.role === "Business"
      ? "businessDashboard"
      : state.user.role === "Influencer"
        ? "influencerDashboard"
        : "consumer";
  const items = [
    ["home", "Home", "home"],
    ["products", "Search", "search"],
    ["methodology", "Impact", "impact"],
    ["consumer", "Wishlist", "wishlist"],
    [accountRoute, "Profile", "profile"],
  ];
  return `<nav class="mobile-bottom-nav" aria-label="Mobile app navigation">
    ${items.map(([target, label, key]) => `<button class="${active === key ? "active" : ""}" data-route="${target}"><span>${mobileIcon(key)}</span>${label}</button>`).join("")}
  </nav>`;
}

function mobileHomeExperience() {
  const recommended = filteredProducts().slice(0, 3);
  const deal = data.products.map((product) => ({ product, market: marketSnapshot(product) })).sort((a, b) => b.market.drop - a.market.drop)[0];
  const categories = data.categories.slice(0, 4);
  const customerSignedIn = state.user?.role === "Consumer";
  const impact = personalImpactSummary();
  return `<section class="mobile-app-screen mobile-only">
    ${appStatus()}
    <header class="mobile-app-header">
      <button class="icon-button" aria-label="Menu">☰</button>
      <img src="assets/neeyat-logo-web.png" alt="Neeyat" />
      <button class="icon-button" aria-label="Notifications">♧</button>
    </header>
    <div class="mobile-greeting">
      <span>${customerSignedIn ? "Welcome back," : "Compare with confidence"}</span>
      <strong>${customerSignedIn ? escapeHtml(state.user.name) : "Price and proof, together"}</strong>
    </div>
    <form class="mobile-search" data-search-form>
      <span class="sr-only">Search products, brands or categories</span>
      <input name="query" placeholder="Search products, brands or categories" />
      <button type="submit" aria-label="Search">⌕</button>
    </form>
    <article class="mobile-impact-card">
      <div>
        <h3>${customerSignedIn ? "Your confirmed shopping impact" : "Two scores, two clear purposes"}</h3>
        <p>${customerSignedIn ? `${impact.count} confirmed demo purchases only.` : "Product evidence is public. Purchase confidence adapts to your decision."}</p>
        <div class="mobile-impact-metrics">
          ${customerSignedIn
            ? `<span><strong>${impact.co2.toFixed(1)} kg</strong> CO2e estimated</span><span><strong>${money(impact.savings)}</strong> estimated savings</span>`
            : `<span><strong>0-100</strong> Product evidence</span><span><strong>Personal</strong> Purchase confidence</span>`}
        </div>
      </div>
      <div class="leaf-mark" aria-hidden="true"></div>
    </article>
    <button class="mobile-human-story" data-route="products">
      <img src="assets/neeyat-shopper-hero.webp" alt="A shopper using Neeyat to make a considered purchase" />
      <span><strong>Compare with context</strong><small>See price, evidence and values fit together.</small></span>
    </button>
    <div class="mobile-section-row"><h3>Popular Categories</h3><button data-route="products">See all</button></div>
    <div class="mobile-category-row">
      ${categories.map((category) => `<button data-category-query="${category}"><span>${categoryMark(category)}</span>${category}</button>`).join("")}
    </div>
    <article class="mobile-deal-card" data-detail="${deal.product.id}">
      <img src="${deal.product.image}" alt="${deal.product.name}" />
      <div><span>Deal radar · ${deal.market.drop}% below 90-day average</span><strong>${deal.product.name}</strong><small>From ${money(deal.market.current)} · ${productEvidenceScore(deal.product)}/100 product evidence</small></div>
    </article>
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

function discoverySearch() {
  return `<form class="discovery-search" data-search-form>
    <label for="discoveryQuery">What are you looking for?</label>
    <div>
      <input id="discoveryQuery" name="query" value="${state.query}" placeholder="Try 'refill shampoo', 'fair fashion' or a brand" autocomplete="off" />
      <button class="primary" type="submit">Compare</button>
    </div>
    <p>Popular: ${["Refillable", "Refurbished tech", "Under £20", "Plastic-free"].map((query) => `<button type="button" data-query="${query === "Under £20" ? "" : query}" data-query-category="${query === "Refurbished tech" ? "Electronics" : "All"}" ${query === "Under £20" ? "data-max-price=20" : ""}>${query}</button>`).join("")}</p>
  </form>`;
}

function categoryShelf() {
  return `<div class="category-shelf">
    ${data.categories.map((category) => {
      const count = data.products.filter((product) => product.category === category).length;
      return `<button data-category-query="${category}"><span>${categoryMark(category)}</span><strong>${category}</strong><small>${count} products</small></button>`;
    }).join("")}
  </div>`;
}

function dealCard(product) {
  const market = marketSnapshot(product);
  return `<article class="deal-card">
    <button class="deal-image" data-detail="${product.id}" aria-label="View ${product.name}"><img src="${product.image}" alt="${product.name}" /></button>
    <div>
      <span class="deal-badge">${market.drop}% below 90-day average</span>
      <h3>${product.name}</h3>
      <p>${market.timing} · ${market.offerCount} retailer offers</p>
      <div class="deal-footer"><strong>${money(market.current)}</strong><span>${productEvidenceScore(product)}/100 product evidence</span></div>
      <div class="deal-actions"><button class="primary small" data-detail="${product.id}">View offers</button><button class="secondary small" data-alert="${product.id}">${state.alerts.includes(product.id) ? "Alert on" : "Set alert"}</button></div>
    </div>
  </article>`;
}

function renderDeals() {
  const ranked = data.products
    .map((product) => ({ product, market: marketSnapshot(product) }))
    .sort((a, b) => b.market.drop - a.market.drop);
  const featured = ranked[0];
  const strongDrops = ranked.filter(({ market }) => market.drop >= 20).slice(0, 6).map(({ product }) => product);
  const underTwenty = ranked.filter(({ market }) => market.current < 20).slice(0, 4).map(({ product }) => product);
  const evidenceLed = ranked.filter(({ product }) => productEvidenceScore(product) >= 82).slice(0, 4).map(({ product }) => product);
  page(
    "Deals",
    `<section class="section app-page deals-page">
      <div class="mobile-page-top mobile-only">${appStatus()}<header><button class="icon-button" data-route="home">←</button><strong>Deals</strong><button class="icon-button" data-route="consumer">♡</button></header></div>
      <div class="deals-heading"><div><span class="eyebrow">Price-drop intelligence</span><h1>Deals with their history attached.</h1><p>This is not a second product search. Deals are ranked by the current delivered price against each item's illustrative 90-day average, then shown with evidence quality and retailer context.</p></div><button class="secondary" data-route="products">Open full comparison</button></div>
      <article class="featured-deal" data-reveal>
        <img src="${featured.product.image}" alt="${featured.product.name}" />
        <div><span class="deal-badge">${featured.market.drop}% below 90-day average</span><h2>${featured.product.name}</h2><p>${featured.product.summary}</p><div class="featured-deal-metrics"><span><strong>${money(featured.market.current)}</strong>Best delivered price</span><span><strong>${money(featured.market.average90)}</strong>90-day average</span><span><strong>${productEvidenceScore(featured.product)}/100</strong>Product evidence</span></div><div class="hero-actions"><button class="primary" data-detail="${featured.product.id}">Compare ${featured.market.offerCount} offers</button><button class="secondary" data-alert="${featured.product.id}">${state.alerts.includes(featured.product.id) ? "Price alert on" : "Track this price"}</button></div></div>
      </article>
      <div class="deal-principles"><span><strong>Delivered price</strong>Fees included before ranking</span><span><strong>Price context</strong>Compared with recent history</span><span><strong>Clear evidence</strong>Product claims remain visible</span><span><strong>No false urgency</strong>No countdowns or invented scarcity</span></div>
      <section class="section flush"><div class="section-head"><div><span class="eyebrow">Strongest movement</span><h2>20%+ below recent average</h2></div></div><div class="deal-grid deal-grid-wide">${strongDrops.map(dealCard).join("")}</div></section>
      <section class="section flush"><div class="section-head"><div><span class="eyebrow">Lower-cost choices</span><h2>Delivered for under £20</h2><p>Every item still shows product evidence beside the saving.</p></div></div><div class="deal-grid">${underTwenty.map(dealCard).join("")}</div></section>
      <section class="section flush"><div class="section-head"><div><span class="eyebrow">Evidence-led value</span><h2>Strong product evidence, currently well priced</h2></div></div><div class="deal-grid">${evidenceLed.map(dealCard).join("")}</div></section>
      ${disclaimer()}
      <div class="mobile-only">${mobileBottomNav("search")}</div>
    </section>`,
  );
}

function homeExplainer() {
  const product = data.products[4];
  const tabs = [
    ["01", "Search naturally", "Start with a product, need or value."],
    ["02", "Compare the full cost", "See price, delivery and market movement."],
    ["03", "Understand the evidence", "Read the reasons behind every score."],
    ["04", "Choose your best fit", "Balance savings with what matters to you."],
  ];
  return `<section class="section explain-section" data-reveal>
    <div class="section-head explain-heading">
      <div><span class="eyebrow">How Neeyat helps</span><h2>One search. A decision you can explain.</h2></div>
      <p>Neeyat turns scattered price and product information into a clear, personal path from discovery to purchase.</p>
    </div>
    <div class="explain-layout">
      <div class="explain-tabs" role="tablist" aria-label="Neeyat decision journey">
        ${tabs.map(([number, title, copy], index) => `<button id="explain-tab-${index}" data-explain-tab="${index}" role="tab" aria-selected="${index === 0}" aria-controls="explain-panel-${index}"><span>${number}</span><div><strong>${title}</strong><small>${copy}</small></div></button>`).join("")}
      </div>
      <div class="explain-stage" aria-live="polite">
        <div id="explain-panel-0" class="explain-panel is-active" data-explain-panel="0" role="tabpanel" aria-labelledby="explain-tab-0">
          <span class="screen-label">Start with what you need</span>
          <div class="demo-query"><span>Refill shampoo</span><strong>Search</strong></div>
          <div class="demo-chip-row"><span>Plastic-free</span><span>Under £15</span><span>UK delivery</span></div>
          <p>Use everyday language. Neeyat interprets the product and the priorities behind your search.</p>
        </div>
        <div id="explain-panel-1" class="explain-panel" data-explain-panel="1" role="tabpanel" aria-labelledby="explain-tab-1" hidden>
          <span class="screen-label">Three retailer offers found</span>
          <div class="demo-offer recommended"><span>Best overall fit</span><strong>£7.62 delivered</strong><small>High retailer confidence</small></div>
          <div class="demo-offer"><span>Lowest item price</span><strong>£7.10 + £2.50</strong><small>Delivery changes the ranking</small></div>
          <div class="demo-offer"><span>Fastest delivery</span><strong>£9.20 delivered</strong><small>Arrives tomorrow</small></div>
        </div>
        <div id="explain-panel-2" class="explain-panel" data-explain-panel="2" role="tabpanel" aria-labelledby="explain-tab-2" hidden>
          <div class="score-explainer">
            <div class="score-orbit"><strong>84</strong><span>Strong choice</span></div>
            <div class="evidence-bars">
              <span><small>Price confidence</small><i style="--bar:91%"></i><strong>91</strong></span>
              <span><small>Ethical evidence</small><i style="--bar:82%"></i><strong>82</strong></span>
              <span><small>Your values fit</small><i style="--bar:88%"></i><strong>88</strong></span>
            </div>
          </div>
          <p>Each result separates evidence from opinion, so you can see what is known, what is self-reported and what needs more detail.</p>
        </div>
        <div id="explain-panel-3" class="explain-panel" data-explain-panel="3" role="tabpanel" aria-labelledby="explain-tab-3" hidden>
          <div class="demo-recommendation">
            <img src="${product.image}" alt="${product.name}" />
            <div><span>Recommended for you</span><strong>${product.name}</strong><small>Plastic-free packaging · strong environmental evidence</small></div>
            <b>£7.62</b>
          </div>
          <div class="decision-reasons"><span>Saves £2.14</span><span>88% values fit</span><span>Price alert available</span></div>
          <button class="primary" data-detail="${product.id}">Explore this decision</button>
        </div>
      </div>
    </div>
  </section>`;
}

function humanStories() {
  const stories = [
    ["assets/neeyat-shopper-hero.webp", "For shoppers", "Aisha balances budget, delivery and packaging without opening a dozen tabs.", "products", "Start a comparison"],
    ["assets/neeyat-creator-story.webp", "For creators", "Amina builds recommendations around visible evidence and clear affiliate disclosure.", "influencers", "Meet the creators"],
    ["assets/neeyat-business-team.webp", "For better businesses", "The KindThread team sees where information is missing and what shoppers value most.", "business", "Explore business tools"],
  ];
  return `<section class="section human-stories" data-reveal>
    <div class="section-head"><div><span class="eyebrow">Designed around people</span><h2>Different needs. One clearer marketplace.</h2></div><p>Illustrative journeys show how the same trusted information can help each side of a purchase make a better decision.</p></div>
    <div class="story-grid">${stories.map(([image, title, copy, target, action]) => `<article class="story-card"><img src="${image}" alt="${title} using the Neeyat platform" loading="lazy" /><div><span>Illustrative journey</span><h3>${title}</h3><p>${copy}</p><button class="text-action" data-route="${target}">${action} →</button></div></article>`).join("")}</div>
  </section>`;
}

function renderHome() {
  const deals = data.products
    .map((product) => ({ product, drop: marketSnapshot(product).drop }))
    .sort((a, b) => b.drop - a.drop)
    .slice(0, 4)
    .map((item) => item.product);
  page(
    "Home",
    `${mobileHomeExperience()}
    <section class="home-hero desktop-hero" data-reveal>
      <img class="home-hero-image" src="assets/neeyat-shopper-hero.webp" alt="A shopper comparing an ethical purchase at home" fetchpriority="high" />
      <div class="home-hero-inner">
        <div class="hero-copy">
          <span class="eyebrow">Ethical money decisions, made practical</span>
          <h1>Find the right price. Understand the real choice.</h1>
          <p>Compare delivered prices, price movement and product evidence, then see which option fits the things you care about.</p>
          ${discoverySearch()}
          <div class="hero-assurance"><span>12-week price context</span><span>Evidence you can inspect</span><span>Your priorities, your choice</span></div>
        </div>
        <aside class="hero-live-insight">
          <span>Neeyat best match</span>
          <strong>Refill Shampoo Bar</strong>
          <div><b>£7.62</b><small>delivered</small><i>88% values fit</i></div>
          <button data-detail="prod-05">See why it matches</button>
        </aside>
      </div>
    </section>
    <section class="human-proof-band" data-reveal>
      <div class="proof-people"><img src="assets/neeyat-creator-story.webp" alt="" /><img src="assets/neeyat-business-team.webp" alt="" /></div>
      <div><strong>Built around real shopping trade-offs</strong><span>Budget, evidence, delivery and personal values belong in the same decision.</span></div>
      <div class="proof-signals"><span><b>Price</b> in context</span><span><b>Claims</b> with evidence</span><span><b>Choices</b> made personal</span></div>
    </section>
    <section class="section discovery-band">
      <div class="section-head"><div><span class="eyebrow">Browse quickly</span><h2>Shop by category</h2></div><button class="text-action" data-route="products">View all products →</button></div>
      ${categoryShelf()}
    </section>
    ${homeExplainer()}
    <section class="section deal-radar">
      <div class="section-head"><div><span class="eyebrow">Deal radar</span><h2>Price drops worth checking</h2><p>Illustrative deals measured against each product's 90-day average, with product evidence alongside the saving.</p></div><button class="secondary" data-route="deals">See all deals</button></div>
      <div class="deal-grid">${deals.map(dealCard).join("")}</div>
    </section>
    <section class="section confidence-band">
      <div><span class="eyebrow">A better comparison</span><h2>Price is only the first signal.</h2><p>Neeyat keeps the familiar comparison journey, then adds evidence quality, retailer transparency, origin, packaging and your personal priorities before recommending an offer.</p><button class="primary" data-route="products">Start comparing</button></div>
      <div class="confidence-list">
        <span><strong>01</strong> Compare total delivered cost</span>
        <span><strong>02</strong> Check 12-week price movement</span>
        <span><strong>03</strong> Understand the ethical evidence</span>
        <span><strong>04</strong> Choose the offer that fits you</span>
      </div>
    </section>
    ${disclaimer()}
    ${humanStories()}`,
  );
}

function featureCard(title, text) {
  return `<article class="card"><h3>${title}</h3><p>${text}</p></article>`;
}

function renderHow() {
  page(
    "How It Works",
    `<section class="section how-page">
      <div class="how-hero"><span class="eyebrow">A clearer shopping journey</span><h1>Search once. Compare properly. Decide for yourself.</h1><p>Neeyat brings commercial facts and product evidence into one understandable flow without pretending there is one perfect choice for everyone.</p><button class="primary" data-route="products">Start comparing</button></div>
      <div class="public-journey">
        ${journeyCard("01", "Tell us what you need", "Search for a product, category, budget or practical requirement.", ["No account required", "Natural-language search", "Useful category filters"])}
        ${journeyCard("02", "See the full comparison", "Review delivered price, recent price movement, retailer confidence and product evidence.", ["Fees included", "Price history", "Claim status"])}
        ${journeyCard("03", "Understand the trade-offs", "Neeyat explains why one offer ranks above another and keeps evidence separate from personal preference.", ["Product Evidence Score", "Purchase Confidence", "Alternative choices"])}
        ${journeyCard("04", "Choose what fits", "Visit a retailer, save the product or set a price alert. Nothing is counted as impact until a purchase is confirmed.", ["Affiliate disclosure", "Customer control", "No inferred impact"])}
      </div>
      <section class="public-boundaries"><div><span class="eyebrow">Clear account boundaries</span><h2>Public pages explain. Private workspaces operate.</h2><p>Shoppers can compare publicly. Customer, creator and business analytics appear only after the matching demo role signs in. Platform administration lives in a completely separate admin console.</p></div><div><span><strong>Public</strong>Products, deals, scoring method, creators and business offer</span><span><strong>Customer</strong>Preferences, confirmed purchases and personal impact estimates</span><span><strong>Creator</strong>Collections, disclosed revenue and recommendation performance</span><span><strong>Business</strong>Own product records, evidence gaps and brand analytics</span></div></section>
      ${disclaimer()}
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
  const market = marketSnapshot(product);
  return `<article class="product-card">
    <div class="product-visual">
      <button data-detail="${product.id}" aria-label="View ${product.name}"><img src="${product.image}" alt="Illustrative image for ${product.name}" /></button>
      <span class="deal-badge">${market.drop}% below average</span>
      <div class="product-quick-actions">
        <button data-alert="${product.id}" aria-label="${state.alerts.includes(product.id) ? "Remove" : "Create"} price alert" title="Price alert">${state.alerts.includes(product.id) ? "Alert on" : "Set alert"}</button>
        <button data-save="${product.id}" aria-label="${state.saved.includes(product.id) ? "Remove from" : "Add to"} saved products" title="Save product">${state.saved.includes(product.id) ? "Saved" : "Save"}</button>
      </div>
    </div>
    <div class="product-body">
      <div class="product-top"><span>${product.category}</span><strong>${product.brand}</strong></div>
      <button class="product-title" data-detail="${product.id}"><h3>${product.name}</h3></button>
      <div class="market-summary">
        <div><span>Best delivered price</span><strong>${money(market.current)}</strong><small>${market.offerCount} offers · avg. ${money(market.average90)}</small></div>
        ${historyBars(product, true)}
      </div>
      <div class="timing-line"><strong>${market.timing}</strong><span>12-week price view</span></div>
      <div class="ai-reason"><strong>Neeyat insight</strong><span>${recommendationReason(product)}</span></div>
      <div class="score-row">
        <span><strong>${product.ethical}</strong> product evidence</span>
        <span><strong>${product.match}</strong> values fit</span>
        <span><strong>${product.verified ? "Verified" : "Review"}</strong> claim status</span>
      </div>
      <div class="signal-row">${intel.signals.slice(0, 3).map((signal) => `<span>${signal}</span>`).join("")}</div>
      <div class="card-actions">
        <button class="primary" data-detail="${product.id}">Compare ${market.offerCount} offers</button>
        <button class="secondary" data-compare="${product.id}">${state.compare.includes(product.id) ? "Remove" : "Add to compare"}</button>
      </div>
    </div>
  </article>`;
}

function renderProducts() {
  const products = filteredProducts();
  page(
    "Compare Products",
    `<section class="section app-page search-page">
      <div class="mobile-page-top mobile-only">
        ${appStatus()}
        <header><button class="icon-button" data-route="home">←</button><strong>Compare</strong><button class="icon-button" data-route="consumer">♡</button></header>
      </div>
      <div class="catalog-head">
        <div><span class="eyebrow">Neeyat product comparison</span><h1>Compare the whole decision.</h1><p>Price, delivery, retailer trust, ethical evidence and your values-fit in one result.</p></div>
        <form class="catalog-search" data-search-form>
          <label class="sr-only" for="searchInput">Search products, brands or categories</label>
          <input id="searchInput" name="query" value="${state.query}" placeholder="Search a product, brand or category" />
          <button class="primary" type="submit">Search</button>
        </form>
      </div>
      <div class="category-pills" aria-label="Product categories">
        <button class="${state.category === "All" ? "active" : ""}" data-category-query="All">All products</button>
        ${data.categories.map((category) => `<button class="${state.category === category ? "active" : ""}" data-category-query="${category}">${category}</button>`).join("")}
      </div>
      <div class="catalog-layout">
        <aside class="filter-sidebar">
          <div class="filter-title"><strong>Refine results</strong><button data-reset-filters>Reset</button></div>
          <label>Category<select id="categoryFilter"><option>All</option>${data.categories.map((cat) => `<option ${cat === state.category ? "selected" : ""}>${cat}</option>`).join("")}</select></label>
          <label>Max delivered price<input id="priceFilter" type="range" min="4" max="250" value="${state.maxPrice}" /><span>Up to ${money(state.maxPrice)}</span></label>
          <label>Minimum product evidence<input id="scoreFilter" type="range" min="0" max="100" value="${state.minScore}" /><span>${state.minScore}/100 or higher</span></label>
          <label class="check-filter"><input id="dealsFilter" type="checkbox" ${state.dealsOnly ? "checked" : ""} /> Price drops of 15%+</label>
          <label class="check-filter"><input id="verifiedFilter" type="checkbox" ${state.verifiedOnly ? "checked" : ""} /> Verified evidence only</label>
          <div class="filter-note"><strong>Every result includes</strong><span>Total delivered price</span><span>12-week price movement</span><span>Ethical evidence</span><span>Personal values fit</span></div>
        </aside>
        <div class="catalog-results">
          <div class="results-toolbar">
            <div><strong>${products.length} results</strong><span>${state.query ? ` for “${state.query}”` : ` across ${state.category === "All" ? "all categories" : state.category}`}</span></div>
            <div class="results-controls">
              <label>Sort<select id="sortFilter"><option value="match">Best match</option><option value="price">Lowest delivered price</option><option value="ethical">Highest product evidence</option><option value="popular">Most evidence</option></select></label>
              <div class="view-toggle" aria-label="Result view"><button class="${state.view === "grid" ? "active" : ""}" data-view="grid" title="Grid view">Grid</button><button class="${state.view === "list" ? "active" : ""}" data-view="list" title="List view">List</button></div>
            </div>
          </div>
          ${products.length ? `<div class="product-grid result-${state.view}">${products.map(productCard).join("")}</div>` : `<div class="empty-results"><h2>No close matches yet</h2><p>Try a broader category, a higher price limit or reset the evidence filters.</p><button class="primary" data-reset-filters>Reset filters</button></div>`}
        </div>
      </div>
      ${disclaimer()}
    </section>
    ${comparePanel()}
    <div class="mobile-only">${mobileBottomNav("search")}</div>`,
  );
  document.querySelector("#sortFilter").value = state.sort;
}

function comparePanel() {
  const items = state.compare.map((id) => data.products.find((p) => p.id === id)).filter(Boolean);
  if (!items.length) return "";
  return `<section class="section comparison-section" id="comparisonTable">
    <div class="section-head"><div><span class="eyebrow">Side-by-side</span><h2>Your comparison</h2><p>Delivered price, product evidence and personal fit for up to four products.</p></div><button class="text-action" data-clear-compare>Clear all</button></div>
    <div class="table-wrap"><table><thead><tr><th>Product</th><th>Delivered price</th><th>Price timing</th><th>Product evidence</th><th>Values fit</th><th>Claim status</th><th></th></tr></thead>
    <tbody>${items.map((product) => {
      const market = marketSnapshot(product);
      return `<tr><td><strong>${product.name}</strong><span>${product.brand}</span></td><td><strong>${money(market.current)}</strong><span>${market.offerCount} offers</span></td><td>${market.timing}<span>${market.drop}% below average</span></td><td>${ethicalScore(product)}/100</td><td>${personalMatch(product)}/100</td><td>${product.verified ? "Verified" : product.reviewStatus}</td><td><button class="secondary small" data-detail="${product.id}">View</button></td></tr>`;
    }).join("")}</tbody></table></div>
  </section>
  <div class="compare-dock">
    <div class="compare-dock-items">${items.map((product) => `<button data-compare="${product.id}" title="Remove ${product.name}"><img src="${product.image}" alt="" /><span>${product.name}</span><strong>×</strong></button>`).join("")}</div>
    <span>${items.length}/4 selected</span>
    <button class="primary" data-scroll-target="comparisonTable">Compare now</button>
  </div>`;
}

function renderProductDetail(id) {
  const product = data.products.find((p) => p.id === id) || data.products[0];
  const listings = retailerListings(product).sort((a, b) => a.total - b.total);
  const intel = intelligenceSummary(product);
  const market = marketSnapshot(product);
  page(
    product.name,
    `<section class="section app-page detail-page">
      <div class="mobile-page-top mobile-only">
        ${appStatus()}
        <header><button class="icon-button" data-route="products">←</button><strong>Product Details</strong><button class="icon-button">♡</button></header>
      </div>
      <button class="secondary" data-route="products">Back to search</button>
      <div class="detail-breadcrumb"><button data-route="home">Home</button><span>/</span><button data-category-query="${product.category}">${product.category}</button><span>/</span><strong>${product.name}</strong></div>
      <div class="detail-layout">
        <img class="detail-image" src="${product.image}" alt="Illustrative product image for ${product.name}" />
        <div>
          <span class="eyebrow">${product.category} / ${product.brand}</span>
          <h1>${product.name}</h1>
          <p>${product.summary}</p>
          <div class="score-cards">
            ${metric("Product evidence", `${productEvidenceScore(product)}/100`)}
            ${metric("Purchase confidence", `${purchaseConfidenceScore(product)}/100`)}
            ${metric("Evidence confidence", confidence(product))}
          </div>
          <div class="commerce-intelligence">
            <h2>Your decision summary</h2>
            <div class="intel-grid">
              <span><strong>Lowest delivered</strong>${money(intel.cheapest.total)} via ${intel.cheapest.retailer}</span>
              <span><strong>Best ethical value</strong>${intel.ethicalValue.retailer} (${intel.ethicalValue.valueScore}/100)</span>
              <span><strong>Review status</strong>${product.reviewStatus}</span>
              <span><strong>Origin</strong>${product.origin}</span>
            </div>
            <p>${recommendationReason({ ...product, lowest: intel.cheapest.total, match: personalMatch(product) })}</p>
          </div>
          <div class="pill-row">${product.certifications.map((item) => `<span>${item}</span>`).join("")}</div>
          <div class="detail-actions">
            <button class="primary" data-scroll-target="retailerOffers">Compare ${market.offerCount} offers</button>
            <button class="secondary" data-alert="${product.id}">${state.alerts.includes(product.id) ? "Price alert on" : "Set price alert"}</button>
            <button class="secondary" data-save="${product.id}">${state.saved.includes(product.id) ? "Saved" : "Save"}</button>
            <button class="secondary" data-compare="${product.id}">${state.compare.includes(product.id) ? "Remove from compare" : "Add to compare"}</button>
          </div>
        </div>
      </div>
      ${disclaimer()}
      <section class="market-intelligence">
        <div class="market-intelligence-copy">
          <span class="eyebrow">Price intelligence</span>
          <h2>${market.timing}</h2>
          <p>The current delivered price is ${market.drop}% below the illustrative 90-day average of ${money(market.average90)} and close to the 90-day low of ${money(market.low90)}.</p>
          <div class="market-stats"><span><strong>${money(market.current)}</strong>Today</span><span><strong>${money(market.average90)}</strong>90-day average</span><span><strong>${money(market.low90)}</strong>90-day low</span></div>
        </div>
        <div class="history-panel">${historyBars(product)}<div><span>12 weeks ago</span><span>Today</span></div></div>
      </section>
      <div class="grid two">
        <article class="card">
          <h2>Product evidence score breakdown</h2>
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
          ${data.influencers.filter((i) => i.verified).slice(0, 3).map((i) => `<p><strong>${i.name}</strong> recommends this for ${i.focus.toLowerCase()}. Creator fit: ${product.creatorFit}. Affiliate disclosure applies.</p>`).join("")}
        </article>
        <article class="card">
          <h2>Alternative products</h2>
          ${filteredProducts().filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3).map((item) => `<button class="alternative-row" data-detail="${item.id}"><span>${item.name}</span><strong>${productEvidenceScore(item)}/100 evidence</strong></button>`).join("")}
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
      <section class="section flush" id="retailerOffers">
        <div class="section-head"><div><span class="eyebrow">Retailer comparison</span><h2>${listings.length} offers, ranked by total value</h2><p>Delivery is included in the total. Retailer confidence and affiliate disclosure remain visible before leaving Neeyat.</p></div></div>
        <div class="offer-list">
          ${listings.map((listing, index) => `<article class="offer-row ${index === 0 ? "recommended" : ""}">
            <div class="offer-rank"><span>${index === 0 ? "Neeyat pick" : `#${index + 1}`}</span><strong>${listing.retailer}</strong><small>${(4.8 - index * 0.2).toFixed(1)}/5 retailer confidence</small></div>
            <div class="offer-details"><span>${listing.stock}</span><strong>${listing.estimate}</strong><small>Updated ${listing.updated}</small></div>
            <div class="offer-price"><span>${money(listing.price)} + ${listing.delivery ? money(listing.delivery) : "free"} delivery</span><strong>${money(listing.total)}</strong><small>Total delivered</small></div>
            <div class="offer-actions"><button class="primary small" data-demo-buy="${listing.retailer}">Visit retailer</button><small>Affiliate link · ${listing.commission} illustrative commission</small></div>
          </article>`).join("")}
        </div>
      </section>
      <section class="section flush">
        <h2>After you confirm a purchase</h2>
        <div class="grid three">
          ${featureCard("Purchase summary", `Estimated delivered price: ${money(intel.cheapest.total)} through ${intel.cheapest.retailer}.`)}
          ${featureCard("Decision record", `${confidence(product)} with ${product.dataPoints} evidence points and ${product.reviewStatus.toLowerCase()} status.`)}
          ${featureCard("Personal impact estimate", `Only a confirmed purchase can update your estimated savings and impact history. Saves and clicks never count as impact.`)}
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
      <span class="eyebrow">Role-based demo access</span>
      <h1>Open the workspace that belongs to you.</h1>
      <p>Public shopping pages stay separate from private role analytics. These quick logins simulate that boundary for the static prototype; production authentication must be server-side.</p>
      <div class="grid three">${data.accounts.map((account) => `<article class="card role-login-card"><span>${account.role} workspace</span><h3>${account.name}</h3><p>${account.role === "Consumer" ? "Confirmed purchases, decision priorities and personal impact estimates." : account.role === "Influencer" ? "Collections, recommendation performance and disclosed revenue." : "Own product records, evidence improvements and consumer insights."}</p><small>${account.email}<br />${account.password}</small><button class="primary" data-login="${account.email}">Enter ${account.role} demo</button></article>`).join("")}</div>
      <div class="admin-login-link"><strong>Platform administrator?</strong><span>Administration is intentionally isolated from user workspaces.</span><a class="secondary" href="admin/">Open admin login</a></div>
    </section>`,
  );
}

function renderRoleGate(role, publicRoute) {
  page(
    `${role} Login Required`,
    `<section class="section narrow role-gate"><span class="eyebrow">Private ${role.toLowerCase()} workspace</span><h1>Sign in with the ${role} demo account.</h1><p>This analytics workspace is not part of the public-facing experience. It contains information visible only to the matching account type.</p><div class="hero-actions"><button class="primary" data-route="login">Open role login</button><button class="secondary" data-route="${publicRoute}">Return to public page</button></div></section>`,
  );
}

function renderConsumer() {
  const saved = state.saved.map((id) => data.products.find((p) => p.id === id)).filter(Boolean);
  const alertProducts = state.alerts.map((id) => data.products.find((p) => p.id === id)).filter(Boolean);
  if (state.user?.role !== "Consumer") {
    page(
      "Saved Products and Alerts",
      `<section class="section app-page wishlist-page">
        <div class="mobile-page-top mobile-only">${appStatus()}<header><button class="icon-button" data-route="home">←</button><strong>Saved & Alerts</strong><button class="icon-button" data-route="login">♙</button></header></div>
        <div class="section-head"><div><span class="eyebrow">Your shortlist</span><h1>Saved products and price alerts.</h1><p>Keep decisions you want to revisit. In this public demo, the shortlist remains in this browser session and is not treated as a purchase or impact.</p></div><button class="primary" data-route="login">Sign in for a demo workspace</button></div>
        <div class="saved-summary"><span><strong>${saved.length}</strong> saved products</span><span><strong>${alertProducts.length}</strong> active price alerts</span><span><strong>0</strong> purchases inferred from clicks or saves</span></div>
        <section class="section flush"><div class="section-head"><div><h2>Price alerts</h2><p>Targets are illustrative and update only when you explicitly switch an alert on.</p></div></div>${alertProducts.length ? `<div class="alert-list">${alertProducts.map((product) => { const market = marketSnapshot(product); return `<article><img src="${product.image}" alt="" /><div><strong>${product.name}</strong><span>Current ${money(market.current)} · notify below ${money(market.current * 0.9)}</span></div><button class="secondary small" data-alert="${product.id}">Remove alert</button></article>`; }).join("")}</div>` : `<div class="empty-results"><h3>No price alerts yet</h3><p>Set an alert from any product or deal.</p><button class="primary" data-route="deals">Browse deals</button></div>`}</section>
        <section class="section flush"><div class="section-head"><div><h2>Saved products</h2><p>Saving is a planning action. It does not affect personal or platform impact figures.</p></div></div>${saved.length ? `<div class="product-grid">${saved.map((p) => productCard({ ...p, ethical: productEvidenceScore(p), match: personalMatch(p), lowest: Math.min(...retailerListings(p).map((l) => l.total)) })).join("")}</div>` : `<div class="empty-results"><h3>Your shortlist is empty</h3><button class="primary" data-route="products">Start comparing</button></div>`}</section>
        ${disclaimer()}
        <div class="mobile-only">${mobileBottomNav("wishlist")}</div>
      </section>`,
    );
    return;
  }
  const impact = personalImpactSummary();
  const purchases = state.purchases.map((purchase) => ({ ...purchase, product: data.products.find((product) => product.id === purchase.id) })).filter((purchase) => purchase.product);
  page(
    "My Neeyat",
    `<section class="section app-page wishlist-page">
      <div class="mobile-page-top mobile-only">
        ${appStatus()}
        <header><button class="icon-button" data-route="home">←</button><strong>My Neeyat</strong><button class="icon-button">♧</button></header>
      </div>
      <div class="section-head"><div><span class="eyebrow">Personal workspace</span><h1>Welcome back, ${state.user.name}.</h1><p>Your impact estimate is based only on the confirmed demo purchases listed below. Saved products, searches and retailer clicks are excluded.</p></div><div class="hero-actions"><button class="secondary" data-route="products">Compare products</button><button class="text-action" data-logout>Sign out</button></div></div>
      ${disclaimer()}
      <div class="grid four">
        ${metric("Confirmed purchases", impact.purchases)}
        ${metric("Estimated savings", money(impact.savings))}
        ${metric("Estimated CO2e avoided", `${impact.co2Avoided.toFixed(1)}kg`)}
        ${metric("Estimated waste avoided", `${impact.wasteAvoided.toFixed(2)}kg`)}
      </div>
      <div class="impact-scope-note"><strong>Personal estimate, not a platform claim</strong><span>Figures compare each confirmed demo purchase with a seeded category benchmark. Production estimates would show methodology, ranges, source dates and user corrections.</span><button class="text-action" data-route="methodology">How impact is calculated →</button></div>
      <section class="section flush"><div class="section-head"><div><h2>Confirmed purchase history</h2><p>Only these records contribute to the personal estimate above.</p></div></div><div class="purchase-list">${purchases.map((purchase) => `<article><img src="${purchase.product.image}" alt="" /><div><strong>${purchase.product.name}</strong><span>Confirmed ${purchase.confirmed} · paid ${money(purchase.paid)}</span></div><span><strong>${money(purchase.benchmark - purchase.paid)}</strong> est. saving</span><span><strong>${purchase.co2Avoided.toFixed(1)}kg</strong> est. CO2e avoided</span></article>`).join("")}</div></section>
      <section class="card preference-card">
        <h2>Your decision priorities</h2>
        <p>These settings personalise Purchase Confidence. They do not change a product's evidence score.</p>
        <div class="value-grid">${Object.entries(state.preferences).map(([key, value]) => `<label>${key}<input type="range" min="0" max="100" value="${value}" data-pref="${key}" /><span>${value}</span></label>`).join("")}</div>
      </section>
      <section class="section flush"><div class="section-head"><div><h2>Saved products</h2><p>Shortlisted for later; not counted as purchases.</p></div></div><div class="product-grid">${saved.map((p) => productCard({ ...p, ethical: productEvidenceScore(p), match: personalMatch(p), lowest: Math.min(...retailerListings(p).map((l) => l.total)) })).join("")}</div></section>
      <div class="mobile-only">${mobileBottomNav("wishlist")}</div>
    </section>`,
  );
}

function renderInfluencers() {
  const publicCreators = data.influencers.filter((influencer) => influencer.verified);
  page(
    "Influencers",
    `<section class="section app-page influencer-page">
      <div class="mobile-page-top mobile-only">
        ${appStatus()}
        <header><button class="icon-button" data-route="home">←</button><strong>Influencer Picks</strong><button class="icon-button">♡</button></header>
      </div>
      <div class="section-head"><div><span class="eyebrow">Creator marketplace</span><h1>People-led recommendations with visible reasons.</h1><p>Explore public creator collections. Commercial relationships and affiliate links stay disclosed alongside every recommendation.</p></div><button class="primary" data-route="login">Creator sign in</button></div>
      ${disclaimer()}
      <article class="creator-spotlight desktop-editorial" data-reveal>
        <img src="assets/neeyat-creator-story.webp" alt="A sustainable-lifestyle creator explaining a refillable skincare product" />
        <div><span class="eyebrow">Creator spotlight</span><h2>Recommendations with a person and a reason behind them.</h2><p>Amina Green curates practical low-waste swaps, shows the evidence she used and clearly labels every commercial relationship.</p><div class="spotlight-stats"><span><strong>42k</strong> community</span><span><strong>6.8%</strong> engagement</span><span><strong>Verified</strong> profile</span></div><button class="primary" data-route="products">Explore Amina's collection</button></div>
      </article>
      <article class="mobile-creator-card mobile-only">
        <img src="${creatorImage()}" alt="Illustrative ethical influencer recommendation" />
        <div>
          <h3>Sustainable Skincare</h3>
          <p>By @greenwithsara</p>
          <button class="primary small" data-route="products">Shop Now</button>
        </div>
      </article>
      <div class="grid four creator-directory">${publicCreators.map((i) => `<article class="card"><span class="creator-initial">${i.name.split(" ").map((part) => part[0]).join("")}</span><h3>${i.name}</h3><p>${i.focus}</p><span class="tag">Verified creator</span><p><strong>Collection:</strong> ${i.collection}</p><button class="text-action" data-route="products">Explore collection →</button></article>`).join("")}</div>
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
  if (state.user?.role !== "Influencer") return renderRoleGate("Influencer", "influencers");
  page(
    "Influencer Dashboard",
    `<section class="section">
      <div class="section-head"><div><span class="eyebrow">Private influencer workspace</span><h1>${state.user.name}'s recommendation performance.</h1></div><button class="text-action" data-logout>Sign out</button></div>${disclaimer()}
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
    `<section class="section app-page business-public-page">
      <div class="mobile-page-top mobile-only">${appStatus()}<header><button class="icon-button" data-route="home">←</button><strong>Neeyat for Business</strong><button class="icon-button" aria-label="More options">⋯</button></header></div>
      <div class="business-intro" data-reveal>
        <div><span class="eyebrow">B2B SaaS</span><h1>Better evidence builds stronger customer trust.</h1><p>Neeyat helps SMEs improve product transparency, understand consumer interest and strengthen ESG positioning without presenting the platform as an external certification.</p><button class="primary" data-route="login">Business sign in</button></div>
        <img src="assets/neeyat-business-team.webp" alt="Small-business founders reviewing product transparency information" />
      </div>
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
      <div class="mobile-only">${mobileBottomNav("profile")}</div>
    </section>`,
  );
}

function renderBusinessDashboard() {
  if (state.user?.role !== "Business") return renderRoleGate("Business", "business");
  const a = data.businessAnalytics;
  page(
    "Business Dashboard",
    `<section class="section app-page business-mobile-page">
      <div class="mobile-page-top mobile-only">
        ${appStatus()}
        <header><strong>Neeyat for Business</strong><button class="icon-button">⋯</button></header>
      </div>
      <div class="section-head"><div><span class="eyebrow">Private business workspace</span><h1>KindThread Co. profile.</h1></div><button class="text-action" data-logout>Sign out</button></div>${disclaimer()}
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

function renderPricing() {
  page(
    "Pricing",
    `<section class="section">
      <span class="eyebrow">Straightforward public pricing</span><h1>Choose the access level that fits your role.</h1><p>Consumer subscriptions and business SaaS plans are separate. Sponsored visibility and affiliate relationships must always remain labelled.</p>
      ${disclaimer()}
      <div class="section-head"><div><h2>For shoppers</h2><p>Comparison remains useful without a paid plan.</p></div></div>
      <div class="grid three">
        ${priceCard("Free", "£0", ["Search", "Basic ethical overview", "Save limited products"])}
        ${priceCard("Basic+", "£3.99/mo", ["Expanded scoring", "Watchlist", "Price-change simulation"])}
        ${priceCard("Premium", "£7.99/mo", ["Advanced personalisation", "Impact trends", "Ad-free browsing"])}
      </div>
      <div class="section-head pricing-subhead"><div><h2>For businesses</h2><p>Tools for managing a business's own product evidence and visibility.</p></div></div>
      <div class="grid three">
        ${priceCard("Starter", "£49/mo", ["Brand profile", "Basic analytics", "5 product records"])}
        ${priceCard("Growth", "£99/mo", ["Consumer insights", "Sponsored preview", "25 product records"])}
        ${priceCard("Advanced", "£199/mo", ["Deeper ESG tools", "Campaign analytics", "Priority review"])}
      </div>
      <div class="creator-commercial-note"><strong>Creators</strong><span>No public monthly fee is shown in this model. Affiliate earnings and Neeyat's retained share must be disclosed in the creator workspace and at recommendation level.</span><button class="secondary" data-route="influencers">Explore creator collections</button></div>
    </section>`,
  );
}

function priceCard(name, price, items) {
  return `<article class="card price-card"><h3>${name}</h3><strong>${price}</strong><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul><button class="secondary">Demo only</button></article>`;
}

function renderMethodology() {
  const example = data.products[4];
  page(
    "Scoring and Impact",
    `<section class="section app-page impact-page">
      <div class="mobile-page-top mobile-only">
        ${appStatus()}
        <header><button class="icon-button" data-route="home">←</button><strong>Scoring & Impact</strong><button class="icon-button">i</button></header>
      </div>
      <div class="scoring-hero"><span class="eyebrow">Clear definitions before numbers</span><h1>Four measures. Four different jobs.</h1><p>Neeyat does not use one vague “impact score” for products, people and the platform. Each measure has a defined subject, input and limitation.</p></div>
      <div class="score-scope-grid">
        <article><span>01 · Product level</span><h2>Product Evidence Score</h2><strong>0–100</strong><p>Summarises the environmental, labour, governance, product-responsibility and evidence record attached to one product.</p><small>Public · same underlying score for every shopper · not a certification.</small></article>
        <article><span>02 · Decision level</span><h2>Purchase Confidence</h2><strong>0–100</strong><p>Combines delivered price, retailer confidence, product evidence and the signed-in shopper's priorities for one purchase decision.</p><small>Personalised · changes with preferences and available offers.</small></article>
        <article><span>03 · Customer level</span><h2>My Shopping Impact</h2><strong>Estimate</strong><p>Tracks estimated savings, CO2e and waste differences from confirmed purchases only. Searches, saves and clicks never count.</p><small>Private workspace · benchmark-based · user-correctable.</small></article>
        <article class="future-scope"><span>04 · Platform level</span><h2>Neeyat Platform Impact</h2><strong>Not yet claimed</strong><p>Aggregate platform impact will be published only after live transactions, defensible attribution rules and methodology review exist.</p><small>No public total is presented in this prototype.</small></article>
      </div>
      <section class="scoring-example">
        <div><span class="eyebrow">Worked product example</span><h2>${example.name}: ${productEvidenceScore(example)}/100</h2><p>This score describes the current demo evidence record for this product. It does not claim that buying the product automatically creates a positive impact.</p><button class="secondary" data-detail="${example.id}">Open the product evidence</button></div>
        <div class="score-breakdown">${scoreBar("Environmental record", example.scores.environment, 30)}${scoreBar("Labour and sourcing", example.scores.labour, 25)}${scoreBar("Governance and transparency", example.scores.governance, 20)}${scoreBar("Product and packaging", example.scores.responsibility, 15)}${scoreBar("Evidence quality", example.scores.evidence, 10)}</div>
      </section>
      <section class="confidence-formula"><div><span class="eyebrow">Personal decision layer</span><h2>How Purchase Confidence is formed</h2><p>The product record remains independent. Neeyat then adds current commercial information and the shopper's stated priorities.</p></div><div class="formula-parts"><span><strong>30%</strong> delivered-price confidence</span><span><strong>30%</strong> product evidence</span><span><strong>20%</strong> retailer confidence</span><span><strong>20%</strong> personal values fit</span></div></section>
      <section class="impact-rules"><div><span class="eyebrow">Personal impact rules</span><h2>What can and cannot change “My Shopping Impact”</h2></div><div class="grid two"><article class="card"><h3>Included</h3><ul><li>A purchase explicitly confirmed by the customer.</li><li>The price paid and a dated comparison benchmark.</li><li>Documented category-impact factors with ranges.</li><li>Returns, cancellations and customer corrections.</li></ul></article><article class="card"><h3>Never counted as impact</h3><ul><li>Searches, impressions or product-page views.</li><li>Saved products, wishlists or price alerts.</li><li>Retailer clicks without purchase confirmation.</li><li>Unverified brand claims presented as facts.</li></ul></article></div></section>
      <div class="methodology-cta"><div><strong>${state.user?.role === "Consumer" ? "Your demo impact estimate is ready." : "Personal impact belongs in a private customer workspace."}</strong><span>Every estimate must retain its source, benchmark date and uncertainty range.</span></div><button class="primary" data-route="${state.user?.role === "Consumer" ? "consumer" : "login"}">${state.user?.role === "Consumer" ? "View My Shopping Impact" : "Open consumer demo"}</button></div>
      ${disclaimer()}
      <div class="mobile-only">${mobileBottomNav("impact")}</div>
    </section>`,
  );
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
  if (routeName === "products") return renderProducts();
  if (routeName === "deals") return renderDeals();
  if (routeName.startsWith("detail:")) return renderProductDetail(routeName.split(":")[1]);
  if (routeName === "login") return renderLogin();
  if (routeName === "consumer") return renderConsumer();
  if (routeName === "influencers") return renderInfluencers();
  if (routeName === "influencerDashboard") return renderInfluencerDashboard();
  if (routeName === "business") return renderBusiness();
  if (routeName === "businessDashboard") return renderBusinessDashboard();
  if (routeName === "pricing") return renderPricing();
  if (routeName === "methodology") return renderMethodology();
  if (["ecosystem", "demo"].includes(routeName)) return renderHome();
  if (["privacy", "terms", "affiliate", "sources"].includes(routeName)) return renderPolicy(routeName);
  if (routeName === "contact") return renderContact();
  return renderHome();
}

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-logout]")) {
    state.user = null;
    route("home");
    return;
  }
  const explainTab = event.target.closest("[data-explain-tab]");
  if (explainTab) {
    const selected = explainTab.dataset.explainTab;
    document.querySelectorAll("[data-explain-tab]").forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.explainTab === selected)));
    document.querySelectorAll("[data-explain-panel]").forEach((panel) => {
      const active = panel.dataset.explainPanel === selected;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
  }
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
  const alert = event.target.closest("[data-alert]");
  if (alert) {
    const id = alert.dataset.alert;
    state.alerts = state.alerts.includes(id) ? state.alerts.filter((item) => item !== id) : [...state.alerts, id];
    render();
  }
  const categoryQuery = event.target.closest("[data-category-query]");
  if (categoryQuery) {
    state.query = "";
    state.category = categoryQuery.dataset.categoryQuery;
    state.route = "products";
    location.hash = "products";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const queryButton = event.target.closest("[data-query]");
  if (queryButton) {
    if (queryButton.dataset.maxPrice) state.maxPrice = Number(queryButton.dataset.maxPrice);
    state.dealsOnly = false;
    applyQuickSearch(queryButton.dataset.query || "", queryButton.dataset.queryCategory || "All");
  }
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    state.view = viewButton.dataset.view;
    renderProducts();
  }
  const resetButton = event.target.closest("[data-reset-filters]");
  if (resetButton) {
    state.query = "";
    state.category = "All";
    state.maxPrice = 250;
    state.minScore = 0;
    state.verifiedOnly = false;
    state.dealsOnly = false;
    state.sort = "match";
    renderProducts();
  }
  if (event.target.closest("[data-clear-compare]")) {
    state.compare = [];
    renderProducts();
  }
  const scrollButton = event.target.closest("[data-scroll-target]");
  if (scrollButton) document.querySelector(`#${scrollButton.dataset.scrollTarget}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const demoBuy = event.target.closest("[data-demo-buy]");
  if (demoBuy) {
    const existing = document.querySelector(".demo-toast");
    existing?.remove();
    document.body.insertAdjacentHTML("beforeend", `<div class="demo-toast"><strong>Retailer hand-off preview</strong><span>A live build would now open ${demoBuy.dataset.demoBuy} with affiliate disclosure and click tracking.</span></div>`);
    window.setTimeout(() => document.querySelector(".demo-toast")?.remove(), 4200);
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
  if (event.target.id === "categoryFilter") state.category = event.target.value;
  if (event.target.id === "priceFilter") state.maxPrice = Number(event.target.value);
  if (event.target.id === "scoreFilter") state.minScore = Number(event.target.value);
  if (event.target.id === "sortFilter") state.sort = event.target.value;
  if (event.target.id === "dealsFilter") state.dealsOnly = event.target.checked;
  if (event.target.id === "verifiedFilter") state.verifiedOnly = event.target.checked;
  if (event.target.dataset.pref) {
    state.preferences[event.target.dataset.pref] = Number(event.target.value);
  }
  if (["categoryFilter", "priceFilter", "scoreFilter", "sortFilter", "dealsFilter", "verifiedFilter"].includes(event.target.id) || event.target.dataset.pref) render();
});

document.addEventListener("submit", (event) => {
  if (event.target.matches("[data-search-form]")) {
    event.preventDefault();
    const query = event.target.querySelector('[name="query"]')?.value.trim() || "";
    state.maxPrice = Math.max(state.maxPrice, 250);
    applyQuickSearch(query, "All");
  }
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



