document.addEventListener('DOMContentLoaded', () => {
    const userStr = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('token');

    if (!userStr || !token) {
        window.location.replace('/login.html');
        return;
    }

    const currentUser = JSON.parse(userStr);

    // Verify Access
    if (!['admin', 'manager', 'super_admin'].includes(currentUser.role)) {
        alert('Acesso negado.');
        window.location.replace('/financeiro');
        return;
    }

    const roleNames = {
        'super_admin': 'Gerente Geral',
        'manager': 'Gerente',
        'admin': 'Administrador'
    };

    document.getElementById('currentUserDisplay').textContent = `${currentUser.nome} (${roleNames[currentUser.role] || currentUser.role})`;

    // Logic: Admin CANNOT see create actions card? 
    if (!['super_admin', 'manager'].includes(currentUser.role)) {
        document.getElementById('actionsCard').style.display = 'none';
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.clear();
        localStorage.clear();
        window.location.replace('/login.html');
    });

    // --- Global State form Modal ---
    let allUsers = [];
    let userIdToDelete = null;

    const deleteModal = document.getElementById('deleteConfirmModal');
    const deleteNameSpan = document.getElementById('deleteUserName');
    const deleteIdSpan = document.getElementById('deleteUserIdentifier');

    // Load Users
    fetchUsers();

    // --- Create Admin Modal Logic ---
    const createModal = document.getElementById('createAdminModal');
    const optManager = document.getElementById('optManager');

    const btnOpenCreate = document.getElementById('btnOpenCreateAdmin');
    if (btnOpenCreate) {
        btnOpenCreate.addEventListener('click', () => {
            // Only Super Admin can create Managers
            if (currentUser.role !== 'super_admin') {
                if (optManager) optManager.style.display = 'none'; // Hide option
            } else {
                if (optManager) optManager.style.display = 'block';
            }
            createModal.classList.add('active');
        });
    }

    const btnCloseCreate = document.getElementById('closeModalBtn');
    if (btnCloseCreate) btnCloseCreate.addEventListener('click', () => createModal.classList.remove('active'));

    // Create Admin Form
    const createForm = document.getElementById('createAdminForm');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('newAdminName').value;
            const email = document.getElementById('newAdminEmail').value;
            const role = document.getElementById('newAdminRole').value;

            try {
                const res = await fetch('/api/v1/users/admin/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ nome, email, role })
                });
                const data = await res.json();

                if (res.ok) {
                    alert(`${role === 'manager' ? 'Gerente' : 'Admin'} criado com sucesso!\nCredencial: ${data.credential}`);
                    createModal.classList.remove('active');
                    fetchUsers();
                    createForm.reset();
                } else {
                    alert('Erro: ' + data.error);
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão');
            }
        });
    }

    // --- Functions ---

    async function fetchUsers() {
        try {
            const res = await fetch('/api/v1/users/admin/list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await res.json();
            if (Array.isArray(users)) {
                allUsers = users;
                renderTable(users);
            } else {
                console.error("API response is not an array:", users);
            }
        } catch (err) {
            console.error('Erro ao buscar usuários', err);
        }
    }

    function renderTable(users) {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        users.forEach(u => {
            const tr = document.createElement('tr');

            // Identifier (Email or Credential)
            const identifier = u.credential ? `<span style="font-family:monospace; font-weight:bold;">${u.credential}</span>` : u.email;

            // Module Logic
            const moduleName = ['admin', 'manager', 'super_admin'].includes(u.role) ? 'Administrativo' : 'Financeiro';

            // Actions
            let actionsHtml = '';

            // Check Delete Permission
            let canDelete = false;
            if (currentUser.role === 'super_admin') {
                canDelete = true;
            } else if (currentUser.role === 'manager') {
                if (['admin', 'user'].includes(u.role)) canDelete = true;
            } else if (currentUser.role === 'admin') {
                if (u.role === 'user') canDelete = true;
            }

            // Cannot delete self
            if (u.id === currentUser.id) canDelete = false;

            if (canDelete) {
                // IMPORTANT: Calls promptDeleteUser
                actionsHtml += `<button class="action-btn btn-danger" onclick="promptDeleteUser(${u.id})">Excluir</button>`;
            }

            tr.innerHTML = `
                <td>${u.nome}</td>
                <td>${identifier}</td>
                <td><span class="badge" style="background:#f1f5f9; color:#475569;">${moduleName}</span></td>
                <td><span class="badge badge-${u.role}">${roleNames[u.role] || u.role}</span></td>
                <td>${actionsHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- Delete Confirmation Logic ---

    window.promptDeleteUser = (id) => {
        const user = allUsers.find(u => u.id === id);
        if (!user) return;

        userIdToDelete = id;

        if (deleteNameSpan) deleteNameSpan.textContent = user.nome;
        if (deleteIdSpan) deleteIdSpan.textContent = user.credential || user.email;

        if (deleteModal) deleteModal.classList.add('active');
    };

    const btnCancelDelete = document.getElementById('cancelDeleteBtn');
    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', () => {
            if (deleteModal) deleteModal.classList.remove('active');
            userIdToDelete = null;
        });
    }

    const btnConfirmDelete = document.getElementById('confirmDeleteBtn');
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', async () => {
            if (!userIdToDelete) return;

            // UI Feedback
            const originalText = btnConfirmDelete.innerText;
            btnConfirmDelete.innerText = 'Excluindo...';
            btnConfirmDelete.disabled = true;

            try {
                const res = await fetch(`/api/v1/users/admin/${userIdToDelete}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    fetchUsers();
                    if (deleteModal) deleteModal.classList.remove('active');
                } else {
                    const data = await res.json();
                    alert('Erro: ' + data.error);
                }
            } catch (err) {
                alert('Erro de conexão');
            } finally {
                btnConfirmDelete.innerText = originalText;
                btnConfirmDelete.disabled = false;
                userIdToDelete = null;
            }
        });
    }
});
