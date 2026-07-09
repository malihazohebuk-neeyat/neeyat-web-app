const products = [
  {
    id: "green-current",
    name: "Green Everyday Account",
    category: "banking",
    monthlyCost: 7,
    environment: 86,
    labour: 72,
    transparency: 91,
    ethics: 84,
    summary: "A current account option with clear reporting, low fees, and visible ethical-screening policies.",
    traits: ["clear fees", "ethical screening", "mobile alerts"],
  },
  {
    id: "impact-saver",
    name: "Community Impact Saver",
    category: "banking",
    monthlyCost: 3,
    environment: 74,
    labour: 77,
    transparency: 82,
    ethics: 79,
    summary: "Savings choice oriented around community lending and transparent use-of-funds reporting.",
    traits: ["community lending", "low cost", "savings"],
  },
  {
    id: "refill-market",
    name: "Refill Home Essentials",
    category: "shopping",
    monthlyCost: 42,
    environment: 93,
    labour: 81,
    transparency: 76,
    ethics: 86,
    summary: "Everyday household products with reusable packaging and supplier-labour disclosures.",
    traits: ["low waste", "verified suppliers", "household"],
  },
  {
    id: "fair-fashion",
    name: "Fair Wardrobe Swap",
    category: "shopping",
    monthlyCost: 28,
    environment: 88,
    labour: 90,
    transparency: 73,
    ethics: 85,
    summary: "Pre-loved clothing marketplace prioritising fair seller practices and lower carbon impact.",
    traits: ["pre-loved", "fair sellers", "lower carbon"],
  },
  {
    id: "renew-plan",
    name: "Renewable Flex Energy",
    category: "energy",
    monthlyCost: 96,
    environment: 94,
    labour: 70,
    transparency: 78,
    ethics: 83,
    summary: "Renewable energy tariff with usage tracking and straightforward switching guidance.",
    traits: ["renewable", "usage insights", "switching"],
  },
  {
    id: "warm-home",
    name: "Warm Home Efficient",
    category: "energy",
    monthlyCost: 82,
    environment: 78,
    labour: 75,
    transparency: 80,
    ethics: 78,
    summary: "Balanced energy choice focused on affordability, efficiency nudges, and clear billing.",
    traits: ["lower cost", "billing clarity", "efficiency"],
  },
  {
    id: "zakat-planner",
    name: "Zakat & Giving Planner",
    category: "giving",
    monthlyCost: 15,
    environment: 72,
    labour: 84,
    transparency: 94,
    ethics: 88,
    summary: "Donation planning tool with transparent charity records and recurring contribution tracking.",
    traits: ["transparent charities", "recurring giving", "records"],
  },
  {
    id: "local-good",
    name: "Local Good Fund",
    category: "giving",
    monthlyCost: 20,
    environment: 81,
    labour: 82,
    transparency: 86,
    ethics: 84,
    summary: "Local causes directory with impact reporting and category-based giving recommendations.",
    traits: ["local causes", "impact reports", "community"],
  },
];

const state = {
  category: "all",
  sort: "match",
  shortlist: new Set(),
};

const controls = {
  environment: document.querySelector("#environment"),
  labour: document.querySelector("#labour"),
  transparency: document.querySelector("#transparency"),
  price: document.querySelector("#price"),
  category: document.querySelector("#category"),
  budget: document.querySelector("#budget"),
};

const productGrid = document.querySelector("#productGrid");
const compareBody = document.querySelector("#compareBody");

function number(value) {
  return Number(value) || 0;
}

function preferences() {
  return {
    environment: number(controls.environment.value),
    labour: number(controls.labour.value),
    transparency: number(controls.transparency.value),
    price: number(controls.price.value),
    budget: number(controls.budget.value),
  };
}

function scoreProduct(product, prefs = preferences()) {
  const ethicsFit =
    (100 - Math.abs(product.environment - prefs.environment)) * 0.27 +
    (100 - Math.abs(product.labour - prefs.labour)) * 0.23 +
    (100 - Math.abs(product.transparency - prefs.transparency)) * 0.25 +
    product.ethics * 0.25;

  const affordability = Math.max(0, 100 - (product.monthlyCost / Math.max(prefs.budget, 1)) * 100);
  const priceWeight = prefs.price / 100;
  return Math.round(ethicsFit * (1 - priceWeight * 0.35) + affordability * priceWeight * 0.35);
}

function filteredProducts() {
  const prefs = preferences();
  return products
    .filter((product) => state.category === "all" || product.category === state.category)
    .map((product) => ({ ...product, match: scoreProduct(product, prefs) }))
    .sort((a, b) => {
      if (state.sort === "cost") return a.monthlyCost - b.monthlyCost;
      if (state.sort === "impact") return b.ethics - a.ethics;
      return b.match - a.match;
    });
}

function renderProducts() {
  const list = filteredProducts();
  productGrid.innerHTML = list
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-top">
            <div>
              <span class="category-pill">${product.category}</span>
              <h3>${product.name}</h3>
            </div>
            <span class="match-badge">${product.match}</span>
          </div>
          <p>${product.summary}</p>
          <div class="trait-list">
            ${product.traits.map((trait) => `<span>${trait}</span>`).join("")}
          </div>
          <dl class="metric-list">
            <div><dt>Cost</dt><dd>£${product.monthlyCost}/mo</dd></div>
            <div><dt>Ethics</dt><dd>${product.ethics}</dd></div>
            <div><dt>Transp.</dt><dd>${product.transparency}</dd></div>
          </dl>
          <div class="card-actions">
            <button class="secondary-action ${state.shortlist.has(product.id) ? "selected" : ""}" data-shortlist="${product.id}">
              ${state.shortlist.has(product.id) ? "Saved" : "Shortlist"}
            </button>
            <button class="secondary-action" data-focus="${product.id}">Inspect</button>
          </div>
        </article>
      `,
    )
    .join("");

  const best = list[0];
  if (best) {
    document.querySelector("#bestMatch").textContent = best.name;
    document.querySelector("#bestReason").textContent = best.summary;
    document.querySelector("#scoreRing").textContent = best.match;
    document.querySelector("#scoreRing").style.background = `radial-gradient(circle at center, white 0 54%, transparent 55%), conic-gradient(var(--mint) 0deg ${best.match * 3.6}deg, #e8ecdf ${best.match * 3.6}deg 360deg)`;
    document.querySelector("#monthlyCost").textContent = `£${best.monthlyCost}`;
    document.querySelector("#impactScore").textContent = best.ethics;
  }
  updateSummary();
}

