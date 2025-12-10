// API Service - Comunicação com o Backend

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Classe para gerenciar requisições à API
 */
class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    /**
     * Configura o token de autenticação
     * @param {string} token - Token JWT
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    /**
     * Remove o token (logout)
     */
    removeToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    /**
     * Obtém os headers padrão para requisições
     * @returns {Object} Headers
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    /**
     * Realiza requisição HTTP
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
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro na requisição');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }

    // ==============================================
    // MÉTODOS DE SALÁRIOS
    // ==============================================

    /**
     * Busca salário do usuário logado
     * @param {number} userId - ID do usuário
     * @returns {Promise} Dados do salário
     */
    async getSalarioByUserId(userId) {
        return await this.request(`/salarios/search?user_id=${userId}`);
    }

    /**
     * Cria um novo salário
     * @param {Object} salarioData - Dados do salário
     * @returns {Promise} Resultado da criação
     */
    async createSalario(salarioData) {
        return await this.request('/salarios', 'POST', salarioData);
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
     * Busca dados do usuário
     * @param {number} id - ID do usuário
     * @returns {Promise} Dados do usuário
     */
    async getUser(id) {
        return await this.request(`/users/${id}`);
    }
}

// Exporta instância única do serviço
const apiService = new ApiService();
