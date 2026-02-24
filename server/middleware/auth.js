const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_barangay_key_change_in_production';

// Generates a JWT token (Will be used in Phase 2 for Login)
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, username: user.username },
        JWT_SECRET,
        { expiresIn: '8h' } // 8 hours session as per standard security practices
    );
};

// Middleware to verify if the user is logged in
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized Access. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Session expired or invalid token.' });
        }
        req.user = decoded; // Attach decoded user info (id, role) to the request object
        next();
    });
};

// Middleware to restrict access based on roles
const roleGuard = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'User role not found.' });
        }

        // Check if the user's role is inside the allowedRoles array
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Forbidden. Requires one of the following roles: ${allowedRoles.join(', ')}` 
            });
        }

        next();
    };
};

module.exports = { generateToken, verifyJWT, roleGuard };