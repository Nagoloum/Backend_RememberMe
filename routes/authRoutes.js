const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Inscription
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    // Créer l'utilisateur (le mot de passe sera haché automatiquement)
    const user = await User.create({ name, email, password });

    // Générer un token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "5d", // Le token expire en 5 jours
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Erreur lors de l'authentification :", err); // ← Log détaillé
    res.status(500).json({
      message: "Erreur serveur",
      details: err.message, // ← On voit l'erreur réelle côté frontend aussi
    });
  }
});

// Connexion
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) { 
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    // Générer un token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Connexion réussie",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Erreur lors de l'authentification :", err); // ← Log détaillé
    res.status(500).json({
      message: "Erreur serveur",
      details: err.message, // ← On voit l'erreur réelle côté frontend aussi
    });
  }
});

module.exports = router;
