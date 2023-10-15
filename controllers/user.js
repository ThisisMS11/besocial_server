const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const errorHandler = require('../utils/ErrorResponse');
const SendEmail = require('../utils/EmailHandler');
const crypto = require('crypto')
const formidable = require('formidable');
const cloudinary = require('../utils/Cloudinary');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const bcrypt = require('bcrypt');
const { getDataUri } = require('../utils/DataUri');
const { NONAME } = require('dns');

exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new errorHandler('Please provide an email and password', 400));
    }

    // find in db
    const user = await User.findOne({ email: email }).select('+password');
    if (!user) {
        return next(new errorHandler('User not found with the given email', 404));
    }

    //confirm password
    const matchpasswordResult = await user.matchpassword(password);


    if (!matchpasswordResult) {
        return next(new errorHandler('Invalid Input', 404));
    }

    res.json({ success: true, token: user.getJwtToken() });

});

/*************************************************** */
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getJwtToken();

    const options = {
        expires: new Date(
            Date.now() + 10 * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    }

    res.status(statusCode).cookie('token', token, options).send({ status: true, token: token });
}
/********************************************************** */

exports.register = asyncHandler(async (req, res, next) => {

    let name, email, password, file;

    /* reading data from formdata object send from client side. */
    const form = formidable({ multiples: true });

    /* the form.parse() function is asynchronous, and it takes some time to complete the parsing process. Therefore, the code outside the form.parse() callback is executed before the parsing is finished. */

    await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(new errorHandler(err, 400));
            }

            // Extract the values from the fields object
            name = fields.username;
            email = fields.email;
            password = fields.password;
            file = files.profilePic;

            resolve();
        });
    });


    if (!name || !email || !password) {
        return next(new errorHandler('Please provide an email and password', 400));
    }

    let user = await User.findOne({ email: email });

    if (user) {
        return next(new errorHandler('User with the given email already exists', 400));
    }

    /* creating user in database */

    const salt = bcrypt.genSaltSync(10);
    password = bcrypt.hashSync(password, salt);

    user = await User.create({ name: name, email: email, unVerfiedEmail: email, password: password });

    /*Cloudinary Stuff to upload the profile Pic*/

    // Default picture in case file not found.
    let profilePic = {
        public_id: 'Screenshot_from_2023-05-25_22-34-21_nb2suf.png',
        url: 'https://res.cloudinary.com/cloudinarymohit/image/upload/v1685034293/Screenshot_from_2023-05-25_22-34-21_nb2suf.png'
    };

    // if file exists
    if (file) {
        if (!file.mimetype.startsWith('image')) {
            next(new errorHandler(`Please upload an image file`, 401));
        }


        try {
            result = await cloudinary.uploader.upload(file.filepath, {
                folder: 'profilePic'
            })
            profilePic = { public_id: result.public_id, url: result.secure_url }
        } catch (err) {
            console.log('cloudinary error : ', err);
        }
    }


    user.profilePic = profilePic;
    await user.save();
    /* ******************************** */


    /* Creating a url for verifying user email */
    const VerificationToken = user.getVerficationtoken();


    const verificationUrl = `${process.env.SERVER_URL}/api/v1/user/verify/${VerificationToken}`;

    const message = `Please verify your email by clicking on the link below: \n\n ${verificationUrl}`;

    // Sending the url to user email

    try {
        await SendEmail({
            email: user.unVerfiedEmail,
            subject: "Email Verification",
            message
        })
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, data: `Email Sent with URL : ${verificationUrl}` });
    } catch (error) {
        console.log(error);
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        // user will still be saved but with unverified Email.
        await user.save({ validateBeforeSave: false });
        return next(new errorHandler('Email could not be sent', 500));
    }
});

/* Get User information */
exports.getUserInfo = asyncHandler(async (req, res, next) => {

    const myself = await User.findById(req.user._id).select('-password').populate([
        { path: 'following', select: 'name profilePic.url' },
        { path: 'followers', select: 'name profilePic.url' },
    ])
    await myself.save();

    res.status(200).json({ success: true, data: myself });
})

/* Get all users */
exports.getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find({}).select('name profilePic');

    if (!users) {
        return next(new errorHandler('No users found', 404));
    }

    res.status(200).json({ success: true, data: users });
})

