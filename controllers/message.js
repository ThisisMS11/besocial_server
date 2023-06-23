const asyncHandler = require('../middleware/asyncHandler');
const Messages = require('../models/Message');
const User = require('../models/User');
const errorHandler = require('../utils/ErrorResponse');


exports.getMessage = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.userId);

    if (!user) {
        return next(new errorHandler(`User not found with id of ${req.params.id}`, 404));
    }

    const messageSent = await Messages.find({ sender: req.user.id, receiver: req.params.userId });

    const messageReceived = await Messages.find({ sender: req.params.userId, receiver: req.user.id });

    const allmessages = messageSent.concat(messageReceived);
    allmessages.sort((a, b) => {
        return a.date - b.date;
    });

    res.status(200).json({
        success: true,
        data: allmessages
    });
});

exports.postMessage = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.userId);

    if (!user) {
        return next(new errorHandler(`User not found with id of ${req.params.userId}`, 404));
    }

    /* block stuff can come here */

    const mess = await Messages.create({
        message: req.body.message,
        sender: req.user.id,
        receiver: req.params.userId
    });

    res.status(200).json({
        success: true,
        data: mess
    });
});

exports.deleteMessage = asyncHandler(async (req, res, next) => {
    const message = await Messages.findById(req.params.messageId);
    if (!message) {
        return next(new errorHandler(`Message not found with id of ${req.params.messageId}`, 404));
    }

    if (message.sender.toString() !== req.user.id) {
        return next(new errorHandler(`User not authorized to delete this message`, 401));
    }

    const response = await Messages.findByIdAndDelete(req.params.messageId);

    res.status(200).json({
        success: true,
        data: response
    });
});

exports.getUserMessages = asyncHandler(async (req, res, next) => {

    const messages = await Messages.find({ sender: req.user.id }).populate([
        { path: 'sender', select: 'name profilePic.url' },
        { path: 'receiver', select: 'name profilePic.url' }
    ])
        .sort({ date: -1 });


    let tempmessages = [];
    const unorderedSet = new Set();

    for (let i = 0; i < messages.length; i++) {
        if (!unorderedSet.has(messages[i].receiver._id)) {
            tempmessages.push(messages[i]);
            unorderedSet.add(messages[i].receiver._id);
        }
    }
    
    res.status(200).json({
        success: true,
        data: tempmessages
    });
})
