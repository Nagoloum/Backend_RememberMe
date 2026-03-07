const createHttpError = require("http-errors");
const Todo = require("../models/Todo");

// Champs autorisés pour la création et la mise à jour
const ALLOWED_CREATE_FIELDS = [
  "title",
  "description",
  "dueDate",
  "dueTime",
  "list",
  "priority",
];
const ALLOWED_UPDATE_FIELDS = [
  "title",
  "description",
  "completed",
  "dueDate",
  "dueTime",
  "list",
  "priority",
];

// Validation simple et propre
const validateTodoInput = (body, isUpdate = false) => {
  const fields = isUpdate ? ALLOWED_UPDATE_FIELDS : ALLOWED_CREATE_FIELDS;

  if (!body || Object.keys(body).length === 0) {
    throw createHttpError(400, "Aucune donnée fournie");
  }

  if (body.dueIme !== undefined && body.dueTime === undefined) {
    body.dueTime = body.dueIme;
    delete body.dueIme;
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
  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    throw createHttpError(
      400,
      "La description doit être une chaîne de caractères"
    );
  }

  if (body.completed !== undefined && typeof body.completed !== "boolean") {
    throw createHttpError(400, "Le champ completed doit être un booléen");
  }

  // DueDate
  if (
    body.dueDate !== undefined &&
    body.dueDate &&
    isNaN(Date.parse(body.dueDate))
  ) {
    throw createHttpError(400, "Format de date invalide pour dueDate");
  }

  if (body.dueDate) {
    const today = new Date().toISOString().slice(0, 10);
    const datePart = typeof body.dueDate === "string" ? body.dueDate.slice(0, 10) : null;
    if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      if (datePart < today) {
        throw createHttpError(400, "La date d'échéance ne peut pas être dans le passé");
      }
    }
  }

  if (body.dueTime !== undefined && body.dueTime !== null) {
    if (typeof body.dueTime !== "string") {
      throw createHttpError(400, "Format invalide pour dueTime");
    }
    const trimmed = body.dueTime.trim();
    if (trimmed.length > 0 && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed)) {
      throw createHttpError(400, "Format invalide pour dueTime (HH:MM)");
    }
  }

  // Priority
  if (
    body.priority !== undefined &&
    !["low", "medium", "high"].includes(body.priority)
  ) {
    throw createHttpError(400, "Priorité doit être : low, medium ou high");
  }

  // List
  if (body.list !== undefined && body.list !== null && typeof body.list !== "string") {
    throw createHttpError(400, "La liste doit être une chaîne de caractères");
  }
};

// Récupérer toutes les tâches de l'utilisateur connecté
exports.getTodos = async (req, res) => {
  try {
    const { list, completed, dueDate } = req.query;

    // Construction du filtre
    let filter = { user: req.userId };

    if (list) filter.list = list;
    if (completed !== undefined) filter.completed = completed === "true";
    if (dueDate !== undefined) {
      if (typeof dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        throw createHttpError(400, "Format invalide pour dueDate (YYYY-MM-DD)");
      }
      const start = new Date(`${dueDate}T00:00:00.000Z`);
      const end = new Date(`${dueDate}T23:59:59.999Z`);
      filter.dueDate = { $gte: start, $lte: end };
    }

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

exports.getTodayNotifications = async (req, res) => {
  try {
    const date = typeof req.query?.date === "string" ? req.query.date : null;
    const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);

    const start = new Date(`${day}T00:00:00.000Z`);
    const end = new Date(`${day}T23:59:59.999Z`);

    const todos = await Todo.find({
      user: req.userId,
      completed: false,
      dueDate: { $gte: start, $lte: end },
    })
      .sort({ dueTime: 1, createdAt: -1 })
      .lean();

    res.json({ date: day, todos });
  } catch (err) {
    console.error("Erreur getTodayNotifications:", err);
    res.status(err.status || 500).json({
      message: err.message || "Erreur lors de la récupération des notifications",
    });
  }
};

exports.getTodoById = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.userId }).lean();
    if (!todo) {
      throw createHttpError(404, "Tâche non trouvée ou accès refusé");
    }
    res.json(todo);
  } catch (err) {
    console.error("Erreur getTodoById:", err);
    res.status(err.status || 400).json({
      message: err.message || "Erreur lors de la récupération de la tâche",
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
    if (req.body.dueTime) todoData.dueTime = req.body.dueTime.trim();
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
    if (req.body.description !== undefined) {
      if (req.body.description === null) {
        todo.description = "";
      } else {
        todo.description = req.body.description.trim();
      }
    }
    if (req.body.completed !== undefined) todo.completed = req.body.completed;
    if (req.body.dueDate !== undefined) {
      todo.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }
    if (req.body.dueTime !== undefined) {
      todo.dueTime = req.body.dueTime ? req.body.dueTime.trim() : null;
    }
    if (req.body.list !== undefined)
      todo.list = req.body.list === null ? "General" : req.body.list?.trim() || "General";
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