/* Get a user information based on his userid */
exports.getOtherUserInfo = asyncHandler(async (req, res, next) => {
    const userId = req.params.userId;

    /* for find user information */
    const user = await User.findById(userId);

    if (!user) {
        return next(new errorHandler('No user found', 404));
    }

    res.status(200).json({ success: true, data: user });
})

/* get other user posts */
exports.getOtherUserPosts = asyncHandler(async (req, res, next) => {
    const userId = req.params.userId;
    const posts = await Post.find({ user: userId }).populate([
        { path: 'user', select: 'name profilePic' },
        {
            path: 'comments', select: 'content id',
            populate: {
                path: 'content.user',
                select: 'name profilePic.url'
            }
        }
    ]);

    if (!posts) {
        return next(new errorHandler('No posts found', 404));
    }

    res.status(200).json({ success: true, data: posts });
})

/* To get specific User Posts */
exports.getUserPosts = asyncHandler(async (req, res, next) => {
    const posts = await Post.find({ user: req.user._id }).populate([
        { path: 'user', select: 'name profilePic' },
        {
            path: 'comments', select: 'content id',
            populate: {
                path: 'content.user',
                select: 'name profilePic.url'
            }
        }
    ]);

    if (!posts) {
        return next(new errorHandler('No posts found', 404));
    }

    res.status(200).json({ success: true, data: posts });
})

exports.resendEmailVerification = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new errorHandler('Invalid Input', 404));
    }
    const VerificationToken = user.getVerficationtoken();


    await user.save({ validateBeforeSave: false });

    // console.log({ url: process.env.SERVER_URL })

    const verificationUrl = `${process.env.SERVER_URL}/api/v1/user/verify/${VerificationToken}`;

    const message = `Please verify your email by clicking on the link below: \n ${verificationUrl}`;

    try {
        await SendEmail({
            email: user.email,
            subject: 'Email Verification',
            message
        })
        res.status(200).json({ success: true, data: `Email sent with url : ${verificationUrl}` });
    }
    catch (err) {
        console.log(err);
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new errorHandler('Email could not be sent', 500));
    }
});

/* verifying the email */
exports.VerifyEmail = asyncHandler(async (req, res, next) => {
    // this is to verify our email and setting isVerified for our user to true.

    // fetching Verfication token from clicked url
    const verificationToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // finding corresponding user in database and checking verificaitonToken Expiry
    const user = await User.findOne({ verificationToken: verificationToken, verificationTokenExpire: { $gt: Date.now() } }).select('+password');

    /* for now */
    // const user = await User.findOne({ verificationToken: verificationToken }).select('+password')

    // If no user found with that token

    if (!user) {
        return next(new errorHandler('Invalid Token', 400));
    }

    user.isVerified = true;

    // check if there exists a unverified email
    if (user.unVerfiedEmail) {

        // Setting Unverified Email and tokens to undefined as we do not require them anymore.
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        // setting verified email to unverified email on successful completion
        user.email = user.unVerfiedEmail;
        user.unVerfiedEmail = undefined;
    }

    await user.save({ validateBeforeSave: false });
    const token = user.getJwtToken();

    // const options = {
    //     expires: new Date(
    //         Date.now() + 10 * 24 * 60 * 60 * 1000
    //     ),
    //     httpOnly: true,
    // }
    const redirectUrl = `${process.env.WEB_APP_URL}/verify/?token=${token}`;
    res.redirect(redirectUrl);
});

/* to update the expired verification token */
exports.UpdateVerificationToken = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ unVerfiedEmail: req.body.email });

    if (!user) {
        return next(new errorHandler('user not found', 404));
    }

    /* this call will update the user's verification token and verification token expiry */
    user.getVerficationtoken();

    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: "Token has been updated try verifying email again." });
})


exports.logout = (asyncHandler(async (req, res) => {

    /* To destroy the session on the backend side */
    req.session.destroy((err) => {
        if (err) throw err;
    })


    /* To set the token cookie to none at the browser */

    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })

    res.status(200).send({ status: "success", data: {} })
}));


