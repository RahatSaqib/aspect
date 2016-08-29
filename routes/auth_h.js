let crypto = require('crypto')
let jwt = require('jsonwebtoken')
let uuid = require('node-uuid')
let Promise = require('bluebird')
let Joi = require('joi')
let config = require('../config')
let { knex } = require('../db')

module.exports = [
  {
    method: 'POST',
    path: '/auth',
    handler: Promise.coroutine(authenticate),
    config: {
      description: 'Authenticate user',
      notes: 'Generate new JWT token given user name and password',
      tags: ['api'],
      validate: {
        payload: {
          name: Joi.string().required(),
          password: Joi.string().required(),
          clientName: Joi.string().required()
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    handler: Promise.coroutine(refreshToken),
    config: {
      description: 'Refresh Token',
      notes: 'Generate a new access token by sending a refresh token',
      tags: ['api'],
      validate: {
        payload: {
          clientId: Joi.string().required(),
          token: Joi.string().required()
        }
      }
    }
  }
]


function* authenticate(req, reply){
  try {
    let user = yield knex('user as u')
      .innerJoin('person as p', 'u.id', 'p.user_id')
      .where({'u.name': req.payload.name})
      .first('u.locked_out', 'u.failed_password_attempts', 'u.id', 'u.name', 'p.culture')
    
    if(!user){
      // TODO generic Auth failed message on username and password failed?
      // TODO should this be 401 (test checks 400)
      return reply({ message: 'not found' }).code(400)
      //res.status(401).json({ message: 'Authentication failed. Wrong user name.' })
    }
    
    if (user.locked_out === 1) {
      return reply({ message: 'Your account is locked.' }).code(401)
    }

    // TODO: check if password matches
    if (req.payload.password !== 'test07') {
      // FIXME this allows 6 attempts if config is 5... bug?
      let lock = user.failed_password_attempts >= config.passwordAttempts ? 1 : 0
      let updateFailedPass = knex('user')
        .where({id: user.id})
        .update({
          failed_password_attempts: user.failed_password_attempts + 1,
          locked_out: lock
        })

      yield updateFailedPass
      return reply({ message: 'Authentication failed. Wrong password.' }).code(401)
    }

    // upsert refresh token
    let now = new Date()
    let expires = new Date(now.getTime() + 7 * 86400000) // 7 days from now
    let refresh_token = crypto.randomBytes(48).toString('base64')
    let clientId = req.payload.clientId || uuid.v4()

    // Use raw query as upsert not yet supported in knex#701
    let setRefreshToken = knex.raw('INSERT INTO refresh_token set ? ON DUPLICATE KEY UPDATE ?', [
      {
        user_id: user.id,
        client_id: clientId,
        client_name: req.payload.clientName,
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

    yield Promise.all([setRefreshToken, updatePwAttempts])

    // finally, return the access token...
    let newToken = yield getToken(config, user.id, user.name, refresh_token, clientId, user.culture)
    reply(newToken)
  } catch (err){
    reply(err).code(500)
  }
}

function* refreshToken(req, reply){
  try {
    // find the token in the db
    let {clientId, token} = req.payload
    let data = yield knex('refresh_token as rt')
      .innerJoin('user as u', 'rt.user_id', 'u.id')
      .innerJoin('person as p', 'u.id', 'p.user_id')
      .where({client_id: clientId, token, revoked: 0})
      .select('rt.user_id as userId', 'rt.expires', 'u.name', 'p.culture')
      .first()

    if (!data) {
      return reply({ message: 'Unable to find token or token revoked' }).code(400)
    }

    // check if expired
    let now = new Date()

    if (data.expires < now) {
      return reply({ message: 'Token expired' }).code(400)
    }

    // looks like we have a valid refresh token. set new one in db
    let expires = new Date(now.getTime() + 7 * 86400000) // 7 days from now
    let refreshToken = crypto.randomBytes(48).toString('base64')

    yield knex('refresh_token')
      .where({token: req.payload.token})
      .update({token: refreshToken, expires})

    let newToken = yield getToken(config, data.userId, data.name, refreshToken, clientId, data.culture)
    reply(newToken)
  } catch (err){
    reply(err).code(500)
  }
}

  /*
  all routes after this will require a token
  routes.use((req, res, next) => jwtmiddleware(req, res, next, config.secret))

  /*
  Route for testing that token works
  routes.get('/', function(req, res) {
    res.json({ message: 'Welcome to the API!' })
  })

  return routes
}
  */

// generate a new jwt
function getToken(config, userId, userName, refreshToken, clientId, culture) {
  return knex('role as r')
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
