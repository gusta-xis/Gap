// Dashboard JavaScript - Lógica da aplicação

// ========================================================
// FUNÇÃO GLOBAL PARA VOLTAR A SUBTEMAS
// ========================================================
window.voltarParaSubtemas = function() {
    console.log('🔙 Voltando para subtemas...');
    window.location.href = '/subsistemas';
};

// Esconde o corpo até confirmar autenticação (evita exibir tela para demo/sem login)
if (document && document.body) {
    document.body.style.display = 'none';
}

// Tratamento de erros global
window.addEventListener('error', function(e) {
    console.error('Erro global capturado:', e.error);
    return true; // Previne que o erro quebre a aplicação
});

// Debug: verificar se há reload sendo chamado
window.addEventListener('beforeunload', function(e) {
    console.log('Página está sendo recarregada!');
});

// Debug: verificar mudanças no localStorage
window.addEventListener('storage', function(e) {
    console.log('Storage mudou:', e.key, e.oldValue, e.newValue);
});

// Estado global do dashboard
let dashboardData = {
    salario: 0,
    gastosFixos: [],
    gastosVariaveis: [],
    totalReceitas: 0,
    totalDespesas: 0,
    saldoAtual: 0,
    historicoMensal: [] // Array com dados dos últimos 6 meses
};

function recordBelongsToUser(item, userId) {
    if (!userId || !item) return false;
    const candidates = [item.user_id, item.userId, item.usuario_id, item.usuarioId, item.user];
    return candidates.some(val => Number(val) === Number(userId));
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('Iniciando dashboard...');
        const isAuthenticated = checkAuthentication();
        if (!isAuthenticated) return;
        // Autenticado: libera a renderização
        document.body.style.display = '';
        initializeDashboard();
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
});

/**
 * Verifica se o usuário está autenticado
 * ⚠️ SEGURANÇA: Usa sessionStorage em vez de localStorage
 */
