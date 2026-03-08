const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI manquante dans les variables d\'environnement');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    // console.log('→ Utilisation de la connexion MongoDB cachée');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 5,                 // Augmente à 10 si trafic moyen
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,        // ← ajouté
      family: 4,                      // ← force IPv4 (évite certains timeouts)
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('→ MongoDB connecté avec succès (cached)');
        return mongoose;
      })
      .catch((err) => {
        console.error('Erreur connexion MongoDB :', err.message);
        cached.promise = null; // reset pour retry
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

module.exports = dbConnect;