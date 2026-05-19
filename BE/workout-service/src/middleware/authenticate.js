'use strict';

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.get('Authorization');
  console.log(`[authenticate] path: ${req.path}, authHeader: ${authHeader ? 'present' : 'missing'}`);

  if (!authHeader) {
    return res.status(401).json({ message: 'Missing authorization token' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid authorization header' });
  }

  const token = parts[1];
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Server configuration error' });
    }
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token signature' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = {
  authenticate,
};
