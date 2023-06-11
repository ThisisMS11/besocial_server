const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({

    requestFrom: {
        type: mongoose.Schema.ObjectId,
        ref: 'Users', // collection name
    },
    requestTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'Users', // collection name
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})


module.exports = mongoose.model('Notifications', NotificationSchema);