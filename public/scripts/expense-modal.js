console.log('🔵 expense-modal.js carregado');

// Formatar valor como moeda brasileira (adiciona números à direita)
function formatCurrencyInput(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length === 0) {
        input.value = '0,00';
        return;
    }
    
    // Converter para número e dividir por 100 para ter os centavos
    const numericValue = parseInt(value, 10) / 100;
    
    // Formatar como moeda brasileira
    input.value = numericValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Controle de tipo (entrada/saída) via botões
let selectedExpenseType = 'saida';
let editingExpenseId = null;

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

function setExpenseType(type) {
    selectedExpenseType = type || 'saida';
    const buttons = document.querySelectorAll('[data-expense-type]');
    buttons.forEach((btn) => {
        const isActive = btn.dataset.expenseType === selectedExpenseType;
        const isEntrada = btn.dataset.expenseType === 'entrada';

        // reset base
        btn.classList.remove('shadow-lg', 'text-white', 'bg-[#cfe8dc]', 'bg-[#f4d8d8]', 'bg-[#2f9b6c]', 'bg-[#b91c1c]', 'dark:bg-emerald-700', 'dark:bg-red-800');
        btn.classList.add('bg-white', 'dark:bg-slate-700');

        if (isActive) {
            // entrada: verde pastel com ícone branco; saída: vermelho pastel com ícone branco
            if (isEntrada) {
                btn.classList.add('bg-[#2f9b6c]', 'text-white');
                btn.classList.add('dark:bg-emerald-700');
            } else {
                btn.classList.add('bg-[#b91c1c]', 'text-white');
                btn.classList.add('dark:bg-red-800');
            }
            btn.classList.add('shadow-lg');
        }
    });
}

function setupExpenseTypeToggle() {
    const buttons = document.querySelectorAll('[data-expense-type]');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.expenseType || 'saida';
            setExpenseType(type);
        });
    });

    // Default para saída (despesa)
    setExpenseType(selectedExpenseType);
}

// Converter valor formatado para número
function parseCurrency(value) {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}

// Abrir modal de despesa
function openExpenseModal(event) {
    console.log('🔵 Abrindo modal de despesa');
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const modal = document.getElementById('addExpenseModal');
    if (!modal) {
        console.log('❌ Modal não encontrada');
        return;
    }
    
    // Remove a classe hidden
    modal.classList.remove('hidden');
    console.log('✅ Modal aberta - classes:', modal.className);
    
    // Limpar campos
    const description = document.getElementById('expenseDescription');
    const amount = document.getElementById('expenseAmount');
    const category = document.getElementById('expenseCategory');
    const date = document.getElementById('expenseDate');
    
    description.value = '';
    amount.value = '0,00';
    category.value = '';
    date.value = '';
    editingExpenseId = null;
    const submitBtn = document.querySelector('[data-action="submit-expense"]');
    if (submitBtn) submitBtn.textContent = 'Adicionar';
    
    // Limpar mensagens
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    if (errorDiv) errorDiv.classList.add('hidden');
    if (successDiv) successDiv.classList.add('hidden');

    // Resetar tipo para saída por padrão
    setExpenseType('saida');
}

