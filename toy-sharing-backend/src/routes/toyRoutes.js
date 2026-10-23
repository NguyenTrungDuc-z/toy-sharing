const express = require('express');
const router = express.Router();
const toyController = require('../controllers/toyController');
const auth = require('../middleware/auth');

// ==========================================
// 1. CÁC TUYẾN ĐƯỜNG CÔNG KHAI (Public)
// ==========================================
router.get('/', toyController.getAllToys);

// ==========================================
// 2. CÁC TUYẾN ĐƯỜNG ĐỒ CHƠI CÁ NHÂN (User)
// ==========================================
router.get('/my-toys', auth, toyController.getMyToys);
router.post('/', auth, toyController.createToy);
router.put('/:id', auth, toyController.updateToy);
router.delete('/:id', toyController.deleteToy);

// ==========================================
// 3. TƯƠNG TÁC (Báo cáo & Yêu thích)
// ==========================================
router.post('/:id/report', auth, toyController.reportToy);
router.post('/:id/favorite', auth, toyController.addFavorite);
router.delete('/:id/favorite', auth, toyController.removeFavorite);

// ==========================================
// 4. KIỂM DUYỆT ĐỒ CHƠI (Admin)
// ==========================================
router.get('/pending', auth, toyController.getPendingToys);
router.put('/:id/moderate', auth, toyController.moderateToy);

module.exports = router;