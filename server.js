const express = require("express")
const path = require('path')
const http = require('http')
const {formatMessage} = require('./utils/message')
const { userJoin, getCurrentUser, removeUser, logUsers } = require('./utils/users')
const { nanoid } = require('nanoid')

const app = express()
const server = http.createServer(app)

const io = require('socket.io')(server)

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
        
        // logUsers()
    })

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