function checkAuthentication() {
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
    const user = sessionStorage.getItem('user') || localStorage.getItem('user');
    const redirectToLogin = () => {
        try {
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('refreshToken');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('userName');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userName');
        } catch (e) { /* ignore */ }
        window.location.replace('/');
    };
    
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

/**
 * Inicializa o dashboard
 */
async function initializeDashboard() {
    setupMobileMenu();
    setupButtons();
    updateUserName(); // Atualizar nome imediatamente
    await loadDashboardData();
}

/**
 * Atualiza o nome do usuário na interface
 * ⚠️ SEGURANÇA: Usa sessionStorage
 */
function updateUserName() {
    console.log('🔵 updateUserName foi chamado');
    try {
        const userDataString = sessionStorage.getItem('user') || localStorage.getItem('user');
        console.log('🔵 userDataString:', userDataString);
        
        if (!userDataString) {
            console.warn('Dados do usuário não encontrados no localStorage');
            return;
        }
        
        const userData = JSON.parse(userDataString);
        console.log('🔵 userData parseado:', userData);
        
        if (userData && userData.nome) {
            // Atualizar saudação (apenas primeiro nome)
            const greetingElement = document.querySelector('[data-user-greeting]');
            if (greetingElement) {
                const primeiroNome = userData.nome.split(' ')[0];
                greetingElement.textContent = `Olá, ${primeiroNome}!`;
                console.log('Nome atualizado na saudação:', primeiroNome);
            } else {
                console.warn('Elemento [data-user-greeting] não encontrado');
            }
            
            // Atualizar nome completo no header
            console.log('🔵 Procurando elemento headerUserName...');
            const headerUserName = document.getElementById('headerUserName');
            console.log('🔵 headerUserName encontrado:', !!headerUserName);
            if (headerUserName) {
                headerUserName.textContent = userData.nome;
                console.log('✅ Nome atualizado no header:', userData.nome);
            } else {
                console.warn('❌ Elemento headerUserName não encontrado');
            }
            
            // Atualizar avatar com inicial do nome
            console.log('🔵 Procurando elemento headerAvatar...');
            const headerAvatar = document.getElementById('headerAvatar');
            console.log('🔵 headerAvatar encontrado:', !!headerAvatar);
            if (headerAvatar) {
                const inicial = userData.nome.charAt(0).toUpperCase();
                headerAvatar.textContent = inicial;
                console.log('✅ Avatar atualizado com inicial:', inicial);
            } else {
                console.warn('❌ Elemento headerAvatar não encontrado');
            }
        } else {
            console.warn('userData.nome não encontrado:', userData);
        }
    } catch (error) {
        console.error('Erro ao atualizar nome do usuário:', error);
    }
}

/**
 * Carrega todos os dados do dashboard
 * ⚠️ SEGURANÇA: Usa sessionStorage e refresh token automático
 */
async function loadDashboardData() {
    try {
        console.log('loadDashboardData iniciado');
        showLoading(true);
        
        // Verificar se há token antes de tentar buscar dados
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
        console.log('Token encontrado:', !!token);
        
        if (!token) {
            console.warn('Token não encontrado. Redirecionando para login.');
            showLoading(false);
            window.location.replace('/');
            return;
        }
        
        // Buscar dados em paralelo
        let gastosFixos = [];
        let gastosVariaveis = [];
        const userDataRaw = sessionStorage.getItem('user') || localStorage.getItem('user');
        const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
        const currentUserId = userData && userData.id ? Number(userData.id) : null;
        
        console.log('Buscando gastos da API...');
        try {
            [gastosFixos, gastosVariaveis] = await Promise.all([
                apiService.getGastosFixos(),
                apiService.getGastosVariaveis()
            ]);
            console.log('Gastos recebidos:', { gastosFixos, gastosVariaveis });
            if (currentUserId) {
                gastosFixos = (gastosFixos || []).filter(g => recordBelongsToUser(g, currentUserId));
                gastosVariaveis = (gastosVariaveis || []).filter(g => recordBelongsToUser(g, currentUserId));
            }
        } catch (error) {
            console.warn('Erro ao buscar gastos, usando dados vazios:', error);
            gastosFixos = [];
            gastosVariaveis = [];
        }

        // Tentar buscar salário (pode não existir ainda)
        let salario = 0;
        console.log('Tentando buscar salário...');
        try {
            const userData = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user'));
            console.log('UserData:', userData);
            if (userData && userData.id) {
                console.log('Buscando salários para user_id:', userData.id);
                const salarioList = await apiService.getSalarios();
                console.log('Salários recebidos:', salarioList);
                if (Array.isArray(salarioList) && salarioList.length > 0) {
                    salario = salarioList[0].valor || 0;
                }
            }
        } catch (error) {
            console.warn('Salário não encontrado, usando valor 0:', error);
            salario = 0;
        }

        console.log('Processando dados...');
        // Processar dados
        dashboardData.salario = salario;
        dashboardData.gastosFixos = gastosFixos || [];
        dashboardData.gastosVariaveis = gastosVariaveis || [];
        
        console.log('📊 dashboardData completo:', dashboardData);
        
        console.log('Calculando totais...');
        calculateTotals();
        
        console.log('Calculando histórico mensal...');
        calculateMonthlyHistory();
        
        console.log('Atualizando UI...');
        updateUI();
        
        console.log('Atualizando gráfico...');
        updateBarChart();
        
        console.log('Finalizando carregamento...');
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        showLoading(false);
        // Manter dados vazios em caso de erro
        dashboardData = {
            salario: 0,
            gastosFixos: [],
            gastosVariaveis: [],
            totalReceitas: 0,
            totalDespesas: 0,
            saldoAtual: 0,
            historicoMensal: []
        };
        updateUI();
    }
}



/**
 * Calcula os totais de receitas e despesas
 */
function calculateTotals() {
    // Total de receitas (salário + entradas variáveis do mês)
    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();

    const totalEntradasVariaveis = dashboardData.gastosVariaveis
        .filter(gasto => {
            const dataStr = gasto.data_gasto || gasto.data;
            const dataGasto = new Date(dataStr);
            return (gasto.tipo === 'entrada') &&
                   (dataGasto.getMonth() + 1 === mesAtual) &&
                   (dataGasto.getFullYear() === anoAtual);
        })
        .reduce((sum, gasto) => sum + parseFloat(gasto.valor || 0), 0);

    dashboardData.totalReceitas = dashboardData.salario + totalEntradasVariaveis;
    
    // Total de despesas (fixos + variáveis de saída do mês atual)
    // reutiliza mesAtual/anoAtual já definidos acima
    
    const totalFixos = dashboardData.gastosFixos.reduce((sum, gasto) => {
        return sum + parseFloat(gasto.valor || 0);
    }, 0);
    
    const totalVariaveis = dashboardData.gastosVariaveis
        .filter(gasto => {
            // Aceitar tanto 'data_gasto' quanto 'data'
            const dataStr = gasto.data_gasto || gasto.data;
            const dataGasto = new Date(dataStr);
            return (gasto.tipo !== 'entrada') &&
                   (dataGasto.getMonth() + 1 === mesAtual) && 
                   (dataGasto.getFullYear() === anoAtual);
        })
        .reduce((sum, gasto) => {
            return sum + parseFloat(gasto.valor || 0);
        }, 0);
    
    dashboardData.totalDespesas = totalFixos + totalVariaveis;
    dashboardData.saldoAtual = dashboardData.totalReceitas - dashboardData.totalDespesas;
}

/**
 * Calcula o histórico mensal dos últimos 6 meses
 */
function calculateMonthlyHistory() {
    const hoje = new Date();
    const historicoMensal = [];
    
    // Gerar dados dos últimos 6 meses
    for (let i = 5; i >= 0; i--) {
        const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mesNumero = mes.getMonth() + 1;
        const ano = mes.getFullYear();
        const nomeMes = mes.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        
        // Calcular receitas do mês (salário + entradas variáveis)
        const receitasVariaveis = dashboardData.gastosVariaveis
            .filter(gasto => {
                const dataStr = gasto.data_gasto || gasto.data;
                const dataGasto = new Date(dataStr);
                return (gasto.tipo === 'entrada') &&
                       (dataGasto.getMonth() + 1 === mesNumero) &&
                       (dataGasto.getFullYear() === ano);
            })
            .reduce((sum, gasto) => sum + parseFloat(gasto.valor || 0), 0);

        const receitas = dashboardData.salario + receitasVariaveis;
        
        // Calcular despesas fixas do mês
        const despesasFixas = dashboardData.gastosFixos.reduce((sum, gasto) => {
            // Gastos fixos contam sempre para todos os meses
            return sum + parseFloat(gasto.valor || 0);
        }, 0);
        
        // Calcular despesas variáveis do mês
        const despesasVariaveis = dashboardData.gastosVariaveis
            .filter(gasto => {
                const dataStr = gasto.data_gasto || gasto.data;
                const dataGasto = new Date(dataStr);
                return (gasto.tipo !== 'entrada') &&
                       (dataGasto.getMonth() + 1 === mesNumero) && 
                       (dataGasto.getFullYear() === ano);
            })
            .reduce((sum, gasto) => {
                return sum + parseFloat(gasto.valor || 0);
            }, 0);
        
        const totalDespesas = despesasFixas + despesasVariaveis;
        const saldo = receitas - totalDespesas;
        
        historicoMensal.push({
            mes: nomeMes,
            mesNumero,
            ano,
            receitas,
            despesas: totalDespesas,
            saldo
        });
    }
    
    dashboardData.historicoMensal = historicoMensal;
    console.log('Histórico mensal calculado:', historicoMensal);
}

/**
 * Atualiza o gráfico de barras com dados históricos
 */
function updateBarChart() {
    if (!dashboardData.historicoMensal || dashboardData.historicoMensal.length === 0) {
        console.warn('Sem dados históricos para o gráfico');
        return;
    }

    const incomeBars = document.querySelectorAll('[data-chart-income]');
    const expenseBars = document.querySelectorAll('[data-chart-expense]');
    const labels = document.querySelectorAll('[data-chart-label]');
    const incomeValues = document.querySelectorAll('[data-chart-income-value]');
    const expenseValues = document.querySelectorAll('[data-chart-expense-value]');

    if (incomeBars.length === 0 || expenseBars.length === 0) {
        console.warn('Elementos do gráfico não encontrados');
        return;
    }

    // Encontrar o valor máximo para normalização
    const maxValor = Math.max(
        ...dashboardData.historicoMensal.map(m => Math.max(m.receitas, m.despesas))
    );

    dashboardData.historicoMensal.forEach((mes, index) => {
        const alturaReceita = maxValor > 0 ? Math.round((mes.receitas / maxValor) * 160) : 0;
        const alturaDespesa = maxValor > 0 ? Math.round((mes.despesas / maxValor) * 160) : 0;

        const incomeBar = incomeBars[index];
        const expenseBar = expenseBars[index];
        const label = labels[index];
        const incomeValue = incomeValues[index];
        const expenseValue = expenseValues[index];

        if (incomeBar) incomeBar.style.height = `${alturaReceita}px`;
        if (expenseBar) expenseBar.style.height = `${alturaDespesa}px`;
        if (label) label.textContent = mes.mes || mes.nomeMes || '';
        if (incomeValue) incomeValue.textContent = formatCurrency(mes.receitas || 0);
        if (expenseValue) expenseValue.textContent = `- ${formatCurrency(mes.despesas || 0)}`;
    });

    console.log('Gráfico de barras atualizado com dados do usuário');
}

/**
 * Atualiza a interface com os dados calculados
 */
function updateUI() {
    // Atualizar valores principais
    updateDashboardData({
        balance: dashboardData.saldoAtual,
        income: dashboardData.totalReceitas,
        expense: dashboardData.totalDespesas
    });
    
    // Atualizar atividades recentes
    try {
        updateRecentActivities();
    } catch (error) {
        console.error('Erro ao atualizar atividades:', error);
    }
    
    // Mostrar mensagem se não houver dados
    if (dashboardData.salario === 0 && 
        dashboardData.gastosFixos.length === 0 && 
        dashboardData.gastosVariaveis.length === 0) {
        console.log('📊 Dashboard pronto! Nenhum dado cadastrado ainda. Comece adicionando seu salário e despesas.');
    }
}

/**
 * Configura o menu mobile
 */
function setupMobileMenu() {
    const menuButton = document.querySelector('.lg\\:hidden button');
    const sidebar = document.querySelector('aside');
    
    if (menuButton && sidebar) {
        menuButton.addEventListener('click', function() {
            sidebar.classList.toggle('flex');
            sidebar.classList.toggle('hidden');
        });
    }
}

/**
 * Configura os botões de ação
 */
function setupButtons() {
    // Botão "Adicionar Despesa"
    const addExpenseBtn = document.querySelector('button[data-action="add-expense"]');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', function() {
            handleAddExpense();
        });
    }
    
    // Botão "Ver Extrato Completo"
    const viewStatementBtn = document.querySelector('button[data-action="view-statement"]');
    if (viewStatementBtn) {
        viewStatementBtn.addEventListener('click', function() {
            handleViewStatement();
        });
    }
}

