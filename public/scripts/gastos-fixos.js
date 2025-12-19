(function() {
    'use strict';

    let gastosFixosData = [];

    async function initGastosFixos() {
        try {
            console.log('🚀 Iniciando módulo de gastos fixos...');
            const isAuthenticated = checkAuthentication();
            if (!isAuthenticated) {
                console.warn('⚠️ Não autenticado');
                return;
            }
            
            console.log('🔧 Configurando event listeners...');
            setupEventListeners();
            console.log('📥 Carregando dados...');
            await loadGastosFixos();
            console.log('✅ Módulo de gastos fixos inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro na inicialização dos gastos fixos:', error);
        }
    }

    window.initializeGastosFixos = initGastosFixos;
    
    window.cleanupGastosFixos = function() {
        console.log('🧹 Limpando dados de gastos fixos...');
        gastosFixosData = [];
    };

    function checkAuthentication() {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
        const user = sessionStorage.getItem('user') || localStorage.getItem('user');
        
        if (!token || !user) {
            console.warn('Usuário não autenticado. Redirecionando para login.');
            redirectToLogin();
            return false;
        }

        try {
            JSON.parse(user);
        } catch (e) {
            console.warn('Dados de usuário corrompidos. Limpando sessão.');
            redirectToLogin();
            return false;
        }
        
        return true;
    }

    function redirectToLogin() {
        try {
            sessionStorage.clear();
            localStorage.clear();
        } catch (e) { }
        window.location.replace('/');
    }

    function setupEventListeners() {
        const btnAddGastoFixo = document.getElementById('btnAddGastoFixo');
        const btnAddGastoFixoEmpty = document.getElementById('btnAddGastoFixoEmpty');
        
        if (btnAddGastoFixo) {
            btnAddGastoFixo.addEventListener('click', () => {
                if (typeof openGastoFixoModal === 'function') {
                    openGastoFixoModal();
                }
            });
        }
        
        if (btnAddGastoFixoEmpty) {
            btnAddGastoFixoEmpty.addEventListener('click', () => {
                if (typeof openGastoFixoModal === 'function') {
                    openGastoFixoModal();
                }
            });
        }
    }

    async function loadGastosFixos() {
        try {
            console.log('📥 Iniciando loadGastosFixos...');
            showLoading();
            
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
            
            if (!token) {
                throw new Error('Token não encontrado');
            }
            
            console.log('🔍 Fazendo requisição para /api/v1/gastos-fixos');
            const response = await fetch('/api/v1/gastos-fixos', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('❌ Resposta não OK:', response.status);
                if (response.status === 401) {
                    redirectToLogin();
                    return;
                }
                throw new Error('Erro ao carregar gastos fixos');
            }

            gastosFixosData = await response.json();
            console.log('✅ Dados carregados:', gastosFixosData.length, 'gastos');
            
            renderGastosFixos();
            updateStatistics();
            
        } catch (error) {
            console.error('❌ Erro ao carregar gastos fixos:', error);
            hideLoading();
            showError('Erro ao carregar gastos fixos. Tente novamente.');
            showEmpty();
        }
    }

    function renderGastosFixos() {
        console.log('🎨 Renderizando gastos fixos...');
        hideLoading();
        
        if (!gastosFixosData || gastosFixosData.length === 0) {
            console.log('📭 Nenhum gasto fixo, mostrando estado vazio');
            showEmpty();
            return;
        }
        
        console.log(`📊 Renderizando ${gastosFixosData.length} gastos`);
        hideEmpty();
        showTable();
        
        const tbody = document.getElementById('gastosFixosTableBody');
        if (!tbody) {
            console.error('❌ Elemento gastosFixosTableBody não encontrado');
            return;
        }
        
        tbody.innerHTML = '';
        
        gastosFixosData.forEach(gasto => {
            const row = createGastoRow(gasto);
            tbody.appendChild(row);
        });
    }

    function createGastoRow(gasto) {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors';
        
        const nome = sanitizeHTML(gasto.nome || '-');
        const categoria = sanitizeHTML(gasto.categoria || 'Sem categoria');
        const diaVencimento = gasto.dia_vencimento || '-';
        const valor = formatCurrency(gasto.valor || 0);
        
        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary text-lg">event_repeat</span>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-slate-800 dark:text-slate-200">${nome}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    ${categoria}
                </span>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Dia ${diaVencimento}</span>
            </td>
            <td class="px-6 py-4 text-right">
                <span class="text-sm font-semibold text-red-600 dark:text-red-400">${valor}</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-3">
                    <button 
                        onclick="editGasto(${gasto.id})"
                        class="btn-positive text-slate-500 hover:text-primary rounded-lg transition-colors"
                        aria-label="Editar"
                        title="Editar"
                    >
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                    </button>
                    <button 
                        onclick="deleteGasto(${gasto.id}, '${nome}')"
                        class="btn-negative text-slate-500 hover:text-red-600 rounded-lg transition-colors"
                        aria-label="Excluir"
                        title="Excluir"
                    >
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                    </button>
                </div>
            </td>
        `;
        
        return tr;
    }

    function updateStatistics() {
        try {
            console.log('📊 Atualizando estatísticas...');
            const total = gastosFixosData.reduce((sum, gasto) => sum + parseFloat(gasto.valor || 0), 0);
            const totalEl = document.getElementById('totalGastosFixos');
            if (totalEl) {
                totalEl.textContent = formatCurrency(total);
            } else {
                console.warn('⚠️ Elemento totalGastosFixos não encontrado');
            }
            
            const quantidadeEl = document.getElementById('quantidadeGastos');
            if (quantidadeEl) {
                quantidadeEl.textContent = gastosFixosData.length;
            } else {
                console.warn('⚠️ Elemento quantidadeGastos não encontrado');
            }
            
            const hoje = new Date().getDate();
            const proximosGastos = gastosFixosData
                .filter(g => g.dia_vencimento >= hoje)
                .sort((a, b) => a.dia_vencimento - b.dia_vencimento);
            
            const proximoVencimentoEl = document.getElementById('proximoVencimento');
            const proximoVencimentoDescEl = document.getElementById('proximoVencimentoNome');
            
            if (proximosGastos.length > 0) {
                const proximo = proximosGastos[0];
                if (proximoVencimentoEl) {
                    proximoVencimentoEl.textContent = `Dia ${proximo.dia_vencimento}`;
                }
                if (proximoVencimentoDescEl) {
                    proximoVencimentoDescEl.textContent = sanitizeHTML(proximo.nome);
                }
            } else {
                const primeirosDoMes = gastosFixosData
                    .sort((a, b) => a.dia_vencimento - b.dia_vencimento);
                
                if (primeirosDoMes.length > 0) {
                    const proximo = primeirosDoMes[0];
                    if (proximoVencimentoEl) {
                        proximoVencimentoEl.textContent = `Dia ${proximo.dia_vencimento}`;
                    }
                    if (proximoVencimentoDescEl) {
                        proximoVencimentoDescEl.textContent = `${sanitizeHTML(proximo.nome)} (próx. mês)`;
                    }
                }
            }
            console.log('✅ Estatísticas atualizadas');
        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas:', error);
        }
    }

    window.editGasto = function(gastoId) {
        if (typeof openGastoFixoModal === 'function') {
            openGastoFixoModal(gastoId);
        }
    };

    async function deleteGasto(id, nome) {
        if (!confirm(`Deseja realmente excluir o gasto fixo "${nome}"?`)) return;
        try {
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
            const response = await fetch(`/api/v1/gastos-fixos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao excluir gasto fixo');
            if (window.initializeGastosFixos) window.initializeGastosFixos();
            if (window.loadAllTransactions) window.loadAllTransactions();
        } catch (e) {
            alert('Erro ao excluir gasto fixo: ' + e.message);
        }
    }
    window.deleteGasto = deleteGasto;

    function showLoading() {
        const loading = document.getElementById('loadingStateFixos');
        const empty = document.getElementById('emptyStateFixos');
        const table = document.getElementById('tableContainerFixos');
        
        if (loading) loading.classList.remove('hidden');
        if (empty) empty.classList.add('hidden');
        if (table) table.classList.add('hidden');
    }

    function hideLoading() {
        const loading = document.getElementById('loadingStateFixos');
        if (loading) loading.classList.add('hidden');
    }

    function showEmpty() {
        const empty = document.getElementById('emptyStateFixos');
        const table = document.getElementById('tableContainerFixos');
        
        if (empty) empty.classList.remove('hidden');
        if (table) table.classList.add('hidden');
    }

    function hideEmpty() {
        const empty = document.getElementById('emptyStateFixos');
        if (empty) empty.classList.add('hidden');
    }

    function showTable() {
        const table = document.getElementById('tableContainerFixos');
        if (table) table.classList.remove('hidden');
    }

    function formatCurrency(value) {
        const num = parseFloat(value) || 0;
        return num.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    function sanitizeHTML(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (typeof window.initializeGastosFixos === 'function') {
                window.initializeGastosFixos();
            }
        });
    } else {
        if (typeof window.initializeGastosFixos === 'function') {
            window.initializeGastosFixos();
        }
    }

})();