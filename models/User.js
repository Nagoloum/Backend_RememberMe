const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,        // ← Empêche les doublons
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, { timestamps: true });

// Middleware pre-save : hachage du mot de passe avec async/await SANS next() mal placé
userSchema.pre('save', async function () {
  // Si le mot de passe n'a pas été modifié, on ne fait rien
  if (!this.isModified('password')) return;

  // Hachage du mot de passe
  this.password = await bcrypt.hash(this.password, 12);
});

// Méthode pour comparer le mot de passe lors de la connexion
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);