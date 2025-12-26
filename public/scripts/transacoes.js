(function() {
    'use strict';

window.voltarParaSubtemas = function() {
    console.log('🔙 Voltando para subtemas...');
    window.location.href = '/subsistemas';
};

let allTransactions = [];
let filteredTransactions = [];
let customCategories = [];

function initTransacoesPage() {
    try {
        console.log('🚀 Iniciando página de Transações...');
        
        const isAuthenticated = checkAuthentication();
        if (!isAuthenticated) return;

        const headerEl = document.getElementById('headerUserName');
        if (headerEl) {
            updateUserName();
        }

        loadCustomCategories();
        loadAllTransactions();
        setupFilterListeners();
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
    }
}

window.initTransacoesPage = initTransacoesPage;

function checkAuthentication() {
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
    const user = sessionStorage.getItem('user') || localStorage.getItem('user');
    
    const redirectToLogin = () => {
        try {
            sessionStorage.clear();
            localStorage.clear();
        } catch (e) { }
        window.location.replace('/');
    };
    
    if (!token || !user) {
        console.warn('⚠️ Usuário não autenticado. Redirecionando para login.');
        redirectToLogin();
        return false;
    }

    try {
        JSON.parse(user);
    } catch (e) {
        console.warn('⚠️ Dados de usuário corrompidos. Limpando sessão.');
        redirectToLogin();
        return false;
    }
    
    return true;
}

function updateUserName() {
    try {
        const headerUserNameEl = document.getElementById('headerUserName');
        const headerAvatarEl = document.getElementById('headerAvatar');

        if (window.__preloadedUserName && headerUserNameEl?.textContent === window.__preloadedUserName) {
            console.log('✅ Nome de usuário já carregado via preload');
            return;
        }
        
        const userDataString = sessionStorage.getItem('user') || localStorage.getItem('user');
        
        if (!userDataString) {
            console.warn('⚠️ Nenhum dado de usuário encontrado');
            return;
        }

        const userData = JSON.parse(userDataString);
        const userName = userData.nome || userData.name || 'Usuário';
        
        if (headerUserNameEl && headerUserNameEl.textContent !== userName) {
            headerUserNameEl.textContent = userName;
        }

        const userInitial = userName.charAt(0).toUpperCase();
        if (headerAvatarEl && headerAvatarEl.textContent !== userInitial) {
            headerAvatarEl.textContent = userInitial;
        }
        
        console.log('✅ Nome de usuário atualizado:', userName);
    } catch (error) {
        console.error('❌ Erro ao atualizar nome do usuário:', error);
    }
}

async function loadAllTransactions() {
    try {
        showLoading();
        
        console.log('📡 Buscando dados das APIs...');
        
        const [gastosVariaveis, gastosFixos, salarios] = await Promise.all([
            apiService.getGastosVariaveis().catch(err => {
                console.warn('⚠️ Erro ao buscar gastos variáveis:', err.message);
                return [];
            }),
            apiService.getGastosFixos().catch(err => {
                console.warn('⚠️ Erro ao buscar gastos fixos:', err.message);
                return [];
            }),
            apiService.getSalarios().catch(err => {
                console.warn('⚠️ Erro ao buscar salários:', err.message);
                return [];
            })
        ]);
        
        console.log('✅ Dados recebidos:', {
            gastosVariaveis: gastosVariaveis?.length || 0,
            gastosFixos: gastosFixos?.length || 0,
            salarios: salarios?.length || 0
        });
        
        allTransactions = normalizeTransactions(gastosVariaveis, gastosFixos, salarios);
        
        console.log('✅ Total de transações normalizadas:', allTransactions.length);
        console.log('📋 Transações:', allTransactions);
        
        applyFilters();
        
    } catch (error) {
        console.error('❌ Erro ao carregar transações:', error);
        showError('Erro ao carregar transações. Por favor, tente novamente.');
    }
}

function normalizeTransactions(gastosVariaveis = [], gastosFixos = [], salarios = []) {
    const normalized = [];
    const userId = getUserId();
    
    if (Array.isArray(gastosVariaveis)) {
        gastosVariaveis.forEach(gasto => {
            if (!recordBelongsToUser(gasto, userId)) return;

            const tipo = gasto.tipo === 'entrada' ? 'receita' : 'despesa';
            
            normalized.push({
                id: gasto.id || gasto.gasto_id,
                descricao: gasto.descricao || gasto.nome || 'Sem descrição',
                valor: parseFloat(gasto.valor || 0),
                data: gasto.data || gasto.data_lancamento || new Date().toISOString(),
                tipo: tipo,
                categoria: normalizeCategoryName(gasto.categoria_slug || gasto.categoria || 'outros'),
                categoria_slug: normalizeCategorySlug(gasto.categoria_slug || gasto.categoria || 'outros'),
                origem: 'variavel',
                canEdit: true,
                canDelete: true,
                rawData: gasto
            });
        });
    }
    
    if (Array.isArray(gastosFixos)) {
        gastosFixos.forEach(gasto => {
            if (!recordBelongsToUser(gasto, userId)) return;
            
            normalized.push({
                id: gasto.id || gasto.gasto_id,
                descricao: gasto.descricao || gasto.nome || 'Gasto Fixo',
                valor: parseFloat(gasto.valor || 0),
                data: gasto.data || gasto.data_vencimento || new Date().toISOString(),
                tipo: 'despesa',
                categoria: normalizeCategoryName(gasto.categoria_slug || gasto.categoria || 'fixo'),
                categoria_slug: normalizeCategorySlug(gasto.categoria_slug || gasto.categoria || 'fixo'),
                origem: 'fixo',
                canEdit: false,
                canDelete: false,
                rawData: gasto
            });
        });
    }
    
    if (Array.isArray(salarios)) {
        salarios.forEach(salario => {
            if (!recordBelongsToUser(salario, userId)) return;
            
            normalized.push({
                id: salario.id || salario.salario_id,
                descricao: salario.descricao || salario.fonte || 'Salário',
                valor: parseFloat(salario.valor || 0),
                data: salario.data || salario.data_recebimento || new Date().toISOString(),
                tipo: 'receita',
                categoria: 'Salário',
                categoria_slug: 'salario',
                origem: 'salario',
                canEdit: false,
                canDelete: false,
                rawData: salario
            });
        });
    }
    
    return normalized;
}

function recordBelongsToUser(item, userId) {
    if (!userId || !item) return false;
    const candidates = [item.user_id, item.userId, item.usuario_id, item.usuarioId, item.user];
    return candidates.some(val => Number(val) === Number(userId));
}

function getUserId() {
    try {
        const userDataString = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (!userDataString) return null;
        
        const userData = JSON.parse(userDataString);
        return userData.id || userData.user_id || userData.userId || null;
    } catch (error) {
        console.error('❌ Erro ao obter ID do usuário:', error);
        return null;
    }
}

function normalizeCategoryName(value) {
    const map = {
        'alimentacao': 'Alimentação',
        'transporte': 'Transporte',
        'saude': 'Saúde',
        'educacao': 'Educação',
        'entretenimento': 'Entretenimento',
        'moradia': 'Moradia',
        'salario': 'Salário',
        'fixo': 'Fixo',
        'outros': 'Outros'
    };
    
    const slug = normalizeCategorySlug(value);
    
    const customCat = customCategories.find(cat => cat.slug === slug);
    if (customCat) {
        return customCat.nome;
    }
    
    return map[slug] || value || 'Outros';
}

function normalizeCategorySlug(value) {
    const v = (value || '').toString().trim().toLowerCase();
    if (!v) return 'outros';
    
    if (v.includes('aliment') || v.includes('merc') || v.includes('comida')) return 'alimentacao';
    if (v.includes('transp') || v.includes('carro') || v.includes('uber')) return 'transporte';
    if (v.includes('saud') || v.includes('medic')) return 'saude';
    if (v.includes('educ') || v.includes('escola') || v.includes('curso')) return 'educacao';
    if (v.includes('entreten') || v.includes('lazer') || v.includes('cinema')) return 'entretenimento';
    if (v.includes('morad') || v.includes('casa') || v.includes('aluguel')) return 'moradia';
    if (v.includes('salar')) return 'salario';
    if (v.includes('fixo')) return 'fixo';
    
    return v.replace(/\s+/g, '-');
}

function setupFilterListeners() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const periodFilter = document.getElementById('periodFilter');
    const sortOrder = document.getElementById('sortOrder');
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (periodFilter) periodFilter.addEventListener('change', applyFilters);
    if (sortOrder) sortOrder.addEventListener('change', applyFilters);
}

function applyFilters() {
    console.log('🔍 Aplicando filtros...');
    console.log('📊 Total de transações antes do filtro:', allTransactions.length);
    
    let filtered = [...allTransactions];
    
    const searchText = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    if (searchText) {
        filtered = filtered.filter(t => 
            t.descricao.toLowerCase().includes(searchText) ||
            t.categoria.toLowerCase().includes(searchText)
        );
        console.log(`🔎 Após filtro de busca "${searchText}":`, filtered.length);
    }
    
    const categoryValue = document.getElementById('categoryFilter')?.value || '';
    if (categoryValue) {
        filtered = filtered.filter(t => t.categoria_slug === categoryValue);
        console.log(`📁 Após filtro de categoria "${categoryValue}":`, filtered.length);
    }
    
    const periodValue = document.getElementById('periodFilter')?.value || 'all';
    if (periodValue !== 'all') {
        filtered = filterByPeriod(filtered, periodValue);
        console.log(`📅 Após filtro de período "${periodValue}":`, filtered.length);
    }
    
    const sortValue = document.getElementById('sortOrder')?.value || 'recent';
    filtered = sortTransactions(filtered, sortValue);
    console.log(`🔀 Após ordenação "${sortValue}":`, filtered.length);
    
    filteredTransactions = filtered;
    
    console.log('✅ Transações filtradas:', filteredTransactions.length);
    
    updateStatistics(filteredTransactions);
    renderTransactions(filteredTransactions);
}

function filterByPeriod(transactions, period) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.filter(t => {
        const transactionDate = new Date(t.data);
        const transactionMonth = transactionDate.getMonth();
        const transactionYear = transactionDate.getFullYear();
        
        switch(period) {
            case 'current-month':
                return transactionMonth === currentMonth && transactionYear === currentYear;
            
            case 'last-month':
                const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                return transactionMonth === lastMonth && transactionYear === lastMonthYear;
            
            case 'current-year':
                return transactionYear === currentYear;
            
            default:
                return true;
        }
    });
}

