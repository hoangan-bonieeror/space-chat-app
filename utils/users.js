let users = [];

export function User(id,username,room) {
    this.id = id,
    this.username = username,
    this.room = room 
}

export function userJoin(id, username, room) {
    const user = new User(id, username, room)

    users.push(user);

    return user;
}

export function getCurrentUser(id) {
    return users.find(user => user.id === id)
}


export function removeUser(id) {
    try {
        users = users.filter(user => user.id !== id)
        return true;
    } catch (err) {
        return false;
    }
}