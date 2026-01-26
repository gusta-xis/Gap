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
    // Requirement: Admin controls user access. So Admin might need a button to create User (not implemented yet in UI but requested).
    // For now, let's allow Manager and Super Admin to see the "Create Admin" button (which opens modal).
    // Admin user creation is usually done via Signup or specific "Invite User" flow not yet fully detailed, 
    // but the prompt said "administrador controla acesso de usuario".
    // Let's hide the "Create Admin/Manager" button for simple Admins.
    if (!['super_admin', 'manager'].includes(currentUser.role)) {
        document.getElementById('actionsCard').style.display = 'none';
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.clear();
        localStorage.clear();
        window.location.replace('/login.html');
    });

    // Load Users
    fetchUsers();

    // Modal Logic
    const modal = document.getElementById('createAdminModal');
    const optManager = document.getElementById('optManager');

    document.getElementById('btnOpenCreateAdmin').addEventListener('click', () => {
        // Only Super Admin can create Managers
        if (currentUser.role !== 'super_admin') {
            if (optManager) optManager.style.display = 'none'; // Hide option
        } else {
            if (optManager) optManager.style.display = 'block';
        }
        modal.classList.add('active');
    });

    document.getElementById('closeModalBtn').addEventListener('click', () => modal.classList.remove('active'));

    // Create Admin Form
    document.getElementById('createAdminForm').addEventListener('submit', async (e) => {
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
                modal.classList.remove('active');
                fetchUsers();
            } else {
                alert('Erro: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão');
        }
    });

    async function fetchUsers() {
        try {
            const res = await fetch('/api/v1/users/admin/list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await res.json();
            renderTable(users);
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
                actionsHtml += `<button class="action-btn btn-danger" onclick="deleteUser(${u.id})">Excluir</button>`;
            }

            tr.innerHTML = `
                <td>${u.nome}</td>
                <td>${identifier}</td>
                <td><span class="badge badge-${u.role}">${roleNames[u.role] || u.role}</span></td>
                <td>${actionsHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.deleteUser = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            const res = await fetch(`/api/v1/users/admin/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert('Erro: ' + data.error);
            }
        } catch (err) {
            alert('Erro de conexão');
        }
    };
});
