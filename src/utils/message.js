const genMessage = (text, username) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

const genLocationMessages = (url, username) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    genMessage,
    genLocationMessages
}