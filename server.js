const { SSL_OP_NO_TICKET } = require('constants')
const express = require('express')

const LCApp = express()
const LCServer = require('http').Server(LCApp)
const LCIOServer = require('socket.io')(LCServer)
const { v4: genUUID } = require('uuid')

LCApp.set('view engine', 'ejs')
LCApp.use(express.static('LCStatic'))

LCApp.get('/', (req,res) => {
    res.redirect(`/${genUUID()}`)
})

LCApp.get('/:room', (req,res) => {
    res.render('room', {roomID: req.params.room })
})

LCIOServer.on('connection', socket => {
    socket.on('join-room', (roomID, userID) => {
        socket.join(roomID)
        socket.to(roomID).broadcast.emit('user-connected', userID)
        socket.on('disconnect', () => {
            socket.to(roomID).broadcast.emit('user-disconnected', userID)
        })
        socket.on('share-disconnected', sharePeerID => {
            socket.to(roomID).broadcast.emit('user-disconnected',sharePeerID)
        })
        socket.on('command', (cmdname,args) => {
            socket.to(roomID).broadcast.emit(cmdname,args)
        })
    })
})

LCServer.listen(3000)