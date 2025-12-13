// ============================================================================
// TRANSACOES.JS - Página de Minhas Transações
// ============================================================================

(function() {
    'use strict';
    
// Função para voltar para subtemas (compatibilidade)
window.voltarParaSubtemas = function() {
    console.log('🔙 Voltando para subtemas...');
    window.location.href = '/subsistemas';
};

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================

let allTransactions = []; // Cache de todas as transações
let filteredTransactions = []; // Transações após aplicar filtros
let customCategories = []; // Categorias personalizadas do usuário

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

function initTransacoesPage() {
    try {
        console.log('🚀 Iniciando página de Transações...');
        
        // Verificar autenticação
        const isAuthenticated = checkAuthentication();
        if (!isAuthenticated) return;
        
        // Configurar nome do usuário no header (apenas se o elemento existir)
        const headerEl = document.getElementById('headerUserName');
        if (headerEl) {
            updateUserName();
        }
        
        // Carregar categorias personalizadas
        loadCustomCategories();
        
        // Carregar dados
        loadAllTransactions();
        
        // Configurar event listeners dos filtros
        setupFilterListeners();
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
    }
}

// Exportar para uso do SPA Router
window.initTransacoesPage = initTransacoesPage;

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================

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
        // Verificar se já foi pré-carregado
        const headerUserNameEl = document.getElementById('headerUserName');
        const headerAvatarEl = document.getElementById('headerAvatar');
        
        // Se os dados já foram carregados via script inline, não precisa atualizar
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
        
        // Atualizar nome no header (apenas se diferente)
        if (headerUserNameEl && headerUserNameEl.textContent !== userName) {
            headerUserNameEl.textContent = userName;
        }
        
        // Atualizar avatar (apenas se diferente)
        const userInitial = userName.charAt(0).toUpperCase();
        if (headerAvatarEl && headerAvatarEl.textContent !== userInitial) {
            headerAvatarEl.textContent = userInitial;
        }
        
        console.log('✅ Nome de usuário atualizado:', userName);
    } catch (error) {
        console.error('❌ Erro ao atualizar nome do usuário:', error);
    }
}

// ============================================================================
// CARREGAMENTO DE DADOS DA API
// ============================================================================

async function loadAllTransactions() {
    try {
        showLoading();
        
        console.log('📡 Buscando dados das APIs...');
        
        // Buscar dados das 3 APIs em paralelo
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
        
        // Normalizar e unificar os dados
        allTransactions = normalizeTransactions(gastosVariaveis, gastosFixos, salarios);
        
        console.log('✅ Total de transações normalizadas:', allTransactions.length);
        console.log('📋 Transações:', allTransactions);
        
        // Aplicar filtros e renderizar
        applyFilters();
        
    } catch (error) {
        console.error('❌ Erro ao carregar transações:', error);
        showError('Erro ao carregar transações. Por favor, tente novamente.');
    }
}

// ============================================================================
// NORMALIZAÇÃO DE DADOS
// ============================================================================

/**
 * Normaliza e unifica dados de diferentes endpoints
 * Retorna um array padronizado com todos os dados
 */
