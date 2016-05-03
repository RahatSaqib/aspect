let express = require('express')
let jwt = require('jsonwebtoken')

let jwtmiddleware = require('./jwtmiddleware')

module.exports = function(secret, db) {

  let routes = express.Router()

  // route to authenticate a user
  routes.post('/', function(req, res) {

    if (!req.body.name) {
      res.status(400).json({ message: 'No user name provided' })
    }

    if (!req.body.password) {
      res.status(400).json({ message: 'No password provided' })
    }

    // find the user in the db
    db.findOne('user', ['id', 'name', 'password', 'password_key'], { name: req.body.name }, function(result) {

      let user = result.data

      if (!user) {
        res.status(401).json({ message: 'Authentication failed. User not found.' })
      } else if (user) {

        // TODO: check if password matches
        if (req.body.password !== 'test07') {
          res.status(401).json({ message: 'Authentication failed. Wrong password.' })
        } else {

          db.query('select r.name from role r inner join user_role ur on r.id = ur.role_id where ?', { user_id: user.id }, (result) => {
            // if user is found and password is right create a token
            let token = jwt.sign({  name: user.name,
                                    modules: ['inv', 'mai'],
                                    roles: result.data.map((a) => { return a.name }) },
                                    secret, {
                                      expiresIn: '1 hour',
                                      issuer: 'https://www.aspect.id'
                                    })

            // TODO: Add refresh token

            // return the information including token as JSON
            res.json({
              token: token
            })
          })
        }
      }
    })
  })

  // all routes after this will require a token
  routes.use((req, res, next) => jwtmiddleware(req, res, next, secret))

  // route to test that token works
  routes.get('/', function(req, res) {
    res.json({ message: 'Welcome to the coolest API on earth! Looks like you have a valid token!' })
  })

  return routes
}
