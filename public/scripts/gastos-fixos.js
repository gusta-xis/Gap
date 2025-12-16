/**
 * Gerenciador de Gastos Fixos
 * Permite listar, criar, editar e excluir gastos fixos mensais
 */

(function() {
    'use strict';

    let gastosFixosData = [];

    // ===================================
    // INICIALIZAÇÃO
    // ===================================

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
    
    // Função de limpeza para SPA Router
    window.cleanupGastosFixos = function() {
        console.log('🧹 Limpando dados de gastos fixos...');
        gastosFixosData = [];
    };

    // ===================================
    // AUTENTICAÇÃO
    // ===================================

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

    // ===================================
    // EVENT LISTENERS
    // ===================================

    function setupEventListeners() {
        // Botões de adicionar - usar modal global
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

    // ===================================
    // CARREGAR DADOS
    // ===================================

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

    // ===================================
    // RENDERIZAÇÃO
    // ===================================

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
                <div class="flex items-center justify-center gap-2">
                    <button 
                        onclick="editGasto(${gasto.id})"
                        class="p-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <span class="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button 
                        onclick="deleteGasto(${gasto.id}, '${nome}')"
                        class="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Excluir"
                    >
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </td>
        `;
        
        return tr;
    }

    // ===================================
    // ESTATÍSTICAS
    // ===================================

    function updateStatistics() {
        try {
            console.log('📊 Atualizando estatísticas...');
            // Total de gastos fixos
            const total = gastosFixosData.reduce((sum, gasto) => sum + parseFloat(gasto.valor || 0), 0);
            const totalEl = document.getElementById('totalGastosFixos');
            if (totalEl) {
                totalEl.textContent = formatCurrency(total);
            } else {
                console.warn('⚠️ Elemento totalGastosFixos não encontrado');
            }
            
            // Quantidade
            const quantidadeEl = document.getElementById('quantidadeGastos');
            if (quantidadeEl) {
                quantidadeEl.textContent = gastosFixosData.length;
            } else {
                console.warn('⚠️ Elemento quantidadeGastos não encontrado');
            }
            
            // Próximo vencimento
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
                // Buscar o primeiro vencimento do próximo mês
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

    // ===================================
    // CRUD OPERATIONS
    // ===================================

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
            // Atualize a lista de gastos fixos ou recarregue a página
            if (window.initializeGastosFixos) window.initializeGastosFixos();
            if (window.loadAllTransactions) window.loadAllTransactions();
        } catch (e) {
            alert('Erro ao excluir gasto fixo: ' + e.message);
        }
    }
    window.deleteGasto = deleteGasto;

    // ===================================
    // UI HELPERS
    // ===================================

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

    // ===================================
    // UTILITÁRIOS
    // ===================================

    function formatCurrency(value) {
        const num = parseFloat(value) || 0;
        return num.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    function formatCurrencyForInput(value) {
        const num = parseFloat(value) || 0;
        return num.toFixed(2).replace('.', ',');
    }

    function parseCurrencyValue(value) {
        if (!value) return 0;
        const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
    }

    function formatCurrencyInput(e) {
        let value = e.target.value;
        
        // Remove tudo exceto números e vírgula
        value = value.replace(/[^\d,]/g, '');
        
        // Garante apenas uma vírgula
        const parts = value.split(',');
        if (parts.length > 2) {
            value = parts[0] + ',' + parts.slice(1).join('');
        }
        
        // Limita a 2 casas decimais
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + ',' + parts[1].substring(0, 2);
        }
        
        e.target.value = value;
    }

    function sanitizeHTML(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showSuccess(message) {
        console.log('✅ ' + message);
        // Aqui você pode adicionar uma notificação visual se necessário
    }

    function showError(message) {
        console.error('❌ ' + message);
        // Aqui você pode adicionar uma notificação visual de erro se necessário
    }

    // Função auto-executável para verificar o carregamento
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Verifica se a função existe antes de chamar
            if (typeof window.initializeGastosFixos === 'function') {
                window.initializeGastosFixos();
            }
        });
    } else {
        // Verifica se a função existe antes de chamar
        if (typeof window.initializeGastosFixos === 'function') {
            window.initializeGastosFixos();
        }
    }

})(); // Fecha o IIFE