import axios from "axios";
import { auth } from "../firebase/config";

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to add auth token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different error statuses
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      console.error("API Error:", error.response.data);

      // Handle authentication errors
      if (error.response.status === 401) {
        // Redirect to login or refresh token
        console.error("Authentication error");
      }
    } else if (error.request) {
      // Request was made but no response was received
      console.error("Network Error:", error.request);
    } else {
      // Something else caused the error
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  }
);

// API endpoints
const apiService = {
  // Auth related endpoints
  auth: {
    verifyToken: () => api.get("/auth/verify"),
  },

  // Events related endpoints
  events: {
    getAll: () => api.get("/events"),
    getById: (id) => api.get(`/events/${id}`),
    create: (data) => api.post("/events", data),
    update: (id, data) => api.put(`/events/${id}`, data),
    delete: (id) => api.delete(`/events/${id}`),
    generateAuthCode: (id) => api.get(`/events/${id}/auth-code`),
  },

  // Payment related endpoints
  payments: {
    createOrder: (data) => api.post("/payment/create-order", data),
    verifyPayment: (data) => api.post("/payment/verify", data),
    getPlans: () => api.get("/payment/plans"),
  },

  // User related endpoints
  users: {
    getProfile: () => api.get("/users/profile"),
    updateProfile: (data) => api.put("/users/profile", data),
  },

  // License related endpoints
  licenses: {
    generate: (eventId, expirationDate) =>
      api.post("/licenses/generate", { eventId, expirationDate }),
    verify: (licenseKey) => api.post("/licenses/verify", { licenseKey }),
  },
};

export default apiService;
