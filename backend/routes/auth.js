const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, id_card_url } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const userData = { name, email, password_hash: password, role: role || 'student' };
    if (role === 'mentor') {
      userData.mentor_status = id_card_url ? 'pending' : 'none';
      userData.id_card_url = id_card_url || '';
    }

    const user = await User.create(userData);
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '24h' });
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password_hash');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.account_status === 'suspended') return res.status(403).json({ message: 'Account suspended' });
    if (user.role === 'mentor' && user.mentor_status === 'pending') return res.status(403).json({ message: 'Your mentor account is pending admin approval. Please wait for verification.' });
    if (user.role === 'mentor' && user.mentor_status === 'rejected') return res.status(403).json({ message: 'Your mentor application was not approved. Contact support for more information.' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    user.last_login = new Date();
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '24h' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
