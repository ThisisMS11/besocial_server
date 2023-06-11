const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authProtect');
const { acceptNotification, rejectNotification, getNotifications } = require('../controllers/notification');

router.route('/accept/:id').put(protect, acceptNotification);
router.route('/reject/:id').put(protect, rejectNotification);
router.route('/getnotifications').get(protect, getNotifications);


module.exports = router;