// ========================================================
// API SERVICE - COM SANITIZAÇÃO E SEGURANÇA
// ========================================================

// Atualizado para a nova versão da API (/api/v1)
const API_BASE_URL = 'http://localhost:3000/api/v1';

/**
 * Sanitiza string removendo tags HTML e caracteres perigosos
 * Função básica quando DOMPurify não está disponível
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizada
 */
function basicSanitize(str) {
  if (typeof str !== 'string') return str;
  
  // Remove tags HTML
  str = str.replace(/<[^>]*>/g, '');
  
  // Remove caracteres de controle perigosos
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return str.trim();
}

/**
 * Sanitiza um objeto recursivamente
 * @param {Object} obj - Objeto a sanitizar
 * @returns {Object} Objeto com valores sanitizados
 */
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

/**
 * Classe para gerenciar requisições à API
 */
class ApiService {
  constructor() {
    // ⚠️ SEGURANÇA: Mudado para sessionStorage (não persiste após fechar navegador)
    this.token = sessionStorage.getItem('accessToken');
    this.refreshToken = sessionStorage.getItem('refreshToken');
  }

  /**
   * Configura os tokens de autenticação
   * @param {string} accessToken - Access Token JWT
   * @param {string} refreshToken - Refresh Token JWT
   */
  setTokens(accessToken, refreshToken) {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    
    // ⚠️ SEGURANÇA: Armazena em sessionStorage em vez de localStorage
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Configura apenas o access token
   * @param {string} accessToken - Access Token JWT
   */
  setAccessToken(accessToken) {
    this.token = accessToken;
    sessionStorage.setItem('accessToken', accessToken);
  }

  /**
   * Remove os tokens (logout)
   */
  removeTokens() {
    this.token = null;
    this.refreshToken = null;
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  }

  /**
   * Obtém os headers padrão para requisições
   * @returns {Object} Headers
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest' // Adiciona header de CSRF
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Atualiza o access token usando o refresh token
   * @returns {Promise<boolean>} True se conseguiu atualizar, false caso contrário
   */
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

      // Se servidor retornar novo refresh token também
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

  /**
   * Realiza requisição HTTP com suporte a refresh token
   * @param {string} endpoint - Endpoint da API
   * @param {string} method - Método HTTP
   * @param {Object} data - Dados a enviar
   * @returns {Promise} Resposta da API
   */
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

      // Se token expirou (401), tenta renovar
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();

        if (refreshed) {
          // Tenta novamente com novo token
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

      // Sanitiza a resposta antes de retornar
      const responseData = await response.json();
      return sanitizeObject(responseData);
    } catch (error) {
      console.error('❌ Erro na requisição:', error.message);
      throw error;
    }
  }

  // ==============================================
  // MÉTODOS DE SALÁRIOS
  // ==============================================

  /**
   * Busca salários do usuário logado
   * @returns {Promise} Lista de salários
   */
  async getSalarios() {
    return await this.request('/salarios');
  }

  /**
   * Busca salário por ID
   * @param {number} id - ID do salário
   * @returns {Promise} Dados do salário
   */
  async getSalarioById(id) {
    return await this.request(`/salarios/${id}`);
  }

  /**
   * Cria um novo salário
   * @param {Object} salarioData - Dados do salário
   * @returns {Promise} Resultado da criação
   */
  async createSalario(salarioData) {
    return await this.request('/salarios', 'POST', salarioData);
  }

  /**
   * Atualiza salário
   * @param {number} id - ID do salário
   * @param {Object} salarioData - Dados atualizados
   * @returns {Promise} Resultado da atualização
   */
  async updateSalario(id, salarioData) {
    return await this.request(`/salarios/${id}`, 'PUT', salarioData);
  }

  /**
   * Deleta salário
   * @param {number} id - ID do salário
   * @returns {Promise} Resultado da deleção
   */
  async deleteSalario(id) {
    return await this.request(`/salarios/${id}`, 'DELETE');
  }

  // ==============================================
  // MÉTODOS DE GASTOS FIXOS
  // ==============================================

  /**
   * Busca gastos fixos do usuário logado
   * @returns {Promise} Lista de gastos fixos
   */
  async getGastosFixos() {
    return await this.request('/gastos-fixos');
  }

