const db = require('../../../config/db');

module.exports = {
    /**
     * Registra uma ação de auditoria
     * @param {number|null} userId - ID do usuário (pode ser null se não autenticado/não encontrado)
     * @param {string} action - Nome da ação (ex: PASSWORD_RESET_REQUEST)
     * @param {string} ipAddress - IP do cliente
     * @param {string} details - Detalhes adicionais (opcional)
     */
    log: (userId, action, ipAddress, details = '') => {
        const query = 'INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)';
        db.query(query, [userId, action, ipAddress, details], (err) => {
            if (err) {
                console.error('❌ Erro ao salvar log de auditoria:', err.message);
            } else {
                // Log silencioso ou apenas em dev
                // console.log(`📝 Auditoria: ${action} - User: ${userId}`);
            }
        });
    }
};
