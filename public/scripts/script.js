// ========================================================
// LOGIN/SIGNUP COM SEGURANÇA
// Usa sessionStorage, sanitização de XSS e refresh tokens
// ========================================================

/**
 * Sanitiza string removendo tags HTML e caracteres perigosos
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizada
 */
function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  
  // Remove tags HTML
  str = str.replace(/<[^>]*>/g, '');
  
  // Remove caracteres de controle
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return str.trim();
}

/**
 * Limpa todos os dados da sessão do usuário
 */
function clearUserSession() {
  // ⚠️ SEGURANÇA: Usa sessionStorage em vez de localStorage
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('userName');
  
  // Também limpa localStorage se houve migração
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userName');
}

// =========================================
// ANTI-CACHE: RECARREGA PAGE SHOW
// =========================================
window.addEventListener('pageshow', function(event) {
  if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
    window.location.reload();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // =========================================
  // AUTO-LOGOUT AO ACESSAR LOGIN PAGE
  // =========================================
  clearUserSession();

  // =========================================
  // ANIMAÇÃO LOGIN/SIGNUP/FORGOT PASSWORD
  // =========================================
  const mainContainer = document.querySelector('.main-container');
  const linkToSignup = document.getElementById('linkToSignup');
  const linkToLogin = document.getElementById('linkToLogin');
  const linkToForgotPassword = document.getElementById('linkToForgotPassword');
  const linkBackToLogin = document.getElementById('linkBackToLogin');

  if (linkToSignup) {
    linkToSignup.addEventListener('click', (e) => {
      e.preventDefault();
      mainContainer.classList.remove('forgot-password-mode');
      mainContainer.classList.add('sign-up-mode');
    });
  }

  if (linkToLogin) {
    linkToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      mainContainer.classList.remove('sign-up-mode');
      mainContainer.classList.remove('forgot-password-mode');
    });
  }

  if (linkToForgotPassword) {
    linkToForgotPassword.addEventListener('click', (e) => {
      e.preventDefault();
      mainContainer.classList.remove('sign-up-mode');
      mainContainer.classList.add('forgot-password-mode');
    });
  }

  if (linkBackToLogin) {
    linkBackToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      mainContainer.classList.remove('forgot-password-mode');
    });
  }

  // =========================================
  // TOGGLE VISIBILIDADE SENHA
  // =========================================
  const toggleButtons = document.querySelectorAll('.toggle-password');
  toggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const iconSvg = button.querySelector('.eye-icon');

      if (input.getAttribute('type') === 'password') {
        input.setAttribute('type', 'text');
        if (iconSvg) iconSvg.style.stroke = '#9c4c19';
      } else {
        input.setAttribute('type', 'password');
        if (iconSvg) iconSvg.style.stroke = '#9ca3af';
      }
    });
  });

  // =========================================
  // SUBMISSÃO LOGIN
  // =========================================
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = sanitizeInput(document.getElementById('login-email').value);
      const senha = document.getElementById('login-senha').value; // Senha não é sanitizada
      const btn = loginForm.querySelector('.btn-submit');
      const txtOriginal = btn.innerText;

      // Validação básica
      if (!email || !senha) {
        alert('Email e senha são obrigatórios.');
        return;
      }

      btn.innerText = 'Entrando...';
      btn.disabled = true;

      try {
        // Usa a nova API com versão
        const response = await fetch('/api/v1/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha }),
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok) {
          // ⚠️ SEGURANÇA: Armazena tokens em sessionStorage
          if (result.accessToken) {
            sessionStorage.setItem('accessToken', result.accessToken);
          }

          if (result.refreshToken) {
            sessionStorage.setItem('refreshToken', result.refreshToken);
          }

          // Armazena dados do usuário (sanitizados)
          if (result.user) {
            try {
              sessionStorage.setItem('user', JSON.stringify(result.user));
              if (result.user.nome) {
                sessionStorage.setItem('userName', sanitizeInput(result.user.nome));
              }
            } catch (e) {
              console.warn('⚠️ Erro ao salvar dados locais:', e);
            }
          }

          alert('✅ Login com sucesso! Redirecionando...');

          // Sempre redireciona para subsistemas após login
          window.location.replace('/subsistemas');
        } else {
          alert(`❌ ${result.error || 'Falha no login.'}`);
        }
      } catch (error) {
        console.error('❌ Erro de conexão:', error);
        alert('❌ Erro de conexão com o servidor.');
      } finally {
        // Limpa campo de senha
        const senhaInput = document.getElementById('login-senha');
        if (senhaInput) senhaInput.value = '';

        btn.innerText = txtOriginal;
        btn.disabled = false;
      }
    });
  }

  // =========================================
  // SUBMISSÃO CADASTRO
  // =========================================
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome = sanitizeInput(document.getElementById('signup-nome').value);
      const email = sanitizeInput(document.getElementById('signup-email').value);
      const senha = document.getElementById('signup-senha').value; // Não sanitiza senha
      const confSenha = document.getElementById('signup-confSenha').value;
      const btn = signupForm.querySelector('.btn-submit');
      const txtOriginal = btn.innerText;

      // Validações
      if (!nome || !email || !senha || !confSenha) {
        alert('Todos os campos são obrigatórios.');
        return;
      }

      if (senha !== confSenha) {
        alert('As senhas não coincidem.');
        return;
      }

      if (senha.length < 8) {
        alert('A senha deve ter no mínimo 8 caracteres.');
        return;
      }

      // Validação de email simples
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Email inválido.');
        return;
      }

      btn.innerText = 'Cadastrando...';
      btn.disabled = true;

      try {
        // Usa a nova API com versão
        const response = await fetch('/api/v1/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, senha }),
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok) {
          alert(`✅ ${result.message || 'Cadastro realizado! Faça login.'}`);
          signupForm.reset();
          mainContainer.classList.remove('sign-up-mode');
        } else {
          alert(`❌ ${result.error || 'Falha no cadastro.'}`);
        }
      } catch (error) {
        console.error('❌ Erro de conexão:', error);
        alert('❌ Erro de conexão com o servidor.');
      } finally {
        // Limpa campos de senha
        const senhaInput = document.getElementById('signup-senha');
        if (senhaInput) senhaInput.value = '';

        const confSenhaInput = document.getElementById('signup-confSenha');
        if (confSenhaInput) confSenhaInput.value = '';

        btn.innerText = txtOriginal;
        btn.disabled = false;
      }
    });
  }

  // =========================================
  // FORMULÁRIO DE RECUPERAÇÃO DE SENHA
  // =========================================
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = forgotPasswordForm.querySelector('button[type="submit"]');
      const txtOriginal = btn.innerText;
      btn.innerText = 'Enviando...';
      btn.disabled = true;

      const email = sanitizeInput(document.getElementById('forgot-email').value);

      try {
        const response = await fetch('/api/v1/users/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const result = await response.json();

        if (response.ok) {
          // Em produção, o token seria enviado por email
          // Por ora, mostramos o link direto para teste
          if (result.token) {
            const resetLink = `${window.location.origin}/reset-password.html?token=${result.token}`;
            
            // Copia automaticamente para clipboard
            try {
              await navigator.clipboard.writeText(resetLink);
              alert(`✅ Link de recuperação copiado!\n\nCole no navegador para redefinir sua senha.\n\n⚠️ Em produção, este link seria enviado por email.`);
            } catch (clipboardErr) {
              // Fallback se clipboard falhar
              alert(`✅ Link de recuperação:\n\n${resetLink}\n\n📋 Copie o link acima\n⚠️ Em produção, este link seria enviado por email.`);
            }
          } else {
            alert(`✅ ${result.message || 'Se o email existir, um link de recuperação foi enviado.'}`);
          }
          forgotPasswordForm.reset();
          mainContainer.classList.remove('forgot-password-mode');
        } else {
          alert(`❌ ${result.error || 'Falha ao enviar link de recuperação.'}`);
        }
      } catch (error) {
        console.error('❌ Erro de conexão:', error);
        alert('❌ Erro de conexão com o servidor.');
      } finally {
        btn.innerText = txtOriginal;
        btn.disabled = false;
      }
    });
  }
});