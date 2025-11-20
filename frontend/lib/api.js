import { apiMiddleware, routes } from './apiMiddleware';

export const api = {
  // Auth endpoints
  async register(data) {
    return apiMiddleware.post(routes.auth.register, data);
  },

  async login(credentials) {
    return apiMiddleware.post(routes.auth.login, credentials);
  },

  async logout() {
    return apiMiddleware.post(routes.auth.logout);
  },

  // Profile endpoints
  async getProfile() {
    return apiMiddleware.get(routes.user.profile);
  },

  async updateProfile(data) {
    return apiMiddleware.put(routes.user.profile, data);
  },

  async updateProfileWithImage(formData) {
    return apiMiddleware.post(routes.user.profile, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Consumption logs endpoints
  async getConsumptionLogs(params = {}) {
    return apiMiddleware.get(routes.consumptionLogs.list, { params });
  },

  async createConsumptionLog(data) {
    return apiMiddleware.post(routes.consumptionLogs.create, data);
  },

  async deleteConsumptionLog(id) {
    return apiMiddleware.delete(routes.consumptionLogs.delete(id));
  },

  // Inventory endpoints
  async getInventory(params = {}) {
    return apiMiddleware.get(routes.inventory.list, { params });
  },

  async createInventory(data) {
    return apiMiddleware.post(routes.inventory.create, data);
  },

  async updateInventory(id, data) {
    return apiMiddleware.put(routes.inventory.update(id), data);
  },

  async deleteInventory(id) {
    return apiMiddleware.delete(routes.inventory.delete(id));
  },

  async getExpiringInventory(params = {}) {
    return apiMiddleware.get(routes.inventory.expiring, { params });
  },

  async getExpiringCount(days = 3) {
    return apiMiddleware.get(routes.inventory.expiringCount, { params: { days } });
  },

  async getTotalInventoryCount() {
    return apiMiddleware.get(routes.inventory.totalCount);
  },

  // Food items endpoint
  async getFoodItems(params = {}) {
    return apiMiddleware.get(routes.foodItems.list, { params });
  },

  // Resources endpoint
  async getResources(params = {}) {
    return apiMiddleware.get(routes.resources.list, { params });
  },

  // Dashboard endpoint
  async getDashboardSummary() {
    return apiMiddleware.get(routes.dashboard.summary);
  },

  async getRecommendations() {
    return apiMiddleware.get(routes.dashboard.recommendations);
  },

  // Image upload endpoint
  async uploadImage(formData) {
    return apiMiddleware.post(routes.images.upload, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async getImages(params = {}) {
    return apiMiddleware.get(routes.images.list, { params });
  },
};
