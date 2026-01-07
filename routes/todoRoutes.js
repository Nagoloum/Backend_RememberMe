const express = require('express');
const router = express.Router();
const {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo
} = require('../controllers/todoController');
const auth = require('../middleware/auth');

// Toutes les routes sont protégées par le middleware auth
router.use(auth);

router.get('/todos', getTodos);
router.post('/todos', createTodo);
router.put('/todos/:id', updateTodo);     
router.delete('/todos/:id', deleteTodo); 

module.exports = router;