const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'Posts'
    },
    content: [{
        user: {
            type: mongoose.Schema.ObjectId,
            required: true,
            ref: 'Users'
        },
        comment: {
            type: String,
            maxlength: 100,
        },
        likes: [{
            type: mongoose.Schema.ObjectId
        }],
        dislikes: [{
            type: mongoose.Schema.ObjectId
        }]
    }]
})


module.exports = mongoose.model('Comments', CommentSchema);
