require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const todoRoutes = require('./routes/todoRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes); // Routes d'authentification

app.use('/api', todoRoutes); // Préfixe /api pour scalabilité

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));