let express = require('express')
let bodyParser = require('body-parser')
let morgan = require('morgan')
let rateLimit = require('express-rate-limit')

let authRoutes = require('./routes/auth')
let config = require('./config')
let db = require('./db')

let app = express()

 // need this for express-rate-limit to work on AWS ELB
app.enable('trust proxy')

// limiter for api calls
let apiLimiter = new rateLimit({
  windowMs: 5*60*1000, // 5 minutes
  max: 100,
  delayMs: 0 // disabled
})

// limiter for auth related actions
let authLimiter = new rateLimit({
  windowMs: 15*60*1000, // 15 minute window
  delayAfter: 5, // begin slowing down responses after the fifth request
  delayMs: 3*1000, // slow down subsequent responses by 3 seconds per request
  max: 8, // start blocking after 8 requests
  message: 'Too many login attempts from this IP. Please try again in 15 minutes.'
})

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
app.get('/', apiLimiter, function (req, res) {
  res.send('Hello! The API ist at http://localhost:' + port + '/api')
})

// apply the routes to our application with the prefix /api
app.use('/api/auth', authLimiter, authRoutes(config, db))

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
