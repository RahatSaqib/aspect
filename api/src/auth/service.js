let crypto = require('crypto')
let jwt = require('jsonwebtoken')
let uuid = require('node-uuid')
let Promise = require('bluebird')
let Boom = require('boom')
let _ = require('lodash')
const bcrypt = require('bcrypt')
const { createFetch, base, accept, header, method, body } = require('http-client')
require('isomorphic-fetch')
const emailUtil = require('../email/emailUtil')
const templateProcessor = require('../email/templateProcessor')

const bcryptCompare = Promise.promisify(bcrypt.compare)
const bcryptHash = Promise.promisify(bcrypt.hash)

const config = require('../config')
const { query, knex } = require('../db')

function* checkAuthentication(){
  return { message: 'Welcome to the API!' }
}

function getUser(username) {
  return query('Get basic user details').from('User as u')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .where({'u.name': username})
    .first( 'u.lockedOut', 'u.failedPasswordAttempts', 'u.password',
      'u.legacyPassword', 'u.id', 'u.name', 'p.culture', 'p.timezone',
      'p.lastPartnerId as partnerId', 'p.lastCountryId as countryId')
}

function getUserByPersonId(personId) {
  return query('Get user details for person').from('Person as p')
    .innerJoin('User as u', 'p.userId', 'u.id')
    .where({'p.id': personId})
    .first( 'u.lockedOut', 'u.failedPasswordAttempts', 'u.password',
      'u.legacyPassword', 'u.id', 'u.name', 'p.culture', 'p.timezone',
      'p.lastPartnerId as partnerId', 'p.lastCountryId as countryId')
}

function getUserId(username) {
  return query('Get user ID for username').from('User as u')
    .where({'u.name': username})
    .first('u.id')
}

function* authenticate(request){
  const {payload} = request

  const user = yield getUser(payload.name)

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

  const now = new Date()
  const refreshToken = crypto.randomBytes(48).toString('base64')
  const clientId = payload.clientId || uuid.v4()

  yield setRefreshToken(user.id, payload.clientName, clientId, refreshToken, now)

  yield query('Update failed password attempts to 0').from('User')
    .where({id: user.id})
    .update({
      failedPasswordAttempts: 0,
      lastLogin: now,
      lastActive: now
    })

  // finally, return the access token...
  const accessToken = yield getAccessToken(user)
  return {
    access: accessToken,
    refresh: refreshToken,
    clientId
  }
}

function setRefreshToken(userId, clientName, clientId, refreshToken, now){
  const expires = new Date(now.getTime() + 7 * 86400000) // 7 days from now
  // upsert refresh token
  return query('Create new refresh token for the user')
    .raw('INSERT INTO RefreshToken set ? ON DUPLICATE KEY UPDATE ?', [{
      userId: userId,
      clientId,
      clientName: clientName,
      token: refreshToken,
      expires: expires,
      createdOn: now
    }, {
      token: refreshToken,
      expires: expires
    }])
}

function* refreshToken(request){
  // find the token in the db
  const {clientId, token} = request.payload
  const data = yield query('Find existing token for client ID').from('RefreshToken as rt')
    .innerJoin('User as u', 'rt.userId', 'u.id')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .where({clientId, token, revoked: 0})
    .first('rt.userId as id', 'rt.expires', 'u.name',
      'p.culture', 'p.timezone', 'p.lastPartnerId as partnerId', 'p.lastCountryId as countryId')

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
function getAccessToken({id, name, culture, timezone, partnerId, countryId}){
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
        culture: culture || 'en-US',
        timezone: timezone || 'Eastern Standard Time'
      },
      config.secret, {
        expiresIn: '1 hour',
        issuer: 'https://www.aspect.id'
      })

      return token
    })
}

function updateUser(userId, changedFields) {
  return query('Update user details').from('User as u')
    .where({'u.id': userId})
    .update(changedFields)
}