/**
 * Atualiza a lista de atividades recentes
 */
function updateRecentActivities() {
    console.log('Atualizando atividades recentes...');
    const activityContainer = document.getElementById('recent-activities-container');
    if (!activityContainer) {
        console.warn('Container de atividades não encontrado');
        return;
    }
    console.log('Container encontrado');
    
    // Combinar e ordenar todas as transações
    const allTransactions = [
        ...dashboardData.gastosFixos.map(g => ({
            tipo: 'despesa',
            descricao: g.nome || g.descricao || 'Gasto Fixo',
            valor: parseFloat(g.valor || 0),
            data: g.data || new Date(),
            categoria: g.categoria || 'Geral'
        })),
        ...dashboardData.gastosVariaveis.map(g => ({
            tipo: g.tipo === 'entrada' ? 'receita' : 'despesa',
            descricao: g.nome || g.descricao || (g.tipo === 'entrada' ? 'Entrada' : 'Gasto Variável'),
            valor: parseFloat(g.valor || 0),
            data: g.data_gasto || g.data || new Date(),
            categoria: normalizeCategorySlug(g.categoria_slug || g.categoria || '') || g.categoria || 'Geral',
            id: g.id,
            origem: 'variavel',
            categoria_slug: normalizeCategorySlug(g.categoria_slug || g.categoria || ''),
            tipoOriginal: g.tipo || 'saida'
        }))
    ];
    
    console.log('🔵 allTransactions:', allTransactions);
    
    // Adicionar salário se existir
    if (dashboardData.salario > 0) {
        const ultimoDiaMes = new Date();
        ultimoDiaMes.setDate(25); // Simular dia de pagamento
        
        allTransactions.push({
            tipo: 'receita',
            descricao: 'Pagamento Salário',
            valor: dashboardData.salario,
            data: ultimoDiaMes,
            categoria: 'Salário'
        });
    }
    
    // Ordenar por data (mais recente primeiro)
    allTransactions.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // Mostrar os 6 mais recentes
    const recentTransactions = allTransactions.slice(0, 6);
    
    // Limpar container
    activityContainer.innerHTML = '';
    
    // Se não houver transações, mostrar mensagem
    if (recentTransactions.length === 0) {
        console.log('Nenhuma transação para exibir');
        activityContainer.innerHTML = `
            <div class="text-center py-8">
                <div class="text-slate-400 dark:text-slate-500 mb-2">
                    <span class="material-symbols-outlined text-5xl">receipt_long</span>
                </div>
                <p class="text-slate-500 dark:text-slate-400 text-sm">Nenhuma transação registrada ainda</p>
                <p class="text-slate-400 dark:text-slate-500 text-xs mt-1">Adicione despesas para visualizar suas atividades</p>
            </div>
        `;
        return;
    }
    
    // Adicionar transações
    recentTransactions.forEach((transaction, index) => {
        const isLast = index === recentTransactions.length - 1;
        const borderClass = isLast ? '' : 'border-b border-black/10 dark:border-white/10';
        
        const icon = getTransactionIcon(transaction);
        const isReceita = transaction.tipo === 'receita';
        const valorFormatado = isReceita 
            ? `+ ${formatCurrency(transaction.valor)}`
            : `- ${formatCurrency(transaction.valor)}`;
        const valorClass = isReceita
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-300';
        
        const dataFormatada = new Date(transaction.data).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        const serialized = transaction.origem === 'variavel' ? encodeURIComponent(JSON.stringify(transaction)) : '';
        const actionButtons = transaction.origem === 'variavel' ? `
            <div class="flex gap-2">
                <button class="text-slate-500 hover:text-primary" aria-label="Editar" onclick="window.expenseModal && window.expenseModal.openExpenseModalForEdit(JSON.parse(decodeURIComponent('${serialized}')))">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                </button>
                <button class="text-slate-500 hover:text-red-500" aria-label="Excluir" onclick="window.expenseModal && window.expenseModal.deleteExpense(${transaction.id})">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                </button>
            </div>
        ` : '';

        const html = `
            <div class="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1fr_auto] items-center gap-4 py-3 ${borderClass}">
                <div class="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary rounded-full size-10 flex items-center justify-center">
                    ${icon}
                </div>
                <div class="flex flex-col">
                    <p class="text-slate-800 dark:text-slate-200 font-medium">${transaction.descricao}</p>
                    <p class="text-slate-500 dark:text-slate-400 text-sm">${dataFormatada}</p>
                </div>
                <p class="text-slate-500 dark:text-slate-400 text-sm hidden sm:block">${transaction.categoria}</p>
                <div class="flex items-center justify-end gap-3">
                    ${actionButtons}
                    <p class="${valorClass} font-bold text-right">${valorFormatado}</p>
                </div>
            </div>
        `;
        
        activityContainer.insertAdjacentHTML('beforeend', html);
    });
}

