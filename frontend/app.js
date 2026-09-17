const state = {
  role: null,
  pendingRole: null,
  page: null,
  selectedMemberId: 1,
  members: [
    { id: 1, name: "Aarav Sharma", countryCode: "+91", phone: "98765 43210", tier: "Gold", points: 1840, spend: 18750, joined: "12 Jan 2026" },
    { id: 2, name: "Meera Iyer", countryCode: "+91", phone: "98450 11882", tier: "Silver", points: 620, spend: 7350, joined: "04 Mar 2026" },
    { id: 3, name: "Rahul Verma", countryCode: "+91", phone: "99887 22014", tier: "Regular", points: 180, spend: 1800, joined: "18 May 2026" },
    { id: 4, name: "Nisha Patel", countryCode: "+91", phone: "99115 83420", tier: "Silver", points: 940, spend: 9920, joined: "02 Feb 2026" },
  ],
  transactions: [
    { title: "Cappuccino & croissant", date: "Today, 10:42 AM", points: 42, balance: 1840, type: "earn" },
    { title: "Reward redeemed", date: "Yesterday, 4:17 PM", points: -150, balance: 1798, type: "redeem" },
    { title: "Iced latte", date: "12 Sep, 1:06 PM", points: 30, balance: 1948, type: "earn" },
  ],
};

const app = document.querySelector("#app");
const modalRoot = document.querySelector("#modal-root");

function money(value) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); }
function initials(name) { return name.split(" ").map(part => part[0]).join("").slice(0, 2); }
function tierClass(tier) { return tier.toLowerCase(); }
function selectedMember() { return state.members.find(member => member.id === state.selectedMemberId); }

function navigate(page) {
  state.page = page;
  render();
}

function toast(message, kind = "success") {
  const item = document.createElement("div");
  item.className = `toast ${kind}`;
  item.textContent = message;
  document.querySelector("#toast-root").append(item);
  setTimeout(() => item.remove(), 3200);
}

function openModal(content) {
  modalRoot.innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal" role="dialog" aria-modal="true">${content}</section></div>`;
  modalRoot.querySelector("[data-close-modal]").addEventListener("click", event => { if (event.target === event.currentTarget) closeModal(); });
  modalRoot.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", closeModal));
}
function closeModal() { modalRoot.innerHTML = ""; }

function roleSelection() {
  return `<section class="role-page">
    <div class="brand-panel">
      <div><div class="brand-mark"><span class="cup">☕</span> BrewRewards</div><h1>Every coffee should feel rewarding.</h1><p>A warm, simple loyalty experience for your customers—and a reliable counter for your café team.</p></div>
      <small>Designed for neighbourhood cafés, built for regulars.</small>
    </div>
    <div class="role-content"><div class="role-card">
      <p class="eyebrow">Welcome to BrewRewards</p><h2>How would you like to continue?</h2><p class="subtle">Choose your space to view rewards or manage the café counter.</p>
      <div class="role-options">
        <button class="role-option" data-role="customer"><span class="role-icon">✦</span><span><strong>I'm a customer</strong><span>View your points and redeem rewards</span></span><span class="arrow">→</span></button>
        <button class="role-option" data-role="staff"><span class="role-icon">☕</span><span><strong>I'm café staff</strong><span>Manage members, purchases, and bills</span></span><span class="arrow">→</span></button>
      </div>
    </div></div>
  </section>`;
}

