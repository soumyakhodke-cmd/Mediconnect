const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.get('/register', (req, res) => res.render('register', { error: null }));

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.render('register', { error: 'Email already registered.' });
    }
    user = new User({ name, email, password, role: 'patient' });
    await user.save();
    
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.SESSION_SECRET || 'supersecret_jwt_key_please_change');
    res.cookie('token', token, { httpOnly: true, path: '/' });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Error registering user Details: ' + (err.message || err.toString()) });
  }
});

router.get('/login', (req, res) => res.render('login', { error: null }));

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.render('login', { error: 'Invalid email or password.' });
    }
    if (user.role === 'doctor') {
      return res.render('login', { error: 'Doctors must use the Doctor Login page.' });
    }
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.SESSION_SECRET || 'supersecret_jwt_key_please_change');
    res.cookie('token', token, { httpOnly: true, path: '/' });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Error logging in Details: ' + (err.message || err.toString()) });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.redirect('/');
});

module.exports = router;
