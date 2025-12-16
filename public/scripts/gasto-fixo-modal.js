console.log('🔵 gasto-fixo-modal.js carregado');

/* ==========================================================================
   UTILITÁRIOS
   ========================================================================== */

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

function parseCurrency(value) {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}

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

/* ==========================================================================
   VARIÁVEIS GLOBAIS
   ========================================================================== */

let editingGastoFixoId = null;

/* ==========================================================================
   MODAL - ABRIR/FECHAR
   ========================================================================== */

async function openGastoFixoModal(gastoId = null) {
    console.log('🔧 Abrindo modal de gasto fixo. ID:', gastoId);
    
    const modal = document.getElementById('modalGastoFixoGlobal');
    if (!modal) {
        console.error('❌ Modal não encontrado');
        return;
    }

    // Sincroniza categorias primeiro
    await fetchAndSyncCustomCategoriesGastoFixo();

    const titleEl = document.getElementById('modalGastoFixoTitle');
    const submitBtn = document.querySelector('[data-action="submit-gasto-fixo"]');
    
    // Limpa mensagens
    const errorDiv = document.getElementById('gastoFixoErrorMessage');
    const successDiv = document.getElementById('gastoFixoSuccessMessage');
    if (errorDiv) errorDiv.classList.add('hidden');
    if (successDiv) successDiv.classList.add('hidden');

    if (gastoId) {
        // MODO EDIÇÃO
        console.log('📝 Modo edição - carregando dados do gasto:', gastoId);
        
        editingGastoFixoId = gastoId;
        if (titleEl) titleEl.textContent = 'Editar Gasto Fixo';
        if (submitBtn) submitBtn.textContent = 'Salvar Alterações';

        try {
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
            const response = await fetch(`/api/v1/gastos-fixos/${gastoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erro ao carregar dados do gasto');

            const gasto = await response.json();
            console.log('✅ Dados carregados:', gasto);

            // Preenche os campos
            const descField = document.getElementById('gastoFixoDescription');
            const amountField = document.getElementById('gastoFixoAmount');
            const categoryField = document.getElementById('gastoFixoCategory');
            const dueDayField = document.getElementById('gastoFixoDueDay');

            if (descField) {
                descField.value = gasto.nome || '';
            }
            
            if (amountField) {
                const valor = parseFloat(gasto.valor || 0);
                amountField.value = valor.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }
            
            if (categoryField) {
                categoryField.value = gasto.categoria_id || '';
            }
            
            if (dueDayField) {
                dueDayField.value = gasto.dia_vencimento || '';
            }

        } catch (error) {
            console.error('❌ Erro ao carregar gasto:', error);
            alert('Erro ao carregar dados: ' + error.message);
            return;
        }

    } else {
        // MODO CRIAÇÃO
        console.log('➕ Modo criação - limpando campos');
        
        editingGastoFixoId = null;
        if (titleEl) titleEl.textContent = 'Adicionar Gasto Fixo';
        if (submitBtn) submitBtn.textContent = 'Adicionar';

        // Limpa os campos
        document.getElementById('gastoFixoDescription').value = '';
        document.getElementById('gastoFixoAmount').value = '';
        document.getElementById('gastoFixoCategory').value = '';
        document.getElementById('gastoFixoDueDay').value = '';
    }

    // Abre o modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeGastoFixoModal(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const modal = document.getElementById('modalGastoFixoGlobal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    
    editingGastoFixoId = null;
}

/* ==========================================================================
   SUBMIT - SALVAR GASTO FIXO
   ========================================================================== */

async function submitGastoFixo(event) {
    if (event) event.preventDefault();

    const submitBtn = document.querySelector('[data-action="submit-gasto-fixo"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Salvando...';
    submitBtn.disabled = true;

    const description = document.getElementById('gastoFixoDescription').value.trim();
    const amountInput = document.getElementById('gastoFixoAmount').value;
    const amount = parseCurrency(amountInput);
    const category = document.getElementById('gastoFixoCategory').value;
    const categoriaId = category ? Number(category) : null;
    const dueDay = document.getElementById('gastoFixoDueDay').value;

    const errorDiv = document.getElementById('gastoFixoErrorMessage');
    const successDiv = document.getElementById('gastoFixoSuccessMessage');

    console.log('📤 Dados do formulário:', {
        description,
        amount,
        category,
        dueDay,
        editingGastoFixoId
    });

    // Validação
    if (!description || !amount || !dueDay) {
        errorDiv.textContent = 'Preencha todos os campos obrigatórios (*).';
        errorDiv.classList.remove('hidden');
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

        const payload = {
            nome: description,
            valor: amount,
            categoria_id: categoriaId, // CORRETO!
            dia_vencimento: parseInt(dueDay),
            user_id: user.id
        };

        console.log('📦 Payload:', payload);

        const isEdit = !!editingGastoFixoId;
        const url = isEdit 
            ? `/api/v1/gastos-fixos/${editingGastoFixoId}` 
            : '/api/v1/gastos-fixos';
        const method = isEdit ? 'PUT' : 'POST';

        console.log(`📡 ${method} ${url}`);

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
            throw new Error(err.message || 'Erro ao salvar gasto fixo.');
        }

        const result = await response.json();
        console.log('✅ Resposta do servidor:', result);

        // Sucesso
        successDiv.textContent = isEdit 
            ? 'Gasto fixo atualizado!' 
            : 'Gasto fixo adicionado com sucesso!';
        successDiv.classList.remove('hidden');
        errorDiv.classList.add('hidden');

        // Atualize imediatamente a tela
        closeGastoFixoModal();

        if (window.initializeGastosFixos) window.initializeGastosFixos();
        if (window.loadAllTransactions) window.loadAllTransactions();
        if (window.loadDashboardData) window.loadDashboardData();
        if (window.initTransacoesPage) window.initTransacoesPage(); // <-- ADICIONE ESTA LINHA

    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

/* ==========================================================================
   CATEGORIAS - SINCRONIZAÇÃO
   ========================================================================== */

async function fetchAndSyncCustomCategoriesGastoFixo() {
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
        syncGastoFixoCategories();
    } catch (e) {
        console.error('Erro ao buscar categorias:', e);
        syncGastoFixoCategories();
    }
}

function syncGastoFixoCategories() {
    const select = document.getElementById('gastoFixoCategory');
    if (!select) return;

    let categorias = loadCustomCategoriesFromStorage();
    if (!Array.isArray(categorias)) categorias = [];

    // Use os ids reais do banco!
    const defaultCategories = [
        { id: 1, nome: 'Alimentação' },
        { id: 2, nome: 'Transporte' },
        { id: 3, nome: 'Moradia' },
        { id: 4, nome: 'Saúde' },
        { id: 5, nome: 'Lazer' },
        { id: 6, nome: 'Educação' },
        { id: 7, nome: 'Outros' }
    ];

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

    // Remove duplicatas
    const seenIds = new Set();
    const uniqueCategories = [];
    allCategories.forEach(cat => {
        if (!seenIds.has(cat.id)) {
            uniqueCategories.push(cat);
            seenIds.add(cat.id);
        }
    });

    // Ordena
    uniqueCategories.sort((a, b) => {
        const aIsOutros = a.nome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'outros';
        const bIsOutros = b.nome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'outros';
        if (aIsOutros && !bIsOutros) return 1;
        if (!aIsOutros && bIsOutros) return -1;
        return a.nome.localeCompare(b.nome, 'pt-BR');
    });

    select.innerHTML = '<option value="">Selecione (Opcional)</option>';

    uniqueCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.nome;
        select.appendChild(opt);
    });
}

/* ==========================================================================
   MODAL DE ADICIONAR CATEGORIA (Reusa o mesmo do expense-modal)
   ========================================================================== */

window.showAddCategoryFromGastoFixo = function() {
    if (typeof window.openAddCategoryModal === 'function') {
        window.openAddCategoryModal();
    }
};

/* ==========================================================================
   EXPORTAR FUNÇÕES GLOBAIS
   ========================================================================== */

window.openGastoFixoModal = openGastoFixoModal;
window.closeGastoFixoModal = closeGastoFixoModal;
window.submitGastoFixo = submitGastoFixo;
window.fetchAndSyncCustomCategoriesGastoFixo = fetchAndSyncCustomCategoriesGastoFixo;
window.syncGastoFixoCategories = syncGastoFixoCategories;
window.refreshGastoFixoCategories = async function() {
    await fetchAndSyncCustomCategoriesGastoFixo();
    syncGastoFixoCategories();
};

console.log('✅ gasto-fixo-modal.js carregado com sucesso!');