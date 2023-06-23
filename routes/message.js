const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authProtect');
const { getMessage, postMessage, deleteMessage, getUserMessages } = require('../controllers/message');

router.route('/').get(protect, getUserMessages);
router.route('/:userId').get(protect, getMessage).post(protect, postMessage);
router.route('/delete/:messageId').delete(protect, deleteMessage);

module.exports = router;