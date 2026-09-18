import axios from "axios";

// In the browser, use a relative path so Vite's dev proxy forwards /api → http://localhost:8000/api.
// On the server (SSR/production), fall back to the absolute VITE_API_URL env variable.
const baseURL =
  typeof window !== "undefined"
    ? "/api"
    : ((import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000/api");

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

const TOKEN_KEY = "token";

export const tokenStore = {
  get: () => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null),
  set: (t: string) => typeof window !== "undefined" && localStorage.setItem(TOKEN_KEY, t),
  clear: () => typeof window !== "undefined" && localStorage.removeItem(TOKEN_KEY),
};

api.interceptors.request.use((req) => {
  const token = tokenStore.get();
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original?._retry &&
      !original?.url?.includes("/users/login") &&
      !original?.url?.includes("/users/refresh-token")
    ) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = axios
            .post(`${baseURL}/users/refresh-token`, {}, { withCredentials: true })
            .then((r) => {
              const t = r.data.accessToken;
              tokenStore.set(t);
              return t;
            })
            .finally(() => {
              refreshing = null;
            });
        }
        const newToken = await refreshing;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        tokenStore.clear();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Endpoint wrappers
export const authApi = {
  register: (data: any) => api.post("/users/register", data),
  login: (data: any) => api.post("/users/login", data),
  verify2faLogin: (data: any) => api.post("/users/verify-2fa-login", data),
  verifyEmail: (token: string) => api.get(`/users/verify-email`, { params: { token } }),
  resendVerification: (email: string) => api.post("/users/resend-verification", { email }),
  forgotPassword: (email: string) => api.post("/users/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post("/users/reset-password", { token, password }),
  refresh: () => api.post("/users/refresh-token"),
  logout: () => api.post("/users/logout"),
  logoutAll: () => api.post("/users/logout-all"),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put("/users/change-password", { currentPassword, newPassword }),
  enable2fa: () => api.post("/users/enable-2fa"),
  confirm2fa: (code: string) => api.post("/users/confirm-2fa", { code }),
  disable2fa: (code: string) => api.post("/users/disable-2fa", { code }),
  profile: () => api.get("/users/profile"),
  dashboard: () => api.get("/users/dashboard"),
  sessions: () => api.get("/users/sessions"),
  revokeSession: (id: string) => api.delete(`/users/sessions/${id}`),
};

export const startupsApi = {
  list: (params?: any) => api.get("/startups", { params: typeof params === 'string' ? { q: params } : params }),
  get: (id: string) => api.get(`/startups/${id}`),
  create: (data: any) => api.post("/startups", data),
  update: (id: string, data: any) => api.put(`/startups/${id}`, data),
  getFounderAnalytics: () => api.get("/startups/analytics/founder"),
  getStartupAnalytics: (id: string) => api.get(`/startups/${id}/analytics`),
  getMatches: (investorId?: string) => api.get(investorId ? `/startups/matches/${investorId}` : "/startups/matches"),
  addMilestone: (id: string, data: any) => api.post(`/startups/${id}/milestones`, data),
  updateMilestone: (id: string, milestoneId: string, data: any) => api.put(`/startups/${id}/milestones/${milestoneId}`, data),
  deleteMilestone: (id: string, milestoneId: string) => api.delete(`/startups/${id}/milestones/${milestoneId}`),
  submitMilestone: (id: string, milestoneId: string, data: any) => api.post(`/startups/${id}/milestones/${milestoneId}/submit`, data),
  verifyMilestone: (id: string, milestoneId: string, data?: any) => api.put(`/startups/${id}/milestones/${milestoneId}/verify`, data || {}),
  rejectMilestone: (id: string, milestoneId: string, reason?: string) => api.put(`/startups/${id}/milestones/${milestoneId}/reject`, { reason }),
};

export const transactionsApi = {
  create: (data: { startupId: string; amount: number; paymentMethod: string; notes?: string }) => api.post("/transactions", data),
  complete: (id: string, data: { paymentId: string }) => api.put(`/transactions/${id}/complete`, data),
  list: (params?: { status?: string; startupId?: string }) => api.get("/transactions", { params }),
  get: (id: string) => api.get(`/transactions/${id}`),
  getPortfolio: () => api.get("/transactions/portfolio"),
  getEscrowLedger: (startupId: string) => api.get(`/transactions/escrow-ledger/${startupId}`),
  cancel: (id: string) => api.delete(`/transactions/${id}`),
};

export const aiApi = {
  chat: (data: { query: string; conversationHistory?: any[] }) => api.post("/ai/chat", data),
  swot: (startupId: string, pitchText?: string) => api.post("/ai/swot-analysis", { startupId, pitchText }),
  riskScore: (startupId: string) => api.post("/ai/risk-score", { startupId }),
  summary: (startupId: string) => api.post("/ai/generate-summary", { startupId }),
  analyzePitch: (startupId: string, pitchText?: string) => api.post("/ai/analyze-pitch", { startupId, pitchText }),
  fundingReadiness: (startupId: string) => api.post("/ai/funding-readiness", { startupId }),
  businessModel: (startupId: string) => api.post("/ai/business-model-analysis", { startupId }),
  recommendation: (startupId: string) => api.post("/ai/investment-recommendation", { startupId }),
  getReports: (startupId: string) => api.get(`/ai/reports/${startupId}`),
  getRiskReports: (startupId: string) => api.get(`/ai/risk-reports/${startupId}`),
  getStatus: () => api.get("/ai/status"),
  configureKey: (apiKey: string) => api.post("/ai/configure-key", { apiKey }),
};

export const adminApi = {
  stats: () => api.get("/admin/stats"),
  users: (params?: any) => api.get("/admin/users", { params }),
  updateKyc: (id: string, kycStatus: string) => api.put(`/admin/users/${id}/kyc`, { kycStatus }),
  updateStatus: (id: string, isActive: boolean) => api.put(`/admin/users/${id}/status`, { isActive }),
  startups: (params?: any) => api.get("/admin/startups", { params }),
  approveStartup: (id: string) => api.put(`/admin/startups/${id}/approve`),
  rejectStartup: (id: string, reason?: string) => api.put(`/admin/startups/${id}/reject`, { reason }),
  transactions: (params?: any) => api.get("/admin/transactions", { params }),
};

export const investorApi = {
  getProfile: () => api.get("/investor/profile"),
  updateProfile: (data: any) => api.put("/investor/profile", data),
  getRecommendations: () => api.get("/investor/recommendations"),
  getMatches: () => api.get("/startups/matches"),
  getWatchlist: () => api.get("/investor/watchlist"),
  addToWatchlist: (startupId: string) => api.post(`/investor/watchlist/${startupId}`),
  removeFromWatchlist: (startupId: string) => api.delete(`/investor/watchlist/${startupId}`),
};

export const notificationsApi = {
  list: () => api.get("/notifications"),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
};

export default api;
