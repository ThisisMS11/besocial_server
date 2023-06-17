const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        ref: 'Users',
        required: true
    },
    receiver: {
        type: String,
        ref: 'Users',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Messages', messageSchema);