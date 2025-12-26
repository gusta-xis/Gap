console.log('🔵 salario-modal.js carregado (Final v3 - Backend Integrado)');

// ========================================
// 1. CONSTANTES E SELETORES DOM
// ========================================
const DOM = {
    modal: 'addSalaryModal',
    fields: {
        description: 'salaryDescription', // Input da descrição/nome
        amount: 'salaryAmount',           // Input do valor
        day: 'salaryReceiveDay'           // Input do dia (1-31)
    },
    messages: {
        error: 'salaryErrorMessage',
        success: 'salarySuccessMessage'
    },
    buttons: {
        submit: '[data-action="submit-salary"]',
        open: '[data-action="add-salary"]'
    }
};

// ========================================
// 2. UTILITÁRIOS (Helpers)
// ========================================
const Utils = {
    getUserId: () => {
        try {
            const data = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
            return data.id || data.user_id || null;
        } catch (e) {
            console.error('Erro ao obter user ID:', e);
            return null;
        }
    },

    parseCurrency: (value) => {
        if (!value) return 0;
        try {
            const parsed = parseFloat(value.replace(/\./g, '').replace(',', '.'));
            return isNaN(parsed) ? 0 : parsed;
        } catch (e) {
            return 0;
        }
    },

    getToken: () => sessionStorage.getItem('accessToken') || localStorage.getItem('token')
};

