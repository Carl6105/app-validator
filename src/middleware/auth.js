import jwt from 'jsonwebtoken';
import { config } from '../config/db.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { _id: decoded.userId };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
};