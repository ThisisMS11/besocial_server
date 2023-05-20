const express = require('express');
const { protect } = require('../middleware/authProtect')
const { createNewPost, like, dislike,getPost } = require('../controllers/post');

const router = express.Router();


/* CRUD POST*/
router.route('/').post(protect, createNewPost);

/* Get Post */
router.get('/:postId',getPost)

/* Post Engagements */
router.route('/like/:postId').put(protect, like);
router.route('/dislike/:postId').put(protect, dislike);

// router.route('/:id').delete(protect, deletePost).get(protect, getPostDetails)


module.exports = router;
