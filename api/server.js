require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('../routes/authRoutes');
const todoRoutes = require('../routes/todoRoutes');
const listRoutes = require('../routes/listRoutes');
const userRoutes = require('../routes/userRoutes');

const app = express();

// ────────────────────────────────────────────────
// 1. Gestion explicite des requêtes OPTIONS (preflight CORS)
//    → Obligatoire sur Vercel pour éviter "Redirect is not allowed for a preflight request"
app.options('*', (req, res) => {
  const origin = req.headers.origin;

  // Liste des origines autorisées (ajoute tes domaines exacts)
  const allowedOrigins = [
    'https://rememberme-lemon-chi.vercel.app',   // ton frontend de prod
    'http://localhost:5173',                      // Vite dev
    'http://localhost:3000',                      // si autre port dev
    // Ajoute les previews Vercel si besoin : process.env.VERCEL_URL ?
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // En production, refuse les origines inconnues
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // cache 24h

  return res.status(204).end(); // Réponse vide pour preflight
});

// ────────────────────────────────────────────────
// 2. Middleware CORS pour les requêtes normales
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'https://rememberme-lemon-chi.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ];

    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ────────────────────────────────────────────────
// 3. Parsing JSON
app.use(express.json());

// ────────────────────────────────────────────────
// 4. Routes
app.use('/api/auth', authRoutes);
app.use('/api', todoRoutes);
app.use('/api', listRoutes);
app.use('/api', userRoutes);

// ────────────────────────────────────────────────
// 5. Route de test simple (très utile pour debug)
app.get('/api/test', (req, res) => {
  res.json({
    status: 'alive',
    message: 'Backend fonctionne correctement',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ────────────────────────────────────────────────
// 6. 404 Not Found
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// ────────────────────────────────────────────────
// 7. Gestionnaire d'erreurs global (très utile sur Vercel)
app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err.message, err.stack);

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Erreur interne du serveur',
    // En production, ne pas exposer la stack complète
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ────────────────────────────────────────────────
// Export pour Vercel serverless functions
module.exports = app;