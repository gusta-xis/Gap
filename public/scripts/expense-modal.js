console.log('🔵 expense-modal.js carregado');

/* ==========================================================================
   UTILITÁRIOS GERAIS
   ========================================================================== */

function formatCurrencyInput(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length === 0) {
        input.value = '';
        return;
    }
    const numericValue = parseInt(value, 10) / 100;
    input.value = numericValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function parseCurrency(value) {
    if (!value) return 0;
    // Remove pontos de milhar e troca vírgula por ponto
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}

function normalizeCategorySlug(value) {
    const v = (value || '').toString().trim().toLowerCase();
    if (!v) return '';
    
    // Mapeamento simples para slugs conhecidos (opcional)
    if (v.includes('aliment') || v.includes('merc')) return 'alimentacao';
    if (v.includes('transp')) return 'transporte';
    if (v.includes('saud')) return 'saude';
    if (v.includes('educ')) return 'educacao';
    if (v.includes('entreten') || v.includes('lazer')) return 'entretenimento';
    if (v.includes('outros') || v.includes('outro')) return 'outros';
    
    // Slugify padrão
    return v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

function getUserIdFromStorage() {
    try {
        const userDataString = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (!userDataString) return null;
        const userData = JSON.parse(userDataString);
        return userData.id || userData.user_id || null;
    } catch (e) {
        return null;
    }
}

/* ==========================================================================
   GERENCIAMENTO DE CATEGORIAS (Select e LocalStorage)
   ========================================================================== */

function loadCustomCategoriesFromStorage() {
    const userId = getUserIdFromStorage();
    if (!userId) return [];
    try {
        const stored = localStorage.getItem(`customCategories_${userId}`);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

function saveCustomCategoriesToStorage(list) {
    const userId = getUserIdFromStorage();
    if (!userId) return;
    localStorage.setItem(`customCategories_${userId}`, JSON.stringify(list || []));
}

// Sincroniza o <select> com as categorias do localStorage
function syncExpenseCategories() {
    const select = document.getElementById('expenseCategory');
    if (!select) return;

    let categorias = loadCustomCategoriesFromStorage();
    if (!Array.isArray(categorias)) categorias = [];

    // Categorias Padrão (Hardcoded para garantir que sempre existam)
    const defaultCategories = [
        { id: 'alimentacao', nome: 'Alimentação' },
        { id: 'transporte', nome: 'Transporte' },
        { id: 'moradia', nome: 'Moradia' },
        { id: 'saude', nome: 'Saúde' },
        { id: 'lazer', nome: 'Lazer' },
        { id: 'educacao', nome: 'Educação' },
        { id: 'outros', nome: 'Outros' }
    ];

    // Mescla categorias padrão com customizadas (evitando duplicatas pelo nome ou ID)
    const allCategories = [...defaultCategories];
    categorias.forEach(customCat => {
        const exists = allCategories.some(c =>
            c.id == customCat.id ||
            c.nome.toLowerCase() === customCat.nome.toLowerCase()
        );
        if (!exists) {
            allCategories.push(customCat);
        }
    });

    // Remove duplicatas exatas de id
    const seenIds = new Set();
    const uniqueCategories = [];
    allCategories.forEach(cat => {
        if (!seenIds.has(cat.id)) {
            uniqueCategories.push(cat);
            seenIds.add(cat.id);
        }
    });

    // Ordena todas as categorias, mas força "Outros" para o final
    uniqueCategories.sort((a, b) => {
        const aIsOutros = a.nome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'outros';
        const bIsOutros = b.nome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'outros';
        if (aIsOutros && !bIsOutros) return 1;
        if (!aIsOutros && bIsOutros) return -1;
        return a.nome.localeCompare(b.nome, 'pt-BR');
    });

    // Limpa o select atual (mantém apenas o placeholder)
    select.innerHTML = '<option value="">(Opcional) Selecione uma categoria</option>';

    // Popula o select
    uniqueCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.nome;
        select.appendChild(opt);
    });
}

// Busca categorias do backend e atualiza o localStorage
async function fetchAndSyncCustomCategories() {
    const userId = getUserIdFromStorage();
    if (!userId) return;

    try {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
        const response = await fetch('/api/v1/categorias', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) return;
        
        const categoriasBackend = await response.json();
        saveCustomCategoriesToStorage(categoriasBackend);
        syncExpenseCategories();
    } catch (e) {
        console.error('Erro ao buscar categorias:', e);
        // Fallback: usa o que já tem no localStorage
        syncExpenseCategories(); 
    }
}

/* ==========================================================================
   MODAL DE DESPESA VARIÁVEL (Adicionar / Editar)
   ========================================================================== */

let selectedExpenseType = 'saida';
let editingExpenseId = null;

function setExpenseType(type) {
    selectedExpenseType = type || 'saida';
    const buttons = document.querySelectorAll('[data-expense-type]');
    
    buttons.forEach((btn) => {
        const isActive = btn.dataset.expenseType === selectedExpenseType;
        const isEntrada = btn.dataset.expenseType === 'entrada';

        // Reset classes base
        btn.className = "flex-1 p-2 rounded-lg border transition-colors duration-200 font-medium";

        if (isActive) {
            if (isEntrada) {
                btn.classList.add('bg-green-600', 'text-white', 'border-green-600', 'shadow-md');
            } else {
                btn.classList.add('bg-red-600', 'text-white', 'border-red-600', 'shadow-md');
            }
        } else {
            // Estilo inativo
            btn.classList.add('bg-white', 'text-slate-600', 'border-slate-200', 'hover:bg-slate-50', 'dark:bg-slate-800', 'dark:text-slate-300', 'dark:border-slate-700');
            if (isEntrada) btn.classList.add('hover:text-green-600', 'hover:border-green-200');
            else btn.classList.add('hover:text-red-600', 'hover:border-red-200');
        }
    });
}

function setupExpenseTypeToggle() {
    const buttons = document.querySelectorAll('[data-expense-type]');
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            setExpenseType(btn.dataset.expenseType);
        });
    });
    setExpenseType('saida');
}

function openExpenseModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    
    const modal = document.getElementById('addExpenseModal');
    if (!modal) return console.error('Modal addExpenseModal não encontrado');
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Limpar campos
    document.getElementById('expenseDescription').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseCategory').value = '';
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0]; // Hoje
    
    // Resetar estado
    editingExpenseId = null;
    const submitBtn = document.querySelector('[data-action="submit-expense"]');
    if(submitBtn) submitBtn.textContent = 'Adicionar';
    
    // Esconder mensagens
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    if (errorDiv) errorDiv.classList.add('hidden');
    if (successDiv) successDiv.classList.add('hidden');

    setExpenseType('saida');
    fetchAndSyncCustomCategories(); // Atualiza lista de categorias
}

function closeExpenseModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const modal = document.getElementById('addExpenseModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function openExpenseModalForEdit(expense) {
    const modal = document.getElementById('addExpenseModal');
    if (!modal) return;

    // Sincroniza categorias antes de preencher
    fetchAndSyncCustomCategories().then(() => {
        document.getElementById('expenseDescription').value = expense.nome || expense.descricao || '';
        const amountVal = parseFloat(expense.valor || 0);
        document.getElementById('expenseAmount').value = amountVal.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        });
        const catValue = expense.categoria_id || normalizeCategorySlug(expense.categoria || '');
        document.getElementById('expenseCategory').value = catValue;
        let dateVal = '';
        const rawDate = expense.data_gasto || expense.data || expense.created_at;
        if (rawDate) {
            dateVal = new Date(rawDate).toISOString().split('T')[0];
        }
        document.getElementById('expenseDate').value = dateVal;
        editingExpenseId = expense.id;
        const submitBtn = document.querySelector('[data-action="submit-expense"]');
        if(submitBtn) submitBtn.textContent = 'Salvar Alterações';
        setExpenseType(expense.tipo || 'saida');
        document.getElementById('errorMessage')?.classList.add('hidden');
        document.getElementById('successMessage')?.classList.add('hidden');
    });

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

