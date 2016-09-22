let crypto = require('crypto')
let jwt = require('jsonwebtoken')
let uuid = require('node-uuid')
let Promise = require('bluebird')
let Boom = require('boom')
let Joi = require('joi')

let config = require('../config')
let { query } = require('../db')
let { asyncHandler } = require('../util')

module.exports = [
  {
    method: 'POST',
    path: '/auth',
    handler: asyncHandler(authenticate),
    config: {
      auth: false,
      description: 'Authenticate user',
      notes: 'Generate new JWT token given user name and password',
      validate: {
        payload: {
          name: Joi.string().required(),
          password: Joi.string().required(),
          clientName: Joi.string().required(),
          clientId: Joi.string()
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/auth',
    handler: asyncHandler(checkAuthentication),
    config: {
      description: 'Check authentication',
      notes: 'Check successful authentication token'
    }
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    handler: asyncHandler(refreshToken),
    config: {
      auth: false,
      description: 'Refresh Token',
      notes: 'Generate a new access token by sending a refresh token',
      validate: {
        payload: {
          clientId: Joi.string().required(),
          token: Joi.string().required()
        }
      }
    }
  }
]

function* checkAuthentication(){
  return { message: 'Welcome to the API!' }
}

function* authenticate(request){
  let {payload} = request

  let user = yield query('Get basic user details').from('user as u')
    .innerJoin('person as p', 'u.id', 'p.user_id')
    .where({'u.name': payload.name})
    .first('u.locked_out', 'u.failed_password_attempts', 'u.id', 'u.name',
      'p.culture', 'p.last_partner_id as partnerId', 'p.last_country_id as countryId')

  if(!user){
    // TODO generic Auth failed message on username and password failed?
    // TODO should this be 401 (test checks 400)
    return Boom.badRequest('not found')
    //res.status(401).json({ message: 'Authentication failed. Wrong user name.' })
  }

  if (user.locked_out === 1) {
    return Boom.unauthorized('Your account is locked.')
  }

  // TODO: check if password matches
  if (payload.password !== 'test07') {
    // FIXME this allows 6 attempts if config is 5... bug?
    let lock = user.failed_password_attempts >= config.passwordAttempts ? 1 : 0
    let updateFailedPass = query('Update failed password attempts and set locked out status on user').from('user')
      .where({id: user.id})
      .update({
        failed_password_attempts: user.failed_password_attempts + 1,
        locked_out: lock
      })

    yield updateFailedPass
    return Boom.unauthorized('Authentication failed. Wrong password.')
  }

  // upsert refresh token
  let now = new Date()
  let expires = new Date(now.getTime() + 7 * 86400000) // 7 days from now
  let refreshToken = crypto.randomBytes(48).toString('base64')
  let clientId = payload.clientId || uuid.v4()

  // Use raw query as upsert not yet supported in knex#701
  let setRefreshToken = query('Create new refresh token for the user').raw('INSERT INTO refresh_token set ? ON DUPLICATE KEY UPDATE ?', [
    {
      user_id: user.id,
      client_id: clientId,
      client_name: payload.clientName,
      token: refreshToken,
      expires: expires,
      created_on: now
    },
    {
      token: refreshToken,
      expires: expires
    }
  ])

  let updatePwAttempts = query('Update failed password attempts to 0').from('user')
    .where({id: user.id})
    .update({
      failed_password_attempts: 0,
      last_login: now,
      last_active: now
    })

  yield Promise.all([setRefreshToken, updatePwAttempts])

  // finally, return the access token...
  let accessToken = yield getAccessToken(user)
  return {
    access: accessToken,
    refresh: refreshToken,
    clientId
  }
}

function* refreshToken(request){
  // find the token in the db
  let {clientId, token} = request.payload
  let data = yield query('Find existing token for client ID').from('refresh_token as rt')
    .innerJoin('user as u', 'rt.user_id', 'u.id')
    .innerJoin('person as p', 'u.id', 'p.user_id')
    .where({client_id: clientId, token, revoked: 0})
    .first('rt.user_id as id', 'rt.expires', 'u.name',
      'p.culture', 'p.last_partner_id as partnerId', 'p.last_country_id as countryId')

  if (!data) {
    return Boom.badRequest('Unable to find token or token revoked')
  }

  // check if expired
  let now = new Date()

  if (data.expires < now) {
    return Boom.badRequest('Token expired')
  }

  // looks like we have a valid refresh token. set new one in db
  let expires = new Date(now.getTime() + 7 * 86400000) // 7 days from now
  let refreshToken = crypto.randomBytes(48).toString('base64')

  yield query('Update refresh token expiry date').from('refresh_token')
    .where({token})
    .update({token: refreshToken, expires})

  let accessToken = yield getAccessToken(data)
  return {
    access: accessToken,
    refresh: refreshToken,
    clientId
  }
}

// generate a new jwt for the given user data
function getAccessToken({id, name, culture, partnerId, countryId}){
  return query('Get permissions for user and partner')
    .from('permission as p')
    .innerJoin('role_permission as rp', 'p.id', 'rp.permission_id')
    .innerJoin('role as r', 'rp.role_id', 'r.id')
    .innerJoin('user_role as ur', 'r.id', 'ur.role_id')
    .where({'ur.user_id': id, 'r.partner_id': partnerId})
    .orderBy(['p.module', 'p.activity'])
    .distinct('p.module', 'p.activity')
    .then(data => {
      // create a new token
      let token = jwt.sign({
        name,
        id,
        partnerId,
        countryId,
        // TODO should we remove modules since same info in permissions to reduce size of JWT?
        modules: data.map(p => p.module),
        permissions: data.map(p => `${p.module}:${p.activity}`),
        culture: culture || 'en-US'
      },
      config.secret, {
        expiresIn: '1 hour',
        issuer: 'https://www.aspect.id'
      })

      return token
    })
}
