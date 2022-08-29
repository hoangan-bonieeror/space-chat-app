const chatForm = document.getElementById('chat-form')
const chatMessage = document.querySelector('.chat-messages')
const listUser = document.querySelector('#users')
const roomeName = document.getElementById('room-name')
const iconBtn = document.getElementById("icon-btn")
const notificationSoundElement = document.getElementById('notification-sound')
const leaveLink = document.getElementById('leave-link')
const listImgBackgroundOption = document.querySelectorAll('img.background-option')
const bellNotification = document.querySelector('.muted')


let notifyMode = window.localStorage.getItem('mode') == 'true';


// Handle responsive height for mobile ui
window.addEventListener('resize', () => {
    // We execute the same script as before
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});

leaveLink.addEventListener('click', e => {
    e.preventDefault()
    document.cookie = [...document.cookie.split(';').filter(cookie => !cookie.includes('room_id'))].join(';')
    window.location = leaveLink.href
})

listImgBackgroundOption.forEach(img => {
    img.addEventListener('click', e => {
        changeBackground(img.src)
    })
})

if(bellNotification) {
    bellNotification.addEventListener('mouseover', _ => {
        notifyMode
        ? bellNotification.children[0].classList.add('fa-bell-slash')
        : bellNotification.children[0].classList.remove('fa-bell-slash')
    })
    
    bellNotification.addEventListener('mouseout', _ => {
        notifyMode
        ? bellNotification.children[0].classList.remove('fa-bell-slash')
        : bellNotification.children[0].classList.add('fa-bell-slash')
    })
    
    bellNotification.addEventListener('click' , _ => {
        notifyMode
        ? bellNotification.children[0].classList.add('fa-bell-slash')
        : bellNotification.children[0].classList.remove('fa-bell-slash')
        changeNotifyMode();
        notifyMode = !notifyMode
    })
}

let { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

window.onload = e => {
    e.preventDefault()
    let listCookie = document.cookie
    console.log(listCookie)
    if (room == '' && listCookie.includes('room_id')) {
        listCookie = document.cookie.split(';')

        let roomIdOnCookie = listCookie.find(cookie => {
            return cookie.includes('room_id')
        })

        let [name, value] = roomIdOnCookie.split('=')
        room = value
    }

    // Set Default background
    document.querySelector('canvas').style.background = window.localStorage.getItem('url_background') 
    ? `url(${window.localStorage.getItem('url_background')})`
    : `url(${listImgBackgroundOption[0].src})`

    !notifyMode && bellNotification.children[0].classList.add('fa-bell-slash')

    const socket = io();
    // Join chat room
    socket.emit('joinRoom', { username, room })

    socket.on('message', message => {
        console.log(message)
        outputMessage(message, notifyMode)

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

    socket.on('set-room-id', (roomId) => {
        document.cookie = `room_id=${roomId}`
    })

    chatForm.addEventListener('submit', e => {
        e.preventDefault()

        const msg = e.target.elements.msg.value;

        // Emit message to server
        socket.emit('message', msg);
        e.target.elements.msg.value = '';
        e.target.elements.msg.focus();
    })

    let nthClick = 1
    iconBtn.addEventListener('click', e => {
        console.log(nthClick)
        if (nthClick == 1) {
            document.getElementById('emoji-content').style.display = 'grid'
            nthClick++
        } else {
            document.getElementById('emoji-content').style.display = 'none'
            nthClick--
        }

    })

    socket.on('loadEmoji', emoticon => {
        emoticon.forEach(emoji => {
            let spanElement = document.createElement('span')
            spanElement.textContent = emoji.emoji

            spanElement.onclick = (e) => {
                let [start, end] = getInputSelection(document.getElementById('msg'))
                let firstPart = document.getElementById('msg').value.slice(0, start)
                let finalPart = document.getElementById('msg').value.slice(end)

                document.getElementById('msg').value = [firstPart, emoji.emoji, finalPart].join('')
                document.getElementById('msg').focus()
            }

            document.getElementById('emoji-content').appendChild(spanElement)
        })
    })

    forceRedirectToHttps()

    roomeName.addEventListener('click', e => {
        navigator.clipboard.writeText(roomeName.textContent)
        document.querySelector('.notify').classList.add('active')

        setTimeout(() => {
            document.querySelector('.notify').classList.remove('active')
        }, 2000)
    })

    const toggleSideBar = document.querySelector('.toggle-sidebar')
    const sideBar = document.querySelector('.chat-sidebar')
    if (toggleSideBar) {
        let toggleSideClick = 1
        toggleSideBar.onclick = (e) => {
            let screenWidth = window.innerWidth
            if (toggleSideClick == 1) {
                let percentSideBar = 0
                if (screenWidth < 700) {
                    percentSideBar = 50
                } else {
                    percentSideBar = 70
                }
                sideBar.classList.add('show')
                toggleSideBar.style.left = `calc(100vw - ${percentSideBar}%)`
                toggleSideBar.children[0].style.transform = 'rotate(180deg)'
                toggleSideClick++
            } else {
                sideBar.classList.remove('show')
                toggleSideBar.style.left = '0'
                toggleSideBar.children[0].style.transform = 'unset'
                toggleSideClick--
            }
        }
    }
}

function changeNotifyMode() {
    console.log(notifyMode)
    window.localStorage.setItem('mode', !(notifyMode))
}

function changeBackground(url) {
    if(window.localStorage.getItem('url_background') !== url) {
        window.localStorage.setItem('url_background', url) 
        document.querySelector('canvas').style.background = `url(${url})`
    } else {
        alert('This is set by default')
    }
}

function outputMessage(obj, mode) {
    const div = document.createElement('div')
    div.classList.add('line-message')
    div.innerHTML = `
        <div class="message">
        <p class="meta">${obj.username} <span>${obj.time}</span></p>
        <p class="text">
            ${obj.text}
        </p>`

    if (obj.username === 'You' || obj.username === 'ChatBot') {
        div.classList.add('right')
    }

    if(obj.username !== 'You') {
        if(mode) {
            notificationSoundElement.play()
        }
    }

    document.querySelector('.chat-messages').appendChild(div)
    div.focus()
}

function getInputSelection(el) {
    var start = 0, end = 0, normalizedValue, range, textInputRange, len, endRange;

    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
        start = el.selectionStart;
        end = el.selectionEnd;
    } else {
        range = document.selection.createRange();

        if (range && range.parentElement() == el) {
            len = el.value.length;
            normalizedValue = el.value.replace(/\r\n/g, "\n");

            // Create a working TextRange that lives only in the input
            textInputRange = el.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());

            // Check if the start and end of the selection are at the very end
            // of the input, since moveStart/moveEnd doesn't return what we want
            // in those cases
            endRange = el.createTextRange();
            endRange.collapse(false);

            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                start = end = len;
            } else {
                start = -textInputRange.moveStart("character", -len);
                start += normalizedValue.slice(0, start).split("\n").length - 1;

                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                    end = len;
                } else {
                    end = -textInputRange.moveEnd("character", -len);
                    end += normalizedValue.slice(0, end).split("\n").length - 1;
                }
            }
        }
    }

    return [start, end]
}

function forceRedirectToHttps() {
    if (window.location.protocol == 'http:' && window.location.hostname !== 'localhost') {
        window.location.href =
            window.location.href.replace(
                'http:', 'https:');
    }
}