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

const Messages = require('./models/Message');
const User = require('./models/User');

app.use(express.json());
app.use(cookieParser());
app.use(cors());

const { Server } = require('socket.io');
const server = require('http').createServer(app);
// const END_POINT = process.env.END_POINT_LOCAL

// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", END_POINT);
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });

const io = new Server(server, {
    cors: {
        // ! this is the origin from where requests will be made to our socket io server from client.
        origin: "*",
        methods: ["GET", "POST"]
    }
});

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


//Socket io is based on events whenever any event happens we perform some  task
const userSocketMap = new Map();
io.on('connection', (socket) => {
    // Associate user ID with socket ID
    const { userId } = socket.handshake.query;
    console.log('userId of the connected user : ', userId);

    userSocketMap.set(userId, socket.id);


    /* send-message event will get us the  receiver id and message */
    socket.on('send-message', async (data) => {
        const { message, receiver } = data;

        console.log({ message, receiver });

        const user = await User.findById(receiver);

        /* if the receiver do not exist anymore for that */
        if (!user) {
            io.to(socket.id).emit('receive-message', { error: "User do not exist anymore" });
            return;
        }

        /* block stuff can come here */

        const mess = await Messages.create({
            message: message,
            sender: userId,
            receiver: receiver
        });

        mess.save();

        // Get the socket ID associated with the target user
        const targetSocketId = userSocketMap.get(receiver);

        console.log('targetSocketId : ', targetSocketId);

        // Emit the message to the target user's socket
        if (targetSocketId) {
            io.to(targetSocketId).emit('receive-message', mess);
        }
    });

});


server.listen(PORT, () => {
    console.log("Server listening ... at port : ", PORT);
})