function sortTransactions(transactions, sortType) {
    const sorted = [...transactions];
    
    switch(sortType) {
        case 'recent':
            return sorted.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        case 'oldest':
            return sorted.sort((a, b) => new Date(a.data) - new Date(b.data));
        
        case 'highest':
            return sorted.sort((a, b) => b.valor - a.valor);
        
        case 'lowest':
            return sorted.sort((a, b) => a.valor - b.valor);
        
        default:
            return sorted;
    }
}

function renderTransactions(transactions) {
    console.log('🎨 Renderizando transações:', transactions?.length || 0);
    
    const tbody = document.getElementById('transactionsTableBody');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    
    if (!tbody) return;
    
    if (loadingState) {
        loadingState.style.opacity = '0';
        setTimeout(() => loadingState.classList.add('hidden'), 300);
    }

    if (!transactions || transactions.length === 0) {
        if (tableContainer) {
            tableContainer.style.opacity = '0';
            setTimeout(() => tableContainer.classList.add('hidden'), 300);
        }
        if (emptyState) {
            emptyState.classList.remove('hidden');
            setTimeout(() => emptyState.style.opacity = '1', 10);
        }
        return;
    }
    
    if (tableContainer) {
        tableContainer.classList.remove('hidden');
        tableContainer.style.opacity = '1';
        tableContainer.style.display = 'block';
    }
    if (emptyState) {
        emptyState.style.opacity = '0';
        setTimeout(() => emptyState.classList.add('hidden'), 300);
    }
    
    tbody.innerHTML = '';
    transactions.forEach((transaction) => {
        const row = createTransactionRow(transaction);
        tbody.appendChild(row);
    });
}

