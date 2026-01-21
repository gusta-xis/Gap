// Função global para ser chamada pelo spa-router.js
window.initializeSettings = async function () {
    console.log('⚙️ Inicializando Configurações...');

    if (typeof window.enforceSecurity !== 'function') {
        window.enforceSecurity = function () {
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
            if (!token) {
                window.location.replace('/');
                return;
            }
        };
    }

    // Oculta conteúdo até validar (simulação, pois já carregou)
    window.enforceSecurity();

    // Sanitização básica
    const sanitizeInput = (str) => {
        if (typeof str !== 'string') return str;
        str = str.replace(/<[^>]*>/g, '');
        return str.trim();
    };

    // Feedback Visual
    const showFeedback = (context, type, message) => {
        // context deve ser 'profile' ou 'security'
        const successBox = document.getElementById(`${context}SuccessMessage`);
        const errorBox = document.getElementById(`${context}ErrorMessage`);

        if (!successBox || !errorBox) return;

        const msgData = type === 'success' ? successBox : errorBox;
        const boxHide = type === 'success' ? errorBox : successBox;

        boxHide.classList.add('hidden');

        const span = msgData.querySelector('.msg-text');
        if (span) span.textContent = message;

        msgData.classList.remove('hidden');

        // Auto-hide após 5 segundos para limpar a tela
        setTimeout(() => {
            if (msgData) msgData.classList.add('hidden');
        }, 5000);
    };

    const clearFeedbacks = (context) => {
        const successBox = document.getElementById(`${context}SuccessMessage`);
        const errorBox = document.getElementById(`${context}ErrorMessage`);
        if (successBox) successBox.classList.add('hidden');
        if (errorBox) errorBox.classList.add('hidden');
    };

    // Setup Header User Info (Re-fetch se necessário, mas o SPA já cuida)
    const userJson = sessionStorage.getItem('user') || localStorage.getItem('user');
    let userData = null;

    if (userJson) {
        try {
            userData = JSON.parse(userJson);
        } catch (e) {
            console.warn('Erro parsing user storage', e);
        }
    }

    // Preencher formulário de perfil se tiver dados
    const profileNome = document.getElementById('profile-nome');
    const profileEmail = document.getElementById('profile-email');

    if (userData) {
        if (profileNome) profileNome.value = userData.nome || '';
        if (profileEmail) profileEmail.value = userData.email || '';
    }

    // Se possível, atualizar dados do servidor para garantir frescor
    if (userData && userData.id) {
        try {
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
            const res = await fetch(`/api/v1/users/${userData.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const freshUser = await res.json();
                // Atualiza campos
                if (profileNome) profileNome.value = freshUser.nome;
                if (profileEmail) profileEmail.value = freshUser.email;
                // Atualiza storage sem apagar token
                const newUserData = { ...userData, ...freshUser };
                sessionStorage.setItem('user', JSON.stringify(newUserData));
                localStorage.setItem('user', JSON.stringify(newUserData)); // Sincroniza
                userData = newUserData; // Atualiza ref local

                // Atualiza header se necessário (embora o SPA Router faça isso)
                if (window.SPARouter && window.SPARouter.updateUserInfo) {
                    window.SPARouter.updateUserInfo();
                }
            }
        } catch (err) {
            console.warn('Não foi possível buscar dados atualizados do usuário.', err);
        }
    }

    // Toggle Password Visibility
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach((button) => {
        // Remove listeners antigos se houver (para garantir) - cloneNode é heavy, melhor só adicionar novo
        // Como o HTML é recriado, não há listeners antigos.
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const iconSvg = button.querySelector('.eye-icon');

            if (input.getAttribute('type') === 'password') {
                input.setAttribute('type', 'text');
                if (iconSvg) iconSvg.style.stroke = '#9c4c19'; // Primary color
            } else {
                input.setAttribute('type', 'password');
                if (iconSvg) iconSvg.style.stroke = '#9ca3af';
            }
        });
    });

    // Handle Profile Update
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearFeedbacks('profile');

            if (!userData || !userData.id) {
                showFeedback('profile', 'error', 'Sessão inválida. Faça login novamente.');
                return;
            }

            const btn = profileForm.querySelector('.btn-submit');
            const originalText = btn.innerText;
            btn.innerText = 'Salvando...';
            btn.disabled = true;

            const nome = sanitizeInput(document.getElementById('profile-nome').value);
            const email = sanitizeInput(document.getElementById('profile-email').value);

            try {
                const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
                const response = await fetch(`/api/v1/users/${userData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ nome, email })
                });

                const result = await response.json();

                if (response.ok) {
                    showFeedback('profile', 'success', 'Dados atualizados com sucesso!');
                    // Update local storage
                    const updatedUser = { ...userData, nome, email };
                    sessionStorage.setItem('user', JSON.stringify(updatedUser));
                    localStorage.setItem('user', JSON.stringify(updatedUser)); // Sync

                    // Update header via Router logic
                    if (window.SPARouter && window.SPARouter.updateUserInfo) {
                        window.SPARouter.updateUserInfo();
                    }

                } else {
                    showFeedback('profile', 'error', result.message || result.error || 'Erro ao atualizar dados.');
                }
            } catch (error) {
                console.error(error);
                showFeedback('profile', 'error', 'Erro de conexão.');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }

    // Handle Security Update
    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearFeedbacks('security');

            if (!userData || !userData.id) {
                showFeedback('security', 'error', 'Sessão inválida. Faça login novamente.');
                return;
            }

            const senhaAtual = document.getElementById('security-senhaAtual').value;
            const senha = document.getElementById('security-senha').value;
            const confSenha = document.getElementById('security-confSenha').value;

            if (!senhaAtual) {
                showFeedback('security', 'error', 'Digite sua senha atual.');
                return;
            }

            if (senha !== confSenha) {
                showFeedback('security', 'error', 'As senhas não coincidem.');
                return;
            }

            if (senha.length < 8) {
                showFeedback('security', 'error', 'A senha deve ter no mínimo 8 caracteres.');
                return;
            }

            const btn = securityForm.querySelector('.btn-submit');
            const originalText = btn.innerText;
            btn.innerText = 'Atualizando...';
            btn.disabled = true;

            try {
                const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
                const response = await fetch(`/api/v1/users/${userData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ senha, senhaAtual })
                });

                const result = await response.json();

                if (response.ok) {
                    showFeedback('security', 'success', 'Senha alterada com sucesso!');
                    securityForm.reset();
                } else {
                    showFeedback('security', 'error', result.message || result.error || 'Erro ao alterar senha.');
                }
            } catch (error) {
                console.error(error);
                showFeedback('security', 'error', 'Erro de conexão.');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }
};

console.log('✅ settings.js carregado');
