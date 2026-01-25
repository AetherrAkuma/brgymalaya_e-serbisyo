import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // 1. Get the token from the header (Authorization: Bearer <token>)
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ success: false, message: "No token provided. Access denied." });
    }

    // 2. Verify the signature
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: "Invalid or Expired Token." });
        }
        
        // 3. Attach user info to the request object
        req.user = decoded; 
        next(); // Pass control to the controller
    });
};