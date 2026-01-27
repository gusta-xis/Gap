function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  str = str.replace(/<[^>]*>/g, '');
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return str.trim();
}

window.addEventListener('pageshow', function (event) {
  if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
    window.location.reload();
  }
});

// Oculta o conteúdo até validar autenticação para evitar flash
document.body.style.display = 'none';

(function checkAuth() {
  const token = sessionStorage.getItem('accessToken');
  if (!token) {
    window.location.replace('/');
    return;
  }

  let userId = null;
  const userJson = sessionStorage.getItem('user') || localStorage.getItem('user');
  if (userJson) {
    try {
      const u = JSON.parse(userJson);
      userId = u && u.id ? u.id : null;
    } catch (e) { }
  }

  const introSeenKey = userId ? `financeIntroSeen_${userId}` : 'financeIntroSeen';
  const introSeen = localStorage.getItem(introSeenKey) === 'true';

  if (introSeen) {
    window.location.replace('/financeiro/dashboard');
    return;
  }

  document.body.style.display = 'flex';
})();

// Desabilita navegação para trás para evitar acessar telas protegidas
try {
  history.pushState(null, '', location.href);
  window.addEventListener('popstate', function () {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      window.location.replace('/');
      return;
    }
    history.pushState(null, '', location.href);
  });
} catch (e) { }

document.addEventListener('DOMContentLoaded', () => {
  const steps = document.querySelectorAll('.step-circle');
  const descriptions = document.querySelectorAll('.description');
  const btnNext = document.getElementById('btn-next');
  const btnPrev = document.getElementById('btn-prev');
  const btnContinue = document.getElementById('btn-continue');

  let currentStep = 0;
  const maxSteps = steps.length - 1;

  function updateUI() {
    steps.forEach((step, index) => {
      if (index === currentStep) {
        step.classList.remove('step-inactive');
        step.classList.add('step-active');
      } else {
        step.classList.remove('step-active');
        step.classList.add('step-inactive');
      }
    });

    descriptions.forEach((desc, index) => {
      if (index === currentStep) {
        desc.classList.add('active');
      } else {
        desc.classList.remove('active');
      }
    });

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

  async function completeIntroduction() {
    let userId = null;
    let user = null;
    const userJson = sessionStorage.getItem('user') || localStorage.getItem('user');

    if (userJson) {
      try {
        user = JSON.parse(userJson);
        userId = user && user.id ? user.id : null;
      } catch (e) { }
    }

    if (userId) {
      try {
        await fetch(`/api/v1/users/${userId}/module-access`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ moduleName: 'financeiro', status: true })
        });

        // Update local session
        if (user) {
          user.modules_access = user.modules_access || {};
          user.modules_access.financeiro = true;
          sessionStorage.setItem('user', JSON.stringify(user));
        }

      } catch (e) {
        console.warn('Erro ao salvar introdução no servidor', e);
      }
    }

    // Fallback/Legacy LocalStorage update just in case
    const introSeenKey = userId ? `financeIntroSeen_${userId}` : 'financeIntroSeen';
    localStorage.setItem(introSeenKey, 'true');

    window.location.replace('/financeiro/dashboard');
  }

  /**
   * Avança para o próximo passo
   */
  function goNext() {
    if (currentStep < maxSteps) {
      goToStep(currentStep + 1);
    } else {
      completeIntroduction();
    }
  }

  function goPrev() {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }

  if (btnNext) btnNext.addEventListener('click', goNext);
  if (btnPrev) btnPrev.addEventListener('click', goPrev);
  if (btnContinue) btnContinue.addEventListener('click', goNext);

  steps.forEach((step) => {
    step.addEventListener('click', () => {
      const index = parseInt(step.getAttribute('data-step'), 10);
      goToStep(index);
    });
  });

  const skipIntroBtn = document.getElementById('skip-intro');
  if (skipIntroBtn) {
    skipIntroBtn.addEventListener('click', (e) => {
      e.preventDefault();
      completeIntroduction();
    });
  }

  updateUI();
});