function* isUsernameAlreadyInUseBySomebodyElse(userId, username) {
  if(username) {
    const existingUserIdWithNewUsername = yield getUserId(username)
    if(existingUserIdWithNewUsername) {
      if(existingUserIdWithNewUsername.id !== userId) {
        return Boom.conflict('Username already in use')
      }
    }
  }
}

function* getChangedFields(payload, existingRecord) {
  const changedFields = {}
  if(payload.newUsername && payload.newUsername != existingRecord.name) {
    changedFields.name = payload.newUsername
  }
  if(payload.newPassword) {
    const passwordsMatch = yield bcryptCompare(payload.newPassword, existingRecord.password)
    if(!passwordsMatch) {
      changedFields.password = yield bcryptHash(payload.newPassword, parseInt(config.passwordSaltRounds))
      changedFields.lastPasswordChange = new Date()
    }
  }
  return changedFields
}

function* updateUsernameAndPasswordForLoggedInUser(request){
  let {payload} = request

  let loggedInUser = yield getUser(request.auth.credentials.name)

  if(!loggedInUser){
    return Boom.notFound('User not Found')
  }
  const pwResult = yield bcryptCompare(payload.currentPassword, loggedInUser.password)
  if (!pwResult) {
    return Boom.forbidden('Incorrect password.')
  }
  if(payload.newUsername) {
    const usernameNotAvailable = yield* isUsernameAlreadyInUseBySomebodyElse(loggedInUser.id,
      payload.newUsername)
    if(usernameNotAvailable) {
      return usernameNotAvailable
    }
  }

  const changedFields = yield* getChangedFields(payload, loggedInUser)
  const now = new Date()
  if(payload.newPassword) {
    const passwordsMatch = yield bcryptCompare(payload.newPassword, loggedInUser.password)
    if(!passwordsMatch) {
      changedFields.lockedOut = 0
      changedFields.failedPasswordAttempts = 0
      changedFields.legacyPassword = 0
      changedFields.password = yield bcryptHash(payload.newPassword, parseInt(config.passwordSaltRounds))
      changedFields.lastPasswordChange = now
    }
  }

  if(!_.isEmpty(changedFields)) {
    yield updateUser(loggedInUser.id, changedFields)
    loggedInUser = yield getUser(changedFields.name || loggedInUser.name)
  }

  const refreshToken = crypto.randomBytes(48).toString('base64')
  const clientId = payload.clientId || uuid.v4()

  yield setRefreshToken(loggedInUser.id, payload.clientName, clientId, refreshToken, now)

  const accessToken = yield getAccessToken(loggedInUser)

  return {
    ok: true,
    data: {
      changedFields: Object.keys(_.pick(changedFields, ['name', 'password'])),
      username: loggedInUser.name
    },
    access: accessToken,
    refresh: refreshToken,
    clientId
  }
}

function* createResetPasswordToken(request){
  const {params} = request

  const users = yield query('Get user details from email address').from('Person as p')
    .innerJoin('User as u', 'p.userId', 'u.id')
    .where({'p.email': params.email})
    .orWhere({'p.email2': params.email})
    .select( 'u.id', 'p.name', 'p.culture' )

  if (users.length === 1) {
    const resetPasswordToken = uuid.v4(),
      now = new Date(),
      expires = new Date(now.getTime() + 3600000),
      generatedEmail = yield* templateProcessor.process('resetPassword', {
        name: users[0].name,
        aspectUrl: process.env['aspectUrl'],
        resetPasswordToken: resetPasswordToken
      }, users[0].culture),
      inlineImageAttachments = yield* templateProcessor.getInlineImageAttachments(generatedEmail.html)

    yield* emailUtil.sendEmail(params.email, generatedEmail.subject, generatedEmail.html,
      generatedEmail.text, inlineImageAttachments)

    yield query('Save reset password token').from('User as u')
      .where('u.id', users[0].id)
      .update({
        resetPasswordToken: resetPasswordToken,
        resetPasswordTokenExpires: expires
      })
  } else if(users.length > 1) {
    return Boom.conflict('Could not pinpoint the user from the email address provided')
  }

  return {
    ok: true
  }
}

