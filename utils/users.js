let users = [];

const userJoin = (id, username, room) => {
    const user = { id, username, room }

    users.push(user);

    return user;
}

const getCurrentUser = (id) => {
    return users.find(user => user.id === id)
}


const removeUser = (id) => {
    try {
        users = users.filter(user => user.id !== id)
        return true;
    } catch (err) {
        return false;
    }
}


module.exports = {
    userJoin,
    getCurrentUser,
    removeUser,
    logUsers : () => {
        console.log(users)
    }
}