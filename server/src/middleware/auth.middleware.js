import { verifyAccessToken } from '../utils/token.util.js';
import User from '../models/user.model.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  try {
    const decoded = verifyAccessToken(token);

    // Check suspension on every request — a suspended user's existing token
    // must stop working immediately, not just at next login.
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
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}