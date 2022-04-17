const chatForm = document.getElementById('chat-form')
const chatMessage = document.querySelector('.chat-messages')
const listUser = document.querySelector('#users')
const roomeName = document.getElementById('room-name')

const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix : true
})

const socket = io();

// Join chat room
socket.emit('joinRoom', { username, room })

socket.on('message' , message => {
    console.log(message)
    outputMessage(message)

    chatMessage.scrollTop = chatMessage.scrollHeight
})


socket.on('loadUsers', users => {
    listUser.innerHTML = ``
    users.forEach(value => {
        let user = document.createElement('li')
        user.textContent = value
        user.style.animationName = 'fadeUp'
        user.style.animationDuration = '.2s'
        listUser.appendChild(user)
    });
})

socket.on('loadRoomName', roomname => {
    roomeName.textContent = roomname
})

chatForm.addEventListener('submit', e => {
    e.preventDefault()

    const msg = e.target.elements.msg.value;

    // Emit message to server
    socket.emit('message', msg);
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
})


function outputMessage(obj) {
    const div = document.createElement('div')
    div.classList.add('message')
    div.innerHTML =`
        <p class="meta">${obj.username} <span>${obj.time}</span></p>
        <p class="text">
            ${obj.text}
        </p>`

    document.querySelector('.chat-messages').appendChild(div)
}