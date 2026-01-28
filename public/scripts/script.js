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
  // Toggle Password Visibility
  document.body.addEventListener('click', (e) => {
    // Check if the clicked element or its parent is the toggle button
    const button = e.target.closest('.toggle-password');
    if (!button) return;

    // Prevent form submission if inside a form
    e.preventDefault();

    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;

    const iconSvg = button.querySelector('.eye-icon');

    if (input.type === 'password') {
      input.type = 'text';
      if (iconSvg) iconSvg.style.stroke = '#A0430A'; // Primary color
    } else {
      input.type = 'password';
      if (iconSvg) iconSvg.style.stroke = ''; // Reset to original
    }
  });

  clearUserSession();

  const mainContainer = document.querySelector('.main-container');
  const linkToSignup = document.getElementById('linkToSignup');
  const linkToLogin = document.getElementById('linkToLogin');
  const linkForgotPassword = document.getElementById('linkForgotPassword');
  const cancelForgot = document.getElementById('cancelForgot');
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

  /* =========================================================
     LÓGICA DE TABS (EMAIL / CREDENCIAL)
     ========================================================= */
  const tabBtns = document.querySelectorAll('.tab-btn');
  const emailGroup = document.getElementById('email-input-group');
  const credentialGroup = document.getElementById('credential-input-group');
  const passwordGroup = document.getElementById('password-group'); // Grupo senha normal
  const activationFields = document.getElementById('activation-fields'); // Grupo ativação

  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  const btnCredentialContinue = document.getElementById('btnCredentialContinue');
  const btnActivateAccount = document.getElementById('btnActivateAccount');

  const emailInput = document.getElementById('login-email');
  const credentialInput = document.getElementById('credential');

  let loginMode = 'email'; // email | credential
  let credentialValidated = false; // Se já validou a existência da credencial

  // Reset UI Helper
  function resetLoginUI() {
    passwordGroup.classList.remove('hidden');
    activationFields.classList.add('hidden');

    btnLoginSubmit.classList.remove('hidden');
    btnCredentialContinue.classList.add('hidden');
    btnActivateAccount.classList.add('hidden');

    credentialValidated = false;
    credentialInput.readOnly = false;
  }

  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Reset steps
        resetLoginUI();
        clearAllFeedbacks();

        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const target = btn.dataset.target;
        if (target === 'email-input-group') {
          emailGroup.classList.remove('hidden');
          credentialGroup.classList.add('hidden');
          loginMode = 'email';
          emailInput.focus();
        } else {
          emailGroup.classList.add('hidden');
          credentialGroup.classList.remove('hidden');
          loginMode = 'credential';
          credentialInput.focus();

          // Credential Mode Initial State: Hide Password, Show Continue
          passwordGroup.classList.add('hidden');
          btnLoginSubmit.classList.add('hidden');
          btnCredentialContinue.classList.remove('hidden');
        }
      });
    });
  }

  /* =========================================================
     TOGGLE MODES (LOGIN <-> SIGNUP <-> FORGOT)
     ========================================================= */

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

  if (linkForgotPassword) {
    linkForgotPassword.addEventListener('click', (e) => {
      e.preventDefault();
      clearAllFeedbacks();
      mainContainer.classList.remove('sign-up-mode');
      mainContainer.classList.add('forgot-password-mode');
      // Reset steps logic if needed
      if (typeof goToStep === 'function') {
        const step1 = document.getElementById('step-1-email');
        if (step1) goToStep(step1);
      }
    });
  }

  if (cancelForgot) {
    cancelForgot.addEventListener('click', (e) => {
      e.preventDefault();
      clearAllFeedbacks();
      mainContainer.classList.remove('forgot-password-mode');
    });
  }

  if (linkBackToLogin) {
    linkBackToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      clearAllFeedbacks();
      mainContainer.classList.remove('forgot-password-mode');
    });
  }

  /* =========================================================
     LOGICA DO BOTÃO CONTINUAR (CREDENCIAL)
     ========================================================= */
  if (btnCredentialContinue) {
    btnCredentialContinue.addEventListener('click', async (e) => {
      e.preventDefault();
      clearAllFeedbacks();

      const cred = sanitizeInput(credentialInput.value).toUpperCase();
      if (!cred) {
        showFeedback('login', 'error', 'Por favor, digite sua credencial.');
        return;
      }

      btnCredentialContinue.innerText = 'Verificando...';
      btnCredentialContinue.disabled = true;

      try {
        const res = await fetch('/api/v1/users/check-credential', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: cred })
        });
        const data = await res.json();

        if (res.ok && data.exists) {
          credentialValidated = true;
          credentialInput.readOnly = true; // Trava input

          btnCredentialContinue.classList.add('hidden'); // Esconde Continue

          if (data.firstAccess) {
            // FLUXO ATIVAÇÃO
            activationFields.classList.remove('hidden');
            btnActivateAccount.classList.remove('hidden');
            showFeedback('login', 'success', `Bem-vindo, ${data.nome.split(' ')[0]}. Crie sua senha.`);
          } else {
            // FLUXO LOGIN NORMAL
            passwordGroup.classList.remove('hidden');
            btnLoginSubmit.classList.remove('hidden');
            document.getElementById('password').focus();
          }

        } else {
          showFeedback('login', 'error', data.error || 'Credencial não encontrada.');
        }
      } catch (err) {
        console.error(err);
        showFeedback('login', 'error', 'Erro de conexão.');
      } finally {
        btnCredentialContinue.innerText = 'Continuar';
        btnCredentialContinue.disabled = false;
      }
    });
  }

  /* =========================================================
     LOGICA DO BOTÃO ATIVAR CONTA
     ========================================================= */
  if (btnActivateAccount) {
    btnActivateAccount.addEventListener('click', async (e) => {
      e.preventDefault();
      clearAllFeedbacks();

      const pass1 = document.getElementById('new-active-password').value;
      const pass2 = document.getElementById('confirm-active-password').value;
      const cred = sanitizeInput(credentialInput.value).toUpperCase();

      if (pass1 !== pass2) {
        showFeedback('login', 'error', 'As senhas não coincidem.');
        return;
      }
      if (pass1.length < 6) {
        showFeedback('login', 'error', 'A senha deve ter no mínimo 6 caracteres.');
        return;
      }

      btnActivateAccount.innerText = 'Ativando...';
      btnActivateAccount.disabled = true;

      try {
        const res = await fetch('/api/v1/users/activate-credential', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: cred, newPassword: pass1 })
        });
        const data = await res.json();

        if (res.ok) {
          showFeedback('login', 'success', 'Conta ativada! Entrando...');

          // Auto-login
          try {
            const loginRes = await fetch('/api/v1/users/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ login: cred, senha: pass1 })
            });
            const loginResult = await loginRes.json();

            if (loginRes.ok) {
              if (loginResult.token) sessionStorage.setItem('accessToken', loginResult.token);
              if (loginResult.refreshToken) sessionStorage.setItem('refreshToken', loginResult.refreshToken);
              if (loginResult.user) {
                sessionStorage.setItem('user', JSON.stringify(loginResult.user));
                if (loginResult.user.nome) sessionStorage.setItem('userName', sanitizeInput(loginResult.user.nome));
              }

              setTimeout(() => {
                if (['admin', 'manager', 'super_admin'].includes(loginResult.user.role)) {
                  window.location.replace('/admin.html');
                } else {
                  window.location.replace('/financeiro/dashboard'); // Fallback or user role
                }
              }, 1000);
            } else {
              // Fallback if auto-login fails
              window.location.reload();
            }
          } catch (loginErr) {
            console.error(loginErr);
            window.location.reload();
          }

        } else {
          showFeedback('login', 'error', data.error);
        }
      } catch (err) {
        showFeedback('login', 'error', 'Erro de conexão.');
      } finally {
        btnActivateAccount.innerText = 'Ativar Conta';
        btnActivateAccount.disabled = false;
      }
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      // Esse listener agora é só para o LOGIN NORMAL (btn-submit ENTER ou Click)
      e.preventDefault();
      clearAllFeedbacks();

      const btn = btnLoginSubmit; // Botão de login normal
      const txtOriginal = btn.innerText;

      // Decide qual valor enviar
      let loginValue = '';
      if (loginMode === 'email') {
        loginValue = sanitizeInput(emailInput.value);
        if (!loginValue) {
          showFeedback('login', 'error', 'Por favor, digite seu email.');
          return;
        }
      } else {
        loginValue = sanitizeInput(credentialInput.value).toUpperCase();
        if (!loginValue) {
          showFeedback('login', 'error', 'Por favor, digite sua credencial.');
          return;
        }
      }

      const senha = document.getElementById('password').value;
      if (!senha) {
        showFeedback('login', 'error', 'Por favor, digite sua senha.');
        return;
      }

      btn.innerText = 'Entrando...';
      btn.disabled = true;

      try {
        const response = await fetch('/api/v1/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: loginValue, senha }),
        });

        // ... (Mesma lógica de antes)
        const result = await response.json().catch(() => ({}));

        if (response.ok) {
          // Store tokens (Backend returns 'token' and 'refreshToken')
          if (result.token) sessionStorage.setItem('accessToken', result.token);
          if (result.refreshToken) sessionStorage.setItem('refreshToken', result.refreshToken);

          if (result.user) {
            try {
              sessionStorage.setItem('user', JSON.stringify(result.user));
              if (result.user.nome) {
                sessionStorage.setItem('userName', sanitizeInput(result.user.nome));
              }
            } catch (e) { console.warn('⚠️ Erro ao salvar dados locais:', e); }
          }

          showFeedback('login', 'success', 'Acesso permitido! Redirecionando...');

          setTimeout(() => {
            if (['admin', 'manager', 'super_admin'].includes(result.user.role)) {
              window.location.replace('/admin.html');
            } else {
              window.location.replace('/subsistemas');
            }
          }, 1000);

        } else {
          showFeedback('login', 'error', result.error || 'Acesso negado, verifique suas credenciais.');
        }
      } catch (error) {
        console.error('❌ Erro de conexão:', error);
        showFeedback('login', 'error', 'Erro de conexão com o servidor.');
      } finally {
        const senhaInput = document.getElementById('password');
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
      const btn = signupForm.querySelector('button[type="submit"]');
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
      const btn = forgotEmailForm.querySelector('button[type="submit"]');
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
      const btn = forgotCodeForm.querySelector('button[type="submit"]');
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
      const btn = forgotResetForm.querySelector('button[type="submit"]');
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