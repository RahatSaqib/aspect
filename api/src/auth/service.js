let crypto = require('crypto')
let jwt = require('jsonwebtoken')
let uuid = require('node-uuid')
let Promise = require('bluebird')
let Boom = require('boom')

let config = require('../config')
let { query } = require('../db')

function* checkAuthentication(){
  return { message: 'Welcome to the API!' }
}

function* authenticate(request){
  let {payload} = request

  let user = yield query('Get basic user details').from('User as u')
    .innerJoin('person as p', 'u.id', 'p.userId')
    .where({'u.name': payload.name})
    .first('u.lockedOut', 'u.failedPasswordAttempts', 'u.id', 'u.name',
      'p.culture', 'p.lastPartnerId as partnerId', 'p.lastCountryId as countryId')

  if(!user){
    // TODO generic Auth failed message on username and password failed?
    // TODO should this be 401 (test checks 400)
    return Boom.badRequest('not found')
    //res.status(401).json({ message: 'Authentication failed. Wrong user name.' })
  }

  if (user.lockedOut === 1) {
    return Boom.unauthorized('Your account is locked.')
  }

  // TODO: check if password matches
  if (payload.password !== 'test07') {
    // FIXME this allows 6 attempts if config is 5... bug?
    let lock = user.failedPasswordAttempts >= config.passwordAttempts ? 1 : 0
    let updateFailedPass = query('Update failed password attempts and set locked out status on user').from('User')
      .where({id: user.id})
      .update({
        failedPasswordAttempts: user.failedPasswordAttempts + 1,
        lockedOut: lock
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
  let setRefreshToken = query('Create new refresh token for the user').raw('INSERT INTO RefreshToken set ? ON DUPLICATE KEY UPDATE ?', [
    {
      userId: user.id,
      clientId,
      clientName: payload.clientName,
      token: refreshToken,
      expires: expires,
      createdOn: now
    },
    {
      token: refreshToken,
      expires: expires
    }
  ])

  let updatePwAttempts = query('Update failed password attempts to 0').from('User')
    .where({id: user.id})
    .update({
      failedPasswordAttempts: 0,
      lastLogin: now,
      lastActive: now
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
  let data = yield query('Find existing token for client ID').from('RefreshToken as rt')
    .innerJoin('User as u', 'rt.userId', 'u.id')
    .innerJoin('person as p', 'u.id', 'p.userId')
    .where({clientId, token, revoked: 0})
    .first('rt.userId as id', 'rt.expires', 'u.name',
      'p.culture', 'p.lastPartnerId as partnerId', 'p.lastCountryId as countryId')

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

  yield query('Update refresh token expiry date').from('RefreshToken')
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
    .from('Permission as p')
    .innerJoin('RolePermission as rp', 'p.id', 'rp.permissionId')
    .innerJoin('Role as r', 'rp.roleId', 'r.id')
    .innerJoin('UserRole as ur', 'r.id', 'ur.roleId')
    .where({'ur.userId': id, 'r.partnerId': partnerId})
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

module.exports = {
  authenticate,
  checkAuthentication,
  refreshToken
}
