const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const errorHandler = require('../utils/ErrorResponse');
const SendEmail = require('../utils/EmailHandler');
const Post = require('../models/Post');
const Notification = require('../models/Notification');


/* to accept a notification */
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

    const Requester = await User.findById(notification.requestFrom).select('following email');

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

    /* send a email to the requester that his request has been accepted */

    // const message = `Your request to follow ${req.user.name} has been accepted`;

    // try {
    //     await SendEmail({
    //         email: Requester.email,
    //         subject: 'Request Accepted',
    //         message
    //     })
    // } catch (err) {
    //     console.log(err);
    // }

    res.status(200).json({
        success: true,
        data: { notification, Requester }
    })
}) 

/* to reject a notification */
exports.rejectNotification = asyncHandler(async (req, res, next) => {

    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);

    if (!notification) {
        return next(new errorHandler('Notification not found', 404));
    }

    // checking if req.user has the right to accept the notification or not

    if (notification.requestTo.toString() !== req.user.id) {
        return next(new errorHandler('Not authorized to reject this notification', 401));
    }

    notification.status = 'rejected';
    await notification.save();



    const Requester = await User.findById(notification.requestFrom).select('following email');

    // check if user exists
    if (!Requester) {
        return next(new errorHandler('Requester not found', 404));
    }

    /* send an email to the requester about rejection */
    // const message = `Your request to follow ${req.user.name} has been rejected`;

    // try {
    //     await SendEmail({
    //         email: Requester.email,
    //         subject: 'Request Rejected',
    //         message
    //     })
    // } catch (err) {
    //     console.log(err);
    // }

    res.status(200).json({
        success: true,
        data: { notification }
    })
})

exports.getNotifications = asyncHandler(async (req, res, next) => {

    const notifications = await Notification.find({ requestTo: req.user.id, status: 'pending' }).populate([
        { path: 'requestFrom', select: 'name profilePic.url' }
    ]);

    res.status(200).json({
        success: true,
        data: notifications
    })
})
