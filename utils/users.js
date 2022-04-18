let users = [];

export function userJoin(id, username, room) {
    const user = { id, username, room }

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