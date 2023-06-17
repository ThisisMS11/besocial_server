const express = require('express')
const dotenv = require('dotenv')
const app = express();
const PORT = 1983 || process.env.PORT
const session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);
const cors = require('cors');
const cookieParser = require('cookie-parser')
const connectDB = require('./config/connectDB')
dotenv.config({ path: './config/config.env' })

/* importing routes here */
const user = require('./routes/user');
const post = require('./routes/post');
const notification = require('./routes/notification');
const message= require('./routes/message')

app.use(express.json());
app.use(cookieParser());
app.use(cors());

connectDB();


/* Setting up MongoDB store to store the session */
const store = new MongoDBSession({
    uri: process.env.MONGO_URI_CLOUD,
    collection: 'sessions'
})

/* Setting up our app to use express-session */
app.use(
    session({
        secret: "kachoriSamosa",
        resave: false,
        saveUninitialized: false,
        store: store
    })
)

/* defining routes here */
app.get('/', (req, res) => {
    res.send("Hello World");
});


app.use('/api/v1/user', user);
app.use('/api/v1/post', post);
app.use('/api/v1/notification', notification);
app.use('/api/v1/message', message);

app.listen(process.env.PORT, () => {
    console.log("Server listening ... at port : ", process.env.PORT);
})