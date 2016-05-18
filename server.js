let express = require('express')
let cors = require('cors')
let bodyParser = require('body-parser')
let morgan = require('morgan')
let rateLimit = require('express-rate-limit')

let config = require('./config')
let db = require('./db')

let authRoutes = require('./routes/auth')
let deviceRoutes = require('./routes/device')


let app = express()

 // need this for express-rate-limit to work on AWS ELB
app.enable('trust proxy')

// rate limiter for api calls
// allow 100 calls per minute
let throttleApiMessage = 'Too many requests from this IP. Please try again in 5 minutes.'
let apiLimiter = new rateLimit({
  windowMs: 5*60*1000,
  max: 100,
  delayMs: 0,
  message: throttleApiMessage,
  handler: function (req, res) {
    res.format({
      json: function(){
        res.status(429).json({ message: throttleApiMessage })
      }
    })
  }
})

// limiter for auth related actions
// allows 10 calls within 15 minutes, then starts slowing down response
// by 3 second increments. completely blocks after 15 attempts
let throttleAuthMessage = 'Too many login attempts from this IP. Please try again in 15 minutes.'
let authLimiter = new rateLimit({
  windowMs: 15*60*1000,
  delayAfter: 10,
  delayMs: 3*1000,
  max: 20,
  message: throttleAuthMessage,
  handler: function (req, res) {
    res.format({
      json: function(){
        res.status(429).json({ message: throttleAuthMessage })
      }
    })
  },
  keyGenerator: function(req ,res){

    // disable for localhost so we can run our unit tests...
    if (req.ip.indexOf('127.0.0.1') !== -1){
      return Math.random()
    }

    return req.ip
  }
})

// =======================
// configuration =========
// =======================
let port = process.env.PORT || 8080

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// enable cross origin requests
app.use(cors())

// use morgan to log requests to the console
app.use(morgan('dev'))

// =======================
// routes ================
// =======================
// basic route
app.get('/', apiLimiter, function (req, res) {
  res.send('Hello! The API is at /api.')
})

// auth routes (get access token, refresh...)
app.use('/api/auth', authLimiter, authRoutes(config, db))

// device routes
app.use('/api/device', apiLimiter, deviceRoutes(config, db))

// =======================
// start the server ======
// =======================
app.listen(port)
console.log('Magic happens at http://localhost:' + port)
