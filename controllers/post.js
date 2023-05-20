const Post = require('../models/Post');
const asyncHandler = require('../middleware/asyncHandler');
const errorHandler = require('../utils/ErrorResponse');

/* Create a New Post */
exports.createNewPost = asyncHandler(async (req, res, next) => {
    req.body.user = req.user._id;

    let newPost = await Post.create(req.body);

    newPost.user = req.user._id;
    newPost = await newPost.save();

    res.status(200).send({ success: true, data: newPost })
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