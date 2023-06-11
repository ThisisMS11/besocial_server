const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const errorHandler = require('../utils/ErrorResponse');
const SendEmail = require('../utils/EmailHandler');
const crypto = require('crypto')
const formidable = require('formidable');
const cloudinary = require('../utils/Cloudinary');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

exports.acceptNotification = asyncHandler(async (req, res, next) => {

    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);

    if (!notification) {
        return next(new errorHandler('Notification not found', 404));
    }

    // checking if req.user has the right to accept the notification or not

    if (notification.requestTo.toString() !== req.user.id) {
        return next(new errorHandler('Not authorized to accept this notification', 401));
    }

    notification.status = 'accepted';
    await notification.save();


    /* now here i have to perform the include tasks */

    const Requester = await User.findById(notification.requestFrom).select('following');

    // check if user exists
    if (!Requester) {
        return next(new errorHandler('Requester not found', 404));
    }

    let followedByUser = Requester.following.some((userid) => userid.equals(req.user._id));

    if (!followedByUser) {
        Requester.following.push(req.user._id);
        await Requester.save();
    }

    /* checking if user is already present in the followers list of req.user */
    followedByUser = req.user.followers.some((userid) => userid.equals(req.user._id));

    if (!followedByUser) {
        req.user.followers.push(Requester._id);
        await req.user.save();
    }

    res.status(200).json({
        success: true,
        data: { notification, Requester }
    })
})