function sanitizeInput(str) {
  if (typeof str !== 'string') return str;

  str = str.replace(/<[^>]*>/g, '');

  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return str.trim();
}

function clearUserSession() {
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('userName');

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userName');
}

window.addEventListener('pageshow', function (event) {
  if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
    window.location.reload();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  clearUserSession();

  const mainContainer = document.querySelector('.main-container');
  const linkToSignup = document.getElementById('linkToSignup');
  const linkToLogin = document.getElementById('linkToLogin');
  const linkToForgotPassword = document.getElementById('linkToForgotPassword');
  const linkBackToLogin = document.getElementById('linkBackToLogin');

  // Helper para exibir feedback visual e esconder o oposto
  function showFeedback(context, type, message) {
    const successBox = document.getElementById(`${context}SuccessMessage`);
    const errorBox = document.getElementById(`${context}ErrorMessage`);
    const msgData = type === 'success' ? successBox : errorBox;
    const boxHide = type === 'success' ? errorBox : successBox;

    if (boxHide) boxHide.classList.add('hidden');

    if (msgData) {
      const span = msgData.querySelector('.msg-text');
      if (span) span.textContent = message;
      msgData.classList.remove('hidden');
    }
  }

  // Helper para limpar feedbacks ao trocar de tela
  function clearAllFeedbacks() {
    document.querySelectorAll('.message-box').forEach(box => box.classList.add('hidden'));
  }

  if (linkToSignup) {
    linkToSignup.addEventListener('click', (e) => {
      e.preventDefault();
      clearAllFeedbacks();
      mainContainer.classList.remove('forgot-password-mode');
      mainContainer.classList.add('sign-up-mode');
    });
  }

  if (linkToLogin) {
    linkToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      clearAllFeedbacks();
      mainContainer.classList.remove('sign-up-mode');
      mainContainer.classList.remove('forgot-password-mode');
    });
  }

  if (linkToForgotPassword) {
    linkToForgotPassword.addEventListener('click', (e) => {
      e.preventDefault();
      clearAllFeedbacks();
      mainContainer.classList.remove('sign-up-mode');
      mainContainer.classList.add('forgot-password-mode');
    });
  }

  if (linkBackToLogin) {
    linkBackToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      clearAllFeedbacks();
      mainContainer.classList.remove('forgot-password-mode');
    });
  }

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

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllFeedbacks();

      const email = sanitizeInput(document.getElementById('login-email').value);
      const senha = document.getElementById('login-senha').value;
      const btn = loginForm.querySelector('.btn-submit');
      const txtOriginal = btn.innerText;

      /* Browser validation handles empty fields */

      btn.innerText = 'Entrando...';
      btn.disabled = true;

      try {
        const response = await fetch('/api/v1/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha }),
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok) {
          if (result.accessToken) sessionStorage.setItem('accessToken', result.accessToken);
          if (result.refreshToken) sessionStorage.setItem('refreshToken', result.refreshToken);

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

          showFeedback('login', 'success', 'Acesso permitido! Redirecionando...');

          setTimeout(() => {
            if (result.user && result.user.introducao_vista === 0) {
              window.location.replace('/financeiro');
            } else {
              window.location.replace('/financeiro/dashboard');
            }
          }, 1000); // Pequeno delay para ler a mensagem

        } else {
          showFeedback('login', 'error', 'Acesso negado, verifique suas credenciais.');
        }
      } catch (error) {
        console.error('❌ Erro de conexão:', error);
        showFeedback('login', 'error', 'Erro de conexão com o servidor.');
      } finally {
        const senhaInput = document.getElementById('login-senha');
        if (senhaInput) senhaInput.value = '';

        btn.innerText = txtOriginal;
        btn.disabled = false;
      }
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllFeedbacks();

      const nome = sanitizeInput(document.getElementById('signup-nome').value);
      const email = sanitizeInput(document.getElementById('signup-email').value);
      const senha = document.getElementById('signup-senha').value;
      const confSenha = document.getElementById('signup-confSenha').value;
      const btn = signupForm.querySelector('.btn-submit');
      const txtOriginal = btn.innerText;

      /* Browser validation handles empty fields */

      if (senha !== confSenha) {
        showFeedback('signup', 'error', 'As senhas não coincidem.');
        return;
      }

      if (senha.length < 8) {
        showFeedback('signup', 'error', 'A senha deve ter no mínimo 8 caracteres.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showFeedback('signup', 'error', 'Email inválido.');
        return;
      }

      btn.innerText = 'Cadastrando...';
      btn.disabled = true;

      try {
        const response = await fetch('/api/v1/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, senha }),
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok) {
          showFeedback('signup', 'success', result.message || 'Cadastro realizado! Faça login.');
          signupForm.reset();
          // Opcional: Voltar para login automaticamente após um tempo
          setTimeout(() => {
            mainContainer.classList.remove('sign-up-mode');
            clearAllFeedbacks();
            showFeedback('login', 'success', 'Cadastro realizado! Faça login.');
          }, 2000);
        } else {
          showFeedback('signup', 'error', result.error || 'Falha no cadastro.');
        }
      } catch (error) {
        console.error('❌ Erro de conexão:', error);
        showFeedback('signup', 'error', 'Erro de conexão com o servidor.');
      } finally {
        const senhaInput = document.getElementById('signup-senha');
        if (senhaInput) senhaInput.value = '';

        const confSenhaInput = document.getElementById('signup-confSenha');
        if (confSenhaInput) confSenhaInput.value = '';

        btn.innerText = txtOriginal;
        btn.disabled = false;
      }
    });
  }

  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllFeedbacks();

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
          if (result.token) {
            const resetLink = `${window.location.origin}/reset-password.html?token=${result.token}`;
            try {
              await navigator.clipboard.writeText(resetLink);
              showFeedback('forgot', 'success', 'Link copiado para a área de transferência! (Simulação)');
            } catch (clipboardErr) {
              showFeedback('forgot', 'success', 'Link gerado (verifique console/alert antigo se necessário).');
            }
          } else {
            showFeedback('forgot', 'success', result.message || 'Se o email existir, um link foi enviado.');
          }
          forgotPasswordForm.reset();
        } else {
          showFeedback('forgot', 'error', result.error || 'Falha ao enviar link.');
        }
      } catch (error) {
        console.error('❌ Erro de conexão:', error);
        showFeedback('forgot', 'error', 'Erro de conexão com o servidor.');
      } finally {
        btn.innerText = txtOriginal;
        btn.disabled = false;
      }
    });
  }
});