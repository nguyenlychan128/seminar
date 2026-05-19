const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';

async function registerUser(email, password) {
  const passwordHash = await hashPassword(password);

  const user = new User({
    email,
    passwordHash,
    role: 'User',
  });

  await user.save();

  return {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };
}

async function loginUser(email, password, ipAddress, userAgent) {
  const user = await User.findOne({ email: email.toLowerCase() });

  const hashToCheck = user ? user.passwordHash : DUMMY_HASH;
  const passwordMatch = await comparePassword(password, hashToCheck);

  if (!user) {
    return {
      success: false,
      status: 401,
      message: 'Invalid email or password',
    };
  }

  if (!user.isActive || user.isDeleted) {
    return {
      success: false,
      status: 401,
      message: 'Account is disabled',
    };
  }

  if (!passwordMatch) {
    return {
      success: false,
      status: 401,
      message: 'Invalid email or password',
    };
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.lastLoginAt = new Date();
  await user.save();

  logger.info('User login', {
    userId: user._id.toString(),
    email: user.email,
    timestamp: new Date().toISOString(),
    ip: ipAddress,
    userAgent,
  });

  return {
    success: true,
    status: 200,
    data: {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
      expiresIn: 900,
    },
  };
}

async function refreshToken(token) {
  try {
    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return {
        success: false,
        status: 401,
        message: 'User not found',
      };
    }

    if (!user.isActive || user.isDeleted) {
      return {
        success: false,
        status: 401,
        message: 'Account is disabled',
      };
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    logger.info('Token refreshed', {
      userId: user._id.toString(),
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      status: 200,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
      },
    };
  } catch (error) {
    logger.warn('Token refresh failed', {
      reason: error.message,
      timestamp: new Date().toISOString(),
    });

    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        status: 401,
        message: 'Refresh token expired. Please log in again.',
      };
    }

    if (error.message === 'Invalid token type') {
      return {
        success: false,
        status: 401,
        message: 'Invalid token type',
      };
    }

    if (error.name === 'JsonWebTokenError' && error.message === 'invalid signature') {
      return {
        success: false,
        status: 403,
        message: 'Invalid token signature',
      };
    }

    return {
      success: false,
      status: 401,
      message: 'Invalid refresh token',
    };
  }
}

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
};
