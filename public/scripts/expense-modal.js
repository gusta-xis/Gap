console.log('🔵 expense-modal.js carregado');


// ========================================
// UTILITÁRIOS DE FORMATAÇÃO
// ========================================


function formatCurrencyInput(input) {
    if (!input) return;
    
    let value = input.value.replace(/\D/g, '');
    if (value.length === 0) {
        input.value = '';
        return;
    }
    
    if (value.length > 10) {
        value = value.substring(0, 10);
    }
    
    const numericValue = parseInt(value, 10) / 100;
    input.value = numericValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function parseCurrency(value) {
    if (!value) return 0;
    try {
        const parsed = parseFloat(value.replace(/\./g, '').replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    } catch (e) {
        console.error('Erro ao parsear valor:', e);
        return 0;
    }
}


// ========================================
// GESTÃO DE USUÁRIO E ARMAZENAMENTO
// ========================================


function getUserIdFromStorage() {
    try {
        const userDataString = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (!userDataString) return null;
        const userData = JSON.parse(userDataString);
        return userData.id || userData.user_id || null;
    } catch (e) {
        console.error('Erro ao obter user ID:', e);
        return null;
    }
}


function loadCustomCategoriesFromStorage() {
    const userId = getUserIdFromStorage();
    if (!userId) return [];
    try {
        const stored = localStorage.getItem(`customCategories_${userId}`);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Erro ao carregar categorias:', e);
        return [];
    }
}


function saveCustomCategoriesToStorage(list) {
    const userId = getUserIdFromStorage();
    if (!userId) return;
    try {
        localStorage.setItem(`customCategories_${userId}`, JSON.stringify(list || []));
    } catch (e) {
        console.error('Erro ao salvar categorias:', e);
    }
}


// ========================================
// GESTÃO DE CATEGORIAS
// ========================================


function syncExpenseCategories() {
    const select = document.getElementById('expenseCategory');
    if (!select) {
        console.warn('⚠️ Select de categoria não encontrado');
        return;
    }

    let categorias = loadCustomCategoriesFromStorage();
    if (!Array.isArray(categorias)) categorias = [];

    const defaultCategories = [
        { id: 'alimentacao', nome: 'Alimentação' },
        { id: 'transporte', nome: 'Transporte' },
        { id: 'moradia', nome: 'Moradia' },
        { id: 'saude', nome: 'Saúde' },
        { id: 'lazer', nome: 'Lazer' },
        { id: 'educacao', nome: 'Educação' },
        { id: 'outros', nome: 'Outros' }
    ];

    const allCategories = [...defaultCategories];

    categorias.forEach(customCat => {
        // Normaliza resposta do backend de categorias
        const cat = {
            id: customCat.id ?? customCat.categoria_id ?? customCat.slug ?? customCat.nome,
            nome: customCat.nome || customCat.label || customCat.descricao || 'Sem nome'
        };

        const exists = allCategories.some(c =>
            String(c.id) === String(cat.id) ||
            c.nome.toLowerCase() === cat.nome.toLowerCase()
        );
        if (!exists) {
            allCategories.push(cat);
        }
    });

    const uniqueMap = new Map();
    allCategories.forEach(cat => {
        const key = String(cat.id);
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, cat);
        }
    });
    const uniqueCategories = Array.from(uniqueMap.values());

    uniqueCategories.sort((a, b) => {
        const normalize = (s) =>
            s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const aIsOutros = normalize(a.nome) === 'outros';
        const bIsOutros = normalize(b.nome) === 'outros';
        if (aIsOutros && !bIsOutros) return 1;
        if (!aIsOutros && bIsOutros) return -1;
        return a.nome.localeCompare(b.nome, 'pt-BR');
    });

    const currentValue = select.value;
    select.innerHTML = '<option value="">(Opcional) Selecione uma categoria</option>';

    uniqueCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id != null ? String(cat.id) : '';
        opt.textContent = cat.nome;
        select.appendChild(opt);
    });

    if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
        select.value = currentValue;
    }
}


