const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * Verify Bearer JWT and attach decoded payload to req.user.
 */
const requireAuth = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: 'Authentication required' });
		}

		const token = authHeader.split(' ')[1];
		const payload = jwt.verify(token, JWT_SECRET);

		req.user = {
			userId: payload.userId,
			email: payload.email,
			role: payload.role || 'user',
		};

		return next();
	} catch (error) {
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
};

/**
 * Restrict endpoint access to admin role only.
 */
const requireAdmin = (req, res, next) => {
	if (!req.user || req.user.role !== 'admin') {
		return res.status(403).json({ error: 'Admin access required' });
	}

	return next();
};

module.exports = {
	requireAuth,
	requireAdmin,
};
