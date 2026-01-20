let xss;
try {
    xss = require('xss');
} catch (error) {
    console.warn('⚠️ Módulo "xss" não encontrado. Usando sanitização básica provisória.');
}

// Função auxiliar para sanitizar strings recursivamente
const sanitize = (value) => {
    if (typeof value === 'string') {
        if (xss) {
            return xss(value);
        } else {
            // Fallback básico: Escape de tags HTML
            return value
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    }
    if (Array.isArray(value)) {
        return value.map(sanitize);
    }
    if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach((key) => {
            value[key] = sanitize(value[key]);
        });
    }
    return value;
};

module.exports = (req, res, next) => {
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    next();
};
