const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMe, updateMe } = require('../controllers/userController');

router.use(auth);

router.get('/users/me', getMe);
router.patch('/users/me', updateMe);

module.exports = router;

