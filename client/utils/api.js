const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      credentials: "include",
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  } catch (err) {
    throw new Error(err.message || "Network error");
  }
}

export const api = {
  // --- Auth ---
  login: (body) => request("/api/login", { method: "POST", body: JSON.stringify(body) }),
  signup: (body) => request("/api/signup", { method: "POST", body: JSON.stringify(body) }),
  forgotPassword: (body) => request("/api/forgot-password", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/api/logout", { method: "POST" }),
  getMe: () => request("/api/me"),

  // --- Users ---
  getDriversOnline: () => request("/api/users/drivers/online"),
  updateDriverStatus: (id, body) => request(`/api/users/${id}/online`, { method: "PUT", body: JSON.stringify(body) }),

  // --- Rides ---
  createRide: (body) => request("/api/rides", { method: "POST", body: JSON.stringify(body) }),
  getRides: (params = "") => request(`/api/rides${params ? `?${params}` : ""}`),
  getRideById: (id) => request(`/api/rides/${id}`),
  acceptRide: (id, body) => request(`/api/rides/${id}/accept`, { method: "PUT", body: JSON.stringify(body) }),
  startRide: (id) => request(`/api/rides/${id}/start`, { method: "PUT" }),
  completeRide: (id) => request(`/api/rides/${id}/complete`, { method: "PUT" }),

  // --- Payments ---
  createPayment: (body) => request("/api/create-checkout-session", { method: "POST", body: JSON.stringify(body) }),

  // --- Ratings ---
  submitRating: (body) => request("/api/ratings", { method: "POST", body: JSON.stringify(body) }),

  // --- Driver earnings ---
  getDriverEarnings: (id) => request(`/api/drivers/${id}/earnings`),

  // --- Real-time helpers ---
  subscribeDrivers: (supabase, callback) => {
    const channel = supabase
      .channel("drivers-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users" },
        (payload) => callback(payload.new)
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  subscribeRideStatus: (supabase, rideId, callback) => {
    const channel = supabase
      .channel("ride-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
        (payload) => callback(payload.new)
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};
