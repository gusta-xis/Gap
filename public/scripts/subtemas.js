// ======================================================
// 1. SEGURANÇA IMEDIATA (RODA ANTES DE TUDO)
// ======================================================

// Função de verificação isolada
function enforceSecurity() {
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) {
        // Se não tem token, substitui a URL imediatamente para o login
        window.location.replace('/'); 
        return;
    }
}

// A. Executa agora mesmo (assim que o script é lido)
enforceSecurity();

// B. Proteção contra cache (Botões Voltar/Avançar)
// O evento 'pageshow' é disparado mesmo se a página vier do cache do navegador
window.addEventListener('pageshow', (event) => {
    // Se a página persistiu (cache) ou se não tem token, verifica de novo
    enforceSecurity();
});

// ======================================================
// 2. CONFIGURAÇÃO VISUAL (TAILWIND)
// ======================================================
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

// ======================================================
// 3. LÓGICA DA INTERFACE (INIT)
// ======================================================
function initSubtemas() {
  try {
    // Recupera dados do sessionStorage (com fallback para localStorage)
    const userJson = sessionStorage.getItem('user') || localStorage.getItem('user');
    const userName = sessionStorage.getItem('userName') || localStorage.getItem('userName');

    // 1. Preencher Saudação
    const greetingEl = document.getElementById('userGreeting');
    if (greetingEl) {
      if (userName) greetingEl.textContent = 'Olá, ' + userName;
      else if (userJson) {
        try {
          const u = JSON.parse(userJson);
          if (u && u.nome) greetingEl.textContent = 'Olá, ' + u.nome;
        } catch (e) { /* ignore */ }
      }
      greetingEl.classList.remove('hidden');
    }

    // 2. Configurar Avatar
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
      let nameForInitials = null;
      if (userJson) {
        try {
          const u = JSON.parse(userJson);
          nameForInitials = u.nome || null;
        } catch (e) { /* ignore */ }
      }
      if (!nameForInitials && userName) nameForInitials = userName;

      if (nameForInitials) {
        const initial = nameForInitials.trim().charAt(0).toUpperCase();
        if (initial) {
          avatarEl.textContent = initial;
        }
      }
    }

    // 3. Configurar Logout
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutLink = document.getElementById('logoutLink');
    
    const doLogout = (openHref) => {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userName');
        // NÃO remove financeIntroSeen aqui - ela é persistente por usuário
      } catch (err) { /* ignore */ }
      
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

// ======================================================
// 4. LÓGICA DO CARD FINANCEIRO (PRIMEIRO ACESSO)
// ======================================================
function setupFinanceCard() {
  const financeCard = document.querySelector('a[href="/financeiro"]');
  
  if (financeCard) {
    financeCard.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Obter userId para verificar se este usuário já viu a introdução
      const userJson = sessionStorage.getItem('user') || localStorage.getItem('user');
      let userId = null;
      
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          userId = userData.id;
        } catch (e) {
          console.warn('❌ Erro ao parsear dados do usuário:', e);
        }
      }
      
      // Verifica se já viu a introdução (usa localStorage para persistir)
      const introSeenKey = userId ? `financeIntroSeen_${userId}` : 'financeIntroSeen';
      const financeIntroSeen = localStorage.getItem(introSeenKey) === 'true';
      
      if (financeIntroSeen) {
        // Já viu, vai direto para dashboard
        window.location.href = '/financeiro/dashboard';
      } else {
        // Primeiro acesso, mostra introdução/wizard
        window.location.href = '/financeiro';
      }
    });
  }
}

// ======================================================
// 5. BOTÃO DE LOGOUT (SAIR DO SISTEMA)
// ======================================================
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Limpa toda a sessão
      sessionStorage.clear();
      localStorage.clear();
      
      // Redireciona para login
      window.location.replace('/');
    });
  }
}

// Inicialização segura
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