// Garante que dashboardData sempre existe no escopo global
window.dashboardData = window.dashboardData || {};

window.voltarParaSubtemas = function() {
    console.log('🔙 Voltando para subtemas...');
    window.location.href = '/subsistemas';
};

const SPARouter = {
    currentPage: null,
    currentScript: null,

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
        },
        'gastos-fixos': {
            title: 'Gastos Fixos - GAP Financeiro',
            contentUrl: '/pages/gastos-fixos-content.html',
            script: '/scripts/gastos-fixos.js'
        }
    },

    init() {
        console.log('🚀 Iniciando SPA Router...');

        if (!this.checkAuth()) return;

        this.updateUserInfo();
        this.setupNavigation();

        const initialPage = window.location.hash.replace('#', '') || 'dashboard';
        this.loadPage(initialPage);
    },

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

    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const page = link.getAttribute('data-page');
                if (page) {
                    e.preventDefault();
                    this.navigateTo(page);
                }
            });
        });

        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.loadPage(e.state.page, false);
            }
        });
    },

    navigateTo(pageName) {
        if (!this.pages[pageName]) {
            console.warn(`Página "${pageName}" não encontrada`);
            return;
        }

        window.history.pushState({ page: pageName }, '', `#${pageName}`);
        this.loadPage(pageName);
    },

    async loadPage(pageName, updateHistory = true) {
        if (!this.pages[pageName]) {
            pageName = 'dashboard';
        }
        
        const page = this.pages[pageName];
        const contentDiv = document.getElementById('app-content');
        
        if (!contentDiv) {
            console.error('❌ Elemento app-content não encontrado');
            return;
        }
        
        try {
            contentDiv.classList.add('loading');

            this.updateActiveNav(pageName);
            document.title = page.title;

            await new Promise(resolve => setTimeout(resolve, 150));

            const response = await fetch(page.contentUrl);
            if (!response.ok) {
                throw new Error(`Erro ao carregar ${page.contentUrl}`);
            }
            
            const html = await response.text();
            contentDiv.innerHTML = html;

            if (this.currentScript) {
                this.currentScript.remove();
                this.currentScript = null;
            }

            this.cleanupPage();

            await this.loadScript(page.script);
            await new Promise(resolve => setTimeout(resolve, 200));

            contentDiv.classList.remove('loading');

            this.initPage(pageName);
            
            // Atualiza o botão de salário após inserir o HTML do dashboard
            if (pageName === 'dashboard' && window.updateSalaryButton) {
                window.updateSalaryButton();
            }

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
    
    loadScript(scriptUrl) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${scriptUrl}?t=${Date.now()}`;
            script.setAttribute('data-page-script', 'true');
            script.onload = () => {
                this.currentScript = script;
                resolve();
            };
            script.onerror = () => reject(new Error(`Falha ao carregar script: ${scriptUrl}`));
            document.body.appendChild(script);
        });
    },

    cleanupPage() {
        document.querySelectorAll('script[data-page-script]').forEach(script => {
            script.remove();
        });

        // Limpeza específica de Gastos Fixos
        if (typeof window.cleanupGastosFixos === 'function') {
            window.cleanupGastosFixos();
        }

        const globalVarsToClean = [
            'dashboardData', 'allTransactions', 'filteredTransactions', 
            'customCategories', 'selectedExpenseType', 'selectedCategoryIcon',
            'gastosFixosData',
            'initializeDashboard', 'initTransacoesPage', 'initializeGastosFixos',
            'loadDashboardData', 'loadGastosFixos',
            'updateUserName', 'renderMonthlyChart', 'handleAddExpense',
            'normalizeTransactions', 'applyFilters', 'renderTransactions',
            'updateStatistics', 'loadCustomCategories', 'saveNewCategory',
            // ADICIONADO: Limpeza de variáveis de salário se necessário (opcional)
            'initializeSalaryModal' 
        ];
        
        globalVarsToClean.forEach(varName => {
            if (window[varName] !== undefined) {
                try {
                    // Não deletamos as inicializações globais de modais se elas forem carregadas no HTML principal
                    // mas limpamos dados de página
                    if (!varName.includes('Modal')) { 
                         delete window[varName];
                    }
                } catch (e) {
                    window[varName] = undefined;
                }
            }
        });
    },

    initPage(pageName) {
        console.log(`🔄 Tentando inicializar página: ${pageName}`);
        
        // --- INICIALIZAÇÃO DOS MODAIS GLOBAIS ---
        
        // 1. Inicializa Modal de Despesa
        if (typeof window.initializeExpenseModal === 'function') {
            window.initializeExpenseModal();
        }

        // 2. Inicializa Modal de Salário (NOVO)
        if (typeof window.initializeSalaryModal === 'function') {
            window.initializeSalaryModal();
        }

        // --- INICIALIZAÇÃO ESPECÍFICA DA PÁGINA ---

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
        } else if (pageName === 'gastos-fixos') {
            if (typeof window.initializeGastosFixos === 'function') {
                console.log('✅ Chamando initializeGastosFixos...');
                window.initializeGastosFixos();
            } else {
                console.warn('⚠️ initializeGastosFixos não está disponível');
            }
        }

        // ADICIONADO: Chamada para carregar dados do dashboard se a função existir
        if (window.loadDashboardData) window.loadDashboardData();
    },

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

window.SPARouter = SPARouter;

document.addEventListener('DOMContentLoaded', function() {
    SPARouter.init();
});
console.log('✅ SPA Router carregado (Atualizado)');

function updateUI() {
    // Atualiza o DOM com os valores de dashboardData
    const salarioEl = document.getElementById('salarioValor');
    if (salarioEl) {
        salarioEl.textContent = window.dashboardData.salario || '0,00';
    }
    // ...outros campos...
}

async function loadDashboardData() {
    // ...fetch dos dados...
    // window.dashboardData.salario = salarioAtualizado;
    // ...
    updateUI();
}