  /**
   * Busca gasto fixo por ID
   * @param {number} id - ID do gasto
   * @returns {Promise} Dados do gasto
   */
  async getGastoFixoById(id) {
    return await this.request(`/gastos-fixos/${id}`);
  }

  /**
   * Cria um novo gasto fixo
   * @param {Object} gastoData - Dados do gasto
   * @returns {Promise} Resultado da criação
   */
  async createGastoFixo(gastoData) {
    return await this.request('/gastos-fixos', 'POST', gastoData);
  }

  /**
   * Atualiza um gasto fixo
   * @param {number} id - ID do gasto
   * @param {Object} gastoData - Dados atualizados
   * @returns {Promise} Resultado da atualização
   */
  async updateGastoFixo(id, gastoData) {
    return await this.request(`/gastos-fixos/${id}`, 'PUT', gastoData);
  }

  /**
   * Deleta um gasto fixo
   * @param {number} id - ID do gasto
   * @returns {Promise} Resultado da deleção
   */
  async deleteGastoFixo(id) {
    return await this.request(`/gastos-fixos/${id}`, 'DELETE');
  }

  // ==============================================
  // MÉTODOS DE GASTOS VARIÁVEIS
  // ==============================================

  /**
   * Busca gastos variáveis do usuário logado
   * @returns {Promise} Lista de gastos variáveis
   */
  async getGastosVariaveis() {
    return await this.request('/gastos-variaveis');
  }

  /**
   * Busca gasto variável por ID
   * @param {number} id - ID do gasto
   * @returns {Promise} Dados do gasto
   */
  async getGastoVariavelById(id) {
    return await this.request(`/gastos-variaveis/${id}`);
  }

  /**
   * Cria um novo gasto variável
   * @param {Object} gastoData - Dados do gasto
   * @returns {Promise} Resultado da criação
   */
  async createGastoVariavel(gastoData) {
    return await this.request('/gastos-variaveis', 'POST', gastoData);
  }

  /**
   * Atualiza um gasto variável
   * @param {number} id - ID do gasto
   * @param {Object} gastoData - Dados atualizados
   * @returns {Promise} Resultado da atualização
   */
  async updateGastoVariavel(id, gastoData) {
    return await this.request(`/gastos-variaveis/${id}`, 'PUT', gastoData);
  }

  /**
   * Deleta um gasto variável
   * @param {number} id - ID do gasto
   * @returns {Promise} Resultado da deleção
   */
  async deleteGastoVariavel(id) {
    return await this.request(`/gastos-variaveis/${id}`, 'DELETE');
  }

  // ==============================================
  // MÉTODOS DE USUÁRIOS
  // ==============================================

  /**
   * Login - Retorna access token e refresh token
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   * @returns {Promise} Dados de login com tokens
   */
  async login(email, senha) {
    const response = await this.request('/users/login', 'POST', {
      email: basicSanitize(email),
      senha: senha // Senha não é sanitizada para preservar força
    });

    // Armazena tokens de forma segura
    this.setTokens(response.accessToken, response.refreshToken);

    return response;
  }

  /**
   * Cadastro - Cria novo usuário
   * @param {Object} userData - Dados do usuário (nome, email, senha)
   * @returns {Promise} Resultado do cadastro
   */
  async signup(userData) {
    return await this.request('/users', 'POST', {
      nome: basicSanitize(userData.nome),
      email: basicSanitize(userData.email),
      senha: userData.senha // Senha não é sanitizada
    });
  }

  /**
   * Busca dados do usuário
   * @param {number} id - ID do usuário
   * @returns {Promise} Dados do usuário
   */
  async getUser(id) {
    return await this.request(`/users/${id}`);
  }

  /**
   * Atualiza dados do usuário
   * @param {number} id - ID do usuário
   * @param {Object} userData - Dados atualizados
   * @returns {Promise} Resultado da atualização
   */
  async updateUser(id, userData) {
    return await this.request(`/users/${id}`, 'PUT', {
      nome: basicSanitize(userData.nome),
      email: basicSanitize(userData.email),
      senha: userData.senha // Senha não é sanitizada
    });
  }
}

// ========================================================
// EXPORTAÇÃO
// ========================================================

// Exporta instância única do serviço (singleton)
const apiService = new ApiService();
