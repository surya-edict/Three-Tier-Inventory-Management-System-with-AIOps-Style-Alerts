import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const inventoryApi = {
  getDashboardSummary: async () => (await api.get('/dashboard/summary')).data,
  getLowStockProducts: async () => (await api.get('/dashboard/low-stock')).data,
  getProducts: async (params = {}) => (await api.get('/products', { params })).data,
  getProductMovements: async (productId) => (await api.get(`/products/${productId}/movements`)).data,
  createProduct: async (payload) => (await api.post('/products', payload)).data,
  updateProduct: async (id, payload) => (await api.put(`/products/${id}`, payload)).data,
  archiveProduct: async (id) => (await api.post(`/products/${id}/archive`)).data,
  restockProduct: async (payload) => (await api.post('/inventory/restock', payload)).data,
  adjustInventory: async (payload) => (await api.post('/inventory/adjust', payload)).data,
  getSuppliers: async (params = {}) => (await api.get('/suppliers', { params })).data,
  createSupplier: async (payload) => (await api.post('/suppliers', payload)).data,
  updateSupplier: async (id, payload) => (await api.put(`/suppliers/${id}`, payload)).data,
  getOrders: async (params = {}) => (await api.get('/orders', { params })).data,
  getMovements: async (params = {}) => (await api.get('/movements', { params })).data,
  sellProduct: async (payload) => (await api.post('/orders', payload)).data,
}

export default api
