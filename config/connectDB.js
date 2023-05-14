const mongoose = require('mongoose')

const connectDB = async () => {
    const conn = await mongoose.connect(process.env.MONGO_URI_CLOUD);
    console.log(`MongoDB connected`);
}

module.exports = connectDB;