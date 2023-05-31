const express = require('express');
const { protect } = require('../middleware/authProtect')
const { createNewPost, like, dislike, getPost,
    addNewComment,
    likeComment, dislikeComment, deleteComment, editComment, getComments, uploadImages, uploadVideos, getAllPosts } = require('../controllers/post');

const router = express.Router();
const { mediaUpload } = require('../middleware/multer');


/* CRUD POST*/
router.route('/').post(protect, createNewPost);

/* Media */
router.route('/uploadImages/:postId').post(protect, mediaUpload, uploadImages);
router.route('/uploadVideos/:postId').post(protect, mediaUpload, uploadVideos);


/* Get Post */
router.route('/').get(protect, getAllPosts);
router.route('/:postID').get(protect, getPost);

/* Post Engagements */
router.route('/like/:postId').put(protect, like);
router.route('/dislike/:postId').put(protect, dislike);

// router.route('/:id').delete(protect, deletePost).get(protect, getPostDetails)

/* Post Comments */
router.route('/comment/:postId').get(getComments);
router.route('/comment/:postId').put(protect, addNewComment);
router.route('/comment/like/:postId/:commentId').put(protect, likeComment)
router.route('/comment/dislike/:postId/:commentId').put(protect, dislikeComment)
router.route('/comment/delete/:postId/:commentId').delete(protect, deleteComment);
router.route('/comment/update/:postId/:commentId').put(protect, editComment);



module.exports = router;
