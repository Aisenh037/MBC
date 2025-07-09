import jwt from 'jsonwebtoken';

export const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = decoded; // Attach decoded user to request if needed downstream
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
