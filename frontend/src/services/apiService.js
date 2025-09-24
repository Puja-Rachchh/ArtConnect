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
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('JSON parsing error - server may have returned HTML:', error);
        throw new Error('Server returned invalid response. Please check if the backend is running correctly.');
      }
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
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

  // Painting methods
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
    return await this.request('/paintings/upload', {
      method: 'POST',
      body: formData,
      headers: {}
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

  // Generic HTTP methods for chat functionality
  static async get(endpoint) {
    return await this.request(endpoint, {
      method: 'GET'
    });
  }

  static async post(endpoint, data) {
    return await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async patch(endpoint, data) {
    return await this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  static async delete(endpoint) {
    return await this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // Auth helper methods
  static logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
  }

  static saveAuthData(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userId', user.id);
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