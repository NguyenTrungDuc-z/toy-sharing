const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, notificationController.getMyNotifications);
router.patch('/read-all', auth, notificationController.markAllAsRead);
router.patch('/:id/read', auth, notificationController.markAsRead);

module.exports = router;
