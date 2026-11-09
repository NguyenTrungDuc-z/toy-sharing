const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.get('/unread-count', auth, messageController.getUnreadCount);
router.get('/:borrowRequestId', auth, messageController.getMessages);
router.post('/:borrowRequestId', auth, messageController.sendMessage);

module.exports = router;
