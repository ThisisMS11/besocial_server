const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    PostString: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: 100
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'Users', // collection name
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: [
        {
            userId: {
                type: mongoose.Schema.ObjectId,
                ref: 'Users'
            }
        }
    ],
    photos: [{
        public_id: {
            type: String
        },
        url: {
            type: String
        }
    }],
    videos: [{
        public_id: {
            type: String
        },
        url: {
            type: String
        }
    }]

}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

/*In MongoDB, virtual attributes, also known as virtual fields or computed fields, are attributes that are not stored directly in the database but are dynamically computed or derived from other fields. */

PostSchema.virtual('comments', {
    ref: 'Comments',
    localField: '_id',
    foreignField: 'postId',
    justOne: false
});


module.exports = mongoose.model('Posts', PostSchema);