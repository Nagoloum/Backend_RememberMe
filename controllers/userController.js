const connectDB = require("../config/db");
const createHttpError = require("http-errors");
const User = require("../models/User");

exports.getMe = async (req, res) => {
  try {
    await connectDB();

    const user = await User.findById(req.userId).lean();
    if (!user) {
      throw createHttpError(404, "Utilisateur introuvable");
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      notificationsEnabled: Boolean(user.notificationsEnabled),
      notificationTime: user.notificationTime || "09:00",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.error("Erreur getMe:", err.message, err.stack);
    res.status(err.status || 500).json({
      message: err.message || "Erreur lors de la récupération du profil",
    });
  }
};

exports.updateMe = async (req, res) => {
  try {
    await connectDB();

    const body = req.body || {};

    const allowed = ["name", "notificationsEnabled", "notificationTime"];
    const invalidFields = Object.keys(body).filter((k) => !allowed.includes(k));
    if (invalidFields.length > 0) {
      throw createHttpError(
        400,
        `Champs non autorisés : ${invalidFields.join(", ")}`
      );
    }

    const updates = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        throw createHttpError(400, "Le nom est requis");
      }
      const trimmed = body.name.trim();
      if (trimmed.length > 80) {
        throw createHttpError(400, "Le nom ne peut pas dépasser 80 caractères");
      }
      updates.name = trimmed;
    }

    if (body.notificationsEnabled !== undefined) {
      if (typeof body.notificationsEnabled !== "boolean") {
        throw createHttpError(400, "notificationsEnabled doit être un booléen");
      }
      updates.notificationsEnabled = body.notificationsEnabled;
    }

    if (body.notificationTime !== undefined) {
      if (body.notificationTime === null || body.notificationTime === "") {
        updates.notificationTime = "09:00";
      } else {
        if (typeof body.notificationTime !== "string") {
          throw createHttpError(400, "notificationTime doit être une chaîne");
        }
        const value = body.notificationTime.trim();
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
          throw createHttpError(
            400,
            "Format invalide pour notificationTime (HH:MM)"
          );
        }
        updates.notificationTime = value;
      }
    }

    const updated = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
    }).lean();

    if (!updated) {
      throw createHttpError(404, "Utilisateur introuvable");
    }

    res.json({
      id: updated._id,
      name: updated.name,
      email: updated.email,
      notificationsEnabled: Boolean(updated.notificationsEnabled),
      notificationTime: updated.notificationTime || "09:00",
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    console.error("Erreur updateMe:", err.message, err.stack);
    res.status(err.status || 400).json({
      message: err.message || "Erreur lors de la mise à jour du profil",
    });
  }
};