function createTransactionRow(transaction) {
    const div = document.createElement('div');
    const borderClass = 'border-b border-black/10 dark:border-white/10';

    const dataFormatada = formatDateLong(transaction.data);
    const icon = getTransactionIcon(transaction);
    const isReceita = transaction.tipo === 'receita';
    const valorAbsoluto = formatCurrency(Math.abs(transaction.valor));
    const valorFormatado = isReceita 
        ? `<span class="mr-1">+</span>${valorAbsoluto}`
        : `<span class="mr-1">-</span>${valorAbsoluto}`;
    const valorClass = isReceita
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-300';

    const tipoLabel = isReceita ? 'Receita' : 'Despesa';
    const tipoClass = isReceita 
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';

    let actions = '';
    // (Código dos botões actions mantido igual...)
    if (transaction.origem === 'fixo') {
        const gastoData = JSON.stringify({
            id: transaction.id,
            nome: transaction.descricao,
            valor: transaction.valor,
            categoria_slug: transaction.categoria_slug,
            dia_vencimento: transaction.rawData?.dia_vencimento || 1
        }).replace(/"/g, '&quot;');
        
        actions = `
          <button onclick='window.editGastoFixoFromTransaction(${gastoData})' class="text-slate-500 hover:text-primary btn-positive rounded-lg transition-colors" aria-label="Editar">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
          </button>
          <button onclick='window.deleteGastoFixoFromTransaction(${transaction.id}, "${transaction.descricao.replace(/'/g, "\\'")}")' class="text-slate-500 hover:text-red-600 btn-negative rounded-lg transition-colors" aria-label="Excluir">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
          </button>
        `;
    } else if (transaction.origem === 'variavel') {
        const expenseData = JSON.stringify({
            id: transaction.id,
            nome: transaction.descricao,
            descricao: transaction.descricao,
            valor: transaction.valor,
            categoria_slug: transaction.categoria_slug,
            categoria: transaction.categoria,
            data_gasto: transaction.data,
            data: transaction.data,
            tipo: transaction.tipo === 'receita' ? 'entrada' : 'saida'
        }).replace(/"/g, '&quot;');
        
        actions = `
          <button onclick='window.editExpenseFromTransaction(${expenseData})' class="text-slate-500 hover:text-primary transition-colors" aria-label="Editar">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
          </button>
          <button onclick='window.deleteExpenseFromTransaction(${transaction.id}, "${transaction.descricao.replace(/'/g, "\\'")}")' class="text-slate-500 hover:text-red-500 transition-colors" aria-label="Excluir">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
          </button>
        `;
    }

    // ALTERAÇÃO DE RESPONSIVIDADE AQUI:
    // Adicionado min-w-[800px] para alinhar com o cabeçalho que permite scroll horizontal
    // Ajustado padding para px-4 sm:px-6
    div.className = `transaction-row min-w-[800px] grid grid-cols-[64px_2fr_1.5fr_2fr_1.2fr_1fr_72px] items-center px-4 sm:px-6 py-4 ${borderClass}`;
    div.innerHTML = `
        <div class="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
            ${icon}
        </div>
        <div class="flex flex-col justify-center overflow-hidden">
            <p class="text-slate-800 dark:text-slate-200 font-medium truncate">${transaction.descricao}</p>
            <p class="text-slate-500 dark:text-slate-400 text-sm md:hidden truncate">${dataFormatada}</p>
        </div>
        <div class="flex items-center overflow-hidden">
            <p class="text-slate-500 dark:text-slate-400 text-sm truncate">${transaction.categoria}</p>
        </div>
        <div class="flex items-center">
            <p class="text-slate-500 dark:text-slate-400 text-sm">${dataFormatada}</p>
        </div>
        <div class="flex items-center">
            <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tipoClass}">
                ${tipoLabel}
            </span>
        </div>
        <div class="flex items-center justify-end">
            <div class="${valorClass} font-bold whitespace-nowrap">${valorFormatado}</div>
        </div>
        <div class="flex items-center justify-end gap-3">
            ${actions}
        </div>
    `;

    return div;
}

function getTransactionIcon(transaction) {
    const tipo = transaction.tipo === 'receita' ? 'receita' : 'despesa';
    const cat = transaction.categoria_slug || '';
    
    const svg = {
        receita: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>`,
        despesa: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><line x1="8" y1="12" x2="16" y2="12" /></svg>`,
        mercado: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a1 1 0 0 0 1 .81h9.72a1 1 0 0 0 .98-.8l1.2-6H6" /></svg>`,
        transporte: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="7" rx="2" /><path d="M3 11l2-4h14l2 4" /><circle cx="7.5" cy="18.5" r="1" /><circle cx="16.5" cy="18.5" r="1" /></svg>`,
        moradia: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9.5 12 4l9 5.5V20a1 1 0 0 1-1 1h-5v-5H9v5H4a1 1 0 0 1-1-1V6" /></svg>`,
        saude: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" /></svg>`,
        educacao: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10L12 4 2 10l10 6 10-6Z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>`,
        entretenimento: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 5v14" /><path d="M17 5v14" /></svg>`,
        default: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9 12h6" /><path d="M12 9v6" /></svg>`
    };
    
    if (cat.includes('aliment') || cat.includes('merc')) return svg.mercado;
    if (cat.includes('transp')) return svg.transporte;
    if (cat.includes('morad')) return svg.moradia;
    if (cat.includes('saud')) return svg.saude;
    if (cat.includes('educ')) return svg.educacao;
    if (cat.includes('entreten')) return svg.entretenimento;
    
    return tipo === 'receita' ? svg.receita : svg.despesa;
}

window.editExpenseFromTransaction = function(expenseData) {
    if (typeof window.openExpenseModalForEdit === 'function') {
        window.openExpenseModalForEdit(expenseData);
    }
};

window.deleteExpenseFromTransaction = async function(id, descricao) {
    if (!confirm(`Tem certeza que deseja excluir "${descricao}"?`)) return;
    try {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
        const response = await fetch(`/api/v1/gastos-variaveis/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Erro ao deletar despesa');
        await loadAllTransactions();
        if (typeof window.loadDashboardData === 'function') window.loadDashboardData();
    } catch (error) {
        alert('Erro ao deletar despesa: ' + error.message);
    }
};

window.editGastoFixoFromTransaction = function(gastoData) {
    if (typeof window.openGastoFixoModal === 'function') {
        window.openGastoFixoModal(gastoData.id);
    }
};

window.deleteGastoFixoFromTransaction = async function(id, descricao) {
    if (!confirm(`Tem certeza que deseja excluir "${descricao}"?`)) return;
    try {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
        const response = await fetch(`/api/v1/gastos-fixos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Erro ao deletar gasto fixo');
        await loadAllTransactions();
        if (typeof window.initializeGastosFixos === 'function') window.initializeGastosFixos();
        if (typeof window.loadDashboardData === 'function') window.loadDashboardData();
    } catch (error) {
        alert('Erro ao deletar gasto fixo: ' + error.message);
    }
};

window.refreshTransactions = function() {
    return loadAllTransactions();
};

function updateStatistics(transactions) {
    const despesas = transactions.filter(t => t.tipo === 'despesa');
    
    const totalDespesas = despesas.reduce((sum, t) => sum + t.valor, 0);
    const totalDespesasEl = document.getElementById('totalDespesas');
    if (totalDespesasEl) {
        totalDespesasEl.textContent = formatCurrency(totalDespesas);
    }
    
    const categorias = {};
    despesas.forEach(d => {
        const cat = d.categoria || 'Outros';
        if (!categorias[cat]) {
            categorias[cat] = { nome: cat, total: 0 };
        }
        categorias[cat].total += d.valor;
    });
    
    const categoriasArray = Object.values(categorias);
    const topCategoria = categoriasArray.sort((a, b) => b.total - a.total)[0];
    
    const topCategoriaEl = document.getElementById('topCategoria');
    const topCategoriaValorEl = document.getElementById('topCategoriaValor');
    
    if (topCategoriaEl && topCategoriaValorEl) {
        if (topCategoria) {
            topCategoriaEl.textContent = topCategoria.nome;
            topCategoriaValorEl.textContent = formatCurrency(topCategoria.total);
        } else {
            topCategoriaEl.textContent = '-';
            topCategoriaValorEl.textContent = 'R$ 0,00';
        }
    }
    
    const mediaMensal = calculateMonthlyAverage(despesas);
    const mediaMensalEl = document.getElementById('mediaMensal');
    if (mediaMensalEl) {
        mediaMensalEl.textContent = formatCurrency(mediaMensal);
    }
}

function calculateMonthlyAverage(despesas) {
    if (despesas.length === 0) return 0;
    const mesesMap = {};
    despesas.forEach(d => {
        const date = new Date(d.data);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!mesesMap[monthKey]) mesesMap[monthKey] = 0;
        mesesMap[monthKey] += d.valor;
    });
    const totaisMensais = Object.values(mesesMap);
    const soma = totaisMensais.reduce((sum, val) => sum + val, 0);
    return totaisMensais.length > 0 ? soma / totaisMensais.length : 0;
}

function loadCustomCategories() {
    try {
        const userId = getUserId();
        if (!userId) return;
        const stored = localStorage.getItem(`customCategories_${userId}`);
        if (stored) {
            customCategories = JSON.parse(stored);
            updateCategoryFilterOptions();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar categorias personalizadas:', error);
    }
}

function updateCategoryFilterOptions() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    const options = categoryFilter.querySelectorAll('option[data-custom="true"]');
    options.forEach(opt => opt.remove());
    
    const addNewOption = categoryFilter.querySelector('option[value="__add_new__"]');
    
    customCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.slug;
        option.textContent = cat.nome;
        option.setAttribute('data-custom', 'true');
        if (addNewOption) {
            categoryFilter.insertBefore(option, addNewOption);
        } else {
            categoryFilter.appendChild(option);
        }
    });

    const outrosOpt = categoryFilter.querySelector('option[value="outros"]');
    if (outrosOpt) {
        categoryFilter.appendChild(outrosOpt);
    }
}