/**
 * Retorna o ícone baseado na categoria
 */
function getTransactionIcon(transaction) {
    const tipo = transaction.tipo === 'receita' ? 'receita' : 'despesa';
    const catSource = transaction.categoria_slug || transaction.categoria || transaction.descricao || '';
    const cat = catSource.toLowerCase();

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

    if (cat.includes('merc') || cat.includes('super') || cat.includes('market') || cat.includes('alimen') || cat.includes('comida')) return svg.mercado;
    if (cat.includes('transp')) return svg.transporte;
    if (cat.includes('morad') || cat.includes('casa')) return svg.moradia;
    if (cat.includes('saud')) return svg.saude;
    if (cat.includes('educ')) return svg.educacao;
    if (cat.includes('entreten') || cat.includes('lazer')) return svg.entretenimento;

    return tipo === 'receita' ? svg.receita : svg.despesa;
}

function normalizeCategorySlug(value) {
    const v = (value || '').toString().trim().toLowerCase();
    if (!v) return '';
    if (v.includes('aliment') || v.includes('merc')) return 'alimentacao';
    if (v.includes('transp')) return 'transporte';
    if (v.includes('saud')) return 'saude';
    if (v.includes('educ')) return 'educacao';
    if (v.includes('entreten') || v.includes('lazer')) return 'entretenimento';
    if (v.includes('outros') || v.includes('outro')) return 'outros';
    return v.replace(/\s+/g, '-');
}

