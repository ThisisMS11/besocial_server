const Messages = require('../models/Message');
const User = require('../models/User');

const userSocketMap = new Map();
const chatSocket = (io) => {

    io.on('connection', (socket) => {
        const { userId } = socket.handshake.query;
        console.log('userId of the connected user : ', userId);

        /* keying up the userId with the corresponding socket.id */
        userSocketMap.set(userId, socket.id);


        /* send-message event will get us the  receiver id and message */
        socket.on('send-message', async (data) => {
            const { message, receiver } = data;

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

            // Emit the message to the target user's socket
            if (targetSocketId) {
                io.to(targetSocketId).emit('receive-message', mess);
            }
        });
    });
}

module.exports = chatSocket;
