const { validateEmail } = require('../utils/validators');
const { registerUser, loginUser, refreshToken: refreshTokenService } = require('../services/authService');
const { validatePassword, validatePasswordMatch } = require('../utils/validators');
const logger = require('../utils/logger');

const MAX_PASSWORD_LENGTH = 128;

async function register(req, res, next) {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and confirmPassword are required',
      });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({
        success: false,
        message: emailError,
      });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const matchError = validatePasswordMatch(password, confirmPassword);
    if (matchError) {
      return res.status(400).json({
        success: false,
        message: matchError,
      });
    }

    const userData = await registerUser(email, password);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: userData,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password must be strings',
      });
    }

    if (email.trim() === '' || password.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Email and password cannot be empty',
      });
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: 'Password is too long',
      });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({
        success: false,
        message: emailError,
      });
    }

    const ipAddress = req.ip || req.socket?.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    const result = await loginUser(email, password, ipAddress, userAgent);

    if (result.success) {
      return res.status(result.status).json({
        success: true,
        message: 'Login successful',
        data: result.data,
      });
    }

    return res.status(result.status).json({
      success: false,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    const result = await refreshTokenService(refreshToken);

    if (result.success) {
      return res.status(result.status).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result.data,
      });
    }

    return res.status(result.status).json({
      success: false,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

function logout(req, res, next) {
  try {
    const ipAddress = req.ip || req.socket?.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    // MVP: No token blacklist. Access tokens remain valid until expiry (JWT_EXPIRES_IN).
    // For server-side invalidation, implement refresh token blacklist in future iteration.
    logger.info('User logout', {
      userId: req.user.userId,
      email: req.user.email,
      timestamp: new Date().toISOString(),
      ip: ipAddress,
      userAgent,
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
}

function getMe(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    },
  });
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
