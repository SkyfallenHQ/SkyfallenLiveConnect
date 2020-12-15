const LCSocket = io('/')
const videoGrid = document.getElementById('video-grid')
const connectedPeers = {}
const screenSharePeers = {}
var isMuted = false
var isCameraOn = true
var userOutgoingStream
let ScreenShareCall
var isSharingScreen = false

const LCVideoPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
})

const LCScreenSharePeer = new Peer(undefined, {
    host: '/',
    port: '3001'
})

const userVideo = createVideoElement()
userVideo[0].muted = true

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(userVideo,stream)
    userOutgoingStream = stream
    LCVideoPeer.on('call', call => {
        connectedPeers[call.peer] = call
        call.answer(stream)
        const video = createVideoElement()
        call.on('stream', userVideoStream => {
            addVideoStream(video,userVideoStream)
        })
        call.on('close', () => {
            video[1].remove()
        })
    })
    LCSocket.on('user-connected', userID => {
        connectToNewUser(userID, stream)
    })

})

LCSocket.on('user-disconnected',userID => {
    if(connectedPeers[userID]) connectedPeers[userID].close()
})

LCVideoPeer.on('open', PeerUserID => {
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
    const call = LCVideoPeer.call(userID,stream)
    const video = createVideoElement()
    call.on('stream', userVideoStream => {
        addVideoStream(video,userVideoStream)
    })
    call.on('close', () => {
        video[1].remove()
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
        userOutgoingStream.getAudioTracks()[0].enabled = true
    } else {
        isMuted = true
        mute_icon.className = "fa fa-microphone-slash icon-togglebtnsize"
        mute_toggle_button.className = "mute-btn disabled-bg"
        userOutgoingStream.getAudioTracks()[0].enabled = false
    }
}

function camera_toggle(){
    mute_icon = document.getElementById("camera-icon")
    mute_toggle_button = document.getElementById("camera-btn")
    if(isCameraOn == false){
        isCameraOn = true
        mute_icon.className = "fa fa-video icon-togglebtnsize"
        mute_toggle_button.className = "camera-btn enabled-bg"
        userOutgoingStream.getVideoTracks()[0].enabled = true
    } else {
        isCameraOn = false
        mute_icon.className = "fa fa-video-slash icon-togglebtnsize"
        mute_toggle_button.className = "camera-btn disabled-bg"
        userOutgoingStream.getVideoTracks()[0].enabled = false
    }
}

function share_screen(){
    if(isSharingScreen == false) {
        navigator.mediaDevices.getDisplayMedia({
            video: {cursor: "always"},
            audio: {enabled: false}
        }).then(desktopStream => {
            isSharingScreen = true
            const desktopVideo = createVideoElement()
            addVideoStream(desktopVideo, desktopStream)
            desktopStream.getVideoTracks()[0].onended = () => {
                desktopVideo[1].remove()
                LCSocket.emit('share-disconnected',LCScreenSharePeer.id)
                isSharingScreen = false
                for (var each in screenSharePeers) { if (screenSharePeers.hasOwnProperty(each)) { delete screenSharePeers[each]; } }
            }
            LCSocket.on('user-connected', userID => {
                ScreenShareCall = LCScreenSharePeer.call(userID, desktopStream)
                LCSocket.emit('command','treatScreenShare',LCScreenSharePeer.id)
            })
            LCSocket.emit('command','treatScreenShare',LCScreenSharePeer.id)
            for (const [userID,call] of Object.entries(connectedPeers)) {
                screenSharePeers[userID] = LCScreenSharePeer.call(userID,desktopStream)
            }
            LCScreenSharePeer.on('call', call => {
                connectedPeers[call.peer] = call
                call.answer(desktopStream)
            })
        })
    }
}