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

  /* =========================================================
     NOVO FLUXO DE RECUPERAÇÃO DE SENHA (CÓDIGO 6 DÍGITOS)
     ========================================================= */

  // Referências aos passos
  const step1Email = document.getElementById('step-1-email');
  const step2Code = document.getElementById('step-2-code');
  const step3Reset = document.getElementById('step-3-new-password');

  // Referências aos formulários
  const forgotEmailForm = document.getElementById('forgotEmailForm');
  const forgotCodeForm = document.getElementById('forgotCodeForm');
  const forgotResetForm = document.getElementById('forgotResetForm');

  // Estado local para controle
  let recoveryEmail = '';
  let recoveryCode = '';

  // Helper para transição de passos
  function goToStep(showStep) {
    step1Email.classList.add('hidden');
    step2Code.classList.add('hidden');
    step3Reset.classList.add('hidden');

    showStep.classList.remove('hidden');
    clearAllFeedbacks();
  }

  // PASSO 1: ENVIAR EMAIL
  if (forgotEmailForm) {
    forgotEmailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllFeedbacks();

      const emailInput = document.getElementById('forgot-email');
      const email = sanitizeInput(emailInput.value);
      const btn = forgotEmailForm.querySelector('.btn-submit');
      const txtOriginal = btn.innerText;

      btn.innerText = 'Enviando...';
      btn.disabled = true;

      try {
        const response = await fetch('/api/v1/users/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const result = await response.json();

        if (response.ok) {
          recoveryEmail = email;
          document.getElementById('userEmailDisplay').textContent = email;
          goToStep(step2Code);
          showFeedback('forgotStep2', 'success', result.message || 'Código enviado! Verifique seu email.');
        } else {
          showFeedback('forgotStep1', 'error', result.error || 'Erro ao enviar código.');
        }
      } catch (error) {
        console.error(error);
        showFeedback('forgotStep1', 'error', 'Erro de conexão.');
      } finally {
        btn.innerText = txtOriginal;
        btn.disabled = false;
      }
    });
  }

  // PASSO 2: VERIFICAR CÓDIGO
  if (forgotCodeForm) {
    forgotCodeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllFeedbacks();

      const codeInput = document.getElementById('forgot-code');
      const code = sanitizeInput(codeInput.value);
      const btn = forgotCodeForm.querySelector('.btn-submit');
      const txtOriginal = btn.innerText;

      if (code.length !== 6) {
        showFeedback('forgotStep2', 'error', 'O código deve ter 6 números.');
        return;
      }

      btn.innerText = 'Verificando...';
      btn.disabled = true;

      try {
        const response = await fetch('/api/v1/users/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: recoveryEmail, code }),
        });

        const result = await response.json();

        if (response.ok) {
          recoveryCode = code;
          goToStep(step3Reset);
          showFeedback('forgotStep3', 'success', 'Código validado! Crie sua nova senha.');
        } else {
          showFeedback('forgotStep2', 'error', result.error || 'Código inválido ou expirado.');
        }
      } catch (error) {
        showFeedback('forgotStep2', 'error', 'Erro de conexão.');
      } finally {
        btn.innerText = txtOriginal;
        btn.disabled = false;
      }
    });

    // Botão Reenviar
    const btnResend = document.getElementById('btnResendCode');
    if (btnResend) {
      btnResend.addEventListener('click', () => {
        goToStep(step1Email);
        showFeedback('forgotStep1', 'success', 'Confirme seu email para reenviar.');
      });
    }
  }

  // PASSO 3: REDEFINIR SENHA
  if (forgotResetForm) {
    forgotResetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllFeedbacks();

      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-new-password').value;
      const btn = forgotResetForm.querySelector('.btn-submit');
      const txtOriginal = btn.innerText;

      if (newPassword !== confirmPassword) {
        showFeedback('forgotStep3', 'error', 'As senhas não coincidem.');
        return;
      }

      if (newPassword.length < 8) {
        showFeedback('forgotStep3', 'error', 'A senha deve ter no mínimo 8 caracteres.');
        return;
      }

      btn.innerText = 'Redefinindo...';
      btn.disabled = true;

      try {
        const response = await fetch('/api/v1/users/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: recoveryEmail, code: recoveryCode, newPassword }),
        });

        const result = await response.json();

        if (response.ok) {
          showFeedback('forgotStep3', 'success', 'Senha redefinida com sucesso! Redirecionando...');
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          showFeedback('forgotStep3', 'error', result.error || 'Erro ao redefinir senha.');
        }
      } catch (error) {
        showFeedback('forgotStep3', 'error', 'Erro de conexão.');
      } finally {
        btn.innerText = txtOriginal;
        btn.disabled = false;
      }
    });
  }
});