async function fetchAndSyncCustomCategories(retryCount = 0) {
    const userId = getUserIdFromStorage();
    if (!userId) {
        console.warn('⚠️ Usuário não identificado, usando categorias locais');
        syncExpenseCategories();
        return;
    }

    try {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) {
            throw new Error('Token não encontrado');
        }

        const response = await fetch('/api/v1/categorias', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Sessão expirada');
            }
            throw new Error(`Erro ${response.status}`);
        }
        
        const categoriasBackendRaw = await response.json();

        // Normaliza estrutura das categorias vindas do backend
        const categoriasBackend = (Array.isArray(categoriasBackendRaw) ? categoriasBackendRaw : []).map(c => ({
            id: c.id ?? c.categoria_id ?? c.slug ?? c.nome,
            nome: c.nome || c.label || c.descricao || 'Sem nome',
            icon: c.icon || c.icone || 'category'
        }));

        saveCustomCategoriesToStorage(categoriasBackend);
        syncExpenseCategories();
        
        console.log('✅ Categorias sincronizadas');
    } catch (e) {
        console.error('❌ Erro ao buscar categorias:', e);
        
        if (retryCount < 1 && e.message !== 'Sessão expirada') {
            console.log('🔄 Tentando novamente...');
            setTimeout(() => fetchAndSyncCustomCategories(retryCount + 1), 1000);
            return;
        }
        
        syncExpenseCategories();
    }
}


// ========================================
// GESTÃO DE TIPO DE TRANSAÇÃO
// ========================================


let selectedExpenseType = 'saida';
let editingExpenseId = null;


function setExpenseType(type) {
    selectedExpenseType = type || 'saida';
    const buttons = document.querySelectorAll('[data-expense-type]');
    
    buttons.forEach((btn) => {
        const isActive = btn.dataset.expenseType === selectedExpenseType;
        const isEntrada = btn.dataset.expenseType === 'entrada';

        btn.className = "flex-1 p-2 rounded-lg border transition-colors duration-200 font-medium";

        if (isActive) {
            if (isEntrada) {
                btn.classList.add('bg-green-600', 'text-white', 'border-green-600', 'shadow-md');
            } else {
                btn.classList.add('bg-red-600', 'text-white', 'border-red-600', 'shadow-md');
            }
        } else {
            btn.classList.add('bg-white', 'text-slate-600', 'border-slate-200', 'hover:bg-slate-50');
            btn.classList.add('dark:bg-slate-800', 'dark:text-slate-300', 'dark:border-slate-700');
            if (isEntrada) {
                btn.classList.add('hover:text-green-600', 'hover:border-green-200');
            } else {
                btn.classList.add('hover:text-red-600', 'hover:border-red-200');
            }
        }
    });
}


function setupExpenseTypeToggle() {
    const buttons = document.querySelectorAll('[data-expense-type]');
    buttons.forEach((btn) => {
        btn.removeEventListener('click', handleExpenseTypeClick);
        btn.addEventListener('click', handleExpenseTypeClick);
    });
    setExpenseType('saida');
}


function handleExpenseTypeClick(e) {
    e.preventDefault();
    setExpenseType(this.dataset.expenseType);
}


// ========================================
// CONTROLE DO MODAL
// ========================================


function openExpenseModal(event) {
    if (event) { 
        event.preventDefault(); 
        event.stopPropagation(); 
    }
    
    console.log('📝 Abrindo modal para NOVA despesa');
    
    const modal = document.getElementById('addExpenseModal');
    if (!modal) {
        console.error('❌ Modal addExpenseModal não encontrado');
        return;
    }
    
    const titleEl = modal.querySelector('h2');
    if (titleEl) {
        titleEl.textContent = 'Nova Despesa';
    }

    const descField = document.getElementById('expenseDescription');
    const amountField = document.getElementById('expenseAmount');
    const categoryField = document.getElementById('expenseCategory');
    const dateField = document.getElementById('expenseDate');
    
    if (descField) descField.value = '';
    if (amountField) amountField.value = '';
    if (categoryField) categoryField.value = '';
    if (dateField) dateField.value = new Date().toISOString().split('T')[0];
    
    editingExpenseId = null;
    
    const submitBtn = document.querySelector('[data-action="submit-expense"]');
    if (submitBtn) {
        submitBtn.textContent = 'Adicionar';
        submitBtn.disabled = false;
    }
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    if (errorDiv) errorDiv.classList.add('hidden');
    if (successDiv) successDiv.classList.add('hidden');

    setExpenseType('saida');
    fetchAndSyncCustomCategories();

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    setTimeout(() => {
        if (descField) descField.focus();
    }, 100);
    
    console.log('✅ Modal aberto');
}


