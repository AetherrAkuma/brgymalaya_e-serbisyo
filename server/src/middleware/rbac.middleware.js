/**
 * RBAC Middleware (Role-Based Access Control)
 * Usage: authorizeRoles('Captain', 'Secretary')
 */
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // 1. Check if user is logged in (req.user comes from verifyAdmin)
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized: No User Found" });
        }

        // 2. Check if the user's role is in the allowed list
        // We normalize to uppercase just in case (optional, but safer)
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Access Denied: ${req.user.role}s are not allowed to access this resource.` 
            });
        }

        // 3. Access Granted
        next();
    };
};