console.log('🔵 expense-modal.js carregado (Com Link de Metas)');

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
        { nome: 'Outros', icon: 'more_horiz' },
        { nome: 'Compras', icon: 'shopping_bag' },
        { nome: 'Roupas', icon: 'checkroom' },
        { nome: 'Eletrônicos', icon: 'devices' },
        { nome: 'Pets', icon: 'pets' },
        { nome: 'Beleza', icon: 'spa' },
        { nome: 'Viagem', icon: 'flight_takeoff' },
        { nome: 'Combustível', icon: 'local_gas_station' },
        { nome: 'Restaurante', icon: 'dining' },
        { nome: 'Café', icon: 'coffee' },
        { nome: 'Bar', icon: 'local_bar' },
        { nome: 'Gym', icon: 'fitness_center' },
        { nome: 'Médico', icon: 'local_hospital' },
        { nome: 'Farmácia', icon: 'medication' },
        { nome: 'Dentista', icon: 'toothed' },
        { nome: 'Cinema', icon: 'theaters' },
        { nome: 'Música', icon: 'music_note' },
        { nome: 'Livros', icon: 'library_books' },
        { nome: 'Joguinhos', icon: 'sports_esports' },
        { nome: 'Internet', icon: 'router' },
        { nome: 'Telefone', icon: 'phone' },
        { nome: 'Energia', icon: 'electric_bolt' },
        { nome: 'Água', icon: 'water_drop' },
        { nome: 'Gás', icon: 'local_fire_department' },
        { nome: 'Seguro', icon: 'security' },
        { nome: 'Impostos', icon: 'account_balance' },
        { nome: 'Empréstimo', icon: 'trending_down' },
        { nome: 'Investimento', icon: 'trending_up' },
        { nome: 'Poupança', icon: 'savings' },
        { nome: 'Criança', icon: 'child_care' },
        { nome: 'Trabalho', icon: 'work' },
        { nome: 'Presente', icon: 'card_giftcard' },
        { nome: 'Doação', icon: 'volunteer_activism' },
        { nome: 'Casa', icon: 'home_repair_service' },
        { nome: 'Jardinagem', icon: 'eco' },
        { nome: 'Limpeza', icon: 'cleaning_services' },
        { nome: 'Carro', icon: 'two_wheeler' },
        { nome: 'Manutenção', icon: 'build' },
        { nome: 'Multa', icon: 'gavel' },
        { nome: 'Hobby', icon: 'palette' },
        { nome: 'Esporte', icon: 'sports_basketball' },
        { nome: 'Streaming', icon: 'ondemand_video' },
        { nome: 'Vídeo Game', icon: 'videogame_asset' },
        { nome: 'Software', icon: 'computer' }
    ];

    const finalCategories = [];
    const addedNames = new Set();

    // 1. Adiciona primeiro as categorias que vieram do BANCO (pois elas têm ID numérico válido)
    categoriasDoBanco.forEach(cat => {
        const nomeNormalizado = cat.nome.trim().toLowerCase();
        if (!addedNames.has(nomeNormalizado)) {
            finalCategories.push({
                id: cat.id,
                nome: cat.nome
            });
            addedNames.add(nomeNormalizado);
        }
    });

    // 2. Adiciona as categorias padrão
    defaultCategories.forEach(def => {
        const nomeNormalizado = def.nome.trim().toLowerCase();
        if (!addedNames.has(nomeNormalizado)) {
            finalCategories.push({
                id: `temp_${nomeNormalizado.replace(/\s+/g, '_')}`,
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
            id: c.id ?? c.categoria_id,
            nome: c.nome || c.label || 'Sem nome',
            icon: c.icon || 'category'
        }));

        saveCustomCategoriesToStorage(categoriasBackend);
        syncExpenseCategories();

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
// GESTÃO DE METAS (Link com Despesas)
// ========================================

async function syncExpenseMetas(forceIncludeId = null) {
    const select = document.getElementById('expenseMeta');
    if (!select) return;

    try {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/v1/metas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const metas = await response.json();

        // Mantém a opção "Nenhuma"
        const currentVal = select.value || forceIncludeId; // Prioritize forceIncludeId if set
        select.innerHTML = '<option value="">Nenhuma</option>';

        if (Array.isArray(metas)) {
            metas.forEach(meta => {
                const metaId = String(meta.id || meta._id);
                const vAlvo = Number(meta.valorAlvo) || Number(meta.valor_alvo) || 0;
                const vAtual = Number(meta.valorAtual) || Number(meta.valor_atual) || 0;

                // Mostra TODAS as metas para garantir que o usuário possa vincular/desvincular livremente
                // if (vAtual < vAlvo || (forceIncludeId && String(forceIncludeId) === metaId)) {
                if (true) {
                    const opt = document.createElement('option');
                    opt.value = metaId;
                    opt.textContent = meta.nome;
                    select.appendChild(opt);
                }
            });
        }

        if (currentVal) select.value = currentVal;

    } catch (e) {
        console.error('Erro ao buscar metas para o select:', e);
    }
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
    const metaField = document.getElementById('expenseMeta');

    if (descField) descField.value = '';
    if (amountField) amountField.value = '';
    if (categoryField) categoryField.value = '';
    if (dateField) dateField.value = getLocalDateString();
    if (metaField) metaField.value = '';

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
    if (typeof syncExpenseMetas === 'function') syncExpenseMetas();

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

    // Carrega categorias e Metas em paralelo para garantir que os selects estejam populados
    Promise.all([
        fetchAndSyncCustomCategories(),
        typeof syncExpenseMetas === 'function' ? syncExpenseMetas(expense.meta_id) : Promise.resolve()
    ]).then(() => {
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

        const metaField = document.getElementById('expenseMeta');
        if (metaField) {
            if (expense.meta_id) {
                metaField.value = expense.meta_id;
            } else {
                metaField.value = '';
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

        if (typeof syncExpenseMetas === 'function') syncExpenseMetas();
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
    const metaField = document.getElementById('expenseMeta');

    const description = descField ? descField.value.trim() : '';
    const amount = parseCurrency(amountField ? amountField.value : '');
    const date = dateField ? dateField.value : '';
    const type = selectedExpenseType;

    const rawCategoryValue = categoryField ? categoryField.value : '';
    const metaId = metaField ? metaField.value : '';

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

        if (rawCategoryValue && !rawCategoryValue.startsWith('temp_')) {
            const numId = Number(rawCategoryValue);
            if (!isNaN(numId) && numId > 0) {
                payload.categoria_id = numId;
            }
        } else {
            console.log('⚠️ Categoria sem ID de banco selecionada.');
        }

        if (metaId) {
            const mId = Number(metaId);
            if (!isNaN(mId) && mId > 0) {
                payload.meta_id = mId;
            }
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
            if (window.loadMetas) window.loadMetas();
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

    // Inicializa metas também
    syncExpenseMetas();
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

window.syncExpenseMetas = syncExpenseMetas;

window.refreshGastoFixoCategories = async function () {
    await fetchAndSyncCustomCategories();
    if (typeof window.syncGastoFixoCategories === 'function') window.syncGastoFixoCategories();
};

window.expenseModal = {
    openExpenseModalForEdit,
    deleteExpense: async function (id) {
        if (!confirm('Deseja realmente excluir esta despesa?')) return;
        try {
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
            const response = await fetch(`/api/v1/gastos-variaveis/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao excluir despesa');
            if (window.loadAllTransactions) window.loadAllTransactions();
            if (window.loadDashboardData) window.loadDashboardData();
        } catch (e) {
            alert('Erro ao excluir despesa: ' + e.message);
        }
    }
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