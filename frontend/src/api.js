// In development, Vite forwards relative /api requests to FastAPI. This works
// in local browsers and forwarded Codespaces ports without a CORS failure.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail ?? "Something went wrong. Please try again.");
  return body;
}

export const api = {
  login: (email, password) => request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  customerDashboard: token => request("/api/customer/dashboard", { headers: { Authorization: `Bearer ${token}` } }),
  staffMembers: token => request("/api/staff/members", { headers: { Authorization: `Bearer ${token}` } }),
};