function openExpenseModalForEdit(expense) {
    console.log('🔵 Editando despesa', expense);
    const modal = document.getElementById('addExpenseModal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const description = document.getElementById('expenseDescription');
    const amount = document.getElementById('expenseAmount');
    const category = document.getElementById('expenseCategory');
    const date = document.getElementById('expenseDate');
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    const submitBtn = document.querySelector('[data-action="submit-expense"]');

    if (description) description.value = expense.nome || expense.descricao || '';

    const amountNumber = Number(expense.valor || 0);
    if (amount) {
        amount.value = amountNumber.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    const categorySlug = normalizeCategorySlug(expense.categoria_slug || expense.categoria || '');
    if (category) category.value = categorySlug;

    const rawDate = expense.data_gasto || expense.data || expense.created_at || '';
    if (date) date.value = rawDate ? rawDate.substring(0, 10) : '';
    editingExpenseId = expense.id;
    if (submitBtn) submitBtn.textContent = 'Salvar';
    if (errorDiv) errorDiv.classList.add('hidden');
    if (successDiv) successDiv.classList.add('hidden');

    setExpenseType(expense.tipo === 'entrada' ? 'entrada' : 'saida');
}
// Fechar modal de despesa
function closeExpenseModal(event) {
    console.log('🔵 Fechando modal de despesa');
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const modal = document.getElementById('addExpenseModal');
    if (!modal) {
        console.log('❌ Modal não encontrada');
        return;
    }
    
    // Adiciona a classe hidden
    modal.classList.add('hidden');
    console.log('✅ Modal fechada - classes:', modal.className);
}

// Submeter despesa
async function submitExpense(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('🔵 Iniciando submissão de despesa');
    
    // Obter dados do formulário
    const description = document.getElementById('expenseDescription').value.trim();
    const amountInput = document.getElementById('expenseAmount').value;
    const amount = parseCurrency(amountInput);
    const category = document.getElementById('expenseCategory').value;
    const type = selectedExpenseType;
    const date = document.getElementById('expenseDate').value;
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    // Validar dados
    if (!description) {
        errorDiv.textContent = 'Por favor, insira uma descrição';
        errorDiv.classList.remove('hidden');
        console.log('❌ Descrição vazia');
        return;
    }
    
    if (!amount || amount <= 0) {
        errorDiv.textContent = 'Por favor, insira um valor válido';
        errorDiv.classList.remove('hidden');
        console.log('❌ Valor inválido');
        return;
    }
    
    if (!type) {
        errorDiv.textContent = 'Por favor, selecione o tipo (Entrada ou Saída)';
        errorDiv.classList.remove('hidden');
        console.log('❌ Tipo não selecionado');
        return;
    }
    
    if (!date) {
        errorDiv.textContent = 'Por favor, selecione uma data';
        errorDiv.classList.remove('hidden');
        console.log('❌ Data não selecionada');
        return;
    }
    
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');
    
    try {
        // ⚠️ SEGURANÇA: Usa sessionStorage em vez de localStorage
        // Obter token e dados do usuário
        const userString = sessionStorage.getItem('user') || localStorage.getItem('user');
        const tokenString = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
        
        if (!userString || !tokenString) {
            console.log('📦 localStorage completo:', Object.keys(localStorage));
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                console.log(`  ${key}: ${localStorage.getItem(key).substring(0, 50)}...`);
            }
            errorDiv.textContent = 'Erro: Usuário não autenticado';
            errorDiv.classList.remove('hidden');
            console.log('❌ Usuário não autenticado - user:', !!userString, 'token:', !!tokenString);
            return;
        }
        
        const user = JSON.parse(userString);
        const token = tokenString;
        
        // Mapear categoria para ID (baseado nas categorias do banco)
        const categoriaMap = {
            'alimentacao': 1,
            'transporte': 2,
            'saude': 4,
            'educacao': 6,
            'entretenimento': 5,
            'outros': 8
        };
        
        // Preparar dados para envio (formato esperado pela API)
        const expenseData = {
            nome: description,  // Campo 'nome' conforme banco de dados
            valor: amount,
            categoria_id: category ? (categoriaMap[category] || null) : null,
            data_gasto: date,
            tipo: type,  // Adicionar tipo (entrada ou saída)
            user_id: user.id  // Adicionar user_id obrigatório
        };
        
        console.log('📤 Enviando despesa:', expenseData);
        
        const isEdit = !!editingExpenseId;
        const url = isEdit ? `/api/v1/gastos-variaveis/${editingExpenseId}` : '/api/v1/gastos-variaveis';
        const method = isEdit ? 'PUT' : 'POST';

        let response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(expenseData)
        });
        
        // Se token expirou (401), tenta renovar com refresh token
        if (response.status === 401) {
            const refreshToken = sessionStorage.getItem('refreshToken');
            if (refreshToken) {
                console.log('🔄 Token expirado, tentando renovar...');
                const refreshResponse = await fetch('/api/v1/users/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });
                
                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    sessionStorage.setItem('accessToken', refreshData.accessToken);
                    console.log('✅ Token renovado com sucesso');
                    
                    // Tentar novamente com novo token
                    response = await fetch(url, {
                        method,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${refreshData.accessToken}`
                        },
                        body: JSON.stringify(expenseData)
                    });
                }
            }
        }
        
        console.log('📥 Status da resposta:', response.status);
        console.log('📥 Content-Type:', response.headers.get('content-type'));
        
        // Obter o texto da resposta primeiro
        const responseText = await response.text();
        console.log('📥 Resposta completa:', responseText);
        
        // Verificar se a resposta é JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.log('❌ Resposta não é JSON:', responseText.substring(0, 500));
            throw new Error('Servidor retornou resposta inválida. A rota /api/v1/gastos-variaveis pode não estar configurada.');
        }
        
        if (!response.ok) {
            let error;
            try {
                error = JSON.parse(responseText);
            } catch (e) {
                console.log('❌ Erro ao parsear JSON de erro:', e);
                throw new Error(`Erro ${response.status}: ${responseText.substring(0, 100)}`);
            }
            console.log('❌ Erro da API:', error);
            throw new Error(error.message || error.error || `Erro ${response.status}: ${JSON.stringify(error)}`);
        }
        
        const result = JSON.parse(responseText);
        console.log('✅ Despesa salva com sucesso:', result);
        
        // Mostrar mensagem de sucesso
        successDiv.textContent = isEdit ? 'Despesa atualizada!' : 'Despesa adicionada com sucesso!';
        successDiv.classList.remove('hidden');
        
        // Limpar formulário e recarregar dashboard
        setTimeout(() => {
            closeExpenseModal();
            
            // Recarregar dados do dashboard
            console.log('🔄 Recarregando dados do dashboard...');
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            } else {
                // Se a função não existir, recarregar a página
                console.log('🔄 Recarregando página...');
                window.location.reload();
            }
            editingExpenseId = null;
        }, 600);
        
    } catch (error) {
        console.log('❌ Erro ao adicionar despesa:', error.message);
        errorDiv.textContent = `Erro: ${error.message}`;
        errorDiv.classList.remove('hidden');
    }
}

// Adicionar listener ao botão "Adicionar Despesa"
function initializeExpenseModal() {
    console.log('🔵 Inicializando event listeners da modal');
    
    const addExpenseBtn = document.querySelector('[data-action="add-expense"]');
    if (addExpenseBtn) {
        // Remover listeners anteriores para evitar duplicação
        addExpenseBtn.onclick = null;
        addExpenseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openExpenseModal(e);
            return false;
        }, true); // Usar capture phase
        console.log('✅ Listener adicionado ao botão "Adicionar Despesa"');
    } else {
        console.log('❌ Botão "Adicionar Despesa" não encontrado');
    }

    // Configurar toggle de tipo entrada/saída
    setupExpenseTypeToggle();
}

// Expor funções para edição/deleção
async function deleteExpense(id) {
    // ⚠️ SEGURANÇA: Usa sessionStorage para tokens
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return alert('Usuário não autenticado');
    if (!confirm('Deseja realmente excluir esta despesa?')) return;
    const response = await fetch(`/api/v1/gastos-variaveis/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        const txt = await response.text();
        console.error('Erro ao deletar', txt);
        alert('Erro ao deletar despesa');
        return;
    }
    if (typeof loadDashboardData === 'function') loadDashboardData();
}

window.expenseModal = {
    openExpenseModalForEdit,
    deleteExpense
};

// Chamar inicialização quando o DOM estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExpenseModal);
    console.log('🔵 Aguardando DOMContentLoaded...');
} else {
    initializeExpenseModal();
    console.log('🔵 DOM já carregado, inicializando agora...');
}
