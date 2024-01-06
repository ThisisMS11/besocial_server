const videoRoomSocketMap = new Map();

const videoSocket = (io) => {

    io.on('connection', (socket) => {
        socket.on("video-call-setup", (data) => {

            console.log("VIDEO CALL HAS STARTED  : ", data);
            // peerId and id 
            const { peerId, id } = data;
            videoRoomSocketMap.set(id, peerId);
        })

        socket.on('give-peer-id', (user) => {
            console.log("ok so the id whose peer is asked is : ", user);
            const targetPeerId = videoRoomSocketMap.get(user);

            if (!targetPeerId) {
                socket.emit('receive-peer-id', "Peer Not Found");
            } else {
                socket.emit('receive-peer-id', targetPeerId);
            }
        })

        socket.on('remove-peer-id', (data) => {
            console.log({data});
            console.log("I have to delete the for : ", data.userId);
            videoRoomSocketMap.delete(data.userId);
        })
    })
}

module.exports = videoSocket;

