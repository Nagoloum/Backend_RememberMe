require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('../routes/authRoutes');
const todoRoutes = require('../routes/todoRoutes');
const listRoutes = require('../routes/listRoutes');
const userRoutes = require('../routes/userRoutes');

const app = express();

// 1. Gestion EXPLICITE et prioritaire des preflight OPTIONS (évite tout redirect)
app.options('*', cors({
  origin: (origin, callback) => {
    const allowed = [
      'https://rememberme-lemon-chi.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, origin);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));

// 2. CORS pour toutes les autres requêtes
app.use(cors({
  origin: [
    'https://rememberme-lemon-chi.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
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

// Test simple
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Backend alive' });
});

// 404
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Erreurs globales
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal error' });
});

module.exports = app;