/**
 * Manipula o clique no botão "Adicionar Despesa"
 */
function handleAddExpense() {
    console.log('🔵 handleAddExpense chamado - abrindo modal');
    // A modal é gerenciada pelo expense-modal.js
    // Apenas log para debug
}

/**
 * Manipula o clique no botão "Ver Extrato Completo"
 */
function handleViewStatement() {
    console.log('🔵 handleViewStatement chamado');
    try {
        const rows = buildStatementRows();
        const userData = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
        const userName = userData && userData.nome ? userData.nome : 'Usuário';
        const html = renderStatementHTML(rows, userName);
        const printWindow = window.open('', '_blank', 'width=1100,height=800');

        if (!printWindow) {
            showError('Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está ativo.');
            return;
        }

        printWindow.document.write(html);
        printWindow.document.close();

        // Aguarda renderização antes de chamar print
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
        };
    } catch (error) {
        console.error('Erro ao gerar PDF do extrato:', error);
        showError('Erro ao gerar o PDF do extrato. Tente novamente.');
    }
}

// Monta todas as linhas do extrato com dados atuais
function buildStatementRows() {
    const rows = [];

    // Gastos fixos
    (dashboardData.gastosFixos || []).forEach(g => {
        rows.push({
            data: g.data || g.data_gasto || g.created_at || new Date(),
            descricao: g.nome || g.descricao || 'Gasto Fixo',
            categoria: g.categoria || 'Fixo',
            tipo: 'Despesa',
            valor: parseFloat(g.valor || 0)
        });
    });

    // Gastos variáveis
    (dashboardData.gastosVariaveis || []).forEach(g => {
        const isEntrada = g.tipo === 'entrada';
        rows.push({
            data: g.data_gasto || g.data || g.created_at || new Date(),
            descricao: g.nome || g.descricao || (isEntrada ? 'Entrada' : 'Gasto Variável'),
            categoria: g.categoria || g.categoria_slug || 'Variável',
            tipo: isEntrada ? 'Receita' : 'Despesa',
            valor: parseFloat(g.valor || 0)
        });
    });

    // Salário (se existir)
    if (dashboardData.salario && dashboardData.salario > 0) {
        const hoje = new Date();
        rows.push({
            data: hoje,
            descricao: 'Salário',
            categoria: 'Renda Fixa',
            tipo: 'Receita',
            valor: parseFloat(dashboardData.salario || 0)
        });
    }

    // Ordenar por data desc
    rows.sort((a, b) => new Date(b.data) - new Date(a.data));
    return rows;
}

// Gera HTML amigável para impressão/exportação em PDF
function renderStatementHTML(rows, userName = 'Usuário') {
    const today = new Date();
    const formatter = (value) => formatCurrency(value || 0);

    const tableRows = rows.map(r => {
        const data = new Date(r.data);
        const dataStr = isNaN(data) ? '' : data.toLocaleDateString('pt-BR');
        const tipoClass = r.tipo === 'Receita' ? 'tag tag-receita' : 'tag tag-despesa';
        return `
            <tr>
                <td>${dataStr}</td>
                <td>${r.descricao || ''}</td>
                <td>${r.categoria || ''}</td>
                <td><span class="${tipoClass}">${r.tipo}</span></td>
                <td class="valor">${formatter(r.valor)}</td>
            </tr>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="utf-8" />
        <title>Extrato Completo</title>
        <style>
            * { box-sizing: border-box; }
            body { font-family: 'Manrope', Arial, sans-serif; margin: 24px; color: #0f172a; }
            .header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
            .brand { display: flex; align-items: center; gap: 10px; }
            .brand img { height: 40px; width: auto; }
            .title-group { display: flex; flex-direction: column; gap: 2px; }
            h1 { margin: 0; font-size: 22px; }
            p.sub { margin: 0; color: #475569; font-size: 13px; }
            p.user { margin: 0; color: #0f172a; font-weight: 700; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            thead { background: #f1f5f9; }
            th, td { padding: 10px 12px; text-align: left; font-size: 13px; }
            th { color: #0f172a; border-bottom: 1px solid #e2e8f0; }
            td { border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) td { background: #f8fafc; }
            .valor { text-align: right; font-weight: 700; }
            .tag { padding: 4px 10px; border-radius: 999px; font-weight: 700; font-size: 11px; display: inline-block; }
            .tag-receita { background: #dcfce7; color: #166534; }
            .tag-despesa { background: #fee2e2; color: #b91c1c; }
            @media print {
                body { margin: 12mm; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="brand">
                <img src="/img/financel.svg" alt="Logo" />
                <div class="title-group">
                    <h1>Extrato Completo</h1>
                    <p class="sub">Gerado em ${today.toLocaleDateString('pt-BR')} às ${today.toLocaleTimeString('pt-BR')}</p>
                </div>
            </div>
            <p class="user">${userName}</p>
        </div>
        <table>
            <thead>
                <tr>
                    <th style="width: 120px;">Data</th>
                    <th>Descrição</th>
                    <th style="width: 160px;">Categoria</th>
                    <th style="width: 120px;">Tipo</th>
                    <th style="width: 140px; text-align: right;">Valor</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows || '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">Nenhuma transação encontrada.</td></tr>'}
            </tbody>
        </table>
    </body>
    </html>
    `;
}

/**
 * Mostra/oculta indicador de carregamento
 */
function showLoading(show) {
    // TODO: Implementar spinner de carregamento
    console.log(show ? 'Carregando...' : 'Carregamento completo');
}

/**
 * Mostra mensagem de erro
 */
function showError(message) {
    alert(message);
}

/**
 * Função para formatar valores em moeda brasileira
 * @param {number} value - Valor a ser formatado
 * @returns {string} - Valor formatado
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Função para atualizar os dados do dashboard
 * @param {Object} data - Dados do dashboard
 */
function updateDashboardData(data) {
    // Atualizar saldo atual
    const balanceElement = document.querySelector('[data-value="balance"]');
    if (balanceElement && data.balance) {
        balanceElement.textContent = formatCurrency(data.balance);
    }
    
    // Atualizar receitas
    const incomeElement = document.querySelector('[data-value="income"]');
    if (incomeElement && data.income) {
        incomeElement.textContent = formatCurrency(data.income);
    }
    
    // Atualizar despesas
    const expenseElement = document.querySelector('[data-value="expense"]');
    if (expenseElement && data.expense) {
        expenseElement.textContent = formatCurrency(data.expense);
    }
}

// Exportar funções para uso global (se necessário)
window.dashboardApp = {
    updateDashboardData,
    formatCurrency
};
