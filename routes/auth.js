let express = require('express')
let jwt = require('jsonwebtoken')

let jwtmiddleware = require('./jwtmiddleware')

module.exports = function(config, db) {

  let routes = express.Router()

  // route to authenticate a user
  routes.post('/', function(req, res) {

    if (!req.body.name) {
      res.status(400).json({ message: 'No user name provided' })
      return
    }

    if (!req.body.password) {
      res.status(400).json({ message: 'No password provided' })
      return
    }

    // find the user in the db
    db.findOne('user', '*', { name: req.body.name }, function(result) {

      let user = result.data

      if (!user) {
        res.status(401).json({ message: 'User not found.' })
        return
      }

      if (user.locked_out === 1) {
        res.status(401).json({ message: 'Your account is locked.' })
        return
      }

      // TODO: check if password matches
      if (req.body.password !== 'test07') {

        let lock = user.failed_password_attempts >= config.passwordAttempts ? 1 : 0

        db.update(  'user',
                    [{failed_password_attempts: user.failed_password_attempts + 1,
                      locked_out: lock }, { id: user.id }],
          () => {
            res.status(401).json({ message: 'Authentication failed. Wrong password.' })
          })
      } else {

        db.update('user', [{ failed_password_attempts: 0 }, { id: user.id }], () => {

          db.query( 'select r.name from role r inner join user_role ur on r.id = ur.role_id where ?',
                    { user_id: user.id }, (result) => {
                      // if user is found and password is right create a token
                      let token = jwt.sign({
                        name: user.name,
                        modules: ['inv', 'mai'],
                        roles: result.data.map((a) => {
                          return a.name
                        })
                      },
                      config.secret, {
                        expiresIn: '1 hour',
                        issuer: 'https://www.aspect.id'
                      })

                      // TODO: Add refresh token

                      // return the information including token as JSON
                      res.json({
                        token: token
                      })
                    })
        })
      }
    })
  })

  // all routes after this will require a token
  routes.use((req, res, next) => jwtmiddleware(req, res, next, config.secret))

  // route to test that token works
  routes.get('/', function(req, res) {
    res.json({ message: 'Welcome to the API!' })
  })

  return routes
}
