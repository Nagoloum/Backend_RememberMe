const createHttpError = require("http-errors");
const Todo = require("../models/Todo");

// Champs autorisés pour la création et la mise à jour
const ALLOWED_CREATE_FIELDS = [
  "title",
  "description",
  "dueDate",
  "list",
  "priority",
];
const ALLOWED_UPDATE_FIELDS = [
  "title",
  "description",
  "completed",
  "dueDate",
  "list",
  "priority",
];

// Validation simple et propre
const validateTodoInput = (body, isUpdate = false) => {
  const fields = isUpdate ? ALLOWED_UPDATE_FIELDS : ALLOWED_CREATE_FIELDS;

  if (!body || Object.keys(body).length === 0) {
    throw createHttpError(400, "Aucune donnée fournie");
  }

  // Champs non autorisés
  const invalidFields = Object.keys(body).filter(
    (key) => !fields.includes(key)
  );
  if (invalidFields.length > 0) {
    throw createHttpError(
      400,
      `Champs non autorisés : ${invalidFields.join(", ")}`
    );
  }

  // Titre : requis en création, optionnel en mise à jour
  if (!isUpdate) {
    if (
      !body.title ||
      typeof body.title !== "string" ||
      body.title.trim().length === 0
    ) {
      throw createHttpError(
        400,
        "Le titre est requis et doit être une chaîne non vide"
      );
    }
    if (body.title.trim().length > 200) {
      throw createHttpError(
        400,
        "Le titre ne peut pas dépasser 200 caractères"
      );
    }
  } else if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      throw createHttpError(400, "Le titre doit être une chaîne non vide");
    }
    if (body.title.trim().length > 200) {
      throw createHttpError(
        400,
        "Le titre ne peut pas dépasser 200 caractères"
      );
    }
  }

  // Description
  if (body.description !== undefined && typeof body.description !== "string") {
    throw createHttpError(
      400,
      "La description doit être une chaîne de caractères"
    );
  }

  // DueDate
  if (
    body.dueDate !== undefined &&
    body.dueDate &&
    isNaN(Date.parse(body.dueDate))
  ) {
    throw createHttpError(400, "Format de date invalide pour dueDate");
  }

  // Priority
  if (
    body.priority !== undefined &&
    !["low", "medium", "high"].includes(body.priority)
  ) {
    throw createHttpError(400, "Priorité doit être : low, medium ou high");
  }

  // List
  if (body.list !== undefined && typeof body.list !== "string") {
    throw createHttpError(400, "La liste doit être une chaîne de caractères");
  }
};

// Récupérer toutes les tâches de l'utilisateur connecté
exports.getTodos = async (req, res) => {
  try {
    const { list, completed } = req.query;

    // Construction du filtre
    let filter = { user: req.userId };

    if (list) filter.list = list;
    if (completed !== undefined) filter.completed = completed === "true";

    const todos = await Todo.find(filter)
      .sort({ dueDate: 1, createdAt: -1 }) // Priorité aux dates proches
      .lean(); // Plus performant pour lecture seule

    res.json(todos);
  } catch (err) {
    console.error("Erreur getTodos:", err);
    res.status(err.status || 500).json({
      message: err.message || "Erreur lors de la récupération des tâches",
    });
  }
};

// Créer une nouvelle tâche
exports.createTodo = async (req, res) => {
  try {
    validateTodoInput(req.body, false);

    const todoData = {
      title: req.body.title.trim(),
      user: req.userId,
    };

    // Ajout des champs optionnels si présents
    if (req.body.description)
      todoData.description = req.body.description.trim();
    if (req.body.dueDate) todoData.dueDate = new Date(req.body.dueDate);
    if (req.body.list !== undefined) {
      todoData.list = req.body.list.trim() || "General";
    } else {
      todoData.list = "General";
    }
    if (req.body.priority) todoData.priority = req.body.priority;

    const newTodo = await Todo.create(todoData);

    res.status(201).json(newTodo);
  } catch (err) {
    console.error("Erreur createTodo:", err);
    res.status(err.status || 400).json({
      message: err.message || "Erreur lors de la création de la tâche", 
    });
  }
};

// Mettre à jour une tâche
exports.updateTodo = async (req, res) => {
  try {
    validateTodoInput(req.body, true);

    const todo = await Todo.findOne({ _id: req.params.id, user: req.userId });

    if (!todo) {
      throw createHttpError(404, "Tâche non trouvée ou accès refusé");
    }

    // Mise à jour contrôlée des champs
    if (req.body.title !== undefined) todo.title = req.body.title.trim();
    if (req.body.description !== undefined)
      todo.description = req.body.description.trim();
    if (req.body.completed !== undefined) todo.completed = req.body.completed;
    if (req.body.dueDate !== undefined) {
      todo.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }
    if (req.body.list !== undefined)
      todo.list = req.body.list?.trim() || "General";
    if (req.body.priority !== undefined) todo.priority = req.body.priority;

    const updatedTodo = await todo.save();

    res.json(updatedTodo);
  } catch (err) {
    console.error("Erreur updateTodo:", err);
    res.status(err.status || 400).json({
      message: err.message || "Erreur lors de la mise à jour de la tâche",
    });
  }
};

// Supprimer une tâche
exports.deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!todo) {
      throw createHttpError(404, "Tâche non trouvée ou accès refusé");
    }
    //rafraichier la liste des taches
    const todos = await Todo.find({ user: req.userId }).sort({
      dueDate: 1,
      createdAt: -1,
    });

    res.json({ message: "Tâche supprimée avec succès", todos });
  } catch (err) {
    console.error("Erreur deleteTodo:", err);
    res.status(err.status || 500).json({
      message: err.message || "Erreur lors de la suppression de la tâche",
    });
  }
};
