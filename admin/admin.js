const adminApp = document.querySelector("#adminApp");
const platformData = window.NEEYAT_DATA;

const ADMIN_EMAIL = "admin@neeyat.demo";
const ADMIN_PASSWORD = "AdminDemo123!";

const seedUsers = [
  { id: "USR-1001", name: "Maliha", email: "consumer@neeyat.demo", role: "Consumer", status: "Active", joined: "14 Mar 2026", lastActive: "2 min ago" },
  { id: "USR-1002", name: "Amina Green", email: "influencer@neeyat.demo", role: "Influencer", status: "Active", joined: "19 Mar 2026", lastActive: "18 min ago" },
  { id: "USR-1003", name: "KindThread Co.", email: "business@neeyat.demo", role: "Business", status: "Active", joined: "22 Mar 2026", lastActive: "1 hr ago" },
  { id: "USR-1004", name: "Sarah Ahmed", email: "sarah@example.demo", role: "Consumer", status: "Active", joined: "02 Apr 2026", lastActive: "Today" },
  { id: "USR-1005", name: "North Loom", email: "team@northloom.demo", role: "Business", status: "Pending", joined: "11 Apr 2026", lastActive: "Yesterday" },
  { id: "USR-1006", name: "Leo Circular", email: "leo@creator.demo", role: "Influencer", status: "Active", joined: "16 Apr 2026", lastActive: "3 hrs ago" },
  { id: "USR-1007", name: "Imran Khan", email: "imran@example.demo", role: "Consumer", status: "Suspended", joined: "24 Apr 2026", lastActive: "18 days ago" },
  { id: "USR-1008", name: "Bare Bottle", email: "ops@barebottle.demo", role: "Business", status: "Review", joined: "03 May 2026", lastActive: "2 days ago" },
  { id: "USR-1009", name: "Nadia Nour", email: "nadia@creator.demo", role: "Influencer", status: "Active", joined: "06 May 2026", lastActive: "Yesterday" },
  { id: "USR-1010", name: "James Walker", email: "james@example.demo", role: "Consumer", status: "Active", joined: "12 May 2026", lastActive: "5 min ago" },
];

const seedClaims = [
  { id: "CLM-2041", productId: "prod-05", claim: "Plastic-free packaging", type: "Packaging", evidence: "Supplier declaration", status: "Pending", updated: "16 Jul 2026" },
  { id: "CLM-2042", productId: "prod-01", claim: "Recycled fibre content", type: "Materials", evidence: "Material specification", status: "Review", updated: "15 Jul 2026" },
  { id: "CLM-2043", productId: "prod-10", claim: "Refurbished device", type: "Circularity", evidence: "Warranty and grading policy", status: "Approved", updated: "14 Jul 2026" },
  { id: "CLM-2044", productId: "prod-13", claim: "Fairtrade supply", type: "Certification", evidence: "Certificate reference", status: "Approved", updated: "12 Jul 2026" },
  { id: "CLM-2045", productId: "prod-08", claim: "Refillable system", type: "Packaging", evidence: "Photographic evidence only", status: "Evidence requested", updated: "11 Jul 2026" },
  { id: "CLM-2046", productId: "prod-11", claim: "Repairable design", type: "Circularity", evidence: "Repair manual", status: "Review", updated: "10 Jul 2026" },
  { id: "CLM-2047", productId: "prod-16", claim: "Plastic-free product", type: "Materials", evidence: "Manufacturer statement", status: "Pending", updated: "09 Jul 2026" },
];

const seedPartners = [
  { id: "PAR-301", name: "KindThread Co.", type: "Brand", owner: "Business", status: "Live", records: 18 },
  { id: "PAR-302", name: "Amina Green", type: "Creator", owner: "Influencer", status: "Live", records: 4 },
  { id: "PAR-303", name: "EcoCart UK", type: "Retailer", owner: "Retailer", status: "Live", records: 124 },
  { id: "PAR-304", name: "North Loom", type: "Brand", owner: "Business", status: "Onboarding", records: 6 },
  { id: "PAR-305", name: "Bare Bottle", type: "Brand", owner: "Business", status: "Review", records: 11 },
  { id: "PAR-306", name: "Leo Circular", type: "Creator", owner: "Influencer", status: "Live", records: 3 },
];

