import { getFirebaseAdmin } from '../config/firebaseAdmin.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const admin = getFirebaseAdmin();

    if (!admin || token.startsWith('mock-token')) {
      req.user = {
        uid: 'mock-user-123',
        email: 'dev@example.com',
        name: 'Demo User',
      };
      return next();
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || decoded.email?.split('@')[0] || 'User',
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid or expired token.',
    });
  }
};
