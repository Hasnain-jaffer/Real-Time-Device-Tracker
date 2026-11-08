// server/src/middleware/auth.middleware.js
import { verifyAccessToken } from '../utils/token.util.js';
import User from '../models/user.model.js';

// Identifies the caller. No token or an invalid token = guest.
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    req.user = { id: 'guest', role: 'student' };
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub).select('isSuspended role');
    if (!user) {
      return res.status(401).json({ message: 'Account no longer exists' });
    }
    if (user.isSuspended) {
      return res.status(403).json({ message: 'This account has been suspended' });
    }

    req.user = { id: decoded.sub, role: user.role };
    next();
  } catch {
    req.user = { id: 'guest', role: 'student' };
    next();
  }
}

// Blocks guests. Use on every route that needs a real account.
export function requireAuth(req, res, next) {
  if (!req.user || req.user.id === 'guest') {
    return res.status(401).json({ message: 'Sign in required' });
  }
  next();
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}