const bcrypt = require('bcryptjs')
const express = require('express')
require('dotenv').config()

const path = require('path')

const passport = require('passport')
const session = require('express-session')
const { Pool }= require('pg')
const LocalStrategy = require('passport-local').Strategy

const app = express()
const port = process.env.PORT || 3000

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(session({secret: "cats", resave: false, saveUninitialized: false}))
app.use(passport.session())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({extended : false}))


passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            const user = rows[0]

            if (!user) {
                return done(null, false, { message: 'Incorrect username!' })
            }
            const match = await bcrypt.compare(password, user.password)
            if(!match) {
                console.log(password)
                console.log(user.password)
                return done(null, false, {message: 'Incorrect password!'})
            }
            return done(null, user)
         } catch(err) {
            return done(err)
         }
    })
)

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
        const user = rows[0]

        done(null, user)
    } catch(err) {
        done(err)
    }
})

app.get('/', (req, res) => {
    res.render('index', {user: req.user})
})
app.get('/sign-up', (req, res) => {
    res.render('sign-up-form', {link: ['/', '/log-in']})
})
app.post('/sign-up', async (req, res, next) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        await pool.query("INSERT INTO users(username, password) VALUES($1, $2)", [
            req.body.username,
            hashedPassword,
        ])
        res.redirect("/")
    } catch (err){
        console.error(err)
        next(err)
    }
})

app.get('/log-in', (req, res) => {
    res.render('log-in', {link: ['/sign-up', '/']})
})

app.post('/log-in', passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/"
}))

app.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.listen(port, (error) => {
    if(error) {
        throw error
    }
    console.log(`Server running at Port ${port}`)
})