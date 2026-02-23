const mongoose = require('mongoose');

const listSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

listSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('List', listSchema);

