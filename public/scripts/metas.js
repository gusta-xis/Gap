console.log('🔵 metas.js carregado (Unique Scope v5)');

/* ==========================================================================
   1. CONSTANTES E SELETORES DOM (Renomeado para evitar conflito)
   ========================================================================== */
const MetasDOM = {
    modal: 'addMetaModal',
    form: 'metaForm',
    fields: {
        name: 'metaNome',
        amount: 'metaValorAlvo',
        date: 'metaPrazo'
    },
    messages: {
        error: 'metaErrorMessage',
        success: 'metaSuccessMessage'
    },
    stats: {
        total: 'totalAcumulado',
        count: 'quantidadeMetas',
        nextDate: 'proximaMetaPrazo',
        nextName: 'proximaMetaNome'
    },
    containers: {
        loading: 'loadingStateMetas',
        empty: 'emptyStateMetas',
        table: 'tableContainerMetas',
        tbody: 'metasTableBody'
    },
    buttons: {
        add: 'btnAddMeta',
        addEmpty: 'btnAddMetaEmpty',
        submit: '#metaForm button[type="submit"]'
    }
};

/* ==========================================================================
   2. UTILITÁRIOS (Renomeado para evitar conflito)
   ========================================================================== */
const MetasUtils = {
    getUserId: () => {
        try {
            const data = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
            return data.id || data.user_id || null;
        } catch (e) {
            console.error('Erro ao obter user ID:', e);
            return null;
        }
    },

    getToken: () => sessionStorage.getItem('accessToken') || localStorage.getItem('token'),

    parseCurrency: (value) => {
        if (!value) return 0;
        try {
            const parsed = parseFloat(value.replace(/\./g, '').replace(',', '.'));
            return isNaN(parsed) ? 0 : parsed;
        } catch (e) { return 0; }
    },

    formatCurrency: (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    formatDate: (dateString) => {
        if (!dateString) return '-';
        // Evita problemas de timezone pegando a string crua
        const [year, month, day] = dateString.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    },

    calculateDaysRemaining: (targetDate) => {
        if (!targetDate || typeof targetDate !== 'string') return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const parts = targetDate.split('T')[0].split('-');
        const target = new Date(parts[0], parts[1] - 1, parts[2]); 
        
        const diffTime = target - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
};

// Fallback global seguro
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

/* ==========================================================================
   3. ESTADO E MANIPULAÇÃO DE UI (Renomeado)
   ========================================================================== */
const MetasUI = {
    getElement: (id) => document.getElementById(id),
    query: (selector) => document.querySelector(selector),

    toggleModal: (show) => {
        const modal = MetasUI.getElement(MetasDOM.modal);
        if (!modal) return; // Silencioso se não achar, para não poluir console de outras páginas
        if (show) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    showMessage: (type, text = null) => {
        const el = MetasUI.getElement(MetasDOM.messages[type]);
        if (!el) return;
        if (text) {
            el.textContent = text;
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    },

    clearMessages: () => {
        MetasUI.showMessage('error');
        MetasUI.showMessage('success');
    },

    setButtonState: (isLoading, text = 'Salvar') => {
        const btn = MetasUI.query(MetasDOM.buttons.submit) || MetasUI.query('#metaForm button[type="submit"]');
        if (!btn) return;
        btn.disabled = isLoading;
        btn.textContent = isLoading ? 'Salvando...' : text;
    },

    resetForm: () => {
        const form = MetasUI.getElement(MetasDOM.form);
        if (form) form.reset();
        
        const nameField = MetasUI.getElement(MetasDOM.fields.name);
        setTimeout(() => nameField?.focus(), 100);
    },

    renderStats: (metas) => {
        const total = metas.reduce((acc, m) => acc + (Number(m.valorAtual) || Number(m.valor_atual) || 0), 0);
        const totalEl = MetasUI.getElement(MetasDOM.stats.total);
        const countEl = MetasUI.getElement(MetasDOM.stats.count);
        
        if (totalEl) totalEl.textContent = MetasUtils.formatCurrency(total);
        if (countEl) countEl.textContent = metas.length;

        const nextDateEl = MetasUI.getElement(MetasDOM.stats.nextDate);
        const nextNameEl = MetasUI.getElement(MetasDOM.stats.nextName);

        if (metas.length > 0) {
            const sorted = [...metas].sort((a, b) => new Date(a.prazo) - new Date(b.prazo));
            const proxima = sorted[0];
            const days = MetasUtils.calculateDaysRemaining(proxima.prazo);
            
            let timeText = days < 0 ? 'Vencida' : (days === 0 ? 'Hoje' : `${days} dias`);
            
            if (nextDateEl) nextDateEl.textContent = timeText;
            if (nextNameEl) nextNameEl.textContent = `Para: ${proxima.nome}`;
        } else {
            if (nextDateEl) nextDateEl.textContent = '-';
            if (nextNameEl) nextNameEl.textContent = 'Sem metas ativas';
        }
    },

    renderTable: (metas) => {
        const loading = MetasUI.getElement(MetasDOM.containers.loading);
        const empty = MetasUI.getElement(MetasDOM.containers.empty);
        const table = MetasUI.getElement(MetasDOM.containers.table);
        const tbody = MetasUI.getElement(MetasDOM.containers.tbody);

        if (loading) loading.classList.add('hidden');

        if (metas.length === 0) {
            if (table) table.classList.add('hidden');
            if (empty) empty.classList.remove('hidden');
            return;
        }

        if (empty) empty.classList.add('hidden');
        if (table) table.classList.remove('hidden');

        if (tbody) {
            tbody.innerHTML = '';
            metas.forEach(meta => {
                const vAtual = Number(meta.valorAtual) || Number(meta.valor_atual) || 0;
                const vAlvo = Number(meta.valorAlvo) || Number(meta.valor_alvo) || 0;
                const pct = vAlvo > 0 ? Math.min(100, Math.round((vAtual / vAlvo) * 100)) : 0;
                
                let colorClass = 'bg-primary';
                if (pct >= 100) colorClass = 'bg-emerald-500';
                else if (pct < 30) colorClass = 'bg-slate-400';

                const id = meta.id || meta._id;

                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group';
                tr.innerHTML = `
                    <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-2 rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-primary'}"></div>
                            ${meta.nome}
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="w-full max-w-[140px] mx-auto">
                            <div class="flex justify-between mb-1">
                                <span class="text-xs font-medium text-slate-700 dark:text-slate-300">${pct}%</span>
                                <span class="text-xs text-slate-500">${MetasUtils.formatCurrency(vAtual)}</span>
                            </div>
                            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div class="${colorClass} h-2 rounded-full transition-all duration-1000" style="width: ${pct}%"></div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center text-slate-600 dark:text-slate-400">
                        ${MetasUtils.formatDate(meta.prazo)}
                    </td>
                    <td class="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-300">
                        ${MetasUtils.formatCurrency(vAlvo)}
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button class="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" onclick="window.metasModule.deleteMeta('${id}')">
                            <span class="material-symbols-outlined text-xl">delete</span>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    }
};

/* ==========================================================================
   4. LÓGICA DE NEGÓCIO (Actions)
   ========================================================================== */

async function loadMetas() {
    try {
        const token = MetasUtils.getToken();
        if (!token) return;

        const response = await fetch('/api/v1/metas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Falha ao carregar metas');
        
        const data = await response.json();
        const lista = Array.isArray(data) ? data : [];
        
        MetasUI.renderStats(lista);
        MetasUI.renderTable(lista);

    } catch (error) {
        console.error('Erro ao carregar metas:', error);
        const loading = MetasUI.getElement(MetasDOM.containers.loading);
        if (loading) loading.innerHTML = '<p class="text-red-500 text-sm">Erro ao sincronizar dados.</p>';
    }
}

function openMetaModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    console.log('🎯 Abrindo modal de meta');
    
    MetasUI.clearMessages();
    MetasUI.resetForm();
    MetasUI.setButtonState(false, 'Salvar');
    MetasUI.toggleModal(true);
}

function closeMetaModal(event) {
    if (event) {
        if (event.type === 'click') {
            const modal = MetasUI.getElement(MetasDOM.modal);
            if (event.target !== modal) return;
        }
        event.preventDefault();
        event.stopPropagation();
    }
    
    MetasUI.clearMessages();
    MetasUI.toggleModal(false);
}

async function submitMeta(event) {
    if (event) event.preventDefault();
    console.log('💾 Iniciando submissão de meta...');
    
    const submitBtn = MetasUI.query(MetasDOM.buttons.submit) || MetasUI.query('#metaForm button[type="submit"]');
    const originalText = submitBtn?.textContent || 'Salvar';
    
    MetasUI.setButtonState(true);
    MetasUI.clearMessages();

    // Captura valores
    const nameVal = MetasUI.getElement(MetasDOM.fields.name)?.value.trim();
    const amountVal = MetasUtils.parseCurrency(MetasUI.getElement(MetasDOM.fields.amount)?.value);
    const dateVal = MetasUI.getElement(MetasDOM.fields.date)?.value;

    // Validação
    if (!nameVal || amountVal <= 0 || !dateVal) {
        MetasUI.showMessage('error', 'Preencha todos os campos obrigatórios (*).');
        MetasUI.setButtonState(false, originalText);
        return;
    }

    try {
        const token = MetasUtils.getToken();
        const userId = MetasUtils.getUserId();

        if (!token) throw new Error('Sessão expirada. Faça login novamente.');
        if (!userId) throw new Error('Erro de usuário. Faça login novamente.');

        const payload = {
            nome: nameVal,
            valor_alvo: amountVal,
            prazo: dateVal,
            user_id: userId,
            valor_atual: 0 // Default inicial
        };

        const response = await fetch('/api/v1/metas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            throw new Error(errJson.message || `Erro ${response.status} ao salvar`);
        }

        console.log('✅ Meta salva com sucesso!');
        MetasUI.showMessage('success', 'Meta criada com sucesso!');

        setTimeout(() => {
            MetasUI.toggleModal(false);
            loadMetas(); 
        }, 1500);

    } catch (error) {
        console.error('❌ Erro no submit:', error);
        MetasUI.showMessage('error', error.message || 'Erro ao processar requisição.');
        MetasUI.setButtonState(false, originalText);
    }
}

async function deleteMeta(id) {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    try {
        const token = MetasUtils.getToken();
        const response = await fetch(`/api/v1/metas/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadMetas();
        } else {
            alert('Erro ao excluir meta.');
        }
    } catch (e) {
        console.error(e);
        alert('Erro de conexão.');
    }
}

/* ==========================================================================
   5. EXPORTAÇÃO GLOBAL (Window)
   ========================================================================== */

// Namespace seguro
window.metasModule = { deleteMeta: deleteMeta };

// Funções globais (HTML onclick compatibility)
window.openMetaModal = openMetaModal;
window.closeMetaModal = closeMetaModal;

/* ==========================================================================
   6. INICIALIZAÇÃO
   ========================================================================== */
function initializeMetasModule() {
    console.log('🚀 Inicializando Módulo de Metas...');
    
    const btnAdd = MetasUI.getElement(MetasDOM.buttons.add);
    const btnEmpty = MetasUI.getElement(MetasDOM.buttons.addEmpty);

    if (btnAdd) btnAdd.addEventListener('click', openMetaModal);
    if (btnEmpty) btnEmpty.addEventListener('click', openMetaModal);

    const form = MetasUI.getElement(MetasDOM.form);
    if (form) {
        form.removeEventListener('submit', submitMeta);
        form.addEventListener('submit', submitMeta);
    }

    const amountInput = MetasUI.getElement(MetasDOM.fields.amount);
    if (amountInput) {
        amountInput.addEventListener('input', () => window.formatCurrencyInput(amountInput));
    }

    const modal = MetasUI.getElement(MetasDOM.modal);
    if (modal) {
        modal.addEventListener('click', closeMetaModal);
    }

    // Carrega dados se a página já estiver montada
    if (MetasUI.getElement(MetasDOM.containers.table)) {
        loadMetas();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMetasModule);
} else {
    initializeMetasModule();
}