import express from 'express'
import path from 'path'
import http from 'http'
import {formatMessage} from './utils/message.js'
import { userJoin, getCurrentUser, removeUser } from './utils/users.js'
import { nanoid } from 'nanoid'
import {emoticon} from 'emoticon';

const app = express()
const server = http.createServer(app)

import { Server } from 'socket.io'
const io = new Server(server)

const __dirname = path.resolve(path.dirname(''));

app.use((req, _ , next) => {
    process.env.PROTOCOL = req.protocol
    process.env.HOSTNAME = req.hostname
    next()
})

app.use(express.static(path.join(__dirname, 'public')))

io.on('connection', socket => {
    socket.on('joinRoom', async ({username, room}) => {
        if(room.length == 0) {
            room = nanoid(10)
        }
        const user = userJoin(socket.id, username, room) // Append the user to local array variable that stored the user and user's room
        console.log(`${user.username} has been just connected to the WebSocket with id : ${socket.id}`)
        socket.join(user.room); // Let user join to the room with room name from room variable
    
        socket.emit('message', formatMessage('ChatBot', 'Welcome to SpaceChat!')) // Welcome the user to the chat app

        socket.broadcast
            .to(user.room) // to room
            .emit('message', formatMessage('ChatBot', `${user.username} has joined the chat`)) // Send a notification to the browser of participants
        
        
        let roomUsers = await io.in(user.room).fetchSockets()
        let usersInRoom = roomUsers.map(user => {
            let usernameOne = getCurrentUser(user.id)

            return usernameOne.username
        })

        socket.emit('loadUsers', usersInRoom) // Load all the user that attended the same room and send to client side

        // Send to all clients that attended the same room
        socket.broadcast
            .to(user.room)
            .emit('loadUsers', usersInRoom)

        // Load and send room name data to client
        socket.emit('loadRoomName', user.room)

        // Send to all clients that anttended the same room
        socket.broadcast
            .to(user.room)
            .emit('loadRoomName', user.room)
        
        socket.emit('set-room-id', room)
        // logUsers()

        socket.emit('loadEmoji', emoticon)
    })

    let listBackground = [
        `${process.env.PROTOCOL}://${process.env.HOSTNAME}:${process.env.PORT || 5000}/assets/d1aehdnbq0h21.jpg`,
        `${process.env.PROTOCOL}://${process.env.HOSTNAME}:${process.env.PORT || 5000}/assets/jameswebb-3333.png`
        
    ]
    socket.emit('loadBackground', listBackground)

    socket.on('message', msg => {
        const currentUser = getCurrentUser(socket.id) // Find the user by their socket id

        // Send msg to client
        socket.emit('message', formatMessage("You" , msg))
        // Send msg to all clients that have already joined the same room
        socket.broadcast
            .to(currentUser.room) // to room
            .emit('message', formatMessage(currentUser.username, msg)) // Send msg to the browser of participants
        // logUsers()
        
    })


    socket.on('disconnect', async ()=> {
        const currentUser = getCurrentUser(socket.id) // Find the user by their socket id
        if(currentUser) {
            let roomUsers = await io.in(currentUser.room).fetchSockets()
            let usersInRoom = roomUsers.map(user => {
                let usernameOne = getCurrentUser(user.id)
    
                return usernameOne.username
            })
            
            socket.emit('loadUsers', usersInRoom)

            socket.broadcast
                .to(currentUser.room)
                .emit('loadUsers', usersInRoom)

            socket.broadcast
                .to(currentUser.room) // to room
                .emit('message', formatMessage('ChatBot', `${currentUser.username} has left the chat`)) // Send a notification to the browser of participants

            let successRemove = removeUser(socket.id)
            if(successRemove) {
                socket.leave(currentUser.room)
            }
        }
        // logUsers()
    })

    // Listen for chatMessage
    socket.on('chatMessage', (msg)=> {
        console.log(msg)
    })
})

server.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`))