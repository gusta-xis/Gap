// ============================================================================
// SPA ROUTER - Sistema de Navegação Sem Reload
// ============================================================================

window.voltarParaSubtemas = function() {
    console.log('🔙 Voltando para subtemas...');
    window.location.href = '/subsistemas';
};

// ============================================================================
// CONTROLE DE NAVEGAÇÃO
// ============================================================================

const SPARouter = {
    currentPage: null,
    currentScript: null,
    
    // Páginas disponíveis
    pages: {
        dashboard: {
            title: 'Dashboard - GAP Financeiro',
            contentUrl: '/pages/dashboard-content.html',
            script: '/scripts/finance-dashboard.js'
        },
        transacoes: {
            title: 'Minhas Transações - GAP Financeiro',
            contentUrl: '/pages/transacoes-content.html',
            script: '/scripts/transacoes.js'
        }
    },
    
    // Inicializar router
    init() {
        console.log('🚀 Iniciando SPA Router...');
        
        // Verificar autenticação
        if (!this.checkAuth()) return;
        
        // Configurar nome do usuário
        this.updateUserInfo();
        
        // Configurar listeners de navegação
        this.setupNavigation();
        
        // Carregar página inicial (dashboard por padrão)
        const initialPage = window.location.hash.replace('#', '') || 'dashboard';
        this.loadPage(initialPage);
    },
    
    // Verificar autenticação
    checkAuth() {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
        const user = sessionStorage.getItem('user') || localStorage.getItem('user');
        
        if (!token || !user) {
            console.warn('⚠️ Usuário não autenticado');
            sessionStorage.clear();
            localStorage.clear();
            window.location.replace('/');
            return false;
        }
        
        return true;
    },
    
    // Atualizar informações do usuário
    updateUserInfo() {
        try {
            const userDataString = sessionStorage.getItem('user') || localStorage.getItem('user');
            if (!userDataString) return;
            
            const userData = JSON.parse(userDataString);
            const userName = userData.nome || userData.name || 'Usuário';
            
            const headerUserNameEl = document.getElementById('headerUserName');
            const headerAvatarEl = document.getElementById('headerAvatar');
            
            if (headerUserNameEl && headerUserNameEl.textContent !== userName) {
                headerUserNameEl.textContent = userName;
            }
            
            const userInitial = userName.charAt(0).toUpperCase();
            if (headerAvatarEl && headerAvatarEl.textContent !== userInitial) {
                headerAvatarEl.textContent = userInitial;
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar info do usuário:', error);
        }
    },
    
    // Configurar navegação
    setupNavigation() {
        // Interceptar cliques nos links de navegação
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const page = link.getAttribute('data-page');
                if (page) {
                    e.preventDefault();
                    this.navigateTo(page);
                }
            });
        });
        
        // Listener para botão voltar/avançar do navegador
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.loadPage(e.state.page, false);
            }
        });
    },
    
    // Navegar para uma página
    navigateTo(pageName) {
        if (!this.pages[pageName]) {
            console.warn(`Página "${pageName}" não encontrada`);
            return;
        }
        
        // Atualizar URL sem reload
        window.history.pushState({ page: pageName }, '', `#${pageName}`);
        
        // Carregar página
        this.loadPage(pageName);
    },
    
    // Carregar página
    async loadPage(pageName, updateHistory = true) {
        if (!this.pages[pageName]) {
            pageName = 'dashboard'; // Fallback
        }
        
        const page = this.pages[pageName];
        const contentDiv = document.getElementById('app-content');
        
        if (!contentDiv) {
            console.error('❌ Elemento app-content não encontrado');
            return;
        }
        
        try {
            // Adicionar classe de loading
            contentDiv.classList.add('loading');
            
            // Atualizar links ativos no menu
            this.updateActiveNav(pageName);
            
            // Atualizar título
            document.title = page.title;
            
            // Aguardar transição
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Carregar conteúdo HTML
            const response = await fetch(page.contentUrl);
            if (!response.ok) {
                throw new Error(`Erro ao carregar ${page.contentUrl}`);
            }
            
            const html = await response.text();
            contentDiv.innerHTML = html;
            
            // Remover script anterior se existir
            if (this.currentScript) {
                this.currentScript.remove();
                this.currentScript = null;
            }
            
            // Limpar event listeners e variáveis globais anteriores
            this.cleanupPage();
            
            // Carregar script da página
            await this.loadScript(page.script);
            
            // Aguardar um momento para garantir que o script foi processado
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Remover classe de loading
            contentDiv.classList.remove('loading');
            
            // Inicializar página específica
            this.initPage(pageName);
            
            this.currentPage = pageName;
            
            console.log(`✅ Página "${pageName}" carregada com sucesso`);
            
        } catch (error) {
            console.error(`❌ Erro ao carregar página "${pageName}":`, error);
            contentDiv.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-red-600 dark:text-red-400 text-lg font-medium">Erro ao carregar a página</p>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mt-2">${error.message}</p>
                    <button onclick="SPARouter.loadPage('dashboard')" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
                        Voltar para Dashboard
                    </button>
                </div>
            `;
            contentDiv.classList.remove('loading');
        }
    },
    
    // Carregar script dinamicamente
    loadScript(scriptUrl) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptUrl + '?t=' + Date.now(); // Cache busting
            script.setAttribute('data-page-script', 'true');
            script.onload = () => {
                this.currentScript = script;
                resolve();
            };
            script.onerror = () => reject(new Error(`Falha ao carregar script: ${scriptUrl}`));
            document.body.appendChild(script);
        });
    },
    
    // Limpar recursos da página anterior
    cleanupPage() {
        // Remover todos os scripts de páginas anteriores
        document.querySelectorAll('script[data-page-script]').forEach(script => {
            script.remove();
        });
        
        // Limpar variáveis globais específicas das páginas
        const globalVarsToClean = [
            'dashboardData', 'allTransactions', 'filteredTransactions', 
            'customCategories', 'selectedExpenseType', 'selectedCategoryIcon',
            'initializeDashboard', 'initTransacoesPage', 'loadDashboardData',
            'updateUserName', 'renderMonthlyChart', 'handleAddExpense',
            'normalizeTransactions', 'applyFilters', 'renderTransactions',
            'updateStatistics', 'loadCustomCategories', 'saveNewCategory'
        ];
        
        globalVarsToClean.forEach(varName => {
            if (window[varName] !== undefined) {
                try {
                    delete window[varName];
                } catch (e) {
                    window[varName] = undefined;
                }
            }
        });
    },
    
    // Inicializar página específica
    initPage(pageName) {
        console.log(`🔄 Tentando inicializar página: ${pageName}`);
        
        if (typeof window.initializeExpenseModal === 'function') {
            window.initializeExpenseModal();
        }

        if (pageName === 'dashboard') {
            if (typeof window.initializeDashboard === 'function') {
                console.log('✅ Chamando initializeDashboard...');
                window.initializeDashboard();
            } else {
                console.warn('⚠️ initializeDashboard não está disponível');
            }
        } else if (pageName === 'transacoes') {
            if (typeof window.initTransacoesPage === 'function') {
                console.log('✅ Chamando initTransacoesPage...');
                window.initTransacoesPage();
            } else {
                console.warn('⚠️ initTransacoesPage não está disponível');
            }
        }
    },
    
    // Atualizar link ativo no menu
    updateActiveNav(pageName) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkPage = link.getAttribute('data-page');
            
            if (linkPage === pageName) {
                link.classList.remove('text-slate-700', 'dark:text-slate-300', 'hover:bg-secondary', 'dark:hover:bg-slate-800');
                link.classList.add('bg-secondary', 'dark:bg-slate-800', 'text-primary', 'dark:text-white');
                link.querySelector('span:last-child').classList.remove('font-medium');
                link.querySelector('span:last-child').classList.add('font-bold');
            } else {
                link.classList.add('text-slate-700', 'dark:text-slate-300', 'hover:bg-secondary', 'dark:hover:bg-slate-800');
                link.classList.remove('bg-secondary', 'dark:bg-slate-800', 'text-primary', 'dark:text-white');
                link.querySelector('span:last-child').classList.add('font-medium');
                link.querySelector('span:last-child').classList.remove('font-bold');
            }
        });
    }
};

// ============================================================================
// INICIALIZAR QUANDO O DOM ESTIVER PRONTO
// ============================================================================

// Exportar SPARouter para window para acesso global
window.SPARouter = SPARouter;

document.addEventListener('DOMContentLoaded', function() {
    SPARouter.init();
});

console.log('✅ SPA Router carregado');
