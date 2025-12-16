/**
 * Modal Global de Gastos Fixos
 * Gerencia o modal de gasto fixo disponível em todas as páginas do dashboard
 */

(function() {
    'use strict';

    let editingGastoId = null;

    // Busca categorias do backend e sincroniza localStorage/modal
    async function fetchAndSyncCustomCategoriesGastoFixo() {
        const userId = getUserIdFromStorage();
        console.log('[GastoFixo] userId:', userId);
        if (!userId) {
            console.warn('[GastoFixo] Nenhum userId encontrado!');
            return;
        }

        try {
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
            console.log('[GastoFixo] Token usado:', token);
            const response = await fetch('/api/v1/categorias', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('[GastoFixo] Status da resposta categorias:', response.status);
            if (!response.ok) {
                console.warn('[GastoFixo] Erro ao buscar categorias do backend:', response.status);
                return;
            }
            const categorias = await response.json();
            console.log('[GastoFixo] Categorias recebidas do backend:', categorias);
            localStorage.setItem(`customCategories_${userId}`, JSON.stringify(categorias));
        } catch (e) {
            console.error('[GastoFixo] Erro ao buscar categorias:', e);
        }
    }

    // Aguarda o DOM estar pronto
    async function init() {
        await fetchAndSyncCustomCategoriesGastoFixo();
        syncGastoFixoCategories();
    }

    // Sincroniza o select de categorias de gasto fixo com todas as categorias do banco
    function syncGastoFixoCategories() {
        const select = document.getElementById('gastoFixoCategory');
        if (!select) {
            console.warn('[GastoFixo] Select de categorias não encontrado!');
            return;
        }

        let categorias = [];
        try {
            const userId = getUserIdFromStorage();
            if (userId) {
                const stored = localStorage.getItem(`customCategories_${userId}`);
                categorias = stored ? JSON.parse(stored) : [];
            }
        } catch (e) {
            categorias = [];
        }

        // Categorias padrão (caso o backend não retorne nada)
        const categoriasPadrao = [
            { id: 1, nome: 'Alimentação' },
            { id: 2, nome: 'Transporte' },
            { id: 3, nome: 'Moradia' },
            { id: 4, nome: 'Saúde' },
            { id: 5, nome: 'Lazer' },
            { id: 6, nome: 'Educação' },
            { id: 7, nome: 'Cartão de crédito' },
            { id: 8, nome: 'Outros' }
        ];

        // Se não houver categorias do backend, usa padrão
        if (!categorias || categorias.length === 0) {
            categorias = categoriasPadrao;
        }

        // Sempre adiciona um placeholder
        select.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Selecione uma categoria';
        select.appendChild(placeholder);

        categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = String(cat.id); // Garante string
            opt.textContent = cat.nome;
            opt.setAttribute('data-custom', 'true');
            select.appendChild(opt);
        });
    }

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

    // Funções globais para abrir/fechar modal
    window.openGastoFixoModal = async function(gastoId = null) {
        const modal = document.getElementById('modalGastoFixoGlobal');
        const modalTitle = document.getElementById('modalGastoFixoTitle');

        if (!modal) return;

        editingGastoId = gastoId;

        if (gastoId) {
            // Modo edição
            modalTitle.textContent = 'Editar Gasto Fixo';
            loadGastoFixoData(gastoId);
        } else {
            // Modo criação
            modalTitle.textContent = 'Adicionar Gasto Fixo';
            clearGastoFixoForm();
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';

        await fetchAndSyncCustomCategoriesGastoFixo();
        syncGastoFixoCategories();
    };

    window.closeGastoFixoModal = function(event) {
        if (event) {
            event.preventDefault();
        }

        const modal = document.getElementById('modalGastoFixoGlobal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }

        clearGastoFixoForm();
        editingGastoId = null;
    };

    window.submitGastoFixo = async function(event) {
        if (event) {
            event.preventDefault();
        }

        const submitBtn = event.target;
        const originalText = submitBtn.textContent;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Salvando...';

            const nome = document.getElementById('gastoFixoDescription').value.trim();
            const valor = parseCurrencyValue(document.getElementById('gastoFixoAmount').value);
            const dia_vencimento = parseInt(document.getElementById('gastoFixoDueDay').value);
            let categoria_id = document.getElementById('gastoFixoCategory').value;
            categoria_id = categoria_id ? parseInt(categoria_id, 10) : null;

            if (!nome) {
                showGastoFixoError('Por favor, informe a descrição do gasto fixo.');
                return;
            }

            if (!valor || valor <= 0) {
                showGastoFixoError('Por favor, informe um valor válido.');
                return;
            }

            if (!dia_vencimento) {
                showGastoFixoError('Por favor, selecione o dia do vencimento.');
                return;
            }

            const formData = {
                nome,
                valor,
                dia_vencimento,
                categoria_id
            };

            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
            const url = editingGastoId ? `/api/v1/gastos-fixos/${editingGastoId}` : '/api/v1/gastos-fixos';
            const method = editingGastoId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.replace('/');
                    return;
                }
                const error = await response.json();
                throw new Error(error.error || 'Erro ao salvar gasto fixo');
            }

            showGastoFixoSuccess(editingGastoId ? 'Gasto fixo atualizado com sucesso!' : 'Gasto fixo adicionado com sucesso!');
            
            setTimeout(() => {
                closeGastoFixoModal();

                // Recarrega a página de gastos fixos se estiver nela
                if (typeof window.loadGastosFixos === 'function') {
                    window.loadGastosFixos();
                }

                // Recarrega o dashboard se estiver nele
                if (typeof window.loadDashboardData === 'function') {
                    window.loadDashboardData();
                }

                if (window.refreshGastoFixoCategories) window.refreshGastoFixoCategories();
            }, 1500);

        } catch (error) {
            console.error('Erro ao salvar gasto fixo:', error);
            showGastoFixoError(error.message || 'Erro ao salvar gasto fixo. Tente novamente.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    };

    async function loadGastoFixoData(gastoId) {
        try {
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');

            const response = await fetch(`/api/v1/gastos-fixos/${gastoId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar gasto fixo');
            }

            const gasto = await response.json();

            // Preenche o formulário
            document.getElementById('gastoFixoDescription').value = gasto.nome || '';
            document.getElementById('gastoFixoAmount').value = formatCurrencyForInput(gasto.valor || 0);
            document.getElementById('gastoFixoDueDay').value = gasto.dia_vencimento || '';
            document.getElementById('gastoFixoCategory').value = gasto.categoria_id || '';

        } catch (error) {
            console.error('Erro ao carregar gasto fixo:', error);
            showGastoFixoError('Erro ao carregar dados do gasto fixo');
            setTimeout(() => closeGastoFixoModal(), 2000);
        }
    }

    function clearGastoFixoForm() {
        document.getElementById('gastoFixoDescription').value = '';
        document.getElementById('gastoFixoAmount').value = '';
        document.getElementById('gastoFixoDueDay').value = '';
        document.getElementById('gastoFixoCategory').value = '';
        hideGastoFixoMessages();
    }

    function showGastoFixoError(message) {
        const errorDiv = document.getElementById('gastoFixoErrorMessage');
        const successDiv = document.getElementById('gastoFixoSuccessMessage');
        
        if (successDiv) successDiv.classList.add('hidden');
        
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }

    function showGastoFixoSuccess(message) {
        const errorDiv = document.getElementById('gastoFixoErrorMessage');
        const successDiv = document.getElementById('gastoFixoSuccessMessage');
        
        if (errorDiv) errorDiv.classList.add('hidden');
        
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.classList.remove('hidden');
        }
    }

    function hideGastoFixoMessages() {
        const errorDiv = document.getElementById('gastoFixoErrorMessage');
        const successDiv = document.getElementById('gastoFixoSuccessMessage');
        
        if (errorDiv) errorDiv.classList.add('hidden');
        if (successDiv) successDiv.classList.add('hidden');
    }

    // Utilitários (usando as mesmas funções do modal de despesas)
    function formatCurrencyForInput(value) {
        const num = parseFloat(value) || 0;
        return num.toFixed(2).replace('.', ',');
    }

    function parseCurrencyValue(value) {
        if (!value) return 0;
        const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
    }

    function sortCategoriesWithOutrosLast(categorias) {
        if (!Array.isArray(categorias)) return [];
        return categorias.slice().sort((a, b) => {
            const aNome = (a.nome || a.label || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const bNome = (b.nome || b.label || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const aIsOutros = aNome === 'outros';
            const bIsOutros = bNome === 'outros';
            if (aIsOutros && !bIsOutros) return 1;
            if (!aIsOutros && bIsOutros) return -1;
            return aNome.localeCompare(bNome, 'pt-BR');
        });
    }

    // Inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();