function loginView() {
  const customer = state.pendingRole === "customer";
  return `<section class="role-page"><div class="brand-panel"><div><div class="brand-mark"><span class="cup">☕</span> BrewRewards</div><h1>${customer ? "Your next reward is brewing." : "A calmer café counter."}</h1><p>${customer ? "See your points, tier, and free-item rewards in one place." : "Manage purchases, members, and receipts with confidence."}</p></div><small>Harbour Brew Café</small></div><div class="role-content"><div class="role-card"><button class="text-button" data-action="back-role">← Back to role selection</button><p class="eyebrow" style="margin-top:1.5rem">${customer ? "Customer sign in" : "Staff sign in"}</p><h2>Welcome back</h2><p class="subtle">${customer ? "Use your mobile number to access your wallet." : "Use your café account to access the counter."}</p><form id="login-form" style="margin-top:1.6rem"><div class="form-group">${customer ? `<label for="login-phone">Phone number</label><input id="login-phone" inputmode="numeric" placeholder="98765 43210" required />` : `<label for="login-email">Work email</label><input id="login-email" type="email" placeholder="priya@harbourbrew.com" required />`}</div><div class="form-group"><label for="login-password">Password</label><input id="login-password" type="password" placeholder="••••••••" required /></div><button class="button primary" style="width:100%;margin-top:.4rem">Sign in</button></form>${customer ? `<p class="subtle" style="font-size:.82rem">New here? Your café can register your number at the counter.</p>` : ""}</div></div></section>`;
}

function shell(title, navigation, content) {
  return `<div class="app-shell">
    <aside class="sidebar"><div class="brand-mark"><span class="cup">☕</span> BrewRewards</div>
      <nav class="nav-list">${navigation.map(item => `<button class="nav-link ${state.page === item.page ? "active" : ""}" data-page="${item.page}"><span>${item.icon}</span>${item.label}</button>`).join("")}</nav>
      <div class="sidebar-bottom"><div class="profile-mini"><strong>${state.role === "staff" ? "Priya · Barista" : "Aarav Sharma"}</strong>${state.role === "staff" ? "Harbour Brew Café" : "Gold member"}</div><button class="nav-link" data-action="sign-out">↩ Sign out</button></div>
    </aside>
    <div class="workspace"><header class="topbar"><div class="mobile-brand brand-mark"><span class="cup">☕</span> BrewRewards</div><h1>${title}</h1><button class="text-button" data-action="help">Help</button></header><main class="content">${content}</main></div>
  </div>`;
}

function transactionRows(transactions = state.transactions) {
  return transactions.map(transaction => `<div class="transaction"><div class="transaction-icon">${transaction.type === "earn" ? "☕" : "✦"}</div><div><strong>${transaction.title}</strong><small>${transaction.date}</small></div><div class="${transaction.points > 0 ? "positive" : "negative"}">${transaction.points > 0 ? "+" : ""}${transaction.points} pts</div></div>`).join("");
}

function customerDashboard() {
  const member = state.members[0];
  const nextTierSpend = member.tier === "Gold" ? member.spend : 15000;
  const progress = Math.min(100, Math.round(member.spend / nextTierSpend * 100));
  const content = `<div class="page-heading"><div><p class="eyebrow">Good morning, ${member.name.split(" ")[0]}</p><h2>Your rewards wallet</h2><p>Every visit gets you a little closer to your next favourite coffee.</p></div><button class="button primary" data-action="open-redeem">Redeem reward</button></div>
    <div class="grid two-col"><div class="grid"><section class="card wallet-card"><span class="tier-pill ${tierClass(member.tier)}">● ${member.tier} member</span><div class="label" style="margin-top:1.3rem">Available points</div><div class="wallet-points">${member.points}</div><div class="wallet-value">Worth ${money(member.points / 10)} in free items</div></section>
      <section class="card"><div class="section-title"><h3>Recent activity</h3><button class="text-button" data-page="customer-history">View all</button></div>${transactionRows()}</section></div>
      <div class="grid"><section class="card"><div class="section-title"><h3>Tier progress</h3><span class="tier-pill ${tierClass(member.tier)}">${member.tier}</span></div><p class="subtle">${member.tier === "Gold" ? "You've reached our highest tier—enjoy double rewards on every visit." : `Spend ${money(nextTierSpend - member.spend)} more to reach your next tier.`}</p><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div><div class="progress-copy"><span>${money(member.spend)} lifetime spend</span><span>${member.tier === "Gold" ? "Gold achieved" : money(nextTierSpend)}</span></div></section>
      <section class="card"><div class="section-title"><h3>How rewards work</h3></div><div class="info-list"><div class="info-item"><span>Earn on every ₹10 purchase</span><strong>1+ point</strong></div><div class="info-item"><span>Reward value</span><strong>10 pts = ₹1</strong></div><div class="info-item"><span>Free redemptions</span><strong>No new points</strong></div></div></section></div></div>`;
  return shell("Customer wallet", [{ page: "customer-home", icon: "⌂", label: "My wallet" }, { page: "customer-history", icon: "◷", label: "Activity" }], content);
}

