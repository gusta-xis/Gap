const API_BASE_URL = 'http://localhost:3000/api/v1';

function basicSanitize(str) {
  if (typeof str !== 'string') return str;
  
  str = str.replace(/<[^>]*>/g, '');
  
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return str.trim();
}

function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = basicSanitize(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

class ApiService {
  constructor() {
    // Não armazenamos o token no construtor, sempre buscamos dinamicamente
  }

  get token() {
    return sessionStorage.getItem('accessToken') || localStorage.getItem('token');
  }

  get refreshToken() {
    return sessionStorage.getItem('refreshToken');
  }

  setTokens(accessToken, refreshToken) {
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
  }

  setAccessToken(accessToken) {
    sessionStorage.setItem('accessToken', accessToken);
  }

  removeTokens() {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };

    const token = this.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      console.warn('⚠️ Sem refresh token para renovação');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (!response.ok) {
        console.warn('❌ Falha ao renovar token');
        this.removeTokens();
        return false;
      }

      const data = await response.json();
      this.setAccessToken(data.accessToken);

      if (data.refreshToken) {
        this.refreshToken = data.refreshToken;
        sessionStorage.setItem('refreshToken', data.refreshToken);
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      this.removeTokens();
      return false;
    }
  }

  async request(endpoint, method = 'GET', data = null) {
    const config = {
      method,
      headers: this.getHeaders()
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();

        if (refreshed) {
          config.headers = this.getHeaders();
          response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Erro na requisição'
        }));

        throw new Error(error.message || error.error || 'Erro na requisição');
      }

      const responseData = await response.json();
      return sanitizeObject(responseData);
    } catch (error) {
      console.error('❌ Erro na requisição:', error.message);
      throw error;
    }
  }

  async getSalarios() {
    return await this.request('/salarios');
  }

  async getSalarioById(id) {
    return await this.request(`/salarios/${id}`);
  }

  async createSalario(salarioData) {
    return await this.request('/salarios', 'POST', salarioData);
  }

  async updateSalario(id, salarioData) {
    return await this.request(`/salarios/${id}`, 'PUT', salarioData);
  }

  async deleteSalario(id) {
    return await this.request(`/salarios/${id}`, 'DELETE');
  }

  async getGastosFixos() {
    return await this.request('/gastos-fixos');
  }

  async getGastoFixoById(id) {
    return await this.request(`/gastos-fixos/${id}`);
  }

  async createGastoFixo(gastoData) {
    return await this.request('/gastos-fixos', 'POST', gastoData);
  }

  async updateGastoFixo(id, gastoData) {
    return await this.request(`/gastos-fixos/${id}`, 'PUT', gastoData);
  }

  async deleteGastoFixo(id) {
    return await this.request(`/gastos-fixos/${id}`, 'DELETE');
  }

  async getGastosVariaveis() {
    return await this.request('/gastos-variaveis');
  }

  async getGastoVariavelById(id) {
    return await this.request(`/gastos-variaveis/${id}`);
  }

  async createGastoVariavel(gastoData) {
    return await this.request('/gastos-variaveis', 'POST', gastoData);
  }

  async updateGastoVariavel(id, gastoData) {
    return await this.request(`/gastos-variaveis/${id}`, 'PUT', gastoData);
  }

  async deleteGastoVariavel(id) {
    return await this.request(`/gastos-variaveis/${id}`, 'DELETE');
  }

  async login(email, senha) {
    const response = await this.request('/users/login', 'POST', {
      email: basicSanitize(email),
      senha: senha
    });

    this.setTokens(response.accessToken, response.refreshToken);

    return response;
  }

  async signup(userData) {
    return await this.request('/users', 'POST', {
      nome: basicSanitize(userData.nome),
      email: basicSanitize(userData.email),
      senha: userData.senha
    });
  }

  async getUser(id) {
    return await this.request(`/users/${id}`);
  }

  async updateUser(id, userData) {
    return await this.request(`/users/${id}`, 'PUT', {
      nome: basicSanitize(userData.nome),
      email: basicSanitize(userData.email),
      senha: userData.senha
    });
  }
}

const apiService = new ApiService();
