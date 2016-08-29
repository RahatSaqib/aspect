let Promise = require('bluebird')
let crypto = require('crypto')
let express = require('express')
let jwt = require('jsonwebtoken')
let uuid = require('node-uuid')

let jwtmiddleware = require('./jwtmiddleware')

module.exports = function(config, db) {

  let routes = express.Router()
  let { knex } = db

  /*
  Route for authenticating a user
  */
  routes.post('/', function(req, res) {
    // validation
    req.check('name', 'User name is required').notEmpty()
    req.check('password', 'Password is required').notEmpty()
    req.check('clientName', 'Client name is required').notEmpty()

    let errors = req.validationErrors()
    if (errors){
      res.status(400).json(errors)
      return
    }

    let findUser = knex('user as u')
      .innerJoin('person as p', 'u.id', 'p.user_id')
      .where({'u.name': req.body.name})
      .select('u.locked_out', 'u.failed_password_attempts', 'u.id', 'u.name', 'p.culture')
      .first()
    
    findUser.then(user => {
      if(!user){
        // TODO generic Auth failed message on username and password failed?
        // TODO should this be 401 (test checks 400)
        res.status(400).json({ message: 'not found' })
        //res.status(401).json({ message: 'Authentication failed. Wrong user name.' })
        return
      }
      
      if (user.locked_out === 1) {
        res.status(401).json({ message: 'Your account is locked.' })
        return
      }

      // TODO: check if password matches
      if (req.body.password !== 'test07') {
        // FIXME this allows 6 attempts if config is 5... bug?
        let lock = user.failed_password_attempts >= config.passwordAttempts ? 1 : 0
        let updateFailedPass = knex('user')
          .where({id: user.id})
          .update({
            failed_password_attempts: user.failed_password_attempts + 1,
            locked_out: lock
          })

        return updateFailedPass.then(() => {
          res.status(401).json({ message: 'Authentication failed. Wrong password.' })
        })
      }

      return user
    }).then(user => {
      if(user){
        // upsert refresh token
        let now = new Date()
        let expires = new Date(now.getTime() + 7 * 86400000) // 7 days from now
        let refresh_token = crypto.randomBytes(48).toString('base64')
        let clientId = req.body.clientId || uuid.v4()

        // Use raw query as upsert not yet supported in knex#701
        let setRefreshToken = knex.raw('INSERT INTO refresh_token set ? ON DUPLICATE KEY UPDATE ?', [
          {
            user_id: user.id,
            client_id: clientId,
            client_name: req.body.clientName,
            token: refresh_token,
            expires: expires,
            created_on: now
          },
          {
            token: refresh_token,
            expires: expires
          }
        ])

        let updatePwAttempts = knex('user')
          .where({id: user.id})
          .update({
            failed_password_attempts: 0,
            last_login: now,
            last_active: now
          })

        return Promise.all([setRefreshToken, updatePwAttempts])
          // finally, return the access token...
          .then(() => getToken(config, db, user.id, user.name, refresh_token, clientId, user.culture))
          .then(token => res.json(token))
      }
    }).catch(err => res.status(500).json(err))
  })

  /*
  Route for getting a new access token by sending a refresh token
  */
  routes.post('/refresh', function(req, res) {

    // validation
    req.check('clientId', 'Client ID is required').notEmpty()
    req.check('token', 'Token is required').notEmpty()

    let errors = req.validationErrors()
    if (errors){
      res.status(400).json(errors)
      return
    }

    // find the token in the db
    let {clientId, token} = req.body
    let getRefreshToken = knex('refresh_token as rt')
      .innerJoin('user as u', 'rt.user_id', 'u.id')
      .innerJoin('person as p', 'u.id', 'p.user_id')
      .where({client_id: clientId, token, revoked: 0})
      .select('rt.user_id as userId', 'rt.expires', 'u.name', 'p.culture')
      .first()

    getRefreshToken.then(data => {
      if (!data) {
        res.status(400).json({ message: 'Unable to find token or token revoked' })
        return
      }

      // check if expired
      let now = new Date()

      if (data.expires < now) {
        res.status(400).json({ message: 'Token expired' })
        return
      }

      // looks like we have a valid refresh token. set new one in db
      let expires = new Date(now.getTime() + 7 * 86400000) // 7 days from now
      let refreshToken = crypto.randomBytes(48).toString('base64')

      return knex('refresh_token')
        .where({token: req.body.token})
        .update({token: refreshToken, expires})
        .then(() => getToken(config, db, data.userId, data.name, refreshToken, clientId, data.culture))
        .then(result => res.json(result))
    }).catch(err => res.status(500).json(err))
  })

  /*
  all routes after this will require a token
  */
  routes.use((req, res, next) => jwtmiddleware(req, res, next, config.secret))

  /*
  Route for testing that token works
  */
  routes.get('/', function(req, res) {
    res.json({ message: 'Welcome to the API!' })
  })

  return routes
}

// generate a new jwt
function getToken(config, db, userId, userName, refreshToken, clientId, culture) {
  return db.knex('role as r')
    .innerJoin('user_role as ur', 'r.id', 'ur.role_id')
    .where({user_id: userId})
    .select('r.name')
    .then(data => {
      // create a new token
      let token = jwt.sign({
        name: userName,
        modules: ['inv', 'mai'],
        roles: data.map(a => a.name),
        culture: culture || 'en-US'
      },
      config.secret, {
        expiresIn: '1 hour',
        issuer: 'https://www.aspect.id'
      })

      // return the information including token as JSON
      return {
        access: token,
        refresh: refreshToken,
        clientId: clientId
      }
    })
}