function closeExpenseModal(event) {
    if (event) { 
        event.preventDefault(); 
        event.stopPropagation(); 
    }
    
    console.log('❌ Fechando modal');
    
    const modal = document.getElementById('addExpenseModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    
    editingExpenseId = null;
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    if (errorDiv) errorDiv.classList.add('hidden');
    if (successDiv) successDiv.classList.add('hidden');
}


function openExpenseModalForEdit(expense) {
    if (!expense || !expense.id) {
        console.error('❌ Despesa inválida:', expense);
        return;
    }
    
    console.log('🔧 Abrindo modal para EDIÇÃO:', expense);
    
    const modal = document.getElementById('addExpenseModal');
    if (!modal) {
        console.error('❌ Modal não encontrado');
        return;
    }

    const titleEl = modal.querySelector('h2');
    if (titleEl) {
        titleEl.textContent = 'Editar Despesa';
    }

    // Garante que categorias estão sincronizadas antes de setar o valor
    fetchAndSyncCustomCategories().then(() => {
        const descField = document.getElementById('expenseDescription');
        if (descField) {
            descField.value = expense.nome || expense.descricao || '';
        }

        const amountField = document.getElementById('expenseAmount');
        if (amountField) {
            const amountVal = parseFloat(expense.valor || 0);
            amountField.value = amountVal.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
            });
        }

        const categoryField = document.getElementById('expenseCategory');
        if (categoryField) {
            // Tenta obter o id da categoria de forma robusta
            const catId =
                expense.categoria?.id != null
                    ? String(expense.categoria.id)
                    : (expense.categoria_id != null
                        ? String(expense.categoria_id)
                        : '');

            const catNome = (expense.categoria_nome || expense.categoria || '').toString().trim().toLowerCase();

            console.log('📂 Categoria id bruto:', expense.categoria_id, ' | catId usado:', catId, ' | nome:', catNome);

            let selected = false;

            // 1) tenta por id
            if (catId && Array.from(categoryField.options).some(o => o.value === catId)) {
                categoryField.value = catId;
                selected = true;
            }

            // 2) fallback: tenta por nome da categoria
            if (!selected && catNome) {
                const match = Array.from(categoryField.options).find(o =>
                    o.textContent.trim().toLowerCase() === catNome
                );
                if (match) {
                    categoryField.value = match.value;
                    selected = true;
                }
            }

            console.log('📂 Categoria selecionada?', selected, ' | valor final:', categoryField.value);
        }

        const dateField = document.getElementById('expenseDate');
        if (dateField) {
            let dateVal = '';
            const rawDate = expense.data_gasto || expense.data || expense.created_at;
            if (rawDate) {
                try {
                    const date = new Date(rawDate);
                    if (!isNaN(date.getTime())) {
                        dateVal = date.toISOString().split('T')[0];
                    } else {
                        dateVal = new Date().toISOString().split('T')[0];
                    }
                } catch (e) {
                    console.error('Erro ao formatar data:', e);
                    dateVal = new Date().toISOString().split('T')[0];
                }
            }
            dateField.value = dateVal;
        }

        const tipo = expense.tipo || 'saida';
        console.log('💰 Tipo:', tipo);
        setExpenseType(tipo);

        editingExpenseId = expense.id;
        console.log('🆔 ID:', editingExpenseId);

        const submitBtn = document.querySelector('[data-action="submit-expense"]');
        if (submitBtn) {
            submitBtn.textContent = 'Salvar Alterações';
            submitBtn.disabled = false;
        }

        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        if (errorDiv) errorDiv.classList.add('hidden');
        if (successDiv) successDiv.classList.add('hidden');

        console.log('✅ Modal preenchido para edição');
    }).catch(err => {
        console.error('❌ Erro ao carregar categorias:', err);
    });

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}


// ========================================
// SUBMISSÃO DO FORMULÁRIO
// ========================================


