const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Don't set Content-Type for FormData (let browser handle it)
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static async signup(userData) {
    return await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async login(credentials) {
    return await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async checkEmail(email) {
    return await this.request('/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Painting related methods
  static async getPaintings() {
    return await this.request('/paintings');
  }

  static async getAllPaintings() {
    return await this.request('/paintings');
  }

  static async getMyPaintings() {
    return await this.request('/paintings/my-paintings');
  }

  static async uploadPainting(formData) {
    // Don't set Content-Type header for FormData
    return await this.request('/paintings/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }

  static async getPainting(id) {
    return await this.request(`/paintings/${id}`);
  }

  static async deletePainting(id) {
    return await this.request(`/paintings/${id}`, {
      method: 'DELETE'
    });
  }

  static async updatePainting(id, updateData) {
    return await this.request(`/paintings/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Bidding APIs
  static async placeBid(paintingId, amount) {
    return await this.request(`/paintings/${paintingId}/bids`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  static async getBids(paintingId) {
    return await this.request(`/paintings/${paintingId}/bids`);
  }

  static async acceptBid(paintingId, bidId) {
    return await this.request(`/paintings/${paintingId}/bids/${bidId}/accept`, {
      method: 'POST'
    });
  }

  // Orders / purchases
  static async getMyOrders() {
    return await this.request('/orders/my');
  }

  // (Notifications removed)

  static logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  static saveAuthData(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  static getAuthData() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return {
      token,
      user: user ? JSON.parse(user) : null,
    };
  }

  static isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }
}

export default ApiService;