// User Activites 
// Follow a User
exports.followUser = (asyncHandler(async (req, res, next) => {
    const userToFollow = await User.findById(req.params.userId);

    if (!userToFollow) {
        return next(new errorHandler('User not found', 404));
    }

    /* checking if whether our user already follows the userToFollow */
    let followedByUser = req.user.following.some((userid) => userid.equals(req.params.userId));

    if (followedByUser) {
        return next(new errorHandler('Already Following', 300));
    }

    /* check whether any such notification already exists or not */

    const followRequest = await Notification.findOne({ requestFrom: req.user._id, requestTo: req.params.userId, status: 'pending' });

    if (followRequest) {
        return next(new errorHandler('Request already sent.', 300));
    }

    /* create a notification for the userToFollow otherwise */
    const response = await Notification.create({
        requestFrom: req.user._id,
        requestTo: req.params.userId,
    })

    /* sending an email to the userToFollow */
    // const message = `${req.user.name} wants to follow you. Please check your notifications.`;

    // try {
    //     await SendEmail({
    //         email: userToFollow.email,
    //         subject: 'New Follower',
    //         message
    //     })
    // } catch (err) {
    //     console.log(err);
    //     return next(new errorHandler('Email could not be sent', 500));
    // }

    res.status(200).send({ status: "success", data: response })
}));


// Unfollow a User
exports.unfollowUser = (asyncHandler(async (req, res) => {

    const userId = req.params.userId;

    const userToFollow = await User.findById(userId).select('followers');
    const myself = await User.findById(req.user._id).select('following');

    // check if user exists
    if (!userToFollow) {
        return next(new errorHandler('User not found', 404));
    }

    let followedByUser = myself.following.some((userid) => userid.equals(userId));

    if (followedByUser) {
        myself.following.remove(userId);
        await myself.save();
    }

    /* checking if user is already present in the followers list of usertoFollow */
    followedByUser = userToFollow.followers.some((userid) => userid.equals(req.user._id));

    if (followedByUser) {
        userToFollow.followers.remove(req.user._id);
        await userToFollow.save();
    }

    res.status(200).send({ status: "success", data: { myself, userToFollow } })

}));

/* edit the user profile routes (name, email) specifically*/
exports.updateUserInfo = asyncHandler(async (req, res, next) => {
    let { name, email } = req.body;

    if (!name && !newpassword && !email) {
        return next(new errorHandler('Please provide some data to update', 400));
    }

    /* only change if values don't match */
    if (req.user.name !== name) {
        req.user.name = name || req.user.name;
    }

    if (req.user.email !== email) {
        req.user.email = email || req.user.email;
        req.user.unVerfiedEmail = email || req.user.unVerfiedEmail;
        req.user.isVerified = false;

        /* Creating a url for verifying user email */
        const VerificationToken = req.user.getVerficationtoken();

        await req.user.save({ validateBeforeSave: false });

        const verificationUrl = `${process.env.SERVER_URL}/api/v1/user/verify/${VerificationToken}`;

        const message = `Please verify your email by clicking on the link below: \n\n ${verificationUrl}`;

        // Sending the url to user email

        try {
            await SendEmail({
                email: req.user.unVerfiedEmail,
                subject: "Email Verification",
                message
            })
            await req.user.save({ validateBeforeSave: false });

            return res.status(200).json({ success: true, data: `Email Sent with URL : ${verificationUrl}` });
        } catch (error) {
            console.log(error);
            req.user.verificationToken = undefined;
            req.user.verificationTokenExpire = undefined;
            // user will still be saved but with unverified Email.
            await req.user.save({ validateBeforeSave: false });
            return next(new errorHandler('Email could not be sent User Info Saved Securely', 500));
        }
    }

    await req.user.save();

    res.status(200).json({ success: true, data: req.user });
})


/* update profile pic */
exports.updateProfilePic = asyncHandler(async (req, res, next) => {
    let file = req.files;
    console.log(file);

    // if file exists
    file = file[0];

    if (!file.mimetype.startsWith('image')) {
        next(new errorHandler(`Please upload an image file`, 401));
    }

    try {
        /* first destroy the previous profile pic */
        const deleteResponse = await cloudinary.uploader.destroy(req.user.profilePic.public_id);

        console.log({ deleteResponse });

        const filedata = getDataUri(file);

        result = await cloudinary.uploader.upload(filedata.content, {
            folder: 'profilePic'
        })

        req.user.profilePic = { public_id: result.public_id, url: result.secure_url }

        await req.user.save();
        res.status(200).json({ success: true, data: req.user });

    } catch (err) {
        console.log('cloudinary error : ', err);
    }
})