const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const errorHandler = require('../utils/ErrorResponse');

exports.login = asyncHandler(async (req, res,next) => {
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
    const matchpasswordResult = user.matchpassword(password);

    if (!matchpasswordResult) {
        return next(new errorHandler('Invalid Input', 404));
    }

    res.json({ success: true, token: user.getJwtToken() });

})

exports.register = asyncHandler(async (req, res,next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return next(new errorHandler('Please provide an email and password', 400));
    }

    let user = await User.findOne({ email: email });

    if (user) {
        return next(new errorHandler('User with the given email already exists', 400));
    }

    user = await User.create({ name: name, email: email, password: password });

    res.send({ success: true, message: "user successfully created" });

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
}))