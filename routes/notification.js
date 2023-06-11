const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authProtect');
const { acceptNotification } = require('../controllers/notification');

router.route('/accept/:id').put(protect, acceptNotification);
// router.route('/reject/:id').put(protect, deleteNotification);

module.exports = router;