function customerHistory() {
  const content = `<div class="page-heading"><div><p class="eyebrow">Your rewards</p><h2>Activity history</h2><p>Every point earned and redeemed in one place.</p></div><button class="button secondary" data-page="customer-home">Back to wallet</button></div><section class="card"><div class="section-title"><h3>All transactions</h3><span class="subtle">${state.transactions.length} entries</span></div>${transactionRows([...state.transactions, { title: "Flat white", date: "08 Sep, 9:30 AM", points: 25, balance: 1918, type: "earn" }, { title: "Bakery reward", date: "04 Sep, 2:15 PM", points: -80, balance: 1893, type: "redeem" }])}</section>`;
  return shell("Activity", [{ page: "customer-home", icon: "⌂", label: "My wallet" }, { page: "customer-history", icon: "◷", label: "Activity" }], content);
}

function staffDashboard() {
  const content = `<div class="page-heading"><div><p class="eyebrow">Harbour Brew Café</p><h2>Good morning, Priya</h2><p>Here's how your rewards programme is doing today.</p></div><button class="button primary" data-action="open-purchase">＋ Record purchase</button></div>
  <div class="grid stats"><section class="card stat-card"><div class="label">Active members</div><div class="value">1,248</div><div class="hint">↑ 24 this month</div></section><section class="card stat-card"><div class="label">Purchases today</div><div class="value">86</div><div class="hint">↑ 12% vs yesterday</div></section><section class="card stat-card"><div class="label">Points issued today</div><div class="value">2,940</div><div class="hint">₹294 reward value</div></section><section class="card stat-card"><div class="label">Redemptions today</div><div class="value">14</div><div class="hint">₹86 redeemed</div></section></div>
  <div class="grid two-col" style="margin-top:1.2rem"><section class="card"><div class="section-title"><h3>Recent counter activity</h3><button class="text-button" data-page="staff-members">View members</button></div>${transactionRows()}</section><section class="card"><div class="section-title"><h3>Quick member lookup</h3></div><p class="subtle">Find a customer by country code and phone number to record a purchase or reward.</p><div class="search-row"><div class="search-field"><span>⌕</span><input id="quick-search" placeholder="Phone number" /></div><button class="button primary" data-action="quick-search">Search</button></div><p class="subtle" style="font-size:.82rem">Tip: use the member directory to search by name too.</p></section></div>`;
  return shell("Staff dashboard", [{ page: "staff-home", icon: "⌂", label: "Dashboard" }, { page: "staff-members", icon: "♙", label: "Members" }, { page: "staff-bills", icon: "▤", label: "Bills" }], content);
}

function staffMembers() {
  const rows = state.members.map(member => `<button class="member-row" data-member-id="${member.id}"><span><strong>${member.name}</strong><small>Joined ${member.joined}</small></span><span>${member.countryCode} ${member.phone}</span><span><span class="tier-pill ${tierClass(member.tier)}">${member.tier}</span></span><span>${member.points} pts</span><span>${money(member.spend)}</span></button>`).join("");
  const content = `<div class="page-heading"><div><p class="eyebrow">Member directory</p><h2>Find a regular</h2><p>Search the loyalty programme by name or phone number.</p></div><button class="button primary" data-action="open-new-member">＋ Add member</button></div><section class="card"><div class="search-row"><div class="search-field"><span>⌕</span><input id="member-search" placeholder="Search name or phone number" /></div><select class="filter-select" id="tier-filter"><option value="all">All tiers</option><option>Regular</option><option>Silver</option><option>Gold</option></select></div><div class="member-table"><div class="member-header"><span>Member</span><span>Phone</span><span>Tier</span><span>Points</span><span>Lifetime spend</span></div><div id="member-rows">${rows}</div></div><div class="pagination"><span>Showing 1–${state.members.length} of 1,248 members</span><div><button class="button secondary">← Previous</button> <button class="button secondary">Next →</button></div></div></section>`;
  return shell("Members", [{ page: "staff-home", icon: "⌂", label: "Dashboard" }, { page: "staff-members", icon: "♙", label: "Members" }, { page: "staff-bills", icon: "▤", label: "Bills" }], content);
}

