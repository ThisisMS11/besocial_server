const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authProtect')
const { login, register, logout, getUserInfo, VerifyEmail, resendEmailVerification, UpdateVerificationToken, getUserPosts, getAllUsers } = require('../controllers/user');


router.post('/login', login);
router.post('/register', register);

router.route('/logout').get(protect, logout);

// email verification stuff
router.route('/verify/:token').get(VerifyEmail);
router.route('/updateVerificationToken').put(UpdateVerificationToken);
router.route('/resendEmailVerification').put(resendEmailVerification);


/* Get user */
router.route('/').get(protect, getUserInfo);
router.route('/allusers').get(protect, getAllUsers);

/* Get User posts */
router.route('/posts').get(protect, getUserPosts);



module.exports = router;
