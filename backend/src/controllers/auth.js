/**
 * Authentication Controller
 *
 * Handles registration, login, password reset, and profile endpoints.
 * All sensitive operations are logged and validated.
 *
 * SECURITY NOTE: Never log plaintext passwords or tokens. Ensure JWT_SECRET is set securely in production.
 */
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { buildResetLink, sendResetPasswordEmail, isSmtpConfigured } = require('../services/resetEmail');
const userRepo = require('../db/userRepository');
const resetTokenRepo = require('../db/resetTokenRepository');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const TOKEN_EXPIRATION = '1h'; // Short expiration for security
const RESET_TOKEN_TTL_MS = Number(process.env.RESET_TOKEN_TTL_MS || 15 * 60 * 1000);

const getAdminEmailSet = () => {
  const raw = process.env.ADMIN_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(Boolean)
  );
};

const resolveUserRole = (email) => {
  const adminEmails = getAdminEmailSet();
  return adminEmails.has(String(email || '').toLowerCase()) ? 'admin' : 'user';
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');


const isStrongPassword = (password) => {
  // Minimum 10 chars, at least one lowercase, uppercase, number, and special char.
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/.test(password);
};

/**
 * Register a new user securely
 */
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error:
          'Password must be at least 10 characters and include uppercase, lowercase, number, and special character',
      });
    }

    // 2. Check if user exists
    const userExists = userRepo.findByEmail(email);
    if (userExists) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // 3. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Persist to database
    const newUser = userRepo.create({
      id: crypto.randomUUID(),
      email,
      role: resolveUserRole(email),
      password: hashedPassword,
    });

    // 5. Generate Initial Token (Optional on registration)
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token, // Send token back for immediate login
      user: { id: newUser.id, email: newUser.email, role: newUser.role } 
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

/**
 * Login a user securely
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 2. Find user
    const user = userRepo.findByEmail(email);
    if (!user) {
        // Return generic message to prevent username enumeration
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4. Generate Secure JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role || resolveUserRole(user.email) },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role || resolveUserRole(user.email) }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

/**
 * Return the authenticated user's basic profile from JWT claims.
 */
exports.getMe = async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

/**
 * Start forgot-password flow.
 * Returns a generic message to avoid email enumeration.
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  resetTokenRepo.removeExpired();

  const user = userRepo.findByEmail(email);
  let resetToken;
  let resetLink;

  if (user) {
    resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(resetToken);
    const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;
    resetLink = buildResetLink({ token: resetToken, email: user.email });

    // Invalidate older active tokens for this user to keep a single valid token.
    resetTokenRepo.invalidateForUser(user.id);

    resetTokenRepo.create({ userId: user.id, tokenHash, expiresAt });

    await sendResetPasswordEmail({
      email: user.email,
      resetLink,
    });
  }

  const response = {
    message: 'If an account exists for this email, a reset link has been sent.',
  };

  // Return token in non-production environments to simulate email-link delivery.
  if (resetToken && process.env.NODE_ENV !== 'production') {
    response.resetToken = resetToken;
    response.resetLink = resetLink;
  }

  return res.status(200).json(response);
};

/**
 * Complete password reset using a valid, non-expired reset token.
 */
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and newPassword are required' });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      error:
        'Password must be at least 10 characters and include uppercase, lowercase, number, and special character',
    });
  }

  resetTokenRepo.removeExpired();

  const tokenHash = hashToken(token);
  const tokenRecord = resetTokenRepo.findValid(tokenHash);

  if (!tokenRecord) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const user = userRepo.findById(tokenRecord.user_id);
  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  await userRepo.updatePassword(user.id, await bcrypt.hash(newPassword, SALT_ROUNDS));
  resetTokenRepo.markUsed(tokenHash);

  // Invalidate all remaining reset tokens for this user after successful reset.
  resetTokenRepo.invalidateForUser(user.id);

  return res.status(200).json({ message: 'Password reset successful' });
};

/**
 * Report non-sensitive email delivery readiness for operators.
 */
exports.getEmailStatus = async (req, res) => {
  return res.status(200).json({
    emailDelivery: {
      mode: process.env.NODE_ENV === 'production' ? 'smtp' : 'development',
      smtpConfigured: isSmtpConfigured(),
    },
  });
};

/**
 * Protected operational diagnostics (non-sensitive values only).
 */
exports.getDiagnostics = async (req, res) => {
  const authRateLimitWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
  const authRateLimitMax = Number(
    process.env.AUTH_RATE_LIMIT_MAX || (process.env.NODE_ENV === 'test' ? 1000 : 10)
  );

  return res.status(200).json({
    diagnostics: {
      environment: process.env.NODE_ENV || 'development',
      security: {
        jwt: {
          usingFallbackSecret: JWT_SECRET === 'fallback_secret',
          tokenExpiration: TOKEN_EXPIRATION,
        },
        authRateLimit: {
          windowMs: authRateLimitWindowMs,
          max: authRateLimitMax,
        },
      },
      emailDelivery: {
        mode: process.env.NODE_ENV === 'production' ? 'smtp' : 'development',
        smtpConfigured: isSmtpConfigured(),
      },
    },
  });
};
