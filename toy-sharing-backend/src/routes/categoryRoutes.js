const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

const adminOnly = (req, res, next) => {
    if (req.authenticatedUser?.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập!' });
    }
    next();
};

// Công khai
router.get('/', categoryController.listPublic);

// Admin
router.get('/admin/all', auth, adminOnly, categoryController.listAll);
router.post('/', auth, adminOnly, categoryController.create);
router.patch('/:id', auth, adminOnly, categoryController.update);
router.delete('/:id', auth, adminOnly, categoryController.remove);

module.exports = router;
