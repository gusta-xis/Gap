/**
 * Middleware: Hierarchy Brain (RBAC)
 * Assigns a numerical weight to the user based on their role.
 * 
 * Hierarchy Levels:
 * - Super Admin (General Manager): 3
 * - Manager: 2
 * - Admin: 1
 * - User: 0
 */
module.exports = (req, res, next) => {
    // Ensure user is authenticated (req.user should exist from authMiddleware)
    if (!req.user || !req.user.role) {
        // If no user context, we can't assign weight. 
        // Usually this runs after authMiddleware.
        return next();
    }

    const roleWeights = {
        'super_admin': 3,
        'manager': 2,
        'admin': 1,
        'user': 0
    };

    // Assign weight, default to 0 if role is invalid
    req.user.weight = roleWeights[req.user.role] !== undefined ? roleWeights[req.user.role] : 0;

    next();
};
