let xss;
try {
    xss = require('xss');
} catch (error) {
    console.warn('⚠️ Module "xss" not found. Using basic provisional sanitization.');
}

/**
 * Recursively sanitizes strings, arrays, and objects.
 * @param {any} value - The value to sanitize.
 * @returns {any} - The sanitized value.
 */
const sanitize = (value) => {
    if (typeof value === 'string') {
        if (xss) {
            return xss(value);
        } else {
            // Basic fallback: HTML tag escaping
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