const seedTransactions = [
  { id: "TX-84012", date: "16 Jul 2026", source: "EcoCart UK", user: "USR-1010", value: 39.0, commission: 2.34, status: "Attributed" },
  { id: "TX-84011", date: "16 Jul 2026", source: "KindMarket", user: "USR-1004", value: 8.2, commission: 0.49, status: "Pending" },
  { id: "TX-84010", date: "15 Jul 2026", source: "Everyday Better", user: "USR-1001", value: 179.0, commission: 10.74, status: "Attributed" },
  { id: "TX-84009", date: "15 Jul 2026", source: "Conscious Basket", user: "USR-1004", value: 18.5, commission: 1.11, status: "Attributed" },
  { id: "TX-84008", date: "14 Jul 2026", source: "Value & Values", user: "USR-1010", value: 24.0, commission: 1.68, status: "Review" },
  { id: "TX-84007", date: "14 Jul 2026", source: "EcoCart UK", user: "USR-1001", value: 11.0, commission: 0.66, status: "Attributed" },
];

const seedContent = [
  { id: "CNT-01", title: "Refillable everyday care", type: "Homepage collection", status: "Published" },
  { id: "CNT-02", title: "Verified choices under £20", type: "Deal collection", status: "Published" },
  { id: "CNT-03", title: "Second-life technology", type: "Creator collection", status: "Draft" },
  { id: "CNT-04", title: "Evidence explainer", type: "Education", status: "Published" },
];

function readStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

const state = {
  authenticated: sessionStorage.getItem("neeyatAdminAuthenticated") === "true",
  section: location.hash.replace("#", "") || "overview",
  users: readStored("neeyatAdminUsers", seedUsers),
  claims: readStored("neeyatAdminClaims", seedClaims),
  partners: readStored("neeyatAdminPartners", seedPartners),
  content: readStored("neeyatAdminContent", seedContent),
  transactions: seedTransactions,
  audit: readStored("neeyatAdminAudit", [
    { time: "16 Jul 2026, 13:42", actor: "Admin Demo", action: "Reviewed product claim", detail: "CLM-2042 moved to Review" },
    { time: "16 Jul 2026, 12:18", actor: "Admin Demo", action: "Updated user status", detail: "USR-1008 moved to Review" },
    { time: "15 Jul 2026, 17:05", actor: "System", action: "Affiliate import", detail: "48 events processed; 2 held for review" },
  ]),
  settings: readStored("neeyatAdminSettings", { environment: 30, labour: 25, governance: 20, responsibility: 15, evidence: 10, publicRegistration: true, claimAutoPublish: false }),
  userQuery: "",
  userRole: "All",
  selectedUser: null,
  loginError: "",
  message: "",
};

