const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    postID: {
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
            userId: mongoose.Schema.ObjectId,
            ref: 'Users',
        }],
        dislikes: [{
            userId: mongoose.Schema.ObjectId,
            ref: 'Users'
        }]
    }]
})


module.exports = mongoose.model('Comments', CommentSchema);