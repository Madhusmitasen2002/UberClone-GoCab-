// client/utils/api.js
const API_BASE_URL = "https://uberclone-gocab.onrender.com";

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
    console.error("API request error:", err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) => request("/api/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/api/logout", { method: "POST" }),
  signup: (payload) => request("/api/signup", { method: "POST", body: JSON.stringify(payload) }),
  forgotPassword: (email) => request("/api/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  // Users
  getUsers: () => request("/api/users"),
  updateUserStatus: (id, payload) => request(`/api/users/${id}/status`, { method: "PUT", body: JSON.stringify(payload) }),
  updateDriverStatus: (id, payload) => request(`/api/users/${id}/online`, { method: "PUT", body: JSON.stringify(payload) }),

  // Rides
  getRides: (query = "") => request(`/api/rides${query}`),
  createRide: (payload) => request("/api/rides", { method: "POST", body: JSON.stringify(payload) }),
  acceptRide: (rideId, payload) => request(`/api/rides/${rideId}/accept`, { method: "PUT", body: JSON.stringify(payload) }),
  startRide: (rideId) => request(`/api/rides/${rideId}/start`, { method: "PUT" }),
  completeRide: (rideId) => request(`/api/rides/${rideId}/complete`, { method: "PUT" }),
  cancelRide: (rideId) => request(`/api/rides/${rideId}/cancel`, { method: "PUT" }),

  // Payments
  getPaymentsByUser: (userId) => request(`/api/payments/user/${userId}`),
  getPaymentsByDriver: (driverId) => request(`/api/payments/driver/${driverId}`),
  getAllPayments: () => request("/api/payments"),
  createPayment: (payload) => request("/api/create-checkout-session", { method: "POST", body: JSON.stringify(payload) }),
  markPaymentPaid: (rideId) => request(`/api/payments/${rideId}/mark-paid`, { method: "PUT" }),

  // Drivers
  getDriversOnline: () => request("/api/users/drivers/online"),
  getDriverEarnings: (driverId) => request(`/api/drivers/${driverId}/earnings`),

  // Ratings
  submitRating: (payload) => request("/api/ratings", { method: "POST", body: JSON.stringify(payload) }),
};
