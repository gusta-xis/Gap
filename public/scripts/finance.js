// ========================================================
// FINANCE INTRO - COM SESSIONSTORE SEGURO
// ========================================================

/**
 * Sanitiza string removendo tags HTML e caracteres perigosos
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  str = str.replace(/<[^>]*>/g, '');
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return str.trim();
}

// =========================================
// SEGURANÇA: ANTI-CACHE
// =========================================
window.addEventListener('pageshow', function(event) {
  if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
    window.location.reload();
  }
});

// =========================================
// VERIFICAÇÃO DE AUTENTICAÇÃO
// =========================================
(function checkAuth() {
  // ⚠️ SEGURANÇA: Mudado para sessionStorage
  const token = sessionStorage.getItem('accessToken');
  if (!token) {
    window.location.replace('/');
    return;
  }

  // Obter ID do usuário para armazenar flag por usuário
  const userJson = sessionStorage.getItem('user');
  let userId = null;
  if (userJson) {
    try {
      const userData = JSON.parse(userJson);
      userId = userData.id;
    } catch (e) {
      console.warn('❌ Erro ao parsear dados do usuário:', e);
    }
  }

  // Se já viu a introdução, pula direto para o dashboard
  // ⚠️ USA localStorage para persistir entre sessões (não limpa ao fechar navegador)
  const introSeenKey = userId ? `financeIntroSeen_${userId}` : 'financeIntroSeen';
  const introSeen = localStorage.getItem(introSeenKey) === 'true';
  
  if (introSeen) {
    window.location.replace('/financeiro/dashboard');
    return;
  }

  // Mostrar a página se passou nas verificações
  document.body.style.display = 'flex';
})();

// =========================================
// STEPPER LÓGICA
// =========================================
document.addEventListener('DOMContentLoaded', () => {
  const steps = document.querySelectorAll('.step-circle');
  const descriptions = document.querySelectorAll('.description');
  const btnNext = document.getElementById('btn-next');
  const btnPrev = document.getElementById('btn-prev');
  const btnContinue = document.getElementById('btn-continue');

  let currentStep = 0;
  const maxSteps = steps.length - 1;

  /**
   * Atualiza a UI (bolinhas, texto e setas)
   */
  function updateUI() {
    // Atualiza bolinhas
    steps.forEach((step, index) => {
      if (index === currentStep) {
        step.classList.remove('step-inactive');
        step.classList.add('step-active');
      } else {
        step.classList.remove('step-active');
        step.classList.add('step-inactive');
      }
    });

    // Atualiza texto (descrição)
    descriptions.forEach((desc, index) => {
      if (index === currentStep) {
        desc.classList.add('active');
      } else {
        desc.classList.remove('active');
      }
    });

    // Atualiza estado das setas
    if (currentStep === 0) {
      btnPrev.classList.add('disabled');
    } else {
      btnPrev.classList.remove('disabled');
    }
  }

  /**
   * Navega para um passo específico
   */
  function goToStep(index) {
    if (index >= 0 && index <= maxSteps) {
      currentStep = index;
      updateUI();
    }
  }

  /**
   * Avança para o próximo passo
   */
  function goNext() {
    if (currentStep < maxSteps) {
      goToStep(currentStep + 1);
    } else {
      // Fim do Wizard -> marca intro como vista e vai para o dashboard
      const userJson = sessionStorage.getItem('user');
      let userId = null;

      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          userId = userData.id;
        } catch (e) {
          console.warn('❌ Erro ao parsear dados do usuário:', e);
        }
      }

      const introSeenKey = userId
        ? `financeIntroSeen_${userId}`
        : 'financeIntroSeen';

      // ⚠️ USA localStorage para persistir entre sessões
      localStorage.setItem(introSeenKey, 'true');
      window.location.replace('/financeiro/dashboard');
    }
  }

  /**
   * Volta para o passo anterior
   */
  function goPrev() {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }

  // =========================================
  // EVENT LISTENERS
  // =========================================

  // Botões de Seta e Continuar
  if (btnNext) btnNext.addEventListener('click', goNext);
  if (btnPrev) btnPrev.addEventListener('click', goPrev);
  if (btnContinue) btnContinue.addEventListener('click', goNext);

  // Clique direto nas bolinhas
  steps.forEach((step) => {
    step.addEventListener('click', () => {
      const index = parseInt(step.getAttribute('data-step'), 10);
      goToStep(index);
    });
  });

  // Botão "Pular introdução"
  const skipIntroBtn = document.getElementById('skip-intro');
  if (skipIntroBtn) {
    skipIntroBtn.addEventListener('click', (e) => {
      e.preventDefault();

      const userJson = sessionStorage.getItem('user');
      let userId = null;

      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          userId = userData.id;
        } catch (e) {
          console.warn('❌ Erro ao parsear dados do usuário:', e);
        }
      }

      const introSeenKey = userId
        ? `financeIntroSeen_${userId}`
        : 'financeIntroSeen';

      // ⚠️ USA localStorage para persistir entre sessões
      localStorage.setItem(introSeenKey, 'true');
      window.location.replace('/financeiro/dashboard');
    });
  }

  // Inicializa o estado correto
  updateUI();
});