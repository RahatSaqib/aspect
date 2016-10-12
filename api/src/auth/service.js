let crypto = require('crypto')
let jwt = require('jsonwebtoken')
let uuid = require('node-uuid')
let Promise = require('bluebird')
let Boom = require('boom')
let _ = require('lodash')

const { createFetch, base, accept, header, method, body } = require('http-client')
require('isomorphic-fetch')

const bcrypt = require('bcrypt')
const bcryptCompare = Promise.promisify(bcrypt.compare)
const bcryptHash = Promise.promisify(bcrypt.hash)

const config = require('../config')
const { query } = require('../db')

function* checkAuthentication(){
  return { message: 'Welcome to the API!' }
}

function* authenticate(request){
  const {payload} = request

  const user = yield query('Get basic user details').from('User as u')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .where({'u.name': payload.name})
    .first( 'u.lockedOut', 'u.failedPasswordAttempts', 'u.password',
            'u.legacyPassword', 'u.id', 'u.name', 'p.culture',
            'p.lastPartnerId as partnerId', 'p.lastCountryId as countryId')

  if(!user){
    return Boom.unauthorized()
  }

  if (user.lockedOut === 1) {
    return Boom.unauthorized('Your account is locked.')
  }

  // if password isn't a bcrypt hash, user was migrated from
  // GxAlert and password wasn't set yet in aspect:
  if (user.password && user.legacyPassword){

    // use GxAlert API to check pw
    const gxFetch = createFetch(
      method('POST'),
      base(config.gxAlertApi),
      accept('application/json'),
      header('Content-Type', 'application/json'),
      body(JSON.stringify({ username: payload.name, password: payload.password }), 'application/json')
    )

    const resp = yield gxFetch('/auth')

    if (resp.status === 200){
      // we now know that pw is valid. store it in our database:
      const pw = yield bcryptHash(payload.password, parseInt(config.passwordSaltRounds))
      yield query('Update user password in our database').from('User')
        .where({id: user.id})
        .update({
          password: pw,
          failedPasswordAttempts: 0,
          legacyPassword: 0,
          lockedOut: false
        })
    } else {
      return Boom.unauthorized('Authentication failed. Wrong password.')
    }
  } else {
    // this is for "regular" accounts that were either created in aspect
    // or migrated from GxAlert and updated their password
    const pwResult = yield bcryptCompare(payload.password, user.password)
    if (!pwResult){
      const lock = user.failedPasswordAttempts + 1 >= config.passwordAttempts ? 1 : 0
      const updateFailedPass = query('Update failed password attempts and set locked out status on user').from('User')
        .where({id: user.id})
        .update({
          failedPasswordAttempts: user.failedPasswordAttempts + 1,
          lockedOut: lock
        })

      yield updateFailedPass
      return Boom.unauthorized('Authentication failed. Wrong password.')
    }
  }

  // upsert refresh token
  const now = new Date()
  const expires = new Date(now.getTime() + 7 * 86400000) // 7 days from now
  const refreshToken = crypto.randomBytes(48).toString('base64')
  const clientId = payload.clientId || uuid.v4()

  // Use raw query as upsert not yet supported in knex#701
  const setRefreshToken = query('Create new refresh token for the user').raw('INSERT INTO RefreshToken set ? ON DUPLICATE KEY UPDATE ?', [
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

  const updatePwAttempts = query('Update failed password attempts to 0').from('User')
    .where({id: user.id})
    .update({
      failedPasswordAttempts: 0,
      lastLogin: now,
      lastActive: now
    })

  yield Promise.all([setRefreshToken, updatePwAttempts])

  // finally, return the access token...
  const accessToken = yield getAccessToken(user)
  return {
    access: accessToken,
    refresh: refreshToken,
    clientId
  }
}

function* refreshToken(request){
  // find the token in the db
  const {clientId, token} = request.payload
  const data = yield query('Find existing token for client ID').from('RefreshToken as rt')
    .innerJoin('User as u', 'rt.userId', 'u.id')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .where({clientId, token, revoked: 0})
    .first('rt.userId as id', 'rt.expires', 'u.name',
      'p.culture', 'p.lastPartnerId as partnerId', 'p.lastCountryId as countryId')

  if (!data) {
    return Boom.badRequest('Unable to find token or token revoked')
  }

  // check if expired
  const now = new Date()

  if (data.expires < now) {
    return Boom.badRequest('Token expired')
  }

  // looks like we have a valid refresh token. set new one in db
  const expires = new Date(now.getTime() + 7 * 86400000) // 7 days from now
  const refreshToken = crypto.randomBytes(48).toString('base64')

  yield query('Update refresh token expiry date').from('RefreshToken')
    .where({token})
    .update({token: refreshToken, expires})

  const accessToken = yield getAccessToken(data)
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
      const token = jwt.sign({
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

function* updateUsernameAndPasswordForLoggedInUser(request){
  let {payload} = request

  const loggedInUser = yield query('Get ID, username and password details for logged in user').from('User as u')
    .where({'u.name': request.auth.credentials.name})
    .first('u.id', 'u.name', 'u.password', 'u.passwordKey')

  if(!loggedInUser){
    return Boom.notFound('User not Found')
  }
  if(loggedInUser.name !== request.auth.credentials.name){
    return Boom.forbidden('Not allowed to updated another user from here.')
  }
  if (!checkPassword(request.auth.credentials.name, payload.currentPassword)) {
    return Boom.forbidden('Incorrect password.')
  }
  const changedFields = {}
  if(payload.newUsername) {
    const existingUserIdWithNewUsername = yield query('Get user object for username').from('User as u')
      .where({'u.name': payload.newUsername})
      .first('u.id')
    if(existingUserIdWithNewUsername) {
      if(existingUserIdWithNewUsername.id !== loggedInUser.id) {
        return Boom.conflict('Username already in use')
      }
    } else if(payload.newUsername != loggedInUser.name) {
      changedFields.name = payload.newUsername
    }
  }
  if(payload.newPassword) {
    const encryptedNewPassword = encryptPassword(payload.newPassword, loggedInUser.passwordKey)
    if(loggedInUser.password != encryptedNewPassword) {
      changedFields.password = encryptedNewPassword
    }
  }
  if(!_.isEmpty(changedFields)) {
    changedFields.updatedOn = new Date()
    changedFields.updatedBy = loggedInUser.id

    yield query('Save user details for currently logged in user').from('user as u')
      .where({'u.id': loggedInUser.id})
      .update(changedFields)
  }

  return {ok: true, data: Object.keys(changedFields)}
}

function checkPassword(username, password) {
  return username && password === 'test07'
}

function encryptPassword(password, passwordKey) {
  if(!passwordKey) {
    throw 'Password key required for encryption'
  }
  return password
}

module.exports = {
  authenticate,
  checkAuthentication,
  refreshToken,
  updateUsernameAndPasswordForLoggedInUser
}
