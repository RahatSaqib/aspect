let express = require('express')
let bodyParser = require('body-parser')
let morgan = require('morgan')

let authRoutes = require('./routes/auth')
let config = require('./config')
let db = require('./db')

let app = express()

let crypto = require('crypto')


// =======================
// configuration =========
// =======================
let port = process.env.PORT || 8080

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// use morgan to log requests to the console
app.use(morgan('dev'))

// =======================
// routes ================
// =======================
// basic route
app.get('/', function (req, res) {
  res.send('Hello! The API ist at http://localhost:' + port + '/api')
})

// apply the routes to our application with the prefix /api
app.use('/api/auth', authRoutes(config.secret, db))

// app.get('/', function(req, res) {

//   db.update('person', [{name: 'Klaus Baumgartner'}, {id: 94}], function(result){
//     res.send(result)
//   })

// })


// =======================
// start the server ======
// =======================
app.listen(port)
console.log('Magic happens at http://localhost:' + port)