async function submitExpense(event) {
    if (event) event.preventDefault();
    
    const submitBtn = document.querySelector('[data-action="submit-expense"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Salvando...';
    submitBtn.disabled = true;

    const description = document.getElementById('expenseDescription').value.trim();
    const amountInput = document.getElementById('expenseAmount').value;
    const amount = parseCurrency(amountInput);
    const category = document.getElementById('expenseCategory').value;
    const type = selectedExpenseType;
    const date = document.getElementById('expenseDate').value;

    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');

    // Validação Básica
    if (!description || !amount || !date) {
        errorDiv.textContent = 'Preencha todos os campos obrigatórios (*).';
        errorDiv.classList.remove('hidden');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }

    try {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
        const user = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user'));

        if (!token || !user) throw new Error('Sessão expirada. Faça login novamente.');

        const payload = {
            nome: description,
            valor: amount,
            categoria_id: category ? (isNaN(category) ? null : Number(category)) : null, // Se for número envia ID, senão null (ou trata slug no back)
            data_gasto: date,
            tipo: type,
            user_id: user.id
        };

        const isEdit = !!editingExpenseId;
        const url = isEdit ? `/api/v1/gastos-variaveis/${editingExpenseId}` : '/api/v1/gastos-variaveis';
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
            const err = await response.json();
            throw new Error(err.message || 'Erro ao salvar despesa.');
        }

        // Sucesso
        successDiv.textContent = isEdit ? 'Despesa atualizada!' : 'Despesa adicionada com sucesso!';
        successDiv.classList.remove('hidden');
        errorDiv.classList.add('hidden');

        // Atualizar UI após 1s
        setTimeout(() => {
            closeExpenseModal();
            // Atualiza Dashboard e Transações se as funções existirem
            if(window.loadDashboardData) window.loadDashboardData();
            if(window.initializeTransactionsPage) window.initializeTransactionsPage();
        }, 1000);

    } catch (error) {
        console.error(error);
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

/* ==========================================================================
   MODAL DE NOVA CATEGORIA
   ========================================================================== */

let customCategoryIcon = null;

function openAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Reset
    document.getElementById('newCategoryName').value = '';
    customCategoryIcon = null;
    document.querySelectorAll('.category-icon-btn').forEach(btn => 
        btn.classList.remove('border-primary', 'bg-primary/10')
    );
    document.getElementById('categoryErrorMessage')?.classList.add('hidden');
}

function closeAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Configura seleção de ícones no modal de categoria
function setupCategoryIconGrid() {
    const buttons = document.querySelectorAll('.category-icon-btn');
    buttons.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault(); // Evita submit se estiver num form
            buttons.forEach(b => b.classList.remove('border-primary', 'bg-primary/10'));
            btn.classList.add('border-primary', 'bg-primary/10');
            customCategoryIcon = btn.getAttribute('data-icon');
        };
    });
}

// Salvar Nova Categoria
async function saveNewCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const errorMsg = document.getElementById('categoryErrorMessage');
    const successMsg = document.getElementById('categorySuccessMessage');
    
    const nome = nameInput.value.trim();
    if (!nome) {
        errorMsg.textContent = 'Informe o nome da categoria.';
        errorMsg.classList.remove('hidden');
        return;
    }

    try {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
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

        if (!response.ok) throw new Error('Erro ao criar categoria.');

        const newCat = await response.json();
        
        // Atualiza cache local
        let currentCats = loadCustomCategoriesFromStorage();
        currentCats.push(newCat);
        saveCustomCategoriesToStorage(currentCats);
        
        // Atualiza Select
        syncExpenseCategories();
        if (window.refreshGastoFixoCategories) window.refreshGastoFixoCategories();

        successMsg.textContent = 'Categoria criada!';
        successMsg.classList.remove('hidden');
        
        setTimeout(() => {
            closeAddCategoryModal();
            // Seleciona a nova categoria automaticamente
            const select = document.getElementById('expenseCategory');
            if(select) select.value = newCat.id;
        }, 800);

    } catch (e) {
        errorMsg.textContent = e.message;
        errorMsg.classList.remove('hidden');
    }
}

// Funções de acesso externo (para botões "+" nos selects)
window.showAddCategoryFromExpense = openAddCategoryModal;
window.showAddCategoryFromGastoFixo = openAddCategoryModal; // Reusa o mesmo modal
window.closeAddCategoryAndReturnToExpense = closeAddCategoryModal;

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */

function initializeExpenseModal() {
    console.log('🚀 Inicializando Expense Modal...');
    
    // Listener do botão principal "Adicionar Despesa"
    const addBtn = document.querySelector('[data-action="add-expense"]');
    if (addBtn) {
        // Remove listeners antigos para evitar duplicação (cloneNode hack ou removeEventListener)
        const newBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newBtn, addBtn);
        newBtn.addEventListener('click', openExpenseModal);
    }

    setupExpenseTypeToggle();
    fetchAndSyncCustomCategories();
    setupCategoryIconGrid();
}

// Expor funções globais
window.openExpenseModal = openExpenseModal;
window.closeExpenseModal = closeExpenseModal;
window.submitExpense = submitExpense;
window.openExpenseModalForEdit = openExpenseModalForEdit;
window.openAddCategoryModal = openAddCategoryModal;
window.closeAddCategoryModal = closeAddCategoryModal;
window.saveNewCategory = saveNewCategory;
window.initializeExpenseModal = initializeExpenseModal;
window.refreshGastoFixoCategories = async function() {
    await fetchAndSyncCustomCategoriesGastoFixo();
    syncGastoFixoCategories();
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    initializeExpenseModal();
});