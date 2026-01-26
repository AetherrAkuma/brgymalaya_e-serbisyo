import jwt from 'jsonwebtoken';

export const verifyAdmin = (req, res, next) => {
    // 1. Get Token
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ success: false, message: "No Token Provided" });
    }

    // 2. Verify Signature
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: "Invalid Token" });
        }

        // 3. CRITICAL CHECK: Is this user actually an Admin?
        // In our Login Controller, we added "is_admin: true" to the token.
        if (!decoded.is_admin) {
            return res.status(403).json({ 
                success: false, 
                message: "Access Forbidden: Residents cannot access Official Data." 
            });
        }

        // 4. Check specific Roles if needed (Optional strict check)
        // const allowedRoles = ['Captain', 'Secretary', 'Treasurer', 'Kagawad'];
        // if (!allowedRoles.includes(decoded.role)) { ... }

        req.user = decoded; // Attach admin info to request
        next(); // Pass to the next function
    });
};