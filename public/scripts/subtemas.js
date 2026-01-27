function enforceSecurity() {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
  if (!token) {
    window.location.replace('/');
    return;
  }
}

// Oculta conteúdo até validar autenticação para evitar flash
document.body.style.display = 'none';

enforceSecurity();
document.body.style.display = 'block';

window.addEventListener('pageshow', (event) => {
  enforceSecurity();
  document.body.style.display = 'block';
});

// Desabilita navegação para trás para evitar acessar telas protegidas
try {
  history.pushState(null, '', location.href);
  window.addEventListener('popstate', function () {
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) {
      window.location.replace('/');
      return;
    }
    history.pushState(null, '', location.href);
  });
} catch (e) { }

window.tailwind = window.tailwind || {};
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#A0430A',
        'primary-light': '#C45B1A',
        'background-light': '#f8f7f5',
        'background-dark': '#221710',
        'card-light': '#DFE8E6',
        'card-dark': '#332d29',
        'text-light': '#181411',
        'text-dark': '#f8f7f5',
        'text-secondary-light': '#4a423d',
        'text-secondary-dark': '#b0a69f',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
        glow: '0 0 20px -5px rgba(160, 67, 10, 0.3)',
      },
    },
  },
};

function initSubtemas() {
  try {
    const userJson = sessionStorage.getItem('user') || localStorage.getItem('user');
    const userName = sessionStorage.getItem('userName') || localStorage.getItem('userName');

    const greetingEl = document.getElementById('userGreeting');
    if (greetingEl) {
      if (userName) greetingEl.textContent = 'Olá, ' + userName;
      else if (userJson) {
        try {
          const u = JSON.parse(userJson);
          if (u && u.nome) greetingEl.textContent = 'Olá, ' + u.nome;
        } catch (e) { }
      }
      greetingEl.classList.remove('hidden');
    }

    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
      let nameForInitials = null;
      if (userJson) {
        try {
          const u = JSON.parse(userJson);
          nameForInitials = u.nome || null;
        } catch (e) { }
      }
      if (!nameForInitials && userName) nameForInitials = userName;

      if (nameForInitials) {
        const initial = nameForInitials.trim().charAt(0).toUpperCase();
        if (initial) {
          avatarEl.textContent = initial;
        }
      }
    }

    const logoutBtn = document.getElementById('logoutBtn');
    const logoutLink = document.getElementById('logoutLink');

    const doLogout = (openHref) => {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userName');
      } catch (err) { }

      if (openHref) {
        window.open(openHref, '_blank', 'noopener');
        window.location.replace('/');
      } else {
        window.location.replace('/');
      }
    };

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        doLogout();
      });
    }
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        const href = logoutLink.getAttribute('href');
        doLogout(href);
      });
    }

  } catch (err) {
    console.warn('Erro ao inicializar subtemas:', err);
  }
}

function setupFinanceCard() {
  const financeCard = document.querySelector('a[href="/financeiro"]');

  if (financeCard) {
    financeCard.addEventListener('click', (e) => {
      e.preventDefault();

      const userJson = sessionStorage.getItem('user') || localStorage.getItem('user');
      let modulesAccess = {};

      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          modulesAccess = userData.modules_access || {};
        } catch (e) {
          console.warn('❌ Erro ao parsear dados do usuário:', e);
        }
      }

      // Check specific module access
      const financeSeen = !!modulesAccess.financeiro;

      if (financeSeen) {
        window.location.href = '/financeiro/dashboard';
      } else {
        window.location.href = '/financeiro';
      }
    });
  }
}

function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      try {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userName');

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userName');
      } catch (e) { }

      window.location.replace('/');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initSubtemas();
    setupFinanceCard();
    setupLogout();
  });
} else {
  initSubtemas();
  setupFinanceCard();
  setupLogout();
}