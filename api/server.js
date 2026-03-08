require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('../routes/authRoutes');
const todoRoutes = require('../routes/todoRoutes');
const listRoutes = require('../routes/listRoutes');
const userRoutes = require('../routes/userRoutes');

const app = express();

// CORS sécurisé : remplace par tes domaines réels
const allowedOrigins = [
  'http://localhost:5173',              // dev Vite
  'http://localhost:3000',
  'https://ton-frontend.vercel.app',    // ← change ça !
  // Ajoute les previews Vercel si besoin : process.env.VERCEL_URL ?
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', todoRoutes);
app.use('/api', listRoutes);
app.use('/api', userRoutes);

// Route 404 globale
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestionnaire d'erreurs global (très utile sur Vercel)
app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err);
  res.status(500).json({
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

module.exports = app;