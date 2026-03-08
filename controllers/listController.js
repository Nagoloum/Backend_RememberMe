const connectDB = require("../config/db");
const createHttpError = require("http-errors");
const List = require("../models/List");

exports.getLists = async (req, res) => {
  try {
    await connectDB(); // ← Essentiel pour Vercel serverless

    const lists = await List.find({ user: req.userId })
      .sort({ name: 1 })
      .lean();

    res.json(lists);
  } catch (err) {
    console.error("Erreur getLists:", err.message, err.stack);
    res.status(err.status || 500).json({
      message: err.message || "Erreur lors de la récupération des listes",
    });
  }
};

exports.createList = async (req, res) => {
  try {
    await connectDB();

    const name = req.body?.name;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw createHttpError(400, "Le nom de la liste est requis");
    }

    const trimmed = name.trim();
    if (trimmed.length > 80) {
      throw createHttpError(400, "Le nom de la liste ne peut pas dépasser 80 caractères");
    }

    const created = await List.create({ name: trimmed, user: req.userId });

    res.status(201).json(created);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Cette liste existe déjà" });
    }

    console.error("Erreur createList:", err.message, err.stack);
    res.status(err.status || 400).json({
      message: err.message || "Erreur lors de la création de la liste",
    });
  }
};