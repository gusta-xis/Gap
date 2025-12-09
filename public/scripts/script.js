document.addEventListener('DOMContentLoaded', () => {

    // =========================================
    // 1. LÓGICA DA ANIMAÇÃO DE TROCA
    // =========================================
    const mainContainer = document.querySelector('.main-container');
    const linkToSignup = document.getElementById('linkToSignup');
    const linkToLogin = document.getElementById('linkToLogin');

    // Quando clicar em "Crie uma conta"
    linkToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        // Adiciona a classe que aciona o CSS transform para a esquerda
        mainContainer.classList.add('sign-up-mode');
    });

    // Quando clicar em "Acesse sua conta"
    linkToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove a classe, voltando ao estado original
        mainContainer.classList.remove('sign-up-mode');
    });


    // =========================================
    // 2. LÓGICA DO OLHO (Funciona para ambos os forms)
    // =========================================
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const iconSvg = button.querySelector('.eye-icon');
            
            if (input.getAttribute('type') === 'password') {
                input.setAttribute('type', 'text');
                iconSvg.style.stroke = "#9c4c19"; 
            } else {
                input.setAttribute('type', 'password');
                iconSvg.style.stroke = "#9ca3af";
            }
        });
    });


    // =========================================
    // 3. SUBMISSÃO DO LOGIN
    // =========================================
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Usei os novos IDs
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-senha').value;
        const btn = loginForm.querySelector('.btn-submit');
        const txtOriginal = btn.innerText;

        btn.innerText = "Entrando..."; btn.disabled = true;

        try {
            // Chama o endpoint de login do usuário
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            const result = await response.json().catch(() => ({}));

            if (response.ok) {
                // Resultado esperado: { token, user }
                if (result.token) {
                    // Armazena token para chamadas autenticadas futuras
                    localStorage.setItem('token', result.token);
                }
                // Armazena também os dados do usuário para exibir o nome no subtemas
                if (result.user) {
                    try {
                        localStorage.setItem('user', JSON.stringify(result.user));
                        if (result.user.nome) localStorage.setItem('userName', result.user.nome);
                    } catch (e) {
                        console.warn('Não foi possível salvar dados do usuário localmente.', e);
                    }
                }
                alert('Login com sucesso! Redirecionando para o painel...');
                // Redireciona diretamente para a rota do servidor que serve subtemas.html
                window.location.href = '/subtemas';
            } else {
                alert(result.error || 'Falha no login.');
            }
        } catch (error) {
            console.error(error); alert('Erro de conexão.');
        } finally {
            // Limpa senha do campo e memória
            const s = document.getElementById('login-senha'); if (s) s.value = '';
            btn.innerText = txtOriginal; btn.disabled = false;
        }
    });


    // =========================================
    // 4. SUBMISSÃO DO CADASTRO
    // =========================================
    const signupForm = document.getElementById('signupForm');
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Usei os novos IDs
        const nome = document.getElementById('signup-nome').value;
        const email = document.getElementById('signup-email').value;
        const senha = document.getElementById('signup-senha').value;
        const confSenha = document.getElementById('signup-confSenha').value;
        const btn = signupForm.querySelector('.btn-submit');
        const txtOriginal = btn.innerText;

        if (senha !== confSenha) {
            alert('As senhas não coincidem.'); return;
        }

        btn.innerText = "Cadastrando..."; btn.disabled = true;

        try {
            // Chama o endpoint de criação de usuário
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha })
            });
            const result = await response.json().catch(() => ({}));

            if (response.ok) {
                alert(result.message || 'Cadastro realizado! Faça login.');
                signupForm.reset();
                // Volta para a tela de login
                mainContainer.classList.remove('sign-up-mode');
            } else {
                alert(result.error || 'Falha no cadastro.');
            }
        } catch (error) {
            console.error(error); alert('Erro de conexão.');
        } finally {
            // Limpa senhas do DOM
            const s1 = document.getElementById('signup-senha'); if (s1) s1.value = '';
            const s2 = document.getElementById('signup-confSenha'); if (s2) s2.value = '';
            btn.innerText = txtOriginal; btn.disabled = false;
        }
    });
});