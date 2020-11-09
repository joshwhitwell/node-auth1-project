const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../database/db-config')
const session = require('express-session')
const sessionStore = require('connect-session-knex')(session)

const server = express()

server.use(express.json())

server.use(session({
    name: 'session',
    secret: 'secret',
    cookie: {
        maxAge: 1000 * 10,
        secure: false,
        httpOnly: true
    },
    resave: false,
    saveUninitialized: false,
    store: new sessionStore({
        knex: require('../database/db-config'),
        tablename: 'sessions',
        sidfieldname: 'sid',
        createTable: true,
        clearInterval: 1000 * 60 * 60
    })
}))

const Users = {
    find() {
        return db('users')
    },

    findBy(user_username) {
        return db('users').where({ user_username }).first()
    },

    findById(user_id) {
        return db('users').where({ user_id }).first()
    },

    async insert(user) {
        try {
            const [id] = await db('users').insert(user)
            return Users.findById(id)
        } catch (err) {
            throw err
        }
    }
}

function protected(req, res, next) {
    if (req.session && req.session.user) {
        next()
    } else {
        res.status(401).json({ message: 'Unauthorized' })
    }
}

server.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body
        const hash = bcrypt.hashSync(password, 10)
        const user = { user_username: username, user_password: hash }
        const newUser = await Users.insert(user)
        res.status(201).json(newUser)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

server.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body
    try {
        const user = await Users.findBy(username)
        if (user && bcrypt.compareSync(password, user.user_password)) {
            req.session.user = user
            res.status(200).json({ message: `Welcome ${user.user_username}` })
        } else {
            res.status(401).json({ message: 'Invalid credentials' })
        }
    } catch (err) {
        res.status(500).json({ message: err.message, stack: err.stack })
    }
})

server.get('/api/auth/logout', (req, res) => {
    if (req.session && req.session.user) {
        req.session.destroy(err => {
            if (err) {
                res.status(500).json({ message: 'Failure logging out' })
            } else {
                res.status(200).json({ message: 'Logged out' })
            }
        })
    } else {
        res.status(500).json({ message: 'Failure logging out' })
    }
})

server.get('/users', protected, async (req, res) => {
    try {
        const users = await Users.find()
        res.status(200).json(users)
    } catch (err) {
        res.status(500).json({ message: err.message, stack: err.stack })
    }
})

server.get('/', (req, res) => {
    res.json({ API: 'UP' })
})

module.exports = server