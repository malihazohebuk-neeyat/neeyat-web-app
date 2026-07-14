function neeyatProductImage(name, category, index) {
  const palette = {
    Fashion: ["#e8eee2", "#6f7f6c", "#2f4f35"],
    Beauty: ["#f3eee6", "#caa885", "#6a4d3d"],
    Household: ["#eef2e8", "#9eac84", "#46573d"],
    Electronics: ["#eef1f2", "#7f8b91", "#1f3037"],
    "Food & Drink": ["#f5efe2", "#c59b54", "#5c4427"],
    "Personal Care": ["#f3f1e9", "#82a98b", "#315d3a"],
    Accessories: ["#eef1e8", "#7a8b6c", "#243c2d"],
  };
  const [bg, mid, dark] = palette[category] || palette.Household;
  const safeName = escapeSvgText(name);
  const safeCategory = escapeSvgText(category);
  const drawing = productDrawing(category, mid, dark);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="540" viewBox="0 0 720 540">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#203222" flood-opacity=".16"/></filter>
    </defs>
    <rect width="720" height="540" rx="42" fill="url(#bg)"/>
    <circle cx="590" cy="92" r="58" fill="${mid}" opacity=".16"/>
    <circle cx="112" cy="430" r="86" fill="${mid}" opacity=".13"/>
    ${drawing}
    <text x="54" y="470" fill="${dark}" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800">${safeName}</text>
    <text x="54" y="505" fill="#61705d" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="700">${safeCategory} | Neeyat demo product</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function productDrawing(category, mid, dark) {
  if (category === "Fashion") {
    return `<g filter="url(#shadow)" transform="translate(250 120)"><path d="M70 28 L118 50 L150 120 L120 138 L108 104 L108 270 L22 270 L22 104 L10 138 L-20 120 L12 50 L58 28 Z" fill="${mid}"/><path d="M58 28 C62 55 96 55 100 28" fill="none" stroke="${dark}" stroke-width="10" stroke-linecap="round"/><path d="M32 95 H100 M32 132 H100" stroke="#fff" stroke-width="9" opacity=".35"/></g>`;
  }
  if (category === "Beauty" || category === "Personal Care") {
    return `<g filter="url(#shadow)" transform="translate(276 108)"><rect x="48" y="10" width="62" height="52" rx="14" fill="${dark}"/><rect x="26" y="56" width="106" height="236" rx="34" fill="${mid}"/><rect x="46" y="102" width="66" height="98" rx="14" fill="#fff" opacity=".72"/><path d="M56 232 H104" stroke="${dark}" stroke-width="9" stroke-linecap="round" opacity=".35"/><circle cx="79" cy="152" r="19" fill="${dark}" opacity=".18"/></g>`;
  }
  if (category === "Household") {
    return `<g filter="url(#shadow)" transform="translate(220 132)"><rect x="54" y="105" width="218" height="128" rx="18" fill="${mid}"/><path d="M84 105 C94 34 230 34 242 105" fill="none" stroke="${dark}" stroke-width="18" stroke-linecap="round"/><rect x="28" y="170" width="272" height="42" rx="18" fill="#fff" opacity=".48"/></g>`;
  }
  if (category === "Electronics") {
    return `<g filter="url(#shadow)" transform="translate(232 114)"><rect x="46" y="18" width="182" height="272" rx="28" fill="${dark}"/><rect x="64" y="48" width="146" height="202" rx="18" fill="${mid}"/><circle cx="138" cy="268" r="10" fill="#fff" opacity=".75"/><path d="M86 92 H190 M86 128 H168 M86 164 H178" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".42"/></g>`;
  }
  if (category === "Food & Drink") {
    return `<g filter="url(#shadow)" transform="translate(238 112)"><path d="M80 32 H210 L186 286 H104 Z" fill="${mid}"/><path d="M96 32 L116 6 H174 L196 32" fill="${dark}"/><rect x="100" y="118" width="86" height="76" rx="14" fill="#fff" opacity=".68"/></g>`;
  }
  return `<g filter="url(#shadow)" transform="translate(238 112)"><rect x="48" y="80" width="168" height="178" rx="24" fill="${mid}"/><path d="M80 80 C88 20 176 20 184 80" fill="none" stroke="${dark}" stroke-width="16" stroke-linecap="round"/><rect x="74" y="124" width="116" height="54" rx="14" fill="#fff" opacity=".56"/></g>`;
}

function creatorImage() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="520" viewBox="0 0 720 520"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#dfeadd"/><stop offset="1" stop-color="#f7f3ea"/></linearGradient></defs><rect width="720" height="520" rx="34" fill="url(#g)"/><circle cx="248" cy="180" r="78" fill="#6f8f65"/><path d="M162 458 C184 326 312 300 384 382 C424 428 448 458 448 458 Z" fill="#315d3a"/><circle cx="250" cy="170" r="54" fill="#d8b69b"/><path d="M188 168 C202 88 318 86 326 178 C292 130 242 136 188 168 Z" fill="#1d201b"/><rect x="430" y="176" width="74" height="160" rx="22" fill="#ffffff"/><rect x="450" y="132" width="34" height="52" rx="10" fill="#315d3a"/><text x="46" y="68" font-family="Inter, Arial" font-weight="800" font-size="28" fill="#203222">Influencer Pick</text><text x="46" y="102" font-family="Inter, Arial" font-weight="600" font-size="18" fill="#657260">Curated ethical recommendation</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

window.NEEYAT_DATA = {
  accounts: [
    { role: "Consumer", email: "consumer@neeyat.demo", password: "Demo123!", name: "Maliha", route: "consumer" },
    { role: "Influencer", email: "influencer@neeyat.demo", password: "Demo123!", name: "Amina Green", route: "influencerDashboard" },
    { role: "Business", email: "business@neeyat.demo", password: "Demo123!", name: "KindThread Co.", route: "businessDashboard" },
    { role: "Administrator", email: "admin@neeyat.demo", password: "Demo123!", name: "Neeyat Admin", route: "admin" },
  ],
  retailers: ["EcoCart UK", "KindMarket", "Everyday Better", "Conscious Basket", "Value & Values"],
  categories: ["Fashion", "Beauty", "Household", "Electronics", "Food & Drink", "Personal Care", "Accessories"],
  products: [
    ["Recycled Cotton Hoodie", "Fashion", "KindThread", 42, [88, 91, 78, 82, 76], ["GOTS pending", "Recycled fibres"], "Strong labour disclosure with recycled-material focus."],
    ["Organic Everyday T-Shirt", "Fashion", "North Loom", 18, [82, 84, 72, 79, 70], ["Organic cotton"], "Affordable wardrobe basic with good sourcing visibility."],
    ["Repairable Denim Jacket", "Fashion", "Mend Studio", 64, [79, 86, 75, 88, 68], ["Repair programme"], "Higher price, stronger circularity and repair commitment."],
    ["Vegan Lip Balm", "Beauty", "SoftKind", 5, [76, 74, 81, 83, 72], ["Vegan formula"], "Low-cost beauty product with clear ingredient notes."],
    ["Refill Shampoo Bar", "Beauty", "Bare Bottle", 8, [90, 77, 70, 93, 74], ["Plastic-free"], "Packaging-light option with strong environmental score."],
    ["Mineral Sunscreen SPF30", "Beauty", "ClearRay", 14, [74, 71, 83, 76, 69], ["Cruelty-free"], "Balanced personal-care choice with transparent claims."],
    ["Concentrated Laundry Sheets", "Household", "Neat Home", 11, [92, 72, 76, 91, 73], ["Low packaging"], "Low-waste household product with compact shipping."],
    ["Reusable Cleaning Kit", "Household", "LoopNest", 24, [89, 78, 80, 88, 77], ["Refillable"], "Reusable household kit with strong packaging responsibility."],
    ["Compostable Sponges", "Household", "EarthCupboard", 6, [85, 70, 67, 84, 66], ["Compostable"], "Good-value low-waste household option."],
    ["Refurbished Smartphone", "Electronics", "AgainTech", 189, [91, 73, 82, 87, 78], ["Refurbished"], "Circular electronics option with warranty and strong value."],
    ["Modular Earbuds", "Electronics", "FairSignal", 69, [77, 76, 79, 86, 71], ["Repairable"], "Repairable design improves lifecycle responsibility."],
    ["Low-Energy Desk Lamp", "Electronics", "BrightLite", 32, [83, 68, 73, 80, 67], ["Energy efficient"], "Lower energy consumption with moderate transparency."],
    ["Fairtrade Coffee Beans", "Food & Drink", "BeanEthic", 9, [78, 89, 81, 72, 86], ["Fairtrade"], "Strong labour and certification confidence."],
    ["Plant-Based Protein Mix", "Food & Drink", "RootFuel", 21, [84, 73, 74, 76, 70], ["Plant based"], "Good climate profile with moderate evidence coverage."],
    ["Organic Snack Box", "Food & Drink", "GoodCrate", 16, [75, 70, 69, 73, 68], ["Organic"], "Convenient option with improving transparency."],
    ["Bamboo Toothbrush Pack", "Personal Care", "MouthKind", 7, [86, 72, 71, 89, 70], ["Plastic-free"], "Low-cost personal-care swap with reduced packaging."],
    ["Period Care Refill Box", "Personal Care", "CareCycle", 12, [81, 78, 83, 84, 75], ["Organic cotton"], "Recurring essentials with clear ingredient information."],
    ["Sensitive Skin Soap", "Personal Care", "SimpleOrigin", 4, [73, 76, 79, 78, 67], ["Palm-oil policy"], "Affordable personal-care choice with transparent sourcing notes."],
    ["Cork Card Holder", "Accessories", "CarryKind", 15, [87, 75, 72, 82, 65], ["Vegan material"], "Durable accessory with lower-impact material choice."],
    ["Recycled Backpack", "Accessories", "PackLoop", 38, [89, 80, 74, 86, 72], ["Recycled polyester"], "Strong practical value and recycled materials."],
    ["Solar Travel Charger", "Accessories", "SunPocket", 29, [82, 69, 70, 79, 64], ["Solar assist"], "Useful travel product with moderate data confidence."],
    ["Cotton Baby Sleepsuit", "Fashion", "LittleKind", 19, [80, 87, 76, 78, 73], ["Organic cotton"], "Family-focused product with good labour positioning."],
    ["Aluminium-Free Deodorant", "Beauty", "FreshRoot", 7, [77, 72, 78, 82, 70], ["Refill option"], "Personal-care product with refill pathway."],
    ["Reusable Food Wraps", "Household", "WrapWell", 10, [91, 71, 69, 90, 66], ["Reusable"], "Simple household swap reducing single-use packaging."],
    ["Second-Life Tablet", "Electronics", "AgainTech", 149, [88, 70, 80, 84, 76], ["Refurbished"], "Lower-cost electronics option with circular-economy benefit."],
    ["Rainforest Cocoa", "Food & Drink", "BeanEthic", 6, [76, 86, 84, 71, 82], ["Fairtrade"], "Ethical treat with stronger labour/certification signal."],
    ["Reusable Razor", "Personal Care", "CareCycle", 23, [84, 74, 76, 88, 68], ["Plastic-free"], "Higher upfront cost offset by reusable design."],
    ["Recycled Laptop Sleeve", "Accessories", "PackLoop", 18, [85, 76, 73, 83, 69], ["Recycled fibres"], "Practical accessory with good material responsibility."],
    ["Ethical Tea Selection", "Food & Drink", "GoodCrate", 12, [74, 83, 78, 70, 77], ["Fair sourcing"], "Good labour score with accessible pricing."],
    ["Refill Handwash Bottle", "Household", "Bare Bottle", 9, [88, 73, 74, 90, 72], ["Refillable"], "Clear packaging reduction benefit for everyday use."],
  ].map((item, index) => {
    const [name, category, brand, basePrice, scores, certifications, summary] = item;
    const [environment, labour, governance, responsibility, evidence] = scores;
    const id = `prod-${String(index + 1).padStart(2, "0")}`;
    const listings = window.NEEYAT_DATA?.retailers ? [] : [];
    return {
      id,
      name,
      category,
      brand,
      image: neeyatProductImage(name, category, index),
      basePrice,
      scores: { environment, labour, governance, responsibility, evidence },
      certifications,
      summary,
      origin: ["UK", "Portugal", "Turkey", "India", "Vietnam", "Netherlands"][index % 6],
      packaging: ["Plastic-free", "Reduced packaging", "Recyclable pack", "Refill-ready"][index % 4],
      reviewStatus: index % 4 === 0 ? "Evidence requested" : index % 3 === 0 ? "Under review" : "Platform display ready",
      trend: index % 2 === 0 ? "Rising consumer interest" : "Stable search demand",
      creatorFit: ["Low-waste homes", "Fair fashion", "Transparent essentials", "Budget conscious swaps"][index % 4],
      dataPoints: 5 + (index % 7),
      verified: index % 3 !== 0,
      selfReported: index % 4 === 0,
      reviewedDaysAgo: 14 + index * 3,
    };
  }),
  influencers: [
    { name: "Amina Green", focus: "Low-waste homes", followers: "42k", engagement: "6.8%", verified: true, collection: "Plastic-light weekly shop" },
    { name: "Sarah Values", focus: "Fair fashion", followers: "31k", engagement: "5.9%", verified: true, collection: "Capsule wardrobe swaps" },
    { name: "Zara Conscious", focus: "Beauty and personal care", followers: "58k", engagement: "7.4%", verified: true, collection: "Refill bathroom shelf" },
    { name: "Imran Impact", focus: "Family budgeting", followers: "24k", engagement: "4.6%", verified: false, collection: "Ethical choices under £20" },
    { name: "Nadia Nour", focus: "Halal-conscious lifestyle", followers: "39k", engagement: "6.1%", verified: true, collection: "Transparent everyday essentials" },
    { name: "Leo Circular", focus: "Refurbished tech", followers: "27k", engagement: "5.2%", verified: true, collection: "Second-life electronics" },
    { name: "Maya Market", focus: "Sustainable food", followers: "33k", engagement: "5.7%", verified: false, collection: "Fairtrade pantry" },
    { name: "Tom Traceable", focus: "Brand transparency", followers: "18k", engagement: "4.9%", verified: true, collection: "Brands that disclose more" },
  ],
  businessAnalytics: {
    views: 12840,
    saves: 932,
    retailerClicks: 1874,
    ctr: "14.6%",
    profileCompleteness: 78,
    subscriptionPlan: "Growth - £99/mo",
  },
  adminStats: {
    users: 6420,
    consumers: 5980,
    influencers: 86,
    businesses: 142,
    products: 312,
    retailerListings: 1218,
    affiliateClicks: 18640,
    estimatedTransactions: 742,
    subscriptionRevenue: 18340,
  },
};
