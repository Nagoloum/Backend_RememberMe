const express = require('express');
const router = express.Router();
const { getLists, createList } = require('../controllers/listController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/lists', getLists);
router.post('/lists', createList);

module.exports = router;