function* updatePasswordWithResetPasswordToken(request) {
  let {payload, params} = request

  let userDetails = yield query('Get user with reset password token')
    .from('User as u')
    .where('u.resetPasswordToken', params.resetPasswordToken)
    .first('u.resetPasswordTokenExpires', 'u.id', 'u.name as username')

  if(userDetails){
    const now = new Date()
    if (userDetails.resetPasswordTokenExpires < now) {
      return Boom.resourceGone('The reset password token is no longer valid')
    }
    yield query('Save password for user').from('User as u')
      .where('u.id', userDetails.id)
      .update({
        lockedOut: 0,
        failedPasswordAttempts: 0,
        legacyPassword: 0,
        password: yield bcryptHash(payload.newPassword, parseInt(config.passwordSaltRounds)),
        lastPasswordChange: now,
        resetPasswordToken: null,
        resetPasswordTokenExpires: null
      })
  } else {
    return Boom.notFound('The reset password token was not found')
  }

  return {
    ok: true,
    username: userDetails ? userDetails.username : undefined
  }
}

function* getRolesForUser(userId) {
  return query('Get roles for user').from('UserRole')
    .where({'ur.userId': userId})
}

function* updateUsernamePasswordForPerson(request) {
  let {params, payload} = request

  // TODO: check access level permissions for currently logged in user

  const userLinkedToPerson = yield getUserByPersonId(params.personId)

  if (payload.newUsername) {
    const usernameNotAvailable = yield isUsernameAlreadyInUseBySomebodyElse(
      userLinkedToPerson ? userLinkedToPerson.id : 0,
      payload.newUsername)
    if (usernameNotAvailable) {
      return usernameNotAvailable
    }
  }

  const responseData = {}
  let userId = 0
  if (userLinkedToPerson) {
    userId = userLinkedToPerson.id
    const changedFields = yield* getChangedFields(payload, userLinkedToPerson)
    if (!_.isEmpty(changedFields)) {
      yield updateUser(userLinkedToPerson.id, changedFields)
    }

    responseData.changedFields = Object.keys(_.omit(changedFields, ['lastPasswordChange']))
    responseData.username = userLinkedToPerson.name
  } else {
    userId = yield query('Insert new user details').from('User')
      .insert({
        name: payload.newUsername,
        password: yield bcryptHash(payload.newPassword, parseInt(config.passwordSaltRounds)),
        approved: 1,
        createdOn: new Date(),
        lockedOut: 0,
        failedPasswordAttempts: 0,
        legacyPassword: 0
      }).returning('id')

    responseData.changedFields = ['name', 'password']
    responseData.username = payload.newUsername
  }

  const userRoles = yield getRolesForUser(userId),
    userRolesToDelete = _.map(_.filter(userRoles,
      userRole => !payload.roles.includes(userRole.roleId)), 'roleId'),
    userRolesToAdd = _.filter(payload.roles, roleId => !_.some(userRoles, {roleId: roleId}))
  if (!_.isEmpty(userRolesToDelete) || !_.isEmpty(userRolesToAdd)) {
    responseData.changedFields.push('roles')
    if (!_.isEmpty(userRolesToDelete)) {
      yield query('Delete user roles').from('UserRole as ur')
        .where({'ur.userId': userId})
        .andWhere(knex.raw('ur.roleId in (?)', _.join(userRolesToDelete)))
        .del()
    }
    if (!_.isEmpty(userRolesToAdd)) {
      yield query('Add user roles')
        .insert(_.map(userRolesToAdd, roleId => { return { userId, roleId } }))
        .into('UserRole')
    }
  }


  return {
    ok: true,
    data: responseData
  }
}

module.exports = {
  getUser,
  authenticate,
  checkAuthentication,
  refreshToken,
  getRolesForUser,
  updateUsernameAndPasswordForLoggedInUser,
  updateUsernamePasswordForPerson,
  createResetPasswordToken,
  updatePasswordWithResetPasswordToken
}
