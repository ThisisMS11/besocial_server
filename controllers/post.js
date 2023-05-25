const Post = require('../models/Post');
const Comment = require('../models/Comments');

const asyncHandler = require('../middleware/asyncHandler');
const errorHandler = require('../utils/ErrorResponse');

/* Create a New Post */
exports.createNewPost = asyncHandler(async (req, res, next) => {
    req.body.user = req.user._id;

    let newPost = await Post.create(req.body);

    newPost.user = req.user._id;

    newPost = await newPost.save();

    /* Creating Corresponding Comment */
    let newcomment = await Comment.create({ postId: newPost._id });
    await newcomment.save();

    res.status(200).send({ success: true, data: newPost })
})
/* Post Media */
exports.uploadImages = asyncHandler(async (req, res, next) => {
    const post = await Post.findById({ _id: req.params.postId });
    if (!post) {
        next(new errorResponse(`No post found with id ${req.params.id}`, 401));
    }

    // ! Admin (permission checking)
    if (post.user != req.user.id) {
        next(new errorResponse(`Not authorized to upload images`, 401));
    }
    
    if (!req.files) {
        next(new errorResponse(`Please upload a file`, 401));
    }


    return;
})

exports.uploadVideos = asyncHandler(async (req, res, next) => {
    return;
})







exports.getPost = asyncHandler(async (req, res, next) => {
    const post = await Post.find({ _id: req.params.postId });

    if (!post) {
        next(new errorHandler(`No post found with id ${req.params.postId}`, 401));
    }

    res.status(200).send({ success: true, post: post });
})

/* Like a Post */
exports.like = asyncHandler(async (req, res, next) => {
    // finding the post
    const post = await Post.findOne({ _id: req.params.postId });
    if (!post) {
        next(new errorHandler(`No post found with id ${req.params.postId}`, 401));
    }
    // checking whether the array of likes already contains the user id or not
    const likedByUser = post.likes.some((like) => like._id.equals(req.user._id));

    if (!likedByUser) {
        post.likes.push(req.user._id);
        await post.save();
    }

    res.status(200).send({ success: true, data: post })
})

/* Dislike a Post */
exports.dislike = asyncHandler(async (req, res, next) => {
    // finding the post
    const post = await Post.findOne({ _id: req.params.postId });
    if (!post) {
        next(new errorHandler(`No post found with id ${req.params.postId}`, 401));
    }
    // checking whether the array of likes already contains the user id or not
    const likedByUser = post.likes.some((like) => like._id.equals(req.user._id));

    // if liked by the req.user only then the user can dislike makes sense.
    if (likedByUser) {
        post.likes.remove(req.user._id);
        await post.save();
    }

    res.status(200).send({ success: true, data: post })
})

/* Comment Exports */

exports.addNewComment = asyncHandler(async (req, res, next) => {
    let comment = await Comment.findOne({ postId: req.params.postId });

    if (!comment) {
        next(new errorHandler(`No Comment Body found with id ${req.params.postId}`, 401));
    }

    if (req.body) {
        /* Pushing the comment data into CommentModal */
        comment.content.push({
            user: req.user._id,
            comment: req.body.comment,
            likes: [],
            dislikes: []
        });

        await comment.save();
    }

    res.status(200).send({ success: true, comment: comment });
})

// like the comment
exports.likeComment = asyncHandler(async (req, res, next) => {

    let comment = await Comment.findOne({ postId: req.params.postId });

    if (!comment) {
        next(new errorHandler(`No Comment Body  found with id ${req.params.postId}`, 401));
    }

    comment.content.map((item) => {

        // string to mongodb id object.
        if (req.params.commentId === item._id.toString()) {

            if (!item.likes.includes(req.user._id)) {
                item.likes.push(req.user._id);
            }

            /* to remove the user  id from dislikes array if disliked earlier */
            if (item.dislikes.includes(req.user._id)) {
                item.dislikes.remove(req.user._id);
            }
        }
    })

    comment.save();

    res.status(200).send({ success: true, comment: comment });
})

// dislike the comment
exports.dislikeComment = asyncHandler(async (req, res, next) => {

    let comment = await Comment.findOne({ postId: req.params.postId });


    if (!comment) {
        next(new errorHandler(`No Comment Body  found with id ${req.params.postId}`, 401));
    }

    comment.content.map((item) => {

        // string to mongodb id object.
        if (req.params.commentId === item._id.toString()) {

            if (!item.dislikes.includes(req.user._id)) {
                item.dislikes.push(req.user._id);
            }

            if (item.likes.includes(req.user._id)) {
                item.likes.remove(req.user._id);
            }
        }
    })

    comment.save();

    res.status(200).send({ success: true, comment: comment });
})

// To delete any comment
exports.deleteComment = asyncHandler(async (req, res, next) => {
    const comment = await Comment.findOne({ postId: req.params.postId });

    if (!comment) {
        return next(new errorHandler(`No post found with id ${req.params.postId}`, 401));
    }

    const commentIndex = comment.content.findIndex((item) => item._id == req.params.commentId);

    if (commentIndex == -1) {
        return next(new errorHandler(`No comments found with id ${req.params.commentId}`, 401));
    }

    /* Future Task only admin and the respective user is supposed to delete the comment */

    if (comment.content[commentIndex].user != req.user.id) {
        return next(new errorHandler(`Not authorized to delete the comment`, 401));
    }

    comment.content.splice(commentIndex, 1);
    comment.save();

    res.status(200).send({ success: true, comment: comment });
})

// Edit comment

//! Editing a comment
exports.editComment = asyncHandler(async (req, res, next) => {
    const comment = await Comment.findOne({ postId: req.params.postId });

    if (!comment) {
        next(new errorResponse(`No post found with id ${req.params.postId}`, 401));
    }

    const commentIndex = comment.content.findIndex((item) => item._id == req.params.commentId);

    if (commentIndex == -1) {
        next(new errorResponse(`No comments found with id ${req.params.commentId}`, 401));
    }

    if (comment.content[commentIndex].user != req.user.id) {
        next(new errorResponse(`Not authorized to edit the comment`, 401));
    }

    comment.content[commentIndex].comment = req.body.comment;
    comment.save();

    res.status(200).send({ success: true, comment: comment });
})


// Get all the comments of a post.
exports.getComments = asyncHandler(async (req, res, next) => {
    let comment = await Comment.findOne({ postId: req.params.postId });

    if (!comment) {
        next(new errorResponse(`No post found with id ${req.params.postId}`, 401));
    }

    res.status(200).send({ success: true, comment: comment });
})