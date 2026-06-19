const rateLimitStores = {};

/**
 * Creates a rate limiting middleware.
 * @param {string} limiterName - Unique identifier for the store (to keep different limits isolated)
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests within windowMs
 * @param {string} options.message - Error response message
 * @param {boolean} options.useUserId - If true, keys by req.user.id when available, falling back to IP
 * @param {function} options.bypass - Optional function returning true if the request should bypass the limiter
 */
function createRateLimiter(limiterName, options = {}) {
    const windowMs = options.windowMs || 15 * 60 * 1000;
    const max = options.max || 100;
    const message = options.message || 'Too many requests, please try again later.';
    const useUserId = options.useUserId !== false; // default true
    const bypass = options.bypass || (() => false);

    // Initialize the store for this limiter
    if (!rateLimitStores[limiterName]) {
        rateLimitStores[limiterName] = new Map();
    }
    const store = rateLimitStores[limiterName];

    // Key generator: returns req.user.id if authenticated & useUserId, else returns client IP
    const getKey = (req) => {
        if (useUserId && req.user && req.user.id) {
            return `user_${req.user.id}`;
        }
        // Fallback to IP address (checks headers for Cloudflare / reverse proxy)
        return req.headers['cf-connecting-ip'] || 
               req.headers['x-forwarded-for'] || 
               req.ip || 
               req.socket.remoteAddress;
    };

    // Periodic cleanup of expired entries to prevent memory leaks
    setInterval(() => {
        const now = Date.now();
        for (const [key, timestamps] of store.entries()) {
            const validTimestamps = timestamps.filter(t => now - t < windowMs);
            if (validTimestamps.length === 0) {
                store.delete(key);
            } else {
                store.set(key, validTimestamps);
            }
        }
    }, windowMs);

    return (req, res, next) => {
        // Bypass checks
        if (bypass(req)) {
            return next();
        }

        const key = getKey(req);
        const now = Date.now();

        if (!store.has(key)) {
            store.set(key, []);
        }

        const timestamps = store.get(key);
        // Filter out timestamps older than the window
        const validTimestamps = timestamps.filter(t => now - t < windowMs);

        if (validTimestamps.length >= max) {
            const oldestTimestamp = validTimestamps[0];
            const msPassed = now - oldestTimestamp;
            const msRemaining = Math.max(0, windowMs - msPassed);
            const secondsRemaining = Math.ceil(msRemaining / 1000);

            res.setHeader('Retry-After', secondsRemaining);
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', new Date(now + msRemaining).toISOString());

            // Log rate limit breach in console for administrators to see
            console.warn(`[RATE LIMIT EXCEEDED] Limiter: ${limiterName}, Key: ${key}, Path: ${req.originalUrl || req.path}, Client: ${req.headers['user-agent'] || 'unknown'}`);

            return res.status(429).json({
                status: 'error',
                message,
                retryAfterSeconds: secondsRemaining
            });
        }

        // Add current timestamp and save
        validTimestamps.push(now);
        store.set(key, validTimestamps);

        // Calculate reset time based on oldest timestamp in window
        const oldestTimestamp = validTimestamps[0];
        const msPassed = now - oldestTimestamp;
        const msRemaining = Math.max(0, windowMs - msPassed);

        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', max - validTimestamps.length);
        res.setHeader('X-RateLimit-Reset', new Date(now + msRemaining).toISOString());

        next();
    };
}

// Read options from env with sensible defaults
const parseEnvInt = (key, defaultValue) => {
    const val = process.env[key];
    return val ? parseInt(val, 10) : defaultValue;
};

// General public API limiter (e.g. announcements, settings, health)
const generalLimiter = createRateLimiter('general', {
    windowMs: parseEnvInt('RATE_LIMIT_GENERAL_WINDOW_MS', 15 * 60 * 1000), // 15 mins
    max: parseEnvInt('RATE_LIMIT_GENERAL_MAX', 300), // 300 requests per window
    message: 'Too many requests to E-Serbisyo public services. Please try again in a few minutes.',
    useUserId: true,
    bypass: (req) => {
        const path = req.originalUrl || req.path || '';
        return path.includes('/api/v1/health') || path.includes('/api/v1/health/db');
    }
});

// Authentication endpoint limiter (login)
const authLimiter = createRateLimiter('auth', {
    windowMs: parseEnvInt('RATE_LIMIT_AUTH_WINDOW_MS', 5 * 60 * 1000), // 5 mins
    max: parseEnvInt('RATE_LIMIT_AUTH_MAX', 15), // 15 requests per window (brute force mitigation)
    message: 'Too many login attempts. Please check your credentials and try again in 5 minutes.',
    useUserId: false // authenticate routes identify by IP
});

// Registration endpoint limiter
const registerLimiter = createRateLimiter('register', {
    windowMs: parseEnvInt('RATE_LIMIT_REGISTER_WINDOW_MS', 60 * 60 * 1000), // 1 hour
    max: parseEnvInt('RATE_LIMIT_REGISTER_MAX', 5), // 5 registrations per hour
    message: 'Too many registration requests from this connection. Please try again in an hour.',
    useUserId: false
});

// Forgot password / Reset password endpoint limiter
const passwordResetLimiter = createRateLimiter('password_reset', {
    windowMs: parseEnvInt('RATE_LIMIT_PASSWORD_RESET_WINDOW_MS', 60 * 60 * 1000), // 1 hour
    max: parseEnvInt('RATE_LIMIT_PASSWORD_RESET_MAX', 5), // 5 requests per hour
    message: 'Too many password reset requests. Please try again in an hour.',
    useUserId: false
});

// Document Request creation endpoint limiter
const requestCreationLimiter = createRateLimiter('request_creation', {
    windowMs: parseEnvInt('RATE_LIMIT_REQUEST_WINDOW_MS', 60 * 60 * 1000), // 1 hour
    max: parseEnvInt('RATE_LIMIT_REQUEST_MAX', 10), // 10 requests per hour per user
    message: 'You have exceeded the hourly limit for submitting document requests. Please try again later.',
    useUserId: true
});

// File upload/download endpoint limiter
const fileUploadLimiter = createRateLimiter('file_upload', {
    windowMs: parseEnvInt('RATE_LIMIT_FILE_UPLOAD_WINDOW_MS', 10 * 60 * 1000), // 10 mins
    max: parseEnvInt('RATE_LIMIT_FILE_UPLOAD_MAX', 15), // 15 uploads per 10 mins
    message: 'Too many file upload requests. Please try again in 10 minutes.',
    useUserId: true
});

// Administrative actions limiter (Creating officials, system configurations, manual audits)
const adminLimiter = createRateLimiter('admin_actions', {
    windowMs: parseEnvInt('RATE_LIMIT_ADMIN_WINDOW_MS', 15 * 60 * 1000), // 15 mins
    max: parseEnvInt('RATE_LIMIT_ADMIN_MAX', 200), // 200 admin operations per 15 mins
    message: 'Too many administrative requests. Please slow down and try again later.',
    useUserId: true
});

module.exports = {
    generalLimiter,
    authLimiter,
    registerLimiter,
    passwordResetLimiter,
    requestCreationLimiter,
    fileUploadLimiter,
    adminLimiter
};
