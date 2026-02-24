/**
 * Input Sanitization Logic (From Table 3.2 in the PDF)
 * Scrubs all incoming text fields from the Presentation Layer to neutralize harmful code.
 * Note: Parameterized SQL queries (via mysql2) are the main defense, but this acts as the 
 * first line of defense against XSS and basic injection patterns in strings.
 */

const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Basic sanitization: escaping HTML/SQL common dangerous characters
    return str.replace(/[<>;'"]/g, (match) => {
        const escapeMap = {
            '<': '&lt;',
            '>': '&gt;',
            ';': '&#59;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return escapeMap[match];
    });
};

// Middleware function to run before our routes
const sqlSanitizer = (req, res, next) => {
    // Sanitize incoming JSON body payload
    if (req.body) {
        for (let key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        }
    }
    
    // Sanitize incoming URL query parameters
    if (req.query) {
        for (let key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key]);
            }
        }
    }

    next();
};

module.exports = { sqlSanitizer, sanitizeString };