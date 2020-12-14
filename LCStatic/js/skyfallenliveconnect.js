const LCSocket = io('/')
const videoGrid = document.getElementById('video-grid')
const connectedPeers = {}
var isMuted = false


const LCPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
})

const userVideo = createVideoElement()
userVideo.muted = true

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(userVideo,stream)

    LCPeer.on('call', call => {
        connectedPeers[call.peer] = call
        call.answer(stream)
        const video = createVideoElement()
        call.on('stream', userVideoStream => {
            addVideoStream(video,userVideoStream)
        })
        call.on('close', () => {
            video[0].remove()
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

function addVideoStream(vidObj, stream){
    const video = vidObj[0]
    video.srcObject = stream
    video.className = "user-video"
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(vidObj[1])
}

function connectToNewUser(userID, stream){
    const call = LCPeer.call(userID,stream)
    const video = createVideoElement()
    call.on('stream', userVideoStream => {
        addVideoStream(video,userVideoStream)
    })
    call.on('close', () => {
        video[0].remove()
    })
    connectedPeers[userID] = call
}

function createVideoElement()
{
    const video = document.createElement('video')
    const videodiv = document.createElement('div')
    videodiv.className = "user-div"
    video.className = "user-video"
    videodiv.append(video)
    return [video, videodiv]
}

function mute_toggle(){
    mute_icon = document.getElementById("microphone-icon")
    mute_toggle_button = document.getElementById("mute-btn")
    if(isMuted){
        isMuted = false
        mute_icon.className = "fa fa-microphone icon-togglebtnsize"
        mute_toggle_button.className = "mute-btn enabled-bg"
    } else {
        isMuted = true
        mute_icon.className = "fa fa-microphone-slash icon-togglebtnsize"
        mute_toggle_button.className = "mute-btn disabled-bg"
    }
}