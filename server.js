const express = require('express')
const dotenv = require('dotenv')
const app = express();
const session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);
const cors = require('cors');
const cookieParser = require('cookie-parser')
const connectDB = require('./config/connectDB')
dotenv.config({ path: './config/config.env' })

const PORT = process.env.PORT || 8000

/* importing routes here */
const user = require('./routes/user');
const post = require('./routes/post');
const notification = require('./routes/notification');
const message = require('./routes/message')

const chatSocket = require('./sockets/chatSocket');
const videoSocket = require('./sockets/videoSocket');

// const Messages = require('./models/Message');
// const User = require('./models/User');

app.use(express.json());
app.use(cookieParser());
app.use(cors());

const { Server } = require('socket.io');
const server = require('http').createServer(app);


connectDB();

/* Setting up MongoDB store to store the session */
const store = new MongoDBSession({
    uri: process.env.MONGO_URI,
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


const io = new Server(server, {
    cors: {
        /*  this is the origin from where requests will be made to our socket io server from client. */
        origin: "*",
        methods: ["GET", "POST"]
    }
});

chatSocket(io);
videoSocket(io);


server.listen(PORT, () => {
    console.log("Server listening ... at port : ", PORT);
})