function memberDetail() {
  const member = selectedMember();
  const content = `<div class="page-heading"><div class="member-hero"><div class="avatar">${initials(member.name)}</div><div class="member-meta"><h2>${member.name}</h2><p>${member.countryCode} ${member.phone} · Member since ${member.joined}</p><span class="tier-pill ${tierClass(member.tier)}">● ${member.tier}</span></div><div class="detail-actions"><button class="button secondary" data-page="staff-members">Back</button><button class="button primary" data-action="open-purchase">Record purchase</button></div></div></div></div>
  <div class="grid stats"><section class="card stat-card"><div class="label">Available balance</div><div class="value">${member.points} pts</div><div class="hint">Worth ${money(member.points / 10)}</div></section><section class="card stat-card"><div class="label">Lifetime spend</div><div class="value">${money(member.spend)}</div><div class="hint">Member's tier qualification total</div></section><section class="card stat-card"><div class="label">Current tier</div><div class="value">${member.tier}</div><div class="hint">${member.tier === "Gold" ? "Highest tier reached" : "Keeps growing with every visit"}</div></section><section class="card stat-card"><div class="label">Member since</div><div class="value">${member.joined.split(" ")[1]} ${member.joined.split(" ")[2]}</div><div class="hint">Loyalty member</div></section></div>
  <div class="grid two-col" style="margin-top:1.2rem"><section class="card"><div class="section-title"><h3>Point history</h3><button class="text-button" data-action="open-redeem">Redeem points</button></div>${transactionRows()}</section><section class="card"><div class="section-title"><h3>Member details</h3></div><div class="info-list"><div class="info-item"><span>Country code</span><strong>${member.countryCode}</strong></div><div class="info-item"><span>Phone</span><strong>${member.phone}</strong></div><div class="info-item"><span>Reward conversion</span><strong>10 pts = ₹1</strong></div></div></section></div>`;
  return shell("Member profile", [{ page: "staff-home", icon: "⌂", label: "Dashboard" }, { page: "staff-members", icon: "♙", label: "Members" }, { page: "staff-bills", icon: "▤", label: "Bills" }], content);
}

function staffBills() {
  const content = `<div class="page-heading"><div><p class="eyebrow">Counter receipt</p><h2>Generate a bill</h2><p>Create a clear receipt for a customer purchase.</p></div><button class="button primary" data-action="open-purchase">New purchase</button></div><section class="card receipt"><div class="receipt-head"><h3>Harbour Brew Café</h3><p class="subtle">17 Beach Road, Chennai · GSTIN: 33ABCDE1234F1Z5</p></div><div class="receipt-line"><span>Receipt no.</span><strong>HB-2026-0917</strong></div><div class="receipt-line"><span>Customer</span><strong>Aarav Sharma</strong></div><div class="receipt-line"><span>Cappuccino × 2</span><strong>₹360</strong></div><div class="receipt-line"><span>Almond croissant × 1</span><strong>₹180</strong></div><div class="receipt-line"><span>Reward discount</span><strong class="positive">−₹60</strong></div><div class="receipt-total"><span>Total paid</span><span>₹480</span></div><div class="receipt-note">48 points will be added after this purchase.</div><div class="modal-actions"><button class="button secondary" data-action="print-bill">Print receipt</button><button class="button primary" data-action="save-bill">Save bill</button></div></section>`;
  return shell("Bills", [{ page: "staff-home", icon: "⌂", label: "Dashboard" }, { page: "staff-members", icon: "♙", label: "Members" }, { page: "staff-bills", icon: "▤", label: "Bills" }], content);
}

