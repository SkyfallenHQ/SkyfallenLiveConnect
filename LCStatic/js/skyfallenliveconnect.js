const LCSocket = io('/')
const videoGrid = document.getElementById('video-grid')
const connectedPeers = {}
const LCPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
})

const userVideo = document.createElement('video')
userVideo.muted = true

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(userVideo,stream)

    LCPeer.on('call', call => {
        connectedPeers[call.peer] = call
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video,userVideoStream)
        })
        call.on('close', () => {
            video.remove()
        })
    })

    LCSocket.on('user-connected', userID => {
        connectToNewUser(userID, stream)
    })

})

LCSocket.on('user-disconnected',userID => {
    if(connectedPeers[userID]) connectedPeers[userID].close() 
})

LCPeer.on('open', PeerUserID => {
    LCSocket.emit('join-room', CURRENT_ROOM_ID, PeerUserID)
})

function addVideoStream(video, stream){
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}

function connectToNewUser(userID, stream){
    const call = LCPeer.call(userID,stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
        addVideoStream(video,userVideoStream)
    })
    call.on('close', () => {
        video.remove()
    })
    connectedPeers[userID] = call
}