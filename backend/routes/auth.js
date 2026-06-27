const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticate } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/email');

const router = express.Router();

const PASSWORD_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function getResetUrl(token) {
  const origin = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${origin}/reset-password/${token}`;
}

async function logAuthEvent(actor_id, action_type, details, ip_address) {
  try {
    await AuditLog.create({ actor_id, action_type, target_entity: 'auth', details, ip_address });
  } catch (e) { /* silent */ }
}

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [student, mentor] }
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, id_card_url } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    if (role === 'admin' && !PASSWORD_COMPLEXITY.test(password)) {
      return res.status(400).json({ message: 'Admin password must be at least 8 characters with uppercase, lowercase, number, and special character' });
    }

    const userData = { name, email, password_hash: password, role: role || 'student' };
    if (role === 'mentor') {
      userData.mentor_status = id_card_url ? 'pending' : 'none';
      userData.id_card_url = id_card_url || '';
    }

    const user = await User.create(userData);
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '24h' });
    await logAuthEvent(user._id, 'user_created', { email, role }, req.ip);
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Log in an existing user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password_hash');
    if (!user) {
      await logAuthEvent(null, 'login_failed', { email, reason: 'no_user' }, req.ip);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.account_status === 'suspended') {
      await logAuthEvent(user._id, 'login_failed', { email, reason: 'suspended' }, req.ip);
      return res.status(403).json({ message: 'Account suspended' });
    }
    if (user.role === 'mentor' && user.mentor_status === 'pending') return res.status(403).json({ message: 'Your mentor account is pending admin approval. Please wait for verification.' });
    if (user.role === 'mentor' && user.mentor_status === 'rejected') return res.status(403).json({ message: 'Your mentor application was not approved. Contact support for more information.' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAuthEvent(user._id, 'login_failed', { email, reason: 'wrong_password' }, req.ip);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    user.last_login = new Date();
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '24h' });
    await logAuthEvent(user._id, 'login_success', { email }, req.ip);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request a password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Reset email sent if account exists
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account with that email exists' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.reset_password_token = hashedToken;
    user.reset_password_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = getResetUrl(rawToken);
    await sendPasswordResetEmail(email, resetUrl);

    await logAuthEvent(user._id, 'password_reset_requested', { email }, req.ip);

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (user.role === 'admin' && !PASSWORD_COMPLEXITY.test(password)) {
      return res.status(400).json({ message: 'Admin password must be at least 8 characters with uppercase, lowercase, number, and special character' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      reset_password_token: hashedToken,
      reset_password_expires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password_hash = password;
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    await user.save();

    await logAuthEvent(user._id, 'password_reset_completed', { email: user.email }, req.ip);

    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