const navItems = [
  ["overview", "Overview"],
  ["users", "Users"],
  ["claims", "Products & claims"],
  ["partners", "Partners"],
  ["transactions", "Transactions"],
  ["content", "Content"],
  ["reports", "Reports"],
  ["settings", "Settings"],
  ["audit", "Audit log"],
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value) {
  return `£${Number(value).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function productName(id) {
  return platformData.products.find((product) => product.id === id)?.name || id;
}

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function statusClass(status) {
  return `status status-${status.toLowerCase().replace(/\s+/g, "-")}`;
}

function recordAudit(action, detail) {
  state.audit.unshift({ time: new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }), actor: "Admin Demo", action, detail });
  state.audit = state.audit.slice(0, 40);
  persist("neeyatAdminAudit", state.audit);
  state.message = `${action}: ${detail}`;
}

function renderLogin() {
  document.title = "Admin Login | Neeyat";
  adminApp.innerHTML = `<section class="admin-login-shell">
    <div class="admin-login-brand"><a href="../" aria-label="Return to Neeyat"><img src="../assets/neeyat-logo-web.png" alt="Neeyat" /></a><span>Platform administration</span><h1>Operate the demo from one controlled workspace.</h1><p>User access, product claims, partners, transactions and platform settings are kept away from the public experience.</p><div class="security-note"><strong>Static prototype limitation</strong><span>This login demonstrates access separation only. Production requires server-side authentication, encrypted sessions, MFA and role-based permissions.</span></div></div>
    <form class="admin-login-form" id="adminLoginForm">
      <div><span class="admin-kicker">Administrator sign in</span><h2>Welcome back</h2><p>Use the demo credentials below.</p></div>
      <label>Email<input name="email" type="email" autocomplete="username" value="${ADMIN_EMAIL}" required /></label>
      <label>Password<input name="password" type="password" autocomplete="current-password" value="${ADMIN_PASSWORD}" required /></label>
      ${state.loginError ? `<p class="form-error">${escapeHtml(state.loginError)}</p>` : ""}
      <button class="admin-primary" type="submit">Sign in to administration</button>
      <div class="demo-credentials"><span>Demo email</span><strong>${ADMIN_EMAIL}</strong><span>Demo password</span><strong>${ADMIN_PASSWORD}</strong></div>
      <a class="back-link" href="../">Return to public platform</a>
    </form>
  </section>`;
}

function metricCard(label, value, detail, tone = "") {
  return `<article class="admin-metric ${tone}"><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>`;
}

function renderOverview() {
  const pendingClaims = state.claims.filter((claim) => ["Pending", "Review", "Evidence requested"].includes(claim.status));
  const activeUsers = state.users.filter((user) => user.status === "Active").length;
  const attributed = state.transactions.filter((transaction) => transaction.status === "Attributed");
  const commission = attributed.reduce((sum, transaction) => sum + transaction.commission, 0);
  return `<section class="admin-view">
    <header class="view-heading"><div><span class="admin-kicker">Operations overview</span><h1>Platform health and queues</h1><p>Illustrative management data for the static administration prototype.</p></div><button class="admin-secondary" data-export="overview">Export summary</button></header>
    <div class="admin-metrics">${metricCard("Active demo users", activeUsers, `${state.users.length} seeded records`)}${metricCard("Claims requiring action", pendingClaims.length, `${state.claims.filter((claim) => claim.status === "Pending").length} newly pending`, "attention")}${metricCard("Live partners", state.partners.filter((partner) => partner.status === "Live").length, `${state.partners.length} total partners`)}${metricCard("Attributed commission", money(commission), `${attributed.length} transactions`)}</div>
    <div class="admin-grid admin-grid-main">
      <article class="admin-panel"><div class="panel-heading"><div><h2>User activity</h2><p>Eight-week illustrative active-user trend</p></div><span class="trend-positive">+14.2%</span></div><div class="bar-chart" aria-label="Illustrative user growth chart">${[44, 53, 49, 62, 66, 73, 79, 86].map((height, index) => `<span style="--height:${height}%"><i>W${index + 1}</i></span>`).join("")}</div></article>
      <article class="admin-panel queue-panel"><div class="panel-heading"><div><h2>Priority queue</h2><p>Items requiring administrator review</p></div><button class="link-button" data-section="claims">Open queue</button></div>${pendingClaims.slice(0, 4).map((claim) => `<button class="queue-row" data-section="claims"><span class="${statusClass(claim.status)}">${claim.status}</span><strong>${productName(claim.productId)}</strong><small>${claim.claim}</small></button>`).join("")}</article>
    </div>
    <div class="admin-grid admin-grid-equal">
      <article class="admin-panel"><div class="panel-heading"><div><h2>Account mix</h2><p>Seeded administration records</p></div></div><div class="role-mix">${["Consumer", "Influencer", "Business"].map((role) => { const count = state.users.filter((user) => user.role === role).length; return `<span><strong>${count}</strong>${role}<i style="--width:${Math.round((count / state.users.length) * 100)}%"></i></span>`; }).join("")}</div></article>
      <article class="admin-panel"><div class="panel-heading"><div><h2>Recent administration</h2><p>Latest auditable actions</p></div><button class="link-button" data-section="audit">View all</button></div><div class="compact-activity">${state.audit.slice(0, 5).map((item) => `<span><i></i><div><strong>${item.action}</strong><small>${item.detail} · ${item.time}</small></div></span>`).join("")}</div></article>
    </div>
  </section>`;
}

function renderUsers() {
  const query = state.userQuery.toLowerCase();
  const users = state.users.filter((user) => state.userRole === "All" || user.role === state.userRole).filter((user) => !query || `${user.name} ${user.email} ${user.id}`.toLowerCase().includes(query));
  return `<section class="admin-view"><header class="view-heading"><div><span class="admin-kicker">Identity and access</span><h1>User administration</h1><p>Review role, status and recent activity. Sensitive production identity data must remain server-side.</p></div><button class="admin-secondary" data-export="users">Export users</button></header>
    <form class="admin-toolbar" id="userFilterForm"><label>Search<input name="query" value="${escapeHtml(state.userQuery)}" placeholder="Name, email or user ID" /></label><label>Role<select name="role"><option>All</option>${["Consumer", "Influencer", "Business"].map((role) => `<option ${state.userRole === role ? "selected" : ""}>${role}</option>`).join("")}</select></label><button class="admin-primary" type="submit">Apply filters</button><button class="admin-secondary" type="button" data-clear-user-filters>Clear</button></form>
    <div class="admin-table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Last active</th><th>Actions</th></tr></thead><tbody>${users.map((user) => `<tr><td><strong>${escapeHtml(user.name)}</strong><span>${user.email}<br />${user.id}</span></td><td>${user.role}</td><td><span class="${statusClass(user.status)}">${user.status}</span></td><td>${user.joined}</td><td>${user.lastActive}</td><td><div class="table-actions"><button data-open-user="${user.id}">View</button><button data-user-toggle="${user.id}">${user.status === "Suspended" ? "Activate" : "Suspend"}</button></div></td></tr>`).join("")}</tbody></table></div>
    ${users.length ? "" : `<div class="admin-empty"><h2>No matching users</h2><p>Clear the filters and try again.</p></div>`}
  </section>`;
}

function renderClaims() {
  return `<section class="admin-view"><header class="view-heading"><div><span class="admin-kicker">Evidence governance</span><h1>Products and claims</h1><p>Moderation changes claim visibility; it does not certify a product or business.</p></div><button class="admin-secondary" data-export="claims">Export claim register</button></header>
    <div class="claim-summary">${["Pending", "Review", "Evidence requested", "Approved"].map((status) => `<span><strong>${state.claims.filter((claim) => claim.status === status).length}</strong>${status}</span>`).join("")}</div>
    <div class="admin-table-wrap"><table><thead><tr><th>Claim</th><th>Product</th><th>Type</th><th>Evidence</th><th>Status</th><th>Updated</th><th>Decision</th></tr></thead><tbody>${state.claims.map((claim) => `<tr><td><strong>${claim.id}</strong><span>${claim.claim}</span></td><td>${productName(claim.productId)}</td><td>${claim.type}</td><td>${claim.evidence}</td><td><span class="${statusClass(claim.status)}">${claim.status}</span></td><td>${claim.updated}</td><td><div class="table-actions"><button data-claim-action="approve" data-claim-id="${claim.id}">Approve</button><button data-claim-action="evidence" data-claim-id="${claim.id}">Request evidence</button></div></td></tr>`).join("")}</tbody></table></div>
  </section>`;
}

function renderPartners() {
  return `<section class="admin-view"><header class="view-heading"><div><span class="admin-kicker">Commercial ecosystem</span><h1>Partner administration</h1><p>Manage onboarding state for brands, creators and retailers.</p></div><button class="admin-secondary" data-export="partners">Export partners</button></header><div class="partner-grid">${state.partners.map((partner) => `<article class="partner-card"><div><span>${partner.type}</span><span class="${statusClass(partner.status)}">${partner.status}</span></div><h2>${partner.name}</h2><p>${partner.records} linked records · ${partner.owner} account</p><div class="table-actions"><button data-partner-action="${partner.status === "Live" ? "hold" : "approve"}" data-partner-id="${partner.id}">${partner.status === "Live" ? "Place on hold" : "Approve partner"}</button><button data-section="claims">Review evidence</button></div></article>`).join("")}</div></section>`;
}

function renderTransactions() {
  const totalValue = state.transactions.reduce((sum, transaction) => sum + transaction.value, 0);
  const totalCommission = state.transactions.reduce((sum, transaction) => sum + transaction.commission, 0);
  return `<section class="admin-view"><header class="view-heading"><div><span class="admin-kicker">Affiliate operations</span><h1>Transaction oversight</h1><p>Illustrative attribution data. Production records require retailer callbacks, reconciliation and fraud controls.</p></div><button class="admin-secondary" data-export="transactions">Export transactions</button></header><div class="admin-metrics">${metricCard("Tracked order value", money(totalValue), `${state.transactions.length} seeded transactions`)}${metricCard("Gross commission", money(totalCommission), "Before creator share and reversals")}${metricCard("Pending review", state.transactions.filter((transaction) => transaction.status !== "Attributed").length, "Pending or held events", "attention")}${metricCard("Attribution rate", "81.6%", "Illustrative only")}</div><div class="admin-table-wrap"><table><thead><tr><th>Transaction</th><th>Date</th><th>Retailer</th><th>User reference</th><th>Order value</th><th>Commission</th><th>Status</th></tr></thead><tbody>${state.transactions.map((transaction) => `<tr><td><strong>${transaction.id}</strong></td><td>${transaction.date}</td><td>${transaction.source}</td><td>${transaction.user}</td><td>${money(transaction.value)}</td><td>${money(transaction.commission)}</td><td><span class="${statusClass(transaction.status)}">${transaction.status}</span></td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderContent() {
  return `<section class="admin-view"><header class="view-heading"><div><span class="admin-kicker">Public experience</span><h1>Content administration</h1><p>Control curated collections without changing product evidence or retailer ranking.</p></div></header><div class="content-list">${state.content.map((item) => `<article><div><span>${item.type}</span><h2>${item.title}</h2></div><span class="${statusClass(item.status)}">${item.status}</span><button data-content-toggle="${item.id}">${item.status === "Published" ? "Move to draft" : "Publish"}</button></article>`).join("")}</div><div class="governance-note"><strong>Ranking governance</strong><p>Sponsored and editorial placement must remain labelled. Content controls cannot override claim status or silently change Product Evidence Scores.</p></div></section>`;
}

function renderReports() {
  const reports = [["users", "User register", "Role, status and activity reference"], ["claims", "Claim register", "Evidence and moderation decisions"], ["partners", "Partner register", "Onboarding and live status"], ["transactions", "Transaction register", "Affiliate attribution and commission"]];
  return `<section class="admin-view"><header class="view-heading"><div><span class="admin-kicker">Exports and governance</span><h1>Reports</h1><p>Generate CSV exports from the current demo state.</p></div></header><div class="report-grid">${reports.map(([key, title, copy]) => `<article><span>CSV export</span><h2>${title}</h2><p>${copy}</p><button class="admin-secondary" data-export="${key}">Download CSV</button></article>`).join("")}</div></section>`;
}

function renderSettings() {
  const settings = state.settings;
  const total = settings.environment + settings.labour + settings.governance + settings.responsibility + settings.evidence;
  return `<section class="admin-view"><header class="view-heading"><div><span class="admin-kicker">Platform configuration</span><h1>Scoring and access settings</h1><p>Changes are stored only in this browser for the static demonstration.</p></div></header><form class="settings-form" id="settingsForm"><section class="admin-panel"><div class="panel-heading"><div><h2>Product Evidence Score weights</h2><p>Weights must total 100%. Changing them requires methodology versioning in production.</p></div><span class="${total === 100 ? "total-valid" : "total-invalid"}">${total}% total</span></div><div class="setting-grid">${[["environment", "Environment"], ["labour", "Labour and sourcing"], ["governance", "Governance"], ["responsibility", "Product responsibility"], ["evidence", "Evidence quality"]].map(([key, label]) => `<label>${label}<input type="number" name="${key}" min="0" max="100" value="${settings[key]}" /><span>%</span></label>`).join("")}</div></section><section class="admin-panel"><h2>Access controls</h2><label class="toggle-row"><input type="checkbox" name="publicRegistration" ${settings.publicRegistration ? "checked" : ""} /><span><strong>Public role registration</strong><small>Allow new consumer, creator and business applications.</small></span></label><label class="toggle-row"><input type="checkbox" name="claimAutoPublish" ${settings.claimAutoPublish ? "checked" : ""} /><span><strong>Automatic claim publishing</strong><small>Keep disabled while manual evidence governance is required.</small></span></label></section><button class="admin-primary" type="submit">Save demo settings</button></form></section>`;
}

function renderAudit() {
  return `<section class="admin-view"><header class="view-heading"><div><span class="admin-kicker">Accountability</span><h1>Audit log</h1><p>Every demo moderation and access action is recorded in this browser.</p></div><button class="admin-secondary" data-export="audit">Export audit log</button></header><div class="admin-table-wrap"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Detail</th></tr></thead><tbody>${state.audit.map((item) => `<tr><td>${item.time}</td><td>${item.actor}</td><td><strong>${item.action}</strong></td><td>${item.detail}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderCurrentView() {
  if (state.section === "users") return renderUsers();
  if (state.section === "claims") return renderClaims();
  if (state.section === "partners") return renderPartners();
  if (state.section === "transactions") return renderTransactions();
  if (state.section === "content") return renderContent();
  if (state.section === "reports") return renderReports();
  if (state.section === "settings") return renderSettings();
  if (state.section === "audit") return renderAudit();
  return renderOverview();
}

function renderUserDrawer() {
  const user = state.users.find((item) => item.id === state.selectedUser);
  if (!user) return "";
  return `<div class="drawer-backdrop" data-close-drawer><aside class="user-drawer" aria-label="User details"><header><div><span class="admin-kicker">${user.id}</span><h2>${escapeHtml(user.name)}</h2></div><button aria-label="Close user details" data-close-drawer>Close</button></header><dl><div><dt>Email</dt><dd>${user.email}</dd></div><div><dt>Role</dt><dd>${user.role}</dd></div><div><dt>Status</dt><dd><span class="${statusClass(user.status)}">${user.status}</span></dd></div><div><dt>Joined</dt><dd>${user.joined}</dd></div><div><dt>Last active</dt><dd>${user.lastActive}</dd></div></dl><section><h3>Administrator controls</h3><p>Demo actions update this browser and create an audit record.</p><button class="admin-secondary" data-user-toggle="${user.id}">${user.status === "Suspended" ? "Reactivate account" : "Suspend account"}</button></section></aside></div>`;
}

function renderShell() {
  document.title = `${navItems.find(([key]) => key === state.section)?.[1] || "Overview"} | Neeyat Admin`;
  adminApp.innerHTML = `<div class="admin-shell"><aside class="admin-sidebar"><a class="admin-brand" href="../"><img src="../assets/neeyat-logo-web.png" alt="Neeyat" /></a><div class="admin-context"><span>Administration</span><strong>Demo environment</strong></div><nav aria-label="Administration sections">${navItems.map(([key, label]) => `<button class="${state.section === key ? "active" : ""}" data-section="${key}"><span></span>${label}</button>`).join("")}</nav><div class="admin-sidebar-foot"><span>Signed in as</span><strong>Admin Demo</strong><small>${ADMIN_EMAIL}</small><button data-admin-logout>Sign out</button></div></aside><div class="admin-workspace"><header class="admin-topbar"><div><strong>${navItems.find(([key]) => key === state.section)?.[1] || "Overview"}</strong><span>Neeyat operating console</span></div><div><span class="environment-badge">Demo data</span><a href="../" target="_blank" rel="noreferrer">Open public site</a></div></header>${renderCurrentView()}</div>${state.message ? `<div class="admin-toast"><strong>Updated</strong><span>${escapeHtml(state.message)}</span></div>` : ""}${renderUserDrawer()}</div>`;
}

function render() {
  if (!state.authenticated) return renderLogin();
  renderShell();
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(type) {
  let rows;
  if (type === "users") rows = [["ID", "Name", "Email", "Role", "Status", "Joined", "Last active"], ...state.users.map((user) => [user.id, user.name, user.email, user.role, user.status, user.joined, user.lastActive])];
  else if (type === "claims") rows = [["ID", "Product", "Claim", "Type", "Evidence", "Status", "Updated"], ...state.claims.map((claim) => [claim.id, productName(claim.productId), claim.claim, claim.type, claim.evidence, claim.status, claim.updated])];
  else if (type === "partners") rows = [["ID", "Name", "Type", "Status", "Records"], ...state.partners.map((partner) => [partner.id, partner.name, partner.type, partner.status, partner.records])];
  else if (type === "transactions") rows = [["ID", "Date", "Source", "User", "Value", "Commission", "Status"], ...state.transactions.map((transaction) => [transaction.id, transaction.date, transaction.source, transaction.user, transaction.value, transaction.commission, transaction.status])];
  else if (type === "audit") rows = [["Time", "Actor", "Action", "Detail"], ...state.audit.map((item) => [item.time, item.actor, item.action, item.detail])];
  else rows = [["Metric", "Value"], ["Users", state.users.length], ["Claims requiring action", state.claims.filter((claim) => claim.status !== "Approved").length], ["Live partners", state.partners.filter((partner) => partner.status === "Live").length]];
  const blob = new Blob([rows.map((row) => row.map(csvEscape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `neeyat-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  recordAudit("Exported report", `${type} CSV downloaded`);
  render();
}

document.addEventListener("submit", (event) => {
  if (event.target.id === "adminLoginForm") {
    event.preventDefault();
    const form = new FormData(event.target);
    if (form.get("email") === ADMIN_EMAIL && form.get("password") === ADMIN_PASSWORD) {
      state.authenticated = true;
      state.loginError = "";
      sessionStorage.setItem("neeyatAdminAuthenticated", "true");
      recordAudit("Administrator login", "Demo administration session opened");
      render();
    } else {
      state.loginError = "Incorrect demo email or password.";
      render();
    }
  }
  if (event.target.id === "userFilterForm") {
    event.preventDefault();
    const form = new FormData(event.target);
    state.userQuery = String(form.get("query") || "").trim();
    state.userRole = String(form.get("role") || "All");
    render();
  }
  if (event.target.id === "settingsForm") {
    event.preventDefault();
    const form = new FormData(event.target);
    const keys = ["environment", "labour", "governance", "responsibility", "evidence"];
    const next = Object.fromEntries(keys.map((key) => [key, Number(form.get(key))]));
    if (Object.values(next).reduce((sum, value) => sum + value, 0) !== 100) {
      state.message = "Scoring weights were not saved because they must total 100%.";
      render();
      return;
    }
    state.settings = { ...next, publicRegistration: form.get("publicRegistration") === "on", claimAutoPublish: form.get("claimAutoPublish") === "on" };
    persist("neeyatAdminSettings", state.settings);
    recordAudit("Updated settings", "Scoring weights and access controls saved");
    render();
  }
});

document.addEventListener("click", (event) => {
  const sectionButton = event.target.closest("[data-section]");
  if (sectionButton) {
    state.section = sectionButton.dataset.section;
    state.selectedUser = null;
    location.hash = state.section;
    render();
    return;
  }
  if (event.target.closest("[data-admin-logout]")) {
    state.authenticated = false;
    sessionStorage.removeItem("neeyatAdminAuthenticated");
    state.section = "overview";
    location.hash = "";
    render();
    return;
  }
  if (event.target.closest("[data-clear-user-filters]")) {
    state.userQuery = "";
    state.userRole = "All";
    render();
    return;
  }
  const openUser = event.target.closest("[data-open-user]");
  if (openUser) {
    state.selectedUser = openUser.dataset.openUser;
    render();
    return;
  }
  if (event.target.closest("[data-close-drawer]") && !event.target.closest(".user-drawer dl, .user-drawer section")) {
    state.selectedUser = null;
    render();
    return;
  }
  const userToggle = event.target.closest("[data-user-toggle]");
  if (userToggle) {
    const user = state.users.find((item) => item.id === userToggle.dataset.userToggle);
    if (user) {
      user.status = user.status === "Suspended" ? "Active" : "Suspended";
      persist("neeyatAdminUsers", state.users);
      recordAudit("Updated user status", `${user.id} moved to ${user.status}`);
      state.selectedUser = user.id;
      render();
    }
    return;
  }
  const claimAction = event.target.closest("[data-claim-action]");
  if (claimAction) {
    const claim = state.claims.find((item) => item.id === claimAction.dataset.claimId);
    if (claim) {
      claim.status = claimAction.dataset.claimAction === "approve" ? "Approved" : "Evidence requested";
      claim.updated = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      persist("neeyatAdminClaims", state.claims);
      recordAudit("Moderated product claim", `${claim.id} moved to ${claim.status}`);
      render();
    }
    return;
  }
  const partnerAction = event.target.closest("[data-partner-action]");
  if (partnerAction) {
    const partner = state.partners.find((item) => item.id === partnerAction.dataset.partnerId);
    if (partner) {
      partner.status = partnerAction.dataset.partnerAction === "approve" ? "Live" : "On hold";
      persist("neeyatAdminPartners", state.partners);
      recordAudit("Updated partner", `${partner.id} moved to ${partner.status}`);
      render();
    }
    return;
  }
  const contentToggle = event.target.closest("[data-content-toggle]");
  if (contentToggle) {
    const item = state.content.find((entry) => entry.id === contentToggle.dataset.contentToggle);
    if (item) {
      item.status = item.status === "Published" ? "Draft" : "Published";
      persist("neeyatAdminContent", state.content);
      recordAudit("Updated public content", `${item.id} moved to ${item.status}`);
      render();
    }
    return;
  }
  const exportButton = event.target.closest("[data-export]");
  if (exportButton) downloadCsv(exportButton.dataset.export);
});

window.addEventListener("hashchange", () => {
  if (!state.authenticated) return;
  state.section = location.hash.replace("#", "") || "overview";
  render();
});

render();
