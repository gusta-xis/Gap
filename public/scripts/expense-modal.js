console.log('🔵 expense-modal.js carregado (Versão Correção Erro 500)');

// ========================================
// UTILITÁRIOS DE FORMATAÇÃO E DATA
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

function getLocalDateString() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - offset);
    return localDate.toISOString().split('T')[0];
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
// GESTÃO DE CATEGORIAS (CORREÇÃO ERRO 500)
// ========================================

function syncExpenseCategories() {
    const select = document.getElementById('expenseCategory');
    if (!select) {
        console.warn('⚠️ Select de categoria não encontrado');
        return;
    }

    let categoriasDoBanco = loadCustomCategoriesFromStorage();
    if (!Array.isArray(categoriasDoBanco)) categoriasDoBanco = [];

    // Categorias padrão que queremos exibir
    const defaultCategories = [
        { nome: 'Alimentação', icon: 'restaurant' },
        { nome: 'Transporte', icon: 'directions_car' },
        { nome: 'Moradia', icon: 'home' },
        { nome: 'Saúde', icon: 'favorite' },
        { nome: 'Lazer', icon: 'movie' },
        { nome: 'Educação', icon: 'school' },
        { nome: 'Outros', icon: 'more_horiz' }
    ];

    const finalCategories = [];
    const addedNames = new Set();

    // 1. Adiciona primeiro as categorias que vieram do BANCO (pois elas têm ID numérico válido)
    categoriasDoBanco.forEach(cat => {
        const nomeNormalizado = cat.nome.trim().toLowerCase();
        if (!addedNames.has(nomeNormalizado)) {
            finalCategories.push({
                id: cat.id, // ID numérico do banco (ex: 15)
                nome: cat.nome
            });
            addedNames.add(nomeNormalizado);
        }
    });

    // 2. Adiciona as categorias padrão APENAS se não existirem ainda
    // Se a categoria padrão for adicionada aqui, ela NÃO tem ID do banco.
    // Isso é perigoso para o backend, então usaremos um ID temporário e trataremos no submit.
    defaultCategories.forEach(def => {
        const nomeNormalizado = def.nome.trim().toLowerCase();
        if (!addedNames.has(nomeNormalizado)) {
            finalCategories.push({
                id: `temp_${nomeNormalizado.replace(/\s+/g, '_')}`, // ID de texto temporário
                nome: def.nome
            });
            addedNames.add(nomeNormalizado);
        }
    });

    // Ordenação
    finalCategories.sort((a, b) => {
        const normalize = (s) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalize(a.nome) === 'outros') return 1;
        if (normalize(b.nome) === 'outros') return -1;
        return a.nome.localeCompare(b.nome, 'pt-BR');
    });

    // Renderiza o Select
    const currentValue = select.value;
    select.innerHTML = '<option value="">(Opcional) Selecione uma categoria</option>';

    finalCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = String(cat.id);
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
        if (!token) throw new Error('Token não encontrado');

        const response = await fetch('/api/v1/categorias', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            if (response.status === 401) throw new Error('Sessão expirada');
            throw new Error(`Erro ${response.status}`);
        }
        
        const categoriasBackendRaw = await response.json();

        // Normaliza
        const categoriasBackend = (Array.isArray(categoriasBackendRaw) ? categoriasBackendRaw : []).map(c => ({
            id: c.id ?? c.categoria_id, // Garante pegar o ID numérico
            nome: c.nome || c.label || 'Sem nome',
            icon: c.icon || 'category'
        }));

        saveCustomCategoriesToStorage(categoriasBackend);
        syncExpenseCategories(); // Atualiza o select mesclando corretamente
        
        console.log('✅ Categorias sincronizadas');
    } catch (e) {
        console.error('❌ Erro ao buscar categorias:', e);
        if (retryCount < 1 && e.message !== 'Sessão expirada') {
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
    if (!modal) return;
    
    const titleEl = modal.querySelector('h2');
    if (titleEl) titleEl.textContent = 'Nova Despesa';

    const descField = document.getElementById('expenseDescription');
    const amountField = document.getElementById('expenseAmount');
    const categoryField = document.getElementById('expenseCategory');
    const dateField = document.getElementById('expenseDate');
    
    if (descField) descField.value = '';
    if (amountField) amountField.value = '';
    if (categoryField) categoryField.value = '';
    if (dateField) dateField.value = getLocalDateString();
    
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
    fetchAndSyncCustomCategories(); // Garante lista atualizada

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    setTimeout(() => { if (descField) descField.focus(); }, 100);
}

function closeExpenseModal(event) {
    if (event) { 
        event.preventDefault(); 
        event.stopPropagation(); 
    }
    
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
    if (!expense || !expense.id) return;
    
    const modal = document.getElementById('addExpenseModal');
    if (!modal) return;

    const titleEl = modal.querySelector('h2');
    if (titleEl) titleEl.textContent = 'Editar Despesa';

    fetchAndSyncCustomCategories().then(() => {
        const descField = document.getElementById('expenseDescription');
        if (descField) descField.value = expense.nome || expense.descricao || '';

        const amountField = document.getElementById('expenseAmount');
        if (amountField) {
            const amountVal = parseFloat(expense.valor || 0);
            amountField.value = amountVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        const categoryField = document.getElementById('expenseCategory');
        if (categoryField) {
            const catId = expense.categoria?.id != null ? String(expense.categoria.id) : (expense.categoria_id != null ? String(expense.categoria_id) : '');
            
            // Tenta setar pelo ID
            let selected = false;
            if (catId) {
                const option = Array.from(categoryField.options).find(o => o.value === catId);
                if (option) {
                    categoryField.value = catId;
                    selected = true;
                }
            }
            
            // Fallback pelo nome se não achou ID
            if (!selected) {
                 const catNome = (expense.categoria_nome || expense.categoria || '').toString().trim().toLowerCase();
                 if (catNome) {
                     const match = Array.from(categoryField.options).find(o => o.textContent.trim().toLowerCase() === catNome);
                     if (match) categoryField.value = match.value;
                 }
            }
        }

        const dateField = document.getElementById('expenseDate');
        if (dateField) {
            try {
                const rawDate = expense.data_gasto || expense.data || expense.created_at;
                dateField.value = rawDate ? new Date(rawDate).toISOString().split('T')[0] : getLocalDateString();
            } catch (e) {
                dateField.value = getLocalDateString();
            }
        }

        setExpenseType(expense.tipo || 'saida');
        editingExpenseId = expense.id;

        const submitBtn = document.querySelector('[data-action="submit-expense"]');
        if (submitBtn) {
            submitBtn.textContent = 'Salvar Alterações';
            submitBtn.disabled = false;
        }

        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) errorDiv.classList.add('hidden');
    });

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// ========================================
// SUBMISSÃO DO FORMULÁRIO (CORREÇÃO DE PAYLOAD)
// ========================================

async function submitExpense(event) {
    if (event) event.preventDefault();
    
    console.log('💾 Iniciando submissão...');
    
    const submitBtn = document.querySelector('[data-action="submit-expense"]');
    if (!submitBtn) return;
    
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Salvando...';
    submitBtn.disabled = true;

    const descField = document.getElementById('expenseDescription');
    const amountField = document.getElementById('expenseAmount');
    const categoryField = document.getElementById('expenseCategory');
    const dateField = document.getElementById('expenseDate');
    
    const description = descField ? descField.value.trim() : '';
    const amount = parseCurrency(amountField ? amountField.value : '');
    const date = dateField ? dateField.value : '';
    const type = selectedExpenseType;
    
    const rawCategoryValue = categoryField ? categoryField.value : '';
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');

    if (!description || amount <= 0 || !date) {
        if (errorDiv) {
            errorDiv.textContent = 'Preencha todos os campos obrigatórios.';
            errorDiv.classList.remove('hidden');
        }
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }

    try {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
        const userId = getUserIdFromStorage();
        
        if (!token) throw new Error('Sessão expirada. Faça login novamente.');
        if (!userId) throw new Error('Erro de usuário. Faça login novamente.');

        // Construção do Payload Seguro
        const payload = {
            nome: description,
            valor: amount,
            data_gasto: date,
            tipo: type,
            user_id: userId
        };
        
        // TRATAMENTO CRÍTICO DE CATEGORIA:
        // Se o valor for numérico (ID do banco), envia.
        // Se for string começando com "temp_" (categoria padrão sem ID), NÃO ENVIA o campo categoria_id.
        // Muitos backends explodem com 'temp_xxx' ou com 'null'. 
        // Se não enviarmos a chave, o banco assume NULL ou DEFAULT, o que evita o erro 500.
        
        if (rawCategoryValue && !rawCategoryValue.startsWith('temp_')) {
            const numId = Number(rawCategoryValue);
            if (!isNaN(numId) && numId > 0) {
                payload.categoria_id = numId;
            }
        } else {
            console.log('⚠️ Categoria sem ID de banco selecionada. Enviando sem categoria_id para evitar erro 500.');
            // Opcional: Se seu backend aceitar nome da categoria, descomente abaixo:
            // payload.categoria_nome = categoryField.options[categoryField.selectedIndex].text;
        }

        console.log('📤 Payload:', payload);

        const isEdit = !!editingExpenseId;
        const url = isEdit 
            ? `/api/v1/gastos-variaveis/${editingExpenseId}` 
            : '/api/v1/gastos-variaveis';
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // Tenta ler o erro do backend mesmo se for 500
            const errText = await response.text();
            let errMsg = `Erro ${response.status}`;
            try {
                const errJson = JSON.parse(errText);
                errMsg = errJson.message || errMsg;
            } catch (e) {
                console.warn('Backend retornou erro não-JSON:', errText);
            }
            throw new Error(errMsg);
        }

        const result = await response.json();
        console.log('✅ Sucesso:', result);

        if (successDiv) {
            successDiv.textContent = isEdit ? 'Atualizado com sucesso!' : 'Salvo com sucesso!';
            successDiv.classList.remove('hidden');
        }
        if (errorDiv) errorDiv.classList.add('hidden');

        setTimeout(() => {
            closeExpenseModal();
            if (window.loadAllTransactions) window.loadAllTransactions();
            if (window.loadDashboardData) window.loadDashboardData();
            if (window.initTransacoesPage) window.initTransacoesPage();
        }, 1000);

    } catch (error) {
        console.error('❌ Erro no submit:', error);
        if (errorDiv) {
            errorDiv.textContent = error.message || 'Erro ao salvar despesa.';
            errorDiv.classList.remove('hidden');
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
            throw new Error('Erro ao criar categoria.');
        }

        const newCatRaw = await response.json();
        
        // Formata para salvar no storage
        const newCat = {
            id: newCatRaw.id ?? newCatRaw.categoria_id,
            nome: newCatRaw.nome || 'Sem nome',
            icon: newCatRaw.icon || 'category'
        };
        
        let currentCats = loadCustomCategoriesFromStorage();
        currentCats.push(newCat);
        saveCustomCategoriesToStorage(currentCats);
        
        syncExpenseCategories(); // Atualiza a lista
        
        if (typeof window.syncGastoFixoCategories === 'function') {
            window.syncGastoFixoCategories();
        }

        if (successMsg) {
            successMsg.textContent = 'Criado com sucesso!';
            successMsg.classList.remove('hidden');
        }
        if (errorMsg) errorMsg.classList.add('hidden');
        
        setTimeout(() => {
            closeAddCategoryModal();
            const select = document.getElementById('expenseCategory');
            if (select && newCat.id) select.value = String(newCat.id);
        }, 800);

    } catch (e) {
        if (errorMsg) {
            errorMsg.textContent = e.message;
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
    if (addBtn) addBtn.addEventListener('click', openExpenseModal);

    const closeBtn = document.querySelector('[data-action="close-expense-modal"]');
    if (closeBtn) closeBtn.addEventListener('click', closeExpenseModal);

    const submitBtn = document.querySelector('[data-action="submit-expense"]');
    if (submitBtn) submitBtn.addEventListener('click', submitExpense);

    const amountField = document.getElementById('expenseAmount');
    if (amountField) amountField.addEventListener('input', handleAmountInput);

    const modal = document.getElementById('addExpenseModal');
    if (modal) modal.addEventListener('click', handleModalBackdropClick);

    setupExpenseTypeToggle();
    fetchAndSyncCustomCategories();
    setupCategoryIconGrid();
}

function handleAmountInput() { formatCurrencyInput(this); }
function handleModalBackdropClick(e) { if (e.target === this) closeExpenseModal(); }

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
    await fetchAndSyncCustomCategories();
    if (typeof window.syncGastoFixoCategories === 'function') window.syncGastoFixoCategories();
};

let isInitialized = false;
function safeInitialize() {
    if (isInitialized) return;
    isInitialized = true;
    initializeExpenseModal();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInitialize);
} else {
    safeInitialize();
}
console.log('✅ expense-modal.js carregado e pronto');