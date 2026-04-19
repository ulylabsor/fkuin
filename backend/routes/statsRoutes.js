const express = require('express');
const router = express.Router();
const controller = require('../controllers/statsController');

// Public route - no auth required
router.get('/', controller.getStats);

module.exports = router;
