// Tailwind config (kept from previous setup)
window.tailwind = window.tailwind || {};
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#A0430A",
                "primary-light": "#C45B1A",
                "background-light": "#f8f7f5",
                "background-dark": "#221710",
                "card-light": "#DFE8E6",
                "card-dark": "#332d29",
                "text-light": "#181411",
                "text-dark": "#f8f7f5",
                "text-secondary-light": "#4a423d",
                "text-secondary-dark": "#b0a69f",
            },
            fontFamily: {
                display: ["Manrope", "sans-serif"],
            },
            boxShadow: {
                soft: "0 20px 40px -15px rgba(0, 0, 0, 0.05)",
                glow: "0 0 20px -5px rgba(160, 67, 10, 0.3)",
            },
        },
    },
};

// Initialization for the subtemas page.
function initSubtemas() {
    try {
        // If no token, force redirect to login — prevents viewing subtemas without auth
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.replace('/');
            return;
        }

        // Fill greeting
        const userJson = localStorage.getItem('user');
        const userName = localStorage.getItem('userName');
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

        // Avatar
        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl) {
            let avatarUrl = null;
            let nameForInitials = null;
            if (userJson) {
                try {
                    const u = JSON.parse(userJson);
                    avatarUrl = u.avatar || u.foto || u.photoUrl || u.profilePicture || null;
                    nameForInitials = u.nome || null;
                } catch (e) { /* ignore */ }
            }
            if (!nameForInitials && userName) nameForInitials = userName;

            if (avatarUrl) {
                avatarEl.style.backgroundImage = `url("${avatarUrl}")`;
                avatarEl.style.backgroundColor = 'transparent';
                avatarEl.textContent = '';
            } else if (nameForInitials) {
                const initial = nameForInitials.trim().charAt(0).toUpperCase();
                if (initial) {
                    avatarEl.style.backgroundImage = 'none';
                    avatarEl.style.backgroundColor = '#C45B1A';
                    avatarEl.style.color = '#fff';
                    avatarEl.style.display = 'flex';
                    avatarEl.style.alignItems = 'center';
                    avatarEl.style.justifyContent = 'center';
                    avatarEl.style.fontWeight = '700';
                    avatarEl.textContent = initial;
                }
                // otherwise keep default CSS background (SVG)
            }
        }

        // Logout behavior: support both button (#logoutBtn) and anchor (#logoutLink)
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutLink = document.getElementById('logoutLink');
        const doLogout = (openHref) => {
            try {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userName');
            } catch (err) { /* ignore */ }
            if (openHref) {
                // open login page in new tab and redirect current window to login
                window.open(openHref, '_blank', 'noopener');
                window.location.replace('/');
            } else {
                window.location.replace('/');
            }
        };

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });
        }
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => { e.preventDefault(); const href = logoutLink.getAttribute('href'); doLogout(href); });
        }

        // When navigating back/forward, pages may be loaded from the bfcache — ensure auth still valid
        window.addEventListener('pageshow', (ev) => {
            if (!localStorage.getItem('token')) {
                window.location.replace('/');
            }
        });

    } catch (err) {
        console.warn('Erro ao inicializar subtemas:', err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubtemas);
} else {
    // Document already loaded (script appended dynamically) — run immediately
    initSubtemas();
}