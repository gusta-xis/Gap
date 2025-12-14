/**
 * Modal Global de Gastos Fixos
 * Gerencia o modal de gasto fixo disponível em todas as páginas do dashboard
 */

(function() {
    'use strict';

    let editingGastoId = null;

    // Aguarda o DOM estar pronto
    function init() {
        // Event listeners já são configurados via onclick no HTML
    }

    // Funções globais para abrir/fechar modal
    window.openGastoFixoModal = function(gastoId = null) {
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

            const descricao = document.getElementById('gastoFixoDescription').value.trim();
            const valor = parseCurrencyValue(document.getElementById('gastoFixoAmount').value);
            const dia_vencimento = parseInt(document.getElementById('gastoFixoDueDay').value);
            const categoria_id = document.getElementById('gastoFixoCategory').value || null;

            if (!descricao) {
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
                descricao,
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
            document.getElementById('gastoFixoDescription').value = gasto.descricao || '';
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

    // Inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
