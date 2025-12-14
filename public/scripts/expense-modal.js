console.log('🔵 expense-modal.js carregado');

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

let selectedExpenseType = 'saida';
let editingExpenseId = null;
let customCategoryIcon = null;

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

        btn.classList.remove('shadow-lg', 'text-white', 'bg-[#cfe8dc]', 'bg-[#f4d8d8]', 'bg-[#2f9b6c]', 'bg-[#b91c1c]', 'dark:bg-emerald-700', 'dark:bg-red-800');
        btn.classList.add('bg-white', 'dark:bg-slate-700');

        if (isActive) {
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

    setExpenseType(selectedExpenseType);
}

function parseCurrency(value) {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}

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
    
    modal.classList.remove('hidden');
    console.log('✅ Modal aberta - classes:', modal.className);
    
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
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    if (errorDiv) errorDiv.classList.add('hidden');
    if (successDiv) successDiv.classList.add('hidden');

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
    
    modal.classList.add('hidden');
    console.log('✅ Modal fechada - classes:', modal.className);
}

async function submitExpense(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('🔵 Iniciando submissão de despesa');
    
    const description = document.getElementById('expenseDescription').value.trim();
    const amountInput = document.getElementById('expenseAmount').value;
    const amount = parseCurrency(amountInput);
    const category = document.getElementById('expenseCategory').value;
    const type = selectedExpenseType;
    const date = document.getElementById('expenseDate').value;
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
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
        
        const categoriaMap = {
            'alimentacao': 1,
            'transporte': 2,
            'saude': 4,
            'educacao': 6,
            'entretenimento': 5,
            'outros': 8
        };
        
        const expenseData = {
            nome: description,
            valor: amount,
            categoria_id: category ? (categoriaMap[category] || null) : null,
            data_gasto: date,
            tipo: type,
            user_id: user.id
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
        
        const responseText = await response.text();
        console.log('📥 Resposta completa:', responseText);
        
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
        
        successDiv.textContent = isEdit ? 'Despesa atualizada!' : 'Despesa adicionada com sucesso!';
        successDiv.classList.remove('hidden');

        setTimeout(async () => {
            closeExpenseModal();
            editingExpenseId = null;

            const refreshTasks = [];
            if (typeof window.refreshTransactions === 'function') {
                refreshTasks.push(Promise.resolve(window.refreshTransactions()));
            }
            if (typeof window.syncCustomCategories === 'function') {
                const synced = loadCustomCategoriesFromStorage();
                window.syncCustomCategories(synced);
            }
            if (typeof window.loadAllTransactions === 'function') {
                refreshTasks.push(Promise.resolve(window.loadAllTransactions()));
            }
            if (typeof window.loadDashboardData === 'function') {
                refreshTasks.push(Promise.resolve(window.loadDashboardData()));
            }

            if (refreshTasks.length) {
                try {
                    await Promise.allSettled(refreshTasks);
                } catch (refreshError) {
                    console.warn('⚠️ Erro ao atualizar dados após salvar despesa:', refreshError);
                }
            }
        }, 300);
        
    } catch (error) {
        console.log('❌ Erro ao adicionar despesa:', error.message);
        errorDiv.textContent = `Erro: ${error.message}`;
        errorDiv.classList.remove('hidden');
    }
}

function initializeExpenseModal() {
    console.log('🔵 Inicializando event listeners da modal');
    
    const addExpenseBtn = document.querySelector('[data-action="add-expense"]');
    if (addExpenseBtn) {
        addExpenseBtn.onclick = null;
        addExpenseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openExpenseModal(e);
            return false;
        }, true);
        console.log('✅ Listener adicionado ao botão "Adicionar Despesa"');
    } else {
        console.log('⚠️ Botão "Adicionar Despesa" não encontrado (provável que não está na página de despesas)');
        return;
    }

    setupExpenseTypeToggle();

    syncExpenseCategories();
    const addCatBtn = document.getElementById('openAddCategoryBtn');
    if (addCatBtn) {
        addCatBtn.onclick = null;
        addCatBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openAddCategoryModal();
        });
    }

    setupCategoryIconGrid();
}