function shortlistProducts() {
  return products
    .filter((product) => state.shortlist.has(product.id))
    .map((product) => ({ ...product, match: scoreProduct(product) }));
}

function renderCompare() {
  const rows = shortlistProducts();
  compareBody.innerHTML = rows.length
    ? rows
        .map(
          (product) => `
            <tr>
              <td>${product.name}</td>
              <td>${product.category}</td>
              <td>£${product.monthlyCost}/mo</td>
              <td>${product.ethics}</td>
              <td>${product.transparency}</td>
              <td>${product.match}</td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="6">No shortlisted choices yet. Add options from the dashboard.</td></tr>`;
}

function renderImpact() {
  const rows = shortlistProducts();
  const spend = rows.reduce((sum, product) => sum + product.monthlyCost * 12, 0);
  const transparent = rows.filter((product) => product.transparency >= 85).length;
  const average = rows.length
    ? Math.round(rows.reduce((sum, product) => sum + product.ethics, 0) / rows.length)
    : 0;

  document.querySelector("#guidedSpend").textContent = `£${spend.toLocaleString("en-GB")}`;
  document.querySelector("#transparentChoices").textContent = transparent;
  document.querySelector("#averageEthics").textContent = average;

  document.querySelector("#impactTimeline").innerHTML = rows.length
    ? rows
        .map(
          (product) => `
            <div class="timeline-item">
              <strong>${product.name}</strong>
              <p>${product.category} choice with ${product.ethics}/100 ethics score and £${product.monthlyCost}/mo estimated cost.</p>
            </div>
          `,
        )
        .join("")
    : `<div class="timeline-item"><strong>No impact trail yet</strong><p>Shortlist choices to build your personal impact view.</p></div>`;
}

function updateSummary() {
  const rows = shortlistProducts();
  const average = rows.length
    ? Math.round(rows.reduce((sum, product) => sum + product.ethics, 0) / rows.length)
    : 82;
  document.querySelector("#shortlistCount").textContent = rows.length;
  document.querySelector("#sidebarScore").textContent = average;
  renderCompare();
  renderImpact();
}

function navigate(viewId) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
}

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => navigate(item.dataset.view));
});

Object.values(controls).forEach((control) => {
  control.addEventListener("input", () => {
    state.category = controls.category.value;
    renderProducts();
  });
});

document.querySelectorAll(".segmented button").forEach((button) => {
  button.addEventListener("click", () => {
    state.sort = button.dataset.sort;
    document.querySelectorAll(".segmented button").forEach((item) => item.classList.toggle("active", item === button));
    renderProducts();
  });
});

productGrid.addEventListener("click", (event) => {
  const shortlistButton = event.target.closest("[data-shortlist]");
  const focusButton = event.target.closest("[data-focus]");

  if (shortlistButton) {
    const id = shortlistButton.dataset.shortlist;
    if (state.shortlist.has(id)) state.shortlist.delete(id);
    else state.shortlist.add(id);
    renderProducts();
  }

  if (focusButton) {
    const product = products.find((item) => item.id === focusButton.dataset.focus);
    if (!product) return;
    state.category = product.category;
    controls.category.value = product.category;
    renderProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

document.querySelector("#resetPrefs").addEventListener("click", () => {
  controls.environment.value = 82;
  controls.labour.value = 76;
  controls.transparency.value = 88;
  controls.price.value = 52;
  controls.category.value = "all";
  controls.budget.value = 450;
  state.category = "all";
  renderProducts();
});

document.querySelector("#coachForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const choice = form.get("choice");
  const priority = form.get("priority");
  const risk = Number(form.get("risk"));
  const options = products
    .filter((product) => product.category === choice)
    .map((product) => ({ ...product, match: scoreProduct(product) }))
    .sort((a, b) => {
      const priorityScore = (item) => (priority === "cost" ? 100 - item.monthlyCost : item[priority] || item.match);
      return priorityScore(b) - priorityScore(a);
    });
  const pick = options[0];
  const caution =
    risk < 4
      ? "Start with a low-commitment option and review it after one month."
      : risk > 7
        ? "You can prioritise higher-impact choices even if the cost is slightly higher."
        : "Balance the ethical signal with cost and convenience before switching.";

  document.querySelector("#coachResult").innerHTML = `
    <span class="panel-label">Recommendation</span>
    <h3>${pick.name}</h3>
    <p>${pick.summary}</p>
    <p><strong>Trade-off:</strong> ${caution}</p>
    <button class="primary-action" data-coach-save="${pick.id}">Add to Shortlist</button>
  `;
});

document.querySelector("#coachResult").addEventListener("click", (event) => {
  const button = event.target.closest("[data-coach-save]");
  if (!button) return;
  state.shortlist.add(button.dataset.coachSave);
  renderProducts();
  navigate("compare");
});

renderProducts();
renderCompare();
renderImpact();
