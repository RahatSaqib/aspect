let async = require('async')
let crypto = require('crypto')
let express = require('express')
let moment = require('moment')
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

    if (!req.body.clientId) {
      res.status(400).json({ message: 'No client ID provided' })
      return
    }

    if (!req.body.clientName) {
      res.status(400).json({ message: 'No client name provided' })
      return
    }

    // find the user in the db
    db.findOne('user', '*', { name: req.body.name }, function(response) {

      if (response.result !== 'success') {
        res.status(500).json({ message: 'Server error' })
        return
      }

      let user = response.data

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

        db.update('user', [{
          failed_password_attempts: user.failed_password_attempts + 1,
          locked_out: lock
          }, { id: user.id }],
          () => {
            res.status(401).json({ message: 'Authentication failed. Wrong password.' })
          })
      } else {

        // upsert refresh token
        let refresh_token = crypto.randomBytes(48).toString('base64')
        let expires = moment().utc().add(7, 'days').format('YYYY-MM-DD HH:mm:ss')

        // some of these db calls can happen in parallel...
        async.parallel([
          function(callback) {
            db.query('INSERT INTO refresh_token set ? ON DUPLICATE KEY UPDATE ?', [{
              user_id: user.id,
              client_id: req.body.clientId,
              client_name: req.body.clientName,
              token: refresh_token,
              expires: expires
            }, {
              token: refresh_token,
              expires: expires
            }], callback)
          },
          function(callback) {
            db.update('user', [{ failed_password_attempts: 0 }, { id: user.id }], callback)
          }],
          function(r) {

            // this happens after the db calls above are complete
            if (r.result !== 'success') {
              res.status(500).json({ message: 'Server error' })
              return
            }

            db.query('select r.name from role r inner join user_role ur on r.id = ur.role_id where ?', { user_id: user.id }, (result) => {
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

              // return the information including token as JSON
              res.json({
                access: token,
                refresh: refresh_token
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