async function deleteExpense(id) {
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

window.initializeExpenseModal = initializeExpenseModal;


const BASE_CATEGORIES = [
    { value: 'alimentacao', label: 'Alimentação' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'saude', label: 'Saúde' },
    { value: 'educacao', label: 'Educação' },
    { value: 'entretenimento', label: 'Entretenimento' },
    { value: 'outros', label: 'Outros' }
];

function getUserIdFromStorage() {
    try {
        const userDataString = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (!userDataString) return null;
        const userData = JSON.parse(userDataString);
        return userData.id || userData.user_id || userData.userId || null;
    } catch (e) {
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
        return [];
    }
}

function saveCustomCategoriesToStorage(list) {
    const userId = getUserIdFromStorage();
    if (!userId) return;
    localStorage.setItem(`customCategories_${userId}`, JSON.stringify(list || []));
}

function syncExpenseCategories() {
    const select = document.getElementById('expenseCategory');
    if (!select) return;

    const customs = loadCustomCategoriesFromStorage();

    const placeholder = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (placeholder) select.appendChild(placeholder);

    const baseWithoutOutros = BASE_CATEGORIES.filter(c => c.value !== 'outros');
    const outrosBase = BASE_CATEGORIES.find(c => c.value === 'outros');

    baseWithoutOutros.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.value;
        opt.textContent = cat.label;
        select.appendChild(opt);
    });

    customs.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.slug;
        opt.textContent = cat.nome;
        opt.setAttribute('data-custom', 'true');
        select.appendChild(opt);
    });

    if (outrosBase) {
        const opt = document.createElement('option');
        opt.value = outrosBase.value;
        opt.textContent = outrosBase.label;
        select.appendChild(opt);
    }

    const filter = document.getElementById('categoryFilter');
    if (filter) {
        const first = filter.querySelector('option[value=""]');
        filter.innerHTML = '';
        if (first) filter.appendChild(first);

        baseWithoutOutros.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.value;
            opt.textContent = cat.label;
            filter.appendChild(opt);
        });

        customs.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.slug;
            opt.textContent = cat.nome;
            opt.setAttribute('data-custom', 'true');
            filter.appendChild(opt);
        });

        if (outrosBase) {
            const opt = document.createElement('option');
            opt.value = outrosBase.value;
            opt.textContent = outrosBase.label;
            filter.appendChild(opt);
        }
    }

    // Sync gastos fixos category select
    const gastoFixoSelect = document.getElementById('gastoFixoCategory');
    if (gastoFixoSelect) {
        const placeholder = gastoFixoSelect.querySelector('option[value=""]');
        gastoFixoSelect.innerHTML = '';
        if (placeholder) gastoFixoSelect.appendChild(placeholder);

        baseWithoutOutros.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.value;
            opt.textContent = cat.label;
            gastoFixoSelect.appendChild(opt);
        });

        customs.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.slug;
            opt.textContent = cat.nome;
            opt.setAttribute('data-custom', 'true');
            gastoFixoSelect.appendChild(opt);
        });

        if (outrosBase) {
            const opt = document.createElement('option');
            opt.value = outrosBase.value;
            opt.textContent = outrosBase.label;
            gastoFixoSelect.appendChild(opt);
        }
    }
}

function openAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        modal.style.opacity = '1';
        const modalContent = modal.querySelector('div > div');
        if (modalContent) modalContent.style.transform = 'scale(1)';
    }, 10);

    const nameInput = document.getElementById('newCategoryName');
    if (nameInput) nameInput.value = '';
    customCategoryIcon = null;
    document.querySelectorAll('.category-icon-btn').forEach(btn => btn.classList.remove('border-primary', 'bg-primary/10'));
    document.getElementById('categoryErrorMessage')?.classList.add('hidden');
    document.getElementById('categorySuccessMessage')?.classList.add('hidden');
}

// Track which modal opened the category modal
let previousModalSource = null;

function showAddCategoryFromExpense() {
    console.log('🔵 Abrindo modal de categoria a partir de despesa');
    previousModalSource = 'expense';
    const categoryModal = document.getElementById('addCategoryModal');
    
    // Mantém a modal de despesa visível (não esconde)
    
    if (categoryModal) {
        categoryModal.classList.remove('hidden');
        categoryModal.classList.add('flex');
        setTimeout(() => {
            categoryModal.style.opacity = '1';
            const modalContent = categoryModal.querySelector('div > div');
            if (modalContent) modalContent.style.transform = 'scale(1)';
        }, 10);
    }
    
    const nameInput = document.getElementById('newCategoryName');
    if (nameInput) nameInput.value = '';
    customCategoryIcon = null;
    document.querySelectorAll('.category-icon-btn').forEach(btn => btn.classList.remove('border-primary', 'bg-primary/10'));
    document.getElementById('categoryErrorMessage')?.classList.add('hidden');
    document.getElementById('categorySuccessMessage')?.classList.add('hidden');
}

