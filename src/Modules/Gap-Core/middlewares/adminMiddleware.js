module.exports = {
    verifyAdmin: (req, res, next) => {
        if (!req.user || !['admin', 'manager', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso negado. Requer permissão de Administrador.' });
        }
        next();
    },

    verifyManager: (req, res, next) => {
        if (!req.user || !['manager', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso negado. Requer permissão de Gerente.' });
        }
        next();
    },

    verifySuperAdmin: (req, res, next) => {
        if (!req.user || req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Acesso negado. Requer permissão de Admin Geral.' });
        }
        next();
    }
};