window.syncCustomCategories = function(list) {
    customCategories = Array.isArray(list) ? list : [];
    updateCategoryFilterOptions();
};

window.reloadCustomCategoriesFromStorage = function() {
    loadCustomCategories();
};

window.openAddExpenseModal = function() {
    if (typeof openExpenseModal === 'function') {
        openExpenseModal();
    } else {
        const modal = document.getElementById('addExpenseModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }
};

window.viewStatement = function() {
    if (window.SPARouter) {
        window.SPARouter.navigateTo('dashboard');
    } else {
        window.location.href = '/app.html#dashboard';
    }
};

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (error) {
        return 'Data inválida';
    }
}

function formatDateLong(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (error) {
        return formatDate(dateString);
    }
}

function formatCurrency(value) {
    try {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(num);
    } catch (error) {
        return 'R$ 0,00';
    }
}

function showLoading() {
    const loadingState = document.getElementById('loadingState');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    if (loadingState) {
        loadingState.classList.remove('hidden');
        loadingState.style.opacity = '1';
    }
    if (tableContainer) {
        tableContainer.style.opacity = '0';
        setTimeout(() => tableContainer.classList.add('hidden'), 300);
    }
    if (emptyState) {
        emptyState.style.opacity = '0';
        setTimeout(() => emptyState.classList.add('hidden'), 300);
    }
}

function showError(message) {
    const loadingState = document.getElementById('loadingState');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (loadingState) loadingState.classList.add('hidden');
    if (tableContainer) tableContainer.classList.add('hidden');
    if (emptyState) {
        emptyState.classList.remove('hidden');
        const errorText = emptyState.querySelector('p');
        if (errorText) errorText.textContent = message;
    }
}

})();

console.log('✅ Script de Transações carregado com sucesso!');

if (window.initTransacoesPage) window.initTransacoesPage();