function purchaseModal() {
  openModal(`<h3>Record a purchase</h3><p>Points will be calculated from the member's tier after the bill is saved.</p><form id="purchase-form"><div class="form-group"><label for="purchase-member">Member</label><select id="purchase-member">${state.members.map(member => `<option value="${member.id}">${member.name} · ${member.points} pts</option>`).join("")}</select></div><div class="form-group"><label for="purchase-amount">Purchase amount (₹)</label><input id="purchase-amount" type="number" min="1" placeholder="e.g. 480" required /></div><div class="form-group"><label for="purchase-note">Bill note (optional)</label><input id="purchase-note" placeholder="e.g. Latte and sandwich" /></div><div class="modal-actions"><button type="button" class="button secondary" data-close>Cancel</button><button class="button primary">Save purchase</button></div></form>`);
  document.querySelector("#purchase-form").addEventListener("submit", event => { event.preventDefault(); const amount = Number(document.querySelector("#purchase-amount").value); if (!amount) return; const member = state.members.find(item => item.id === Number(document.querySelector("#purchase-member").value)); const points = Math.round(amount / 10); member.points += points; member.spend += amount; member.tier = member.spend >= 15000 ? "Gold" : member.spend >= 5000 ? "Silver" : "Regular"; closeModal(); toast(`${points} points added to ${member.name}'s wallet.`); navigate(state.page === "staff-member-detail" ? "staff-member-detail" : "staff-home"); });
}

function redeemModal() {
  const member = state.role === "customer" ? state.members[0] : selectedMember();
  openModal(`<h3>Redeem your points</h3><p>${member.points} points are available, worth up to ${money(member.points / 10)} in free items. Free redemptions do not earn new points.</p><form id="redeem-form"><div class="form-group"><label for="redeem-points">Points to redeem</label><input id="redeem-points" type="number" min="10" max="${member.points}" step="10" placeholder="e.g. 100" required /></div><div class="modal-actions"><button type="button" class="button secondary" data-close>Cancel</button><button class="button danger">Confirm redemption</button></div></form>`);
  document.querySelector("#redeem-form").addEventListener("submit", event => { event.preventDefault(); const points = Number(document.querySelector("#redeem-points").value); if (!points || points > member.points || points % 10 !== 0) return toast("Use a whole multiple of 10 within the available balance.", "error"); member.points -= points; state.transactions.unshift({ title: "Reward redeemed", date: "Just now", points: -points, balance: member.points, type: "redeem" }); closeModal(); toast(`${points} points redeemed — reward value ${money(points / 10)}.`); render(); });
}

function newMemberModal() {
  openModal(`<h3>Add a member</h3><p>Phone number is stored separately from the country code.</p><form id="member-form"><div class="form-group"><label for="member-name">Full name</label><input id="member-name" required /></div><div class="form-group"><label for="member-country">Country code</label><input id="member-country" value="+91" required /></div><div class="form-group"><label for="member-phone">Phone number</label><input id="member-phone" inputmode="numeric" required /></div><div class="modal-actions"><button type="button" class="button secondary" data-close>Cancel</button><button class="button primary">Create member</button></div></form>`);
  document.querySelector("#member-form").addEventListener("submit", event => { event.preventDefault(); const name = document.querySelector("#member-name").value.trim(); const phone = document.querySelector("#member-phone").value.trim(); if (!name || !phone) return; state.members.push({ id: Date.now(), name, countryCode: document.querySelector("#member-country").value.trim(), phone, tier: "Regular", points: 0, spend: 0, joined: "Today" }); closeModal(); toast(`${name} is now a BrewRewards member.`); render(); });
}

