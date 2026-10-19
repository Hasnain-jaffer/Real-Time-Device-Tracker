// server/src/middleware/bridgeAuth.middleware.js
import crypto from 'crypto';

export function bridgeAuth(req, res, next) {
  const secret = process.env.BRIDGE_SECRET;
  if (!secret) {
    return res.status(503).json({ message: 'Bridge access is not configured' });
  }

  const provided = req.get('x-bridge-secret') || '';
  // Hash both sides so lengths match and the comparison is constant-time
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(secret).digest();

  if (!crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ message: 'Invalid bridge credentials' });
  }
  next();
}