// =========================================
// 0. FORÇAR RECARREGAMENTO (ANTI-CACHE)
// =========================================
window.addEventListener('pageshow', function(event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================
    // 1. AUTO-LOGOUT AO ACESSAR ESSA TELA
    // =========================================
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userName');

    // =========================================
    // 2. LÓGICA DA ANIMAÇÃO DE TROCA (LOGIN/CADASTRO)
    // =========================================
    const mainContainer = document.querySelector('.main-container');
    const linkToSignup = document.getElementById('linkToSignup');
    const linkToLogin = document.getElementById('linkToLogin');

    if(linkToSignup) {
        linkToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            mainContainer.classList.add('sign-up-mode');
        });
    }

    if(linkToLogin) {
        linkToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            mainContainer.classList.remove('sign-up-mode');
        });
    }

    // =========================================
    // 3. LÓGICA DO OLHO (MOSTRAR/OCULTAR SENHA)
    // =========================================
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const iconSvg = button.querySelector('.eye-icon');

            if (input.getAttribute('type') === 'password') {
                input.setAttribute('type', 'text');
                if(iconSvg) iconSvg.style.stroke = '#9c4c19';
            } else {
                input.setAttribute('type', 'password');
                if(iconSvg) iconSvg.style.stroke = '#9ca3af';
            }
        });
    });

    // =========================================
    // 4. SUBMISSÃO DO LOGIN
    // =========================================
    const loginForm = document.getElementById('loginForm');
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;
            const btn = loginForm.querySelector('.btn-submit');
            const txtOriginal = btn.innerText;

            btn.innerText = 'Entrando...';
            btn.disabled = true;

            try {
                const response = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha }),
                });
                const result = await response.json().catch(() => ({}));

                if (response.ok) {
                    // Salva Token e Usuário
                    if (result.token) localStorage.setItem('token', result.token);
                    if (result.user) {
                        try {
                            localStorage.setItem('user', JSON.stringify(result.user));
                            if (result.user.nome) localStorage.setItem('userName', result.user.nome);
                        } catch (e) {
                            console.warn('Erro ao salvar dados locais.', e);
                        }
                    }
                    
                    alert('Login com sucesso! Redirecionando...');
                    
                    // Verificar se é o primeiro acesso ao financeiro
                    const financeIntroSeen = localStorage.getItem('financeIntroSeen');
                    
                    if (financeIntroSeen === 'true') {
                        // Já viu a introdução, vai direto para subsistemas
                        window.location.replace('/subsistemas');
                    } else {
                        // Primeiro acesso, vai para a introdução do financeiro
                        window.location.replace('/financeiro');
                    } 
                    
                } else {
                    alert(result.error || 'Falha no login.');
                }
            } catch (error) {
                console.error(error);
                alert('Erro de conexão.');
            } finally {
                const s = document.getElementById('login-senha');
                if (s) s.value = '';
                btn.innerText = txtOriginal;
                btn.disabled = false;
            }
        });
    }

    // =========================================
    // 5. SUBMISSÃO DO CADASTRO
    // =========================================
    const signupForm = document.getElementById('signupForm');
    if(signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('signup-nome').value;
            const email = document.getElementById('signup-email').value;
            const senha = document.getElementById('signup-senha').value;
            const confSenha = document.getElementById('signup-confSenha').value;
            const btn = signupForm.querySelector('.btn-submit');
            const txtOriginal = btn.innerText;

            if (senha !== confSenha) {
                alert('As senhas não coincidem.');
                return;
            }

            btn.innerText = 'Cadastrando...';
            btn.disabled = true;

            try {
                const response = await fetch('/api/users', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, senha }),
                });
                const result = await response.json().catch(() => ({}));

                if (response.ok) {
                    alert(result.message || 'Cadastro realizado! Faça login.');
                    signupForm.reset();
                    mainContainer.classList.remove('sign-up-mode');
                } else {
                    alert(result.error || 'Falha no cadastro.');
                }
            } catch (error) {
                console.error(error);
                alert('Erro de conexão.');
            } finally {
                const s1 = document.getElementById('signup-senha');
                if (s1) s1.value = '';
                const s2 = document.getElementById('signup-confSenha');
                if (s2) s2.value = '';
                btn.innerText = txtOriginal;
                btn.disabled = false;
            }
        });
    }
});