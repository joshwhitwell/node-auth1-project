const express = require('express')

const server = express()

server.use(express.json())

server.get('/', (req, res) => {
    res.json({ API: 'UP' })
})

module.exports = server