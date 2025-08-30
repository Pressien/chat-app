export function requireAuth() {
  return (req, res, next) => {
    const auth = req.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });
    req.token = token;
    next();
  };
}
