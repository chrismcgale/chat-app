const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { genMessage, genLocationMessages } = require('./utils/message')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 5000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', genMessage('Welcome', "Admin"))
        socket.broadcast.to(user.room).emit('message', genMessage(`${user.username} has joined!`, "Admin"))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser( socket.id )
        if (user) {
            const filter = new Filter()

            if(filter.isProfane(message)) {
                return callback("Profanity is not allowed")
            }

            io.to(user.room).emit('message', genMessage(message, user.username))
            callback()
        } 
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser( socket.id )
        if (user) {
            const message = `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
            io.to(user.room).emit('locationMessage', genLocationMessages(message, user.username))
            callback()
        }
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', genMessage(`${user.username} has left!`, "Admin"))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }    
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})