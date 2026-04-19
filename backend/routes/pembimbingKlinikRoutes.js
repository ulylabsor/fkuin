const express = require('express');
const router = express.Router();
const controller = require('../controllers/pembimbingKlinikController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes - read only
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// Protected routes - require authentication
router.post('/', authMiddleware, controller.create);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.delete);

module.exports = router;