function render() {
  if (!state.role) app.innerHTML = roleSelection();
  if (state.pendingRole && !state.role) app.innerHTML = loginView();
  else if (state.page === "customer-history") app.innerHTML = customerHistory();
  else if (state.page === "customer-home") app.innerHTML = customerDashboard();
  else if (state.page === "staff-members") app.innerHTML = staffMembers();
  else if (state.page === "staff-member-detail") app.innerHTML = memberDetail();
  else if (state.page === "staff-bills") app.innerHTML = staffBills();
  else app.innerHTML = staffDashboard();
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-role]").forEach(button => button.addEventListener("click", () => { state.pendingRole = button.dataset.role; render(); }));
  document.querySelectorAll("[data-action='back-role']").forEach(button => button.addEventListener("click", () => { state.pendingRole = null; render(); }));
  const loginForm = document.querySelector("#login-form");
  if (loginForm) loginForm.addEventListener("submit", event => { event.preventDefault(); state.role = state.pendingRole; state.pendingRole = null; state.page = state.role === "customer" ? "customer-home" : "staff-home"; render(); });
  document.querySelectorAll("[data-page]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.page)));
  document.querySelectorAll("[data-member-id]").forEach(button => button.addEventListener("click", () => { state.selectedMemberId = Number(button.dataset.memberId); navigate("staff-member-detail"); }));
  document.querySelectorAll("[data-action='sign-out']").forEach(button => button.addEventListener("click", () => { state.role = null; state.pendingRole = null; state.page = null; render(); }));
  document.querySelectorAll("[data-action='open-purchase']").forEach(button => button.addEventListener("click", purchaseModal));
  document.querySelectorAll("[data-action='open-redeem']").forEach(button => button.addEventListener("click", redeemModal));
  document.querySelectorAll("[data-action='open-new-member']").forEach(button => button.addEventListener("click", newMemberModal));
  document.querySelectorAll("[data-action='help']").forEach(button => button.addEventListener("click", () => toast("Help centre will be connected in a later step.")));
  document.querySelectorAll("[data-action='print-bill']").forEach(button => button.addEventListener("click", () => window.print()));
  document.querySelectorAll("[data-action='save-bill']").forEach(button => button.addEventListener("click", () => toast("Bill saved. PDF generation will be connected to the backend.")));
  const search = document.querySelector("#member-search");
  if (search) search.addEventListener("input", filterMembers);
  const filter = document.querySelector("#tier-filter");
  if (filter) filter.addEventListener("change", filterMembers);
  const quickSearch = document.querySelector("[data-action='quick-search']");
  if (quickSearch) quickSearch.addEventListener("click", () => { const value = document.querySelector("#quick-search").value.replace(/\D/g, ""); const found = state.members.find(member => member.phone.replace(/\D/g, "").includes(value)); if (!value) return toast("Enter a phone number to search.", "error"); if (!found) return toast("No matching member found.", "error"); state.selectedMemberId = found.id; navigate("staff-member-detail"); });
}

function filterMembers() {
  const query = document.querySelector("#member-search").value.toLowerCase();
  const tier = document.querySelector("#tier-filter").value;
  const visible = state.members.filter(member => (member.name.toLowerCase().includes(query) || member.phone.replace(/\s/g, "").includes(query.replace(/\s/g, ""))) && (tier === "all" || member.tier === tier));
  document.querySelector("#member-rows").innerHTML = visible.map(member => `<button class="member-row" data-member-id="${member.id}"><span><strong>${member.name}</strong><small>Joined ${member.joined}</small></span><span>${member.countryCode} ${member.phone}</span><span><span class="tier-pill ${tierClass(member.tier)}">${member.tier}</span></span><span>${member.points} pts</span><span>${money(member.spend)}</span></button>`).join("") || `<p class="subtle">No members match this search.</p>`;
  document.querySelectorAll("[data-member-id]").forEach(button => button.addEventListener("click", () => { state.selectedMemberId = Number(button.dataset.memberId); navigate("staff-member-detail"); }));
}

render();