async function submitExpense(event) {
    if (event) event.preventDefault();
    
    console.log('💾 Iniciando submissão...');
    
    const submitBtn = document.querySelector('[data-action="submit-expense"]');
    if (!submitBtn) {
        console.error('❌ Botão de submit não encontrado');
        return;
    }
    
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Salvando...';
    submitBtn.disabled = true;

    const descField = document.getElementById('expenseDescription');
    const amountField = document.getElementById('expenseAmount');
    const categoryField = document.getElementById('expenseCategory');
    const dateField = document.getElementById('expenseDate');
    
    const description = descField ? descField.value.trim() : '';
    const amountInput = amountField ? amountField.value : '';
    const amount = parseCurrency(amountInput);
    const category = categoryField ? categoryField.value : '';
    const categoriaId = category ? category : null;
    const type = selectedExpenseType;
    const date = dateField ? dateField.value : '';

    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');

    if (!description || amount <= 0 || !date) {
        const errorMsg = 'Preencha todos os campos obrigatórios: descrição, valor e data.';
        console.error('❌ Validação falhou:', errorMsg);
        
        if (errorDiv) {
            errorDiv.textContent = errorMsg;
            errorDiv.classList.remove('hidden');
        }
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }

    try {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
        const userString = sessionStorage.getItem('user') || localStorage.getItem('user');
        
        if (!token || !userString) {
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        const user = JSON.parse(userString);
        if (!user.id) {
            throw new Error('Usuário inválido.');
        }

        const payload = {
            nome: description,
            valor: amount,
            categoria_id: categoriaId,
            data_gasto: date,
            tipo: type,
            user_id: user.id
        };

        console.log('📤 Payload:', payload);

        const isEdit = !!editingExpenseId;
        const url = isEdit 
            ? `/api/v1/gastos-variaveis/${editingExpenseId}` 
            : '/api/v1/gastos-variaveis';
        const method = isEdit ? 'PUT' : 'POST';

        console.log(`🌐 ${method} ${url}`);

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            throw new Error(err.message || `Erro ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Sucesso:', result);

        const successMsg = isEdit 
            ? 'Despesa atualizada com sucesso!' 
            : 'Despesa adicionada com sucesso!';
        
        if (successDiv) {
            successDiv.textContent = successMsg;
            successDiv.classList.remove('hidden');
        }
        
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }

        setTimeout(() => {
            closeExpenseModal();
            
            if (window.loadAllTransactions) {
                console.log('🔄 Recarregando transações...');
                window.loadAllTransactions();
            }
            if (window.loadDashboardData) {
                console.log('🔄 Recarregando dashboard...');
                window.loadDashboardData();
            }
            if (window.initializeTransactionsPage) {
                console.log('🔄 Reinicializando transações...');
                window.initializeTransactionsPage();
            }
        }, 1000);

    } catch (error) {
        console.error('❌ Erro:', error);
        
        if (errorDiv) {
            errorDiv.textContent = error.message || 'Erro ao salvar despesa.';
            errorDiv.classList.remove('hidden');
        }
        
        if (successDiv) {
            successDiv.classList.add('hidden');
        }
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}


// ========================================
// MODAL DE ADICIONAR CATEGORIA
// ========================================


let customCategoryIcon = null;


function openAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    const nameField = document.getElementById('newCategoryName');
    if (nameField) nameField.value = '';
    
    customCategoryIcon = null;
    
    document.querySelectorAll('.category-icon-btn').forEach(btn => 
        btn.classList.remove('border-primary', 'bg-primary/10')
    );
    
    const errorMsg = document.getElementById('categoryErrorMessage');
    const successMsg = document.getElementById('categorySuccessMessage');
    if (errorMsg) errorMsg.classList.add('hidden');
    if (successMsg) successMsg.classList.add('hidden');
}


function closeAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}


function setupCategoryIconGrid() {
    const buttons = document.querySelectorAll('.category-icon-btn');
    buttons.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            buttons.forEach(b => b.classList.remove('border-primary', 'bg-primary/10'));
            btn.classList.add('border-primary', 'bg-primary/10');
            customCategoryIcon = btn.getAttribute('data-icon');
        };
    });
}


async function saveNewCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const errorMsg = document.getElementById('categoryErrorMessage');
    const successMsg = document.getElementById('categorySuccessMessage');
    
    const nome = nameInput ? nameInput.value.trim() : '';
    if (!nome) {
        if (errorMsg) {
            errorMsg.textContent = 'Informe o nome da categoria.';
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    try {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado');
        
        const response = await fetch('/api/v1/categorias', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nome,
                icon: customCategoryIcon || 'category'
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            throw new Error(err.message || 'Erro ao criar categoria.');
        }

        const newCatRaw = await response.json();

        const newCat = {
            id: newCatRaw.id ?? newCatRaw.categoria_id ?? newCatRaw.slug ?? newCatRaw.nome,
            nome: newCatRaw.nome || newCatRaw.label || newCatRaw.descricao || 'Sem nome',
            icon: newCatRaw.icon || newCatRaw.icone || 'category'
        };
        
        let currentCats = loadCustomCategoriesFromStorage();
        currentCats.push(newCat);
        saveCustomCategoriesToStorage(currentCats);
        
        syncExpenseCategories();
        
        if (typeof window.syncGastoFixoCategories === 'function') {
            window.syncGastoFixoCategories();
        }

        if (successMsg) {
            successMsg.textContent = 'Categoria criada com sucesso!';
            successMsg.classList.remove('hidden');
        }
        
        if (errorMsg) {
            errorMsg.classList.add('hidden');
        }
        
        setTimeout(() => {
            closeAddCategoryModal();
            const select = document.getElementById('expenseCategory');
            if (select && newCat.id) {
                select.value = String(newCat.id);
            }
        }, 800);

    } catch (e) {
        console.error('Erro ao salvar categoria:', e);
        if (errorMsg) {
            errorMsg.textContent = e.message || 'Erro ao criar categoria.';
            errorMsg.classList.remove('hidden');
        }
    }
}


// ========================================
// INICIALIZAÇÃO
// ========================================


function initializeExpenseModal() {
    console.log('🚀 Inicializando Expense Modal...');
    
    const addBtn = document.querySelector('[data-action="add-expense"]');
    if (addBtn) {
        addBtn.removeEventListener('click', openExpenseModal);
        addBtn.addEventListener('click', openExpenseModal);
        console.log('✅ Botão "Adicionar Despesa" configurado');
    } else {
        console.warn('⚠️ Botão [data-action="add-expense"] não encontrado');
    }

    const closeBtn = document.querySelector('[data-action="close-expense-modal"]');
    if (closeBtn) {
        closeBtn.removeEventListener('click', closeExpenseModal);
        closeBtn.addEventListener('click', closeExpenseModal);
        console.log('✅ Botão "Fechar" configurado');
    }

    const submitBtn = document.querySelector('[data-action="submit-expense"]');
    if (submitBtn) {
        submitBtn.removeEventListener('click', submitExpense);
        submitBtn.addEventListener('click', submitExpense);
        console.log('✅ Botão "Submit" configurado');
    }

    const amountField = document.getElementById('expenseAmount');
    if (amountField) {
        amountField.removeEventListener('input', handleAmountInput);
        amountField.addEventListener('input', handleAmountInput);
        console.log('✅ Campo de valor configurado');
    }

    const modal = document.getElementById('addExpenseModal');
    if (modal) {
        modal.removeEventListener('click', handleModalBackdropClick);
        modal.addEventListener('click', handleModalBackdropClick);
    }

    setupExpenseTypeToggle();
    fetchAndSyncCustomCategories();
    setupCategoryIconGrid();
    
    console.log('✅ Expense Modal inicializado');
}


function handleAmountInput() {
    formatCurrencyInput(this);
}


function handleModalBackdropClick(e) {
    if (e.target === this) {
        closeExpenseModal();
    }
}


// ========================================
// EXPORTA FUNÇÕES GLOBAIS
// ========================================


window.openExpenseModal = openExpenseModal;
window.closeExpenseModal = closeExpenseModal;
window.submitExpense = submitExpense;
window.openExpenseModalForEdit = openExpenseModalForEdit;
window.openAddCategoryModal = openAddCategoryModal;
window.closeAddCategoryModal = closeAddCategoryModal;
window.saveNewCategory = saveNewCategory;
window.initializeExpenseModal = initializeExpenseModal;
window.syncExpenseCategories = syncExpenseCategories;
window.fetchAndSyncCustomCategories = fetchAndSyncCustomCategories;

window.showAddCategoryFromExpense = openAddCategoryModal;
window.showAddCategoryFromGastoFixo = openAddCategoryModal;
window.closeAddCategoryAndReturnToExpense = closeAddCategoryModal;

window.refreshGastoFixoCategories = async function() {
    console.log('🔄 Atualizando categorias...');
    await fetchAndSyncCustomCategories();
    
    if (typeof window.syncGastoFixoCategories === 'function') {
        window.syncGastoFixoCategories();
    }
};


// ========================================
// AUTO-INICIALIZAÇÃO
// ========================================


let isInitialized = false;

function safeInitialize() {
    if (isInitialized) {
        console.log('⚠️ Expense Modal já foi inicializado');
        return;
    }
    isInitialized = true;
    initializeExpenseModal();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInitialize);
} else {
    safeInitialize();
}

console.log('✅ expense-modal.js carregado e pronto');
