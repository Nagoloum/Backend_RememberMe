const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const connectDB = require('../config/db');

router.post('/register', async (req, res) => {
  try {
    await connectDB();
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const user = await User.create({ name, email, password });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '5d',
    });

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Erreur register :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    await connectDB(); // ← ajouté ici aussi
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Connexion réussie',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Erreur login :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;