function showAddCategoryFromGastoFixo() {
    console.log('🔵 Abrindo modal de categoria a partir de gasto fixo');
    previousModalSource = 'gasto-fixo';
    const categoryModal = document.getElementById('addCategoryModal');
    
    // Mantém a modal de gasto fixo visível (não esconde)
    
    if (categoryModal) {
        categoryModal.classList.remove('hidden');
        categoryModal.classList.add('flex');
        setTimeout(() => {
            categoryModal.style.opacity = '1';
            const modalContent = categoryModal.querySelector('div > div');
            if (modalContent) modalContent.style.transform = 'scale(1)';
        }, 10);
    }
    
    const nameInput = document.getElementById('newCategoryName');
    if (nameInput) nameInput.value = '';
    customCategoryIcon = null;
    document.querySelectorAll('.category-icon-btn').forEach(btn => btn.classList.remove('border-primary', 'bg-primary/10'));
    document.getElementById('categoryErrorMessage')?.classList.add('hidden');
    document.getElementById('categorySuccessMessage')?.classList.add('hidden');
}

function closeAddCategoryAndReturnToExpense() {
    console.log('🔵 Fechando modal de categoria');
    const categoryModal = document.getElementById('addCategoryModal');
    
    if (categoryModal) {
        categoryModal.style.opacity = '0';
        const modalContent = categoryModal.querySelector('div > div');
        if (modalContent) modalContent.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            categoryModal.classList.add('hidden');
            categoryModal.classList.remove('flex');
            // Modal anterior já está visível, não precisa fazer nada
        }, 250);
    }
}

function closeAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (!modal) return;
    closeAddCategoryAndReturnToExpense();
}
window.showAddCategoryFromExpense = showAddCategoryFromExpense;
window.showAddCategoryFromGastoFixo = showAddCategoryFromGastoFixo;
window.closeAddCategoryAndReturnToExpense = closeAddCategoryAndReturnToExpense;

function setupCategoryIconGrid() {
    const grid = document.getElementById('categoryIconGrid');
    if (!grid) return;
    grid.querySelectorAll('[data-icon]').forEach(btn => {
        btn.addEventListener('click', () => {
            grid.querySelectorAll('[data-icon]').forEach(b => b.classList.remove('border-primary', 'bg-primary/10'));
            btn.classList.add('border-primary', 'bg-primary/10');
            customCategoryIcon = btn.getAttribute('data-icon');
        });
    });
}

function saveNewCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const errorMsg = document.getElementById('categoryErrorMessage');
    const successMsg = document.getElementById('categorySuccessMessage');

    const nome = nameInput?.value?.trim();
    if (!nome) {
        if (errorMsg) {
            errorMsg.textContent = 'Por favor, informe o nome da categoria.';
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    const slug = nome.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const customs = loadCustomCategoriesFromStorage();
    const exists = customs.some(cat => cat.slug === slug);
    if (exists) {
        if (errorMsg) {
            errorMsg.textContent = 'Já existe uma categoria com este nome.';
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    const newCategory = {
        nome,
        slug,
        icon: customCategoryIcon || 'category',
        createdAt: new Date().toISOString()
    };

    customs.push(newCategory);
    saveCustomCategoriesToStorage(customs);
    syncExpenseCategories();

    if (typeof window.syncCustomCategories === 'function') {
        window.syncCustomCategories(customs);
    }

    if (successMsg) {
        successMsg.textContent = `Categoria "${nome}" adicionada!`;
        successMsg.classList.remove('hidden');
    }
    if (errorMsg) errorMsg.classList.add('hidden');

    setTimeout(() => {
        closeAddCategoryModal();
        // Resync categories after adding
        syncExpenseCategories();
    }, 900);
}

window.openAddCategoryModal = openAddCategoryModal;
window.closeAddCategoryModal = closeAddCategoryModal;
window.saveNewCategory = saveNewCategory;

document.addEventListener('DOMContentLoaded', syncExpenseCategories);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExpenseModal);
    console.log('🔵 Aguardando DOMContentLoaded...');
} else {
    initializeExpenseModal();
    console.log('🔵 DOM já carregado, inicializando agora...');
}
