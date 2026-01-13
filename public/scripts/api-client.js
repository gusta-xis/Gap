/**
 * ApiClient - Cliente HTTP Centralizado
 * Padroniza requisições, Autenticação (Bearer Token) e Tratamento de Erros.
 */
const ApiClient = {
    baseUrl: '/api/v1',

    // Obtém token de qualquer storage disponível
    getToken() {
        return sessionStorage.getItem('accessToken') || localStorage.getItem('token');
    },

    // Gera headers padrão + Auth
    getHeaders(customHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders
        };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    // Método genérico de requisição
    async request(endpoint, options = {}) {
        // Garante que o endpoint comece com / se não tiver, e remove / do baseUrl se tiver duplicado
        // Simplificação: assume baseUrl sem slash final e endpoint com slash inicial
        const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

        const config = {
            ...options,
            headers: this.getHeaders(options.headers)
        };

        try {
            console.log(`📡 [API] ${options.method || 'GET'} ${url}`);
            const response = await fetch(url, config);

            // Tratamento Global de 401 (Não Autorizado)
            if (response.status === 401) {
                console.warn('🔒 [API] Sessão expirada ou token inválido.');
                // Se desejar logout automático, pode disparar evento aqui
                // window.dispatchEvent(new CustomEvent('auth:logout'));
                throw new Error('Sessão expirada. Faça login novamente.');
            }

            // Tratamento de Erros da API
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                console.error('❌ [API] Erro:', errorBody);
                throw new Error(errorBody.message || errorBody.error || `Erro ${response.status} na requisição`);
            }

            // Retorna JSON se houver conteúdo, senão true (para 204 No Content)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return true;

        } catch (err) {
            console.error(`❌ [API] Falha de Rede ou Lógica:`, err);
            throw err;
        }
    },

    // Shorthands
    get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
    post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); },
    put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); },
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};

// Expõe globalmente
window.ApiClient = ApiClient;
console.log('🚀 ApiClient inicializado.');