// Garante formatação global de moeda nos inputs
if (typeof window.formatCurrencyInput !== 'function') {
    window.formatCurrencyInput = (input) => {
        if (!input) return;
        let value = input.value.replace(/\D/g, '').substring(0, 10);
        if (!value) { input.value = ''; return; }
        
        input.value = (parseInt(value, 10) / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };
}

// ========================================
// 3. ESTADO E MANIPULAÇÃO DE UI
// ========================================
let editingSalaryId = null;

const UI = {
    getElement: (id) => document.getElementById(id),
    
    toggleModal: (show) => {
        const modal = UI.getElement(DOM.modal);
        if (!modal) return console.error(`❌ Modal #${DOM.modal} não encontrado`);
        
        if (show) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    showMessage: (type, text = null) => {
        const el = UI.getElement(DOM.messages[type]);
        if (!el) return;

        if (text) {
            const textEl = el.querySelector('.msg-text') || el; 
            textEl.textContent = text;
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    },

    clearMessages: () => {
        UI.showMessage('error');
        UI.showMessage('success');
    },

    setButtonState: (isLoading, text = 'Salvar') => {
        const btn = document.querySelector(DOM.buttons.submit);
        if (!btn) return;
        btn.disabled = isLoading;
        btn.textContent = isLoading ? 'Salvando...' : text;
    },

    resetForm: () => {
        const desc = UI.getElement(DOM.fields.description);
        const amount = UI.getElement(DOM.fields.amount);
        const day = UI.getElement(DOM.fields.day);

        if (desc) desc.value = '';
        if (amount) amount.value = '';
        if (day) day.value = ''; 
        
        setTimeout(() => desc?.focus(), 100);
    },

    populateForm: (salary) => {
        const desc = UI.getElement(DOM.fields.description);
        const amount = UI.getElement(DOM.fields.amount);
        const day = UI.getElement(DOM.fields.day);

        // Tenta preencher a descrição (compatível com 'descricao' do SQL ou 'nome' do Model)
        if (desc) desc.value = salary.descricao || salary.nome || '';
        
        if (amount) {
            const val = parseFloat(salary.valor || 0);
            amount.value = val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        }

        if (day) {
            // Lógica para extrair o dia, seja de uma Data completa ou de um Inteiro
            if (salary.data_recebimento && typeof salary.data_recebimento === 'string' && salary.data_recebimento.includes('-')) {
                const parts = salary.data_recebimento.split('-'); // [Ano, Mes, Dia]
                day.value = parseInt(parts[2], 10);
            } else if (salary.dia_recebimento) {
                day.value = salary.dia_recebimento;
            } else {
                // Fallback: se for a data atual
                day.value = new Date().getDate();
            }
        }
    }
};

// ========================================
// 4. LÓGICA DE NEGÓCIO (Ações)
// ========================================

function openSalaryModal(event) {
    event?.preventDefault();
    event?.stopPropagation();

    console.log('💰 Abrindo modal de salário');
    
    editingSalaryId = null;
    const modal = UI.getElement(DOM.modal);
    if (!modal) return;

    const title = modal.querySelector('h2') || document.getElementById('salaryModalTitle');
    if (title) title.textContent = 'Adicionar Receita Fixa';
    
    UI.clearMessages();
    UI.resetForm();
    UI.setButtonState(false, 'Adicionar');
    UI.toggleModal(true);
}

function openSalaryModalForEdit(salary) {
    if (!salary?.id) return;

    console.log('📝 Editando receita fixa:', salary);
    
    editingSalaryId = salary.id;
    const modal = UI.getElement(DOM.modal);
    if (!modal) return;

    const title = modal.querySelector('h2') || document.getElementById('salaryModalTitle');
    if (title) title.textContent = 'Editar Receita Fixa';
    
    UI.clearMessages();
    UI.populateForm(salary);
    UI.setButtonState(false, 'Salvar Alterações');
    UI.toggleModal(true);
}

function closeSalaryModal(event) {
    event?.preventDefault();
    event?.stopPropagation();
    
    editingSalaryId = null;
    UI.clearMessages();
    UI.toggleModal(false);
}

async function submitSalary(event) {
    event?.preventDefault();
    console.log('💾 Iniciando submissão de receita fixa...');

    const submitBtn = document.querySelector(DOM.buttons.submit);
    const originalText = submitBtn?.textContent || 'Salvar';
    
    UI.setButtonState(true);
    UI.clearMessages();

    // 1. Coleta de Dados do Formulário
    const descVal = UI.getElement(DOM.fields.description)?.value.trim();
    const amountVal = Utils.parseCurrency(UI.getElement(DOM.fields.amount)?.value);
    const dayVal = UI.getElement(DOM.fields.day)?.value;

    // 2. Validação Front-End
    if (!descVal || amountVal <= 0 || !dayVal) {
        UI.showMessage('error', 'Preencha todos os campos obrigatórios (*).');
        UI.setButtonState(false, originalText);
        return;
    }

    const dayInt = parseInt(dayVal, 10);
    if (dayInt < 1 || dayInt > 31) {
        UI.showMessage('error', 'O dia de recebimento deve ser entre 1 e 31.');
        UI.setButtonState(false, originalText);
        return;
    }

    try {
        const token = Utils.getToken();
        const userId = Utils.getUserId();

        if (!token) throw new Error('Sessão expirada. Faça login novamente.');
        if (!userId) throw new Error('Erro de usuário. Faça login novamente.');

        // 3. Preparação das Datas e Referências
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(dayInt).padStart(2, '0');
        
        // Formatos exigidos pelo Banco/Middleware
        const data_recebimento = `${ano}-${mes}-${dia}`;
        const referencia_mes = `${ano}-${mes}`; // Ex: "2023-10" (Obrigatório para o middleware)

        // 4. Montagem do Payload
        // Nota: Enviamos tanto 'descricao' quanto 'nome' para garantir compatibilidade 
        // caso o backend esteja esperando um ou outro.
        const payload = {
            descricao: descVal,      // Padrão SQL Salários
            nome: descVal,           // Fallback para Modelos genéricos
            valor: amountVal,
            data_recebimento: data_recebimento,
            referencia_mes: referencia_mes, 
            user_id: userId
        };

        const isEdit = !!editingSalaryId;
        const url = isEdit ? `/api/v1/salarios/${editingSalaryId}` : '/api/v1/salarios';
        const method = isEdit ? 'PUT' : 'POST';

        console.log(`📤 Enviando ${method}:`, payload);

        // 5. Requisição Fetch
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        // 6. Tratamento de Erros da API
        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            // Prioriza a mensagem de erro vinda do backend
            const msg = errJson.error || errJson.message || `Erro ${response.status} ao salvar`;
            throw new Error(msg);
        }

        const resData = await response.json();
        console.log('✅ Sucesso:', resData);

        // 7. Feedback e Atualização
        UI.showMessage('success', isEdit ? 'Receita atualizada com sucesso!' : 'Receita criada com sucesso!');
        
        setTimeout(() => {
            closeSalaryModal();
            if (window.loadAllTransactions) window.loadAllTransactions();
            if (window.loadDashboardData) window.loadDashboardData();
            if (window.updateSalaryButton) window.updateSalaryButton();
        }, 1000);

    } catch (error) {
        console.error('❌ Erro no submit:', error);
        UI.showMessage('error', error.message || 'Erro desconhecido ao processar.');
    } finally {
        UI.setButtonState(false, originalText);
    }
}

// ========================================
// 5. DELETE ACTIONS (Global)
// ========================================
window.salaryModal = {
    openSalaryModalForEdit,
    deleteSalary: async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta receita?')) return;
        
        try {
            const token = Utils.getToken();
            const response = await fetch(`/api/v1/salarios/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || err.message || 'Erro ao excluir');
            }

            // Atualiza UI
            if (window.loadAllTransactions) window.loadAllTransactions();
            if (window.loadDashboardData) window.loadDashboardData();
            if (window.updateSalaryButton) window.updateSalaryButton();
            alert('Receita excluída com sucesso!');
        } catch (e) {
            alert(`Erro: ${e.message}`);
        }
    }
};

// ========================================
// 6. INICIALIZAÇÃO
// ========================================
function initializeSalaryModal() {
    console.log('🚀 Inicializando Salary Modal...');

    const addBtn = document.querySelector(DOM.buttons.open);
    const submitBtn = document.querySelector(DOM.buttons.submit);
    const modal = UI.getElement(DOM.modal);

    // Remove listeners antigos
    addBtn?.removeEventListener('click', openSalaryModal);
    addBtn?.addEventListener('click', openSalaryModal);

    submitBtn?.removeEventListener('click', submitSalary);
    submitBtn?.addEventListener('click', submitSalary);

    // Máscara de moeda
    const amountInput = UI.getElement(DOM.fields.amount);
    if (amountInput) {
        // Usa cloneNode para garantir limpeza total de listeners antigos se necessário,
        // mas addEventListener direto é seguro aqui.
        amountInput.addEventListener('input', () => window.formatCurrencyInput(amountInput));
    }

    // Fechar ao clicar fora
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeSalaryModal(e);
    });
}

// Função para atualizar o botão de salário
async function updateSalaryButton() {
    const btn = document.querySelector(DOM.buttons.open);
    if (!btn) return;

    try {
        const token = Utils.getToken();
        const userId = Utils.getUserId();
        if (!token || !userId) return;

        // Busca salários do usuário
        const res = await fetch(`/api/v1/salarios?user_id=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();

        const salarios = await res.json();
        if (Array.isArray(salarios) && salarios.length > 0) {
            btn.textContent = 'Gerenciar Salário';
            btn.onclick = async (e) => {
                e.preventDefault();
                // Abre o modal já preenchido para edição do primeiro salário
                openSalaryModalForEdit(salarios[0]);
            };
        } else {
            btn.textContent = 'Adicionar Salário';
            btn.onclick = openSalaryModal;
        }
    } catch {
        // fallback padrão
        btn.textContent = 'Adicionar Salário';
        btn.onclick = openSalaryModal;
    }
}

// Exports Globais para uso em outros scripts
window.openSalaryModal = openSalaryModal;
window.closeSalaryModal = closeSalaryModal;
window.submitSalary = submitSalary;
window.openSalaryModalForEdit = openSalaryModalForEdit;
window.initializeSalaryModal = initializeSalaryModal;
window.updateSalaryButton = updateSalaryButton;

// Auto-init ao carregar a página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeSalaryModal();
        updateSalaryButton();
    });
} else {
    initializeSalaryModal();
    updateSalaryButton();
}