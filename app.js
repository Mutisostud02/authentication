const express = require('express')
require('dotenv').config('')

const path = require('path')
// const passport = require('passport')

const app = express()
const port = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended : false}))

app.get('/', (req, res) => {
    res.render('index')
})

app.listen(port, (error) => {
    if(error) {
        throw error
    }
    console.log(`Server running at Port ${port}`)
})