// Dashboard JavaScript - Lógica da aplicação

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

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('Iniciando dashboard...');
        checkAuthentication();
        initializeDashboard();
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
});

/**
 * Verifica se o usuário está autenticado
 */
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        console.warn('Usuário não autenticado. Usando modo demonstração.');
        // Criar usuário de demonstração apenas se não existir
        const demoUser = JSON.stringify({
            id: 1,
            nome: 'Usuário Demo',
            email: 'demo@example.com'
        });
        
        // Verificar se já não é o usuário demo para evitar loop
        if (user !== demoUser) {
            localStorage.setItem('user', demoUser);
        }
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
 */
function updateUserName() {
    console.log('🔵 updateUserName foi chamado');
    try {
        const userDataString = localStorage.getItem('user');
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
 */
async function loadDashboardData() {
    try {
        console.log('loadDashboardData iniciado');
        showLoading(true);
        
        // Verificar se há token antes de tentar buscar dados
        const token = localStorage.getItem('token');
        console.log('Token encontrado:', !!token);
        
        if (!token) {
            console.warn('Token não encontrado. Usando dados vazios.');
            showLoading(false);
            return;
        }
        
        // Buscar dados em paralelo
        let gastosFixos = [];
        let gastosVariaveis = [];
        
        console.log('Buscando gastos da API...');
        try {
            [gastosFixos, gastosVariaveis] = await Promise.all([
                apiService.getGastosFixos(),
                apiService.getGastosVariaveis()
            ]);
            console.log('Gastos recebidos:', { gastosFixos, gastosVariaveis });
        } catch (error) {
            console.warn('Erro ao buscar gastos, usando dados vazios:', error);
            gastosFixos = [];
            gastosVariaveis = [];
        }

        // Tentar buscar salário (pode não existir ainda)
        let salario = 0;
        console.log('Tentando buscar salário...');
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            console.log('UserData:', userData);
            if (userData && userData.id) {
                console.log('Buscando salário para user_id:', userData.id);
                const salarioData = await apiService.getSalarioByUserId(userData.id);
                console.log('Salário recebido:', salarioData);
                salario = salarioData.valor || 0;
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
    // Total de receitas (apenas salário por enquanto)
    dashboardData.totalReceitas = dashboardData.salario;
    
    // Total de despesas (fixos + variáveis do mês atual)
    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();
    
    const totalFixos = dashboardData.gastosFixos.reduce((sum, gasto) => {
        return sum + parseFloat(gasto.valor || 0);
    }, 0);
    
    const totalVariaveis = dashboardData.gastosVariaveis
        .filter(gasto => {
            const dataGasto = new Date(gasto.data);
            return dataGasto.getMonth() + 1 === mesAtual && 
                   dataGasto.getFullYear() === anoAtual;
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
        
        // Calcular receitas do mês (salário)
        const receitas = dashboardData.salario;
        
        // Calcular despesas fixas do mês
        const despesasFixas = dashboardData.gastosFixos.reduce((sum, gasto) => {
            // Gastos fixos contam sempre para todos os meses
            return sum + parseFloat(gasto.valor || 0);
        }, 0);
        
        // Calcular despesas variáveis do mês
        const despesasVariaveis = dashboardData.gastosVariaveis
            .filter(gasto => {
                const dataGasto = new Date(gasto.data);
                return dataGasto.getMonth() + 1 === mesNumero && 
                       dataGasto.getFullYear() === ano;
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
    
    // Encontrar o valor máximo para normalização
    const maxValor = Math.max(
        ...dashboardData.historicoMensal.map(m => Math.max(m.receitas, m.despesas))
    );
    
    // Mapear meses para abreviações usadas no HTML
    const mesesAbrev = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    
    dashboardData.historicoMensal.forEach((mes, index) => {
        // Calcular alturas proporcionais (máximo 160px)
        const alturaReceita = maxValor > 0 ? Math.round((mes.receitas / maxValor) * 160) : 0;
        const alturaDespesa = maxValor > 0 ? Math.round((mes.despesas / maxValor) * 160) : 0;
        
        // Pegar o mês correto baseado no índice (últimos 6 meses)
        const dataInicio = new Date();
        dataInicio.setMonth(dataInicio.getMonth() - 5); // Voltar 5 meses
        const mesAtual = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + index, 1);
        const mesAbrev = mesesAbrev[mesAtual.getMonth()];
        
        // Atualizar elementos do gráfico
        const barReceita = document.querySelector(`.bar-height-${mesAbrev}-income`);
        const barDespesa = document.querySelector(`.bar-height-${mesAbrev}-expense`);
        
        if (barReceita) {
            barReceita.style.height = `${alturaReceita}px`;
        }
        if (barDespesa) {
            barDespesa.style.height = `${alturaDespesa}px`;
        }
    });
    
    console.log('Gráfico de barras atualizado');
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
            tipo: 'fixo',
            descricao: g.descricao || 'Gasto Fixo',
            valor: parseFloat(g.valor || 0),
            data: g.data || new Date(),
            categoria: g.categoria || 'Geral'
        })),
        ...dashboardData.gastosVariaveis.map(g => ({
            tipo: 'variavel',
            descricao: g.descricao || 'Gasto Variável',
            valor: parseFloat(g.valor || 0),
            data: g.data || new Date(),
            categoria: g.categoria || 'Geral'
        }))
    ];
    
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
    
    // Mostrar apenas os 4 mais recentes
    const recentTransactions = allTransactions.slice(0, 4);
    
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
        
        const icon = getTransactionIcon(transaction.categoria);
        const valorFormatado = transaction.tipo === 'receita' 
            ? `+ ${formatCurrency(transaction.valor)}`
            : `- ${formatCurrency(transaction.valor)}`;
        const valorClass = transaction.tipo === 'receita'
            ? 'text-green-600 dark:text-green-400'
            : 'text-slate-800 dark:text-slate-200';
        
        const dataFormatada = new Date(transaction.data).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        const html = `
            <div class="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1fr_auto] items-center gap-4 py-3 ${borderClass}">
                <div class="bg-primary/20 text-primary dark:bg-primary/30 dark:text-secondary rounded-full size-10 flex items-center justify-center">
                    <span class="material-symbols-outlined">${icon}</span>
                </div>
                <div class="flex flex-col">
                    <p class="text-slate-800 dark:text-slate-200 font-medium">${transaction.descricao}</p>
                    <p class="text-slate-500 dark:text-slate-400 text-sm">${dataFormatada}</p>
                </div>
                <p class="text-slate-500 dark:text-slate-400 text-sm hidden sm:block">${transaction.categoria}</p>
                <p class="${valorClass} font-bold text-right">${valorFormatado}</p>
            </div>
        `;
        
        activityContainer.insertAdjacentHTML('beforeend', html);
    });
}

/**
 * Retorna o ícone baseado na categoria
 */
function getTransactionIcon(categoria) {
    const icons = {
        'Alimentação': 'shopping_cart',
        'Salário': 'receipt_long',
        'Lazer': 'restaurant',
        'Transporte': 'directions_car',
        'Moradia': 'home',
        'Saúde': 'local_hospital',
        'Educação': 'school',
        'Geral': 'category'
    };
    return icons[categoria] || 'category';
}

/**
 * Manipula o clique no botão "Adicionar Despesa"
 */
function handleAddExpense() {
    // Redirecionar para página de financeiro
    window.location.href = '/financeiro';
}

/**
 * Manipula o clique no botão "Ver Extrato Completo"
 */
function handleViewStatement() {
    // Redirecionar para página de financeiro
    window.location.href = '/financeiro';
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