function normalizeTransactions(gastosVariaveis = [], gastosFixos = [], salarios = []) {
    const normalized = [];
    const userId = getUserId();
    
    // Normalizar Gastos Variáveis
    if (Array.isArray(gastosVariaveis)) {
        gastosVariaveis.forEach(gasto => {
            // Verificar se pertence ao usuário
            if (!recordBelongsToUser(gasto, userId)) return;
            
            // Determinar tipo baseado no campo 'tipo'
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
    
    // Normalizar Gastos Fixos
    if (Array.isArray(gastosFixos)) {
        gastosFixos.forEach(gasto => {
            // Verificar se pertence ao usuário
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
    
    // Normalizar Salários
    if (Array.isArray(salarios)) {
        salarios.forEach(salario => {
            // Verificar se pertence ao usuário
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

/**
 * Verifica se um registro pertence ao usuário atual
 */
function recordBelongsToUser(item, userId) {
    if (!userId || !item) return false;
    const candidates = [item.user_id, item.userId, item.usuario_id, item.usuarioId, item.user];
    return candidates.some(val => Number(val) === Number(userId));
}

/**
 * Obtém o ID do usuário logado
 */
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

/**
 * Normaliza o nome da categoria para exibição
 */
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
    
    // Verificar se é categoria personalizada
    const customCat = customCategories.find(cat => cat.slug === slug);
    if (customCat) {
        return customCat.nome;
    }
    
    return map[slug] || value || 'Outros';
}

/**
 * Normaliza o slug da categoria
 */
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

// ============================================================================
// FILTROS E ORDENAÇÃO
// ============================================================================

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
    
    // Filtro de busca por texto
    const searchText = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    if (searchText) {
        filtered = filtered.filter(t => 
            t.descricao.toLowerCase().includes(searchText) ||
            t.categoria.toLowerCase().includes(searchText)
        );
        console.log(`🔎 Após filtro de busca "${searchText}":`, filtered.length);
    }
    
    // Filtro por categoria
    const categoryValue = document.getElementById('categoryFilter')?.value || '';
    if (categoryValue) {
        filtered = filtered.filter(t => t.categoria_slug === categoryValue);
        console.log(`📁 Após filtro de categoria "${categoryValue}":`, filtered.length);
    }
    
    // Filtro por período
    const periodValue = document.getElementById('periodFilter')?.value || 'all';
    if (periodValue !== 'all') {
        filtered = filterByPeriod(filtered, periodValue);
        console.log(`📅 Após filtro de período "${periodValue}":`, filtered.length);
    }
    
    // Ordenação
    const sortValue = document.getElementById('sortOrder')?.value || 'recent';
    filtered = sortTransactions(filtered, sortValue);
    console.log(`🔀 Após ordenação "${sortValue}":`, filtered.length);
    
    // Atualizar lista filtrada e renderizar
    filteredTransactions = filtered;
    
    console.log('✅ Transações filtradas:', filteredTransactions.length);
    
    // Atualizar estatísticas
    updateStatistics(filteredTransactions);
    
    // Renderizar tabela
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

// ============================================================================
// RENDERIZAÇÃO DA TABELA
// ============================================================================

function renderTransactions(transactions) {
    console.log('🎨 Renderizando transações:', transactions?.length || 0);
    
    const tbody = document.getElementById('transactionsTableBody');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    
    console.log('📦 Elementos encontrados:', {
        tbody: !!tbody,
        tableContainer: !!tableContainer,
        emptyState: !!emptyState,
        loadingState: !!loadingState
    });
    
    if (!tbody) {
        console.error('❌ Elemento tbody não encontrado!');
        return;
    }
    
    // Esconder loading com transição
    if (loadingState) {
        loadingState.style.opacity = '0';
        setTimeout(() => loadingState.classList.add('hidden'), 300);
    }
    
    // Verificar se há transações
    if (!transactions || transactions.length === 0) {
        console.log('⚠️ Nenhuma transação para renderizar');
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
    
    console.log('✅ Renderizando', transactions.length, 'transações');
    
    // Mostrar tabela com transição
    if (tableContainer) {
        tableContainer.classList.remove('hidden');
        tableContainer.style.opacity = '1';
        tableContainer.style.display = 'block';
    }
    if (emptyState) {
        emptyState.style.opacity = '0';
        setTimeout(() => emptyState.classList.add('hidden'), 300);
    }
    
    // Limpar tbody
    tbody.innerHTML = '';
    
    console.log('🔧 Adicionando', transactions.length, 'linhas na tabela...');
    
    // Renderizar cada transação com delay escalonado
    transactions.forEach((transaction) => {
        const row = createTransactionRow(transaction);
        tbody.appendChild(row);
    });
    
    console.log('✅ Renderização concluída - tbody tem', tbody.children.length, 'linhas');
}

function createTransactionRow(transaction) {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-black/10 dark:border-white/10';
    
    // Formatar data
    const dataFormatada = formatDate(transaction.data);
    const dataLonga = formatDateLong(transaction.data);
    
    // Formatar valor
    const valorFormatado = formatCurrency(transaction.valor);
    
    // Classe de cor do valor seguindo padrão do dashboard
    const valorClass = transaction.tipo === 'receita' 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-red-600 dark:text-red-300';
    
    // Badge do tipo
    const badgeClass = transaction.tipo === 'receita'
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    
    const badgeText = transaction.tipo === 'receita' ? 'Receita' : 'Despesa';
    
    // Ícone
    const icon = getTransactionIcon(transaction);
    
    // Botões de ação (apenas para gastos variáveis)
    const actionButtons = transaction.canEdit || transaction.canDelete ? `
        <div class="flex items-center justify-center gap-2">
            ${transaction.canEdit ? `
                <button 
                    onclick="editTransaction(${transaction.id}, '${transaction.origem}')" 
                    class="text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                    title="Editar"
                >
                    <span class="material-symbols-outlined text-lg">edit</span>
                </button>
            ` : ''}
            ${transaction.canDelete ? `
                <button 
                    onclick="deleteTransaction(${transaction.id}, '${transaction.origem}')" 
                    class="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Excluir"
                >
                    <span class="material-symbols-outlined text-lg">delete</span>
                </button>
            ` : ''}
        </div>
    ` : '<span class="text-slate-400 dark:text-slate-500 text-xs">-</span>';
    
    tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center gap-3">
                <div class="bg-primary/10 dark:bg-primary/20 text-primary rounded-full size-10 flex items-center justify-center flex-shrink-0">
                    ${icon}
                </div>
                <div class="flex flex-col">
                    <div class="text-sm font-medium text-slate-900 dark:text-slate-100">${transaction.descricao}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">${dataLonga}</div>
                </div>
            </div>
        </td>
            <td class="px-6 py-3 whitespace-nowrap">
            <div class="text-sm text-slate-700 dark:text-slate-300">${transaction.categoria}</div>
        </td>
            <td class="px-6 py-3 whitespace-nowrap">
            <div class="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">&nbsp;</div>
        </td>
            <td class="px-6 py-3 whitespace-nowrap">
            <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}">
                ${badgeText}
            </span>
        </td>
            <td class="px-6 py-3 whitespace-nowrap text-right">
            <div class="text-sm font-bold ${valorClass}">${valorFormatado}</div>
        </td>
            <td class="px-6 py-3 whitespace-nowrap text-center">
            ${actionButtons}
        </td>
    `;
    
    return tr;
}

// ============================================================================
// ÍCONES DAS TRANSAÇÕES
// ============================================================================

function getTransactionIcon(transaction) {
    const tipo = transaction.tipo === 'receita' ? 'receita' : 'despesa';
    const cat = transaction.categoria_slug || '';
    
    const svg = {
        receita: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>`,
        despesa: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><line x1="8" y1="12" x2="16" y2="12" /></svg>`,
        mercado: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a1 1 0 0 0 1 .81h9.72a1 1 0 0 0 .98-.8l1.2-6H6" /></svg>`,
        transporte: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="7" rx="2" /><path d="M3 11l2-4h14l2 4" /><circle cx="7.5" cy="18.5" r="1" /><circle cx="16.5" cy="18.5" r="1" /></svg>`,
        moradia: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9.5 12 4l9 5.5V20a1 1 0 0 1-1 1h-5v-5H9v5H4a1 1 0 0 1-1-1Z" /></svg>`,
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

// ============================================================================
// AÇÕES (EDITAR/DELETAR)
// ============================================================================

window.editTransaction = function(id, origem) {
    console.log('✏️ Editar transação:', id, origem);

    if (origem !== 'variavel') {
        alert('Apenas gastos variáveis podem ser editados.');
        return;
    }

    const tx = allTransactions.find(t => Number(t.id) === Number(id) && t.origem === origem);
    if (!tx) {
        alert('Transação não encontrada.');
        return;
    }

    const base = tx.rawData || {};
    const payload = {
        ...base,
        id: base.id || tx.id,
        nome: base.nome || base.descricao || tx.descricao,
        descricao: base.descricao || base.nome || tx.descricao,
        valor: base.valor != null ? base.valor : tx.valor,
        categoria_slug: normalizeCategorySlug(base.categoria_slug || base.categoria || tx.categoria_slug),
        categoria: base.categoria || tx.categoria,
        data_gasto: base.data_gasto || base.data || tx.data,
        tipo: base.tipo || (tx.tipo === 'receita' ? 'entrada' : 'saida')
    };

    if (window.expenseModal?.openExpenseModalForEdit) {
        window.expenseModal.openExpenseModalForEdit(payload);
    } else if (typeof openExpenseModalForEdit === 'function') {
        openExpenseModalForEdit(payload);
    } else if (typeof openExpenseModal === 'function') {
        openExpenseModal();
    }
};

window.deleteTransaction = async function(id, origem) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
        return;
    }
    
    try {
        console.log('🗑️ Deletando transação:', id, origem);
        
        if (origem === 'variavel') {
            await apiService.deleteGastoVariavel(id);
        } else {
            alert('Apenas gastos variáveis podem ser deletados.');
            return;
        }
        
        // Recarregar dados
        await loadAllTransactions();
        
        console.log('✅ Transação deletada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao deletar transação:', error);
        alert('Erro ao deletar transação: ' + error.message);
    }
};

// Expor recarregador para o modal global reutilizar
window.refreshTransactions = function() {
    return loadAllTransactions();
};

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

function updateStatistics(transactions) {
    // Filtrar apenas despesas
    const despesas = transactions.filter(t => t.tipo === 'despesa');
    
    // 1. Total de Despesas
    const totalDespesas = despesas.reduce((sum, t) => sum + t.valor, 0);
    const totalDespesasEl = document.getElementById('totalDespesas');
    if (totalDespesasEl) {
        totalDespesasEl.textContent = formatCurrency(totalDespesas);
    }
    
    // 2. Categoria Mais Gasta
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
    
    // 3. Média de Gasto Mensal
    const mediaMensal = calculateMonthlyAverage(despesas);
    const mediaMensalEl = document.getElementById('mediaMensal');
    if (mediaMensalEl) {
        mediaMensalEl.textContent = formatCurrency(mediaMensal);
    }
}

function calculateMonthlyAverage(despesas) {
    if (despesas.length === 0) return 0;
    
    // Agrupar despesas por mês/ano
    const mesesMap = {};
    
    despesas.forEach(d => {
        const date = new Date(d.data);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!mesesMap[monthKey]) {
            mesesMap[monthKey] = 0;
        }
        mesesMap[monthKey] += d.valor;
    });
    
    // Calcular média
    const totaisMensais = Object.values(mesesMap);
    const soma = totaisMensais.reduce((sum, val) => sum + val, 0);
    const media = totaisMensais.length > 0 ? soma / totaisMensais.length : 0;
    
    return media;
}

// ============================================================================
// BOTÕES DE AÇÃO
// GERENCIAMENTO DE CATEGORIAS PERSONALIZADAS
// ============================================================================

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
    
    // Remover categorias personalizadas antigas (se houver)
    const options = categoryFilter.querySelectorAll('option[data-custom="true"]');
    options.forEach(opt => opt.remove());
    
    // Adicionar categorias personalizadas antes da opção "Adicionar Nova"
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

    // Garantir que "Outros" fique por último
    const outrosOpt = categoryFilter.querySelector('option[value="outros"]');
    if (outrosOpt) {
        categoryFilter.appendChild(outrosOpt);
    }
}
// Exportar para que o modal global de categorias consiga sincronizar o filtro local
window.syncCustomCategories = function(list) {
    customCategories = Array.isArray(list) ? list : [];
    updateCategoryFilterOptions();
};
window.reloadCustomCategoriesFromStorage = function() {
    loadCustomCategories();
};

// ============================================================================
// ============================================================================

window.openAddExpenseModal = function() {
    console.log('🔵 Abrindo modal de adicionar despesa (fixo)');
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
    console.log('🔵 Abrindo extrato completo...');
    // Mantém navegação via SPA para o extrato
    if (window.SPARouter) {
        window.SPARouter.navigateTo('dashboard');
    } else {
        window.location.href = '/app.html#dashboard';
    }
};

// ============================================================================
// HELPERS DE FORMATAÇÃO
// ============================================================================

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

// ============================================================================
// FEEDBACK VISUAL
// ============================================================================

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

})(); // Fim da IIFE


console.log('✅ Script de Transações carregado com sucesso!');
