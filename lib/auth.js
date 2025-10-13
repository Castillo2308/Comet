import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES || '30m';

export function signAccessToken(payload) {
  // Keep payload minimal: { cedula, email, role }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No autorizado' });
  const decoded = verifyAccessToken(token);
  if (!decoded) return res.status(401).json({ message: 'Token inválido o expirado' });
  req.user = decoded;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Prohibido' });
    next();
  };
}
