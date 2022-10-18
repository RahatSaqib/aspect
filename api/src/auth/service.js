const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const uuid = require('node-uuid')
const { promisify } = require('util')
const Boom = require('@hapi/boom')
const _ = require('lodash')
const bcrypt = require('bcrypt')
require('isomorphic-fetch')
const emailUtil = require('../email/emailUtil')
const templateProcessor = require('../email/templateProcessor')
const logger = require('../shared/logger')

const bcryptCompare = promisify(bcrypt.compare)
const bcryptHash = promisify(bcrypt.hash)

const config = require('../config')
const { query, knex } = require('../db')
const { gxAlertAuthenticate } = require('./gxalert')
const { getRemoteAddress } = require('../shared/request')
const { LOGIN_HISTORY_CODES, loginHistoryCodeDecorator } = require('./loginHistory')

const clientTypes = {
  app: 'reporter_app',
  web: 'web',
}

async function checkAuthentication() {
  return { message: 'Welcome to the API!' }
}

const personProps = [
  'p.name as userName',
  'p.culture',
  'p.timezone',
  'p.id as personId',
  'p.lastPartnerId as partnerId',
  'p.lastCountryId as countryId',
  'p.userId',
  'p.id as personId',
  'c.abbreviation as countryAbbreviation',
  'p.phone',
  'p.cell',
  'p.email',
  'p.disabled',
]

const userProps = [
  'u.lockedOut',
  'u.failedPasswordAttempts',
  'u.password',
  'u.legacyPassword',
  'u.id',
  'u.name',
  ...personProps,
]

function getUser(username, options = {}) {
  const { partnerId = false } = options
  return query('Get basic user details')
    .from('User as u')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .leftJoin('Country as c', 'c.id', 'p.lastCountryId')
    .where({ 'u.name': username })
    .modify(q => {
      if (partnerId) q.where('p.lastPartnerId', partnerId)
    })
    .first(userProps)
}

function getUserByPersonId(personId) {
  return query('Get user details for person')
    .from('Person as p')
    .innerJoin('User as u', 'p.userId', 'u.id')
    .leftJoin('Country as c', 'c.id', 'p.lastCountryId')
    .where({ 'p.id': personId })
    .first(userProps)
}

function getPersonByPersonId(personId) {
  return query('Get user details for person')
    .from('Person as p')
    .leftJoin('Country as c', 'c.id', 'p.lastCountryId')
    .where({ 'p.id': personId })
    .first(personProps)
}

function getUserByUserId(userId) {
  return query('Get user details for user')
    .from('User as u')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .leftJoin('Country as c', 'c.id', 'p.lastCountryId')
    .where({ 'u.id': userId })
    .first(userProps)
}

function getUserId(username) {
  return query('Get user ID for username').from('User as u').where({ 'u.name': username }).first('u.id')
}

function getTokenExpiry(clientType, currentTime) {
  const expiresTime = clientType && clientType.includes(clientTypes.app) ? 30 * 86400000 : 7 * 86400000
  return new Date(currentTime.getTime() + expiresTime)
}

async function authenticate(request, response) {
  const { payload } = request
  let user = await getUser(payload.name)
  if (!user) {
    try {
      // no user with such username in Aspect yet - check it in GxAlert
      user = await gxAlertAuthenticate(payload.name, payload.password)
      response.user = user
      if (!user) {
        // TODO: Check if what is wrong is the user or the password

        const err = Boom.unauthorized('Authentication failed. Wrong username or password.', null, {
          errorKeyCode: 'wrongUserOrPassword',
        })
        err.output.payload.data = err.data
        return loginHistoryCodeDecorator(err, LOGIN_HISTORY_CODES.userNotExists)
      }
    } catch (err) {
      const data = {
        userName: payload.name,
        message: err.message,
      }
      if (err.isConnectionError !== undefined) {
        if (err.isConnectionError) return Boom.conflict("Couldn't connect to GxAlert", data)
        return loginHistoryCodeDecorator(
          Boom.unauthorized('There was a conflict with your GxAlert credentials', data),
          LOGIN_HISTORY_CODES.unexpected
        )
      }

      return loginHistoryCodeDecorator(
        Boom.internal('Authentication failed because an internal server error', data),
        LOGIN_HISTORY_CODES.unexpected
      )
    }
  }

  if (user.lockedOut === 1 || user.disabled === 1) {
    return loginHistoryCodeDecorator(
      Boom.forbidden('Your account is locked.'),
      user.lockedOut ? LOGIN_HISTORY_CODES.lockedOut : LOGIN_HISTORY_CODES.disabled,
      user.id
    )
  }

  // if password isn't a bcrypt hash, user was migrated from
  // GxAlert and password wasn't set yet in aspect:
  if (user.password && user.legacyPassword) {
    // check login at GxAlert and return created/updated user from Aspect if login match in GxAlert
    user = await gxAlertAuthenticate(payload.name, payload.password)
    if (!user) {
      return loginHistoryCodeDecorator(
        Boom.unauthorized('Authentication failed. Wrong username or password.'),
        LOGIN_HISTORY_CODES.gxAlertWrongPassword,
        user.id
      )
    }
  } else {
    // this is for "regular" accounts that were either created in aspect
    // or migrated from GxAlert and updated their password
    const pwResult = await bcryptCompare(payload.password, user.password)

    if (!pwResult) {
      const attempts = user.failedPasswordAttempts + 1
      const lock = attempts >= config.passwordAttempts ? 1 : 0
      const updateFailedPass = query('Update failed password attempts and set locked out status on user')
        .from('User')
        .where({ id: user.id })
        .update({
          failedPasswordAttempts: attempts,
          lockedOut: lock,
        })

      await updateFailedPass

      if (lock) {
        logger.alert(`User account locked due to too many invalid login attempts
        Username: ${payload.name}
        Attempts: ${attempts}
        `)
      }
      return loginHistoryCodeDecorator(
        Boom.unauthorized('Authentication failed. Wrong username or password.'),
        LOGIN_HISTORY_CODES.wrongPassword,
        user.id
      )
    }
  }

  const now = new Date()
  const refreshToken = crypto.randomBytes(48).toString('base64')
  const { clientType = clientTypes.web, clientName } = payload
  let { clientId } = payload
  clientId = clientId || uuid.v4()
  // handle 'deviceTokenId' only for reporter app
  let { deviceTokenId = null } = payload
  if (clientType !== clientTypes.app) {
    deviceTokenId = null
  }

  await setRefreshToken({
    clientId,
    clientName,
    clientType,
    deviceTokenId,
    now,
    refreshToken,
    userId: user.id,
    countryAbbreviation: user.countryAbbreviation,
  })

  response.user = user // to be consumed by loginHistoryWrapper
  await query('Update failed password attempts to 0').from('User').where({ id: user.id }).update({
    failedPasswordAttempts: 0,
    lastLogin: now,
    lastActive: now,
  })

  const accessToken = await getAccessToken(user, clientType)
  const displayPreferences = await getDisplayPreferences(user)

  return {
    access: accessToken,
    refresh: refreshToken,
    clientId,
    clientType,
    culture: user.culture || 'en-US',
    timezone: user.timezone || 'Eastern Standard Time',
    displayPreferences,
    countryId: user.countryId,
    countryAbbreviation: user.countryAbbreviation,
    deviceTokenId,
    userId: user.id,
  }
}

function setRefreshToken({
  clientId,
  clientName,
  clientType = clientTypes.web,
  deviceTokenId = null,
  now,
  refreshToken,
  userId,
}) {
  const expires = getTokenExpiry(clientType, now)
  deviceTokenId = clientType === clientTypes.app ? deviceTokenId : null
  // Create new refresh token for the user -
  // upsert refresh token
  return knex.raw('INSERT INTO RefreshToken set ? ON DUPLICATE KEY UPDATE ?', [
    {
      userId,
      clientId,
      clientName,
      token: refreshToken,
      expires,
      createdOn: now,
      clientType,
      deviceTokenId,
    },
    {
      token: refreshToken,
      expires,
      deviceTokenId,
    },
  ])
}

async function refreshToken(request) {
  // find the token in the db
  const { clientId, token, clientType = clientTypes.web } = request.payload

  // handle 'deviceTokenId' only for reporter app
  let { deviceTokenId = null } = request.payload
  if (clientType !== clientTypes.app) {
    deviceTokenId = null
  }

  const data = await query('Find existing token for client ID')
    .from('RefreshToken as rt')
    .innerJoin('User as u', 'rt.userId', 'u.id')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .leftJoin('Country as c', 'c.id', 'p.lastCountryId')
    .where({ clientId, token, clientType, revoked: 0 })
    .first(
      'u.lockedOut',
      'u.failedPasswordAttempts',
      'u.password',
      'u.legacyPassword',
      'rt.userId as id',
      'rt.expires',
      'rt.clientName',
      'rt.clientType',
      'u.name',
      'p.name as userName',
      'p.culture',
      'p.timezone',
      'p.id as personId',
      'p.lastPartnerId as partnerId',
      'p.lastCountryId as countryId',
      'p.userId',
      'c.abbreviation as countryAbbreviation'
    )

  if (!data) {
    return Boom.badRequest('Unable to find token or token revoked')
  }

  // check if expired
  const now = new Date()

  if (data.expires < now) {
    return Boom.badRequest('Token expired')
  }

  // looks like we have a valid refresh token. set new one in db
  const expires = getTokenExpiry(data.clientType, now)
  const refreshToken = crypto.randomBytes(48).toString('base64')

  await query('Update refresh token expiry date').from('RefreshToken').where({ token }).update({
    token: refreshToken,
    expires,
    updatedOn: now,
    deviceTokenId,
  })

  const accessToken = await getAccessToken(data)
  const displayPreferences = await getDisplayPreferences(data)
  return {
    access: accessToken,
    refresh: refreshToken,
    clientId,
    clientType,
    countryId: data.countryId,
    deviceTokenId,
    culture: data.culture || 'en-US',
    timezone: data.timezone || 'Eastern Standard Time',
    displayPreferences,
    countryAbbreviation: data.countryAbbreviation,
    userId: data.id,
  }
}

async function getJobFunctions(id, name, partnerId) {
  return query('Get job functions for user and partner')
    .from('Person as p')
    .innerJoin('Job as j', 'p.id', 'j.personId') // 'j.jobFunctionId', 'jf.id')
    .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .where({ 'p.userId': id, 'jf.partnerId': partnerId })
    .orderBy(['jf.name'])
    .distinct('jf.name')
    .pluck('jf.name')
}

async function hasPermissions(auth, modules) {
  return _.intersection(auth.credentials.permissions, modules).length > 0
}

// generate a new jwt for the given user data
async function getAccessToken({ id, name, partnerId, personId }, clientType = 'web') {
  const permissions = await query('Get permissions for user and partner')
    .from('Permission as p')
    .innerJoin('JobFunctionPermission as jfp', 'p.id', 'jfp.permissionId')
    .innerJoin('JobFunction as jf', 'jfp.jobFunctionId', 'jf.id')
    .innerJoin('Job as j', 'j.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'j.personId', 'ps.id')
    .where({ 'ps.userId': id, 'jf.partnerId': partnerId })
    .orderBy(['p.module', 'p.activity'])
    .distinct('p.module', 'p.activity')
    .then(data => data.map(p => `${p.module}:${p.activity}`))

  const applicableLicense = await getApplicableLicense(personId, partnerId)

  // create a new token
  const token = jwt.sign(
    {
      name,
      permissions,
      hasToAcceptLicenseId:
        clientType.includes(clientTypes.app) || !applicableLicense || applicableLicense.acceptedOn
          ? null
          : applicableLicense.id,
    },
    config.secret,
    {
      expiresIn: '1 hour',
      issuer: 'https://www.aspect.id',
    }
  )

  return token
}

function getGeographyAccess(personId, partnerId) {
  return query('Get list of geographies which user can access')
    .from('JobContext as jc')
    .innerJoin('Job as j', 'jc.jobId', 'j.id')
    .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .leftJoin('Geography as g', 'jc.geographyId', 'g.id')
    .leftJoin('Site as s', 'jc.siteId', 's.id')
    .leftJoin('Geography as gs', 's.geographyId', 'gs.id')
    .where('j.personId', personId)
    .where('jf.partnerId', partnerId)
    .distinct(
      // country-state-lga when jc.siteId = null and jc.geographyId != null
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      // country-state-lga when jc.siteId != null and jc.geographyId = null
      'jc.siteId',
      'gs.countryId as siteCountryId',
      'gs.stateId as siteStateId',
      'gs.lgaId as siteLgaId'
    )
    .then(function (items) {
      return items
        ? items.map(item => ({
            countryId: item.countryId || item.siteCountryId,
            stateId: item.stateId || item.siteStateId,
            lgaId: item.lgaId || item.siteLgaId,
            siteId: item.siteId,
          }))
        : []
    })
}

async function getDisplayPreferences({ partnerId }) {
  // TODO add user preferences that override partner
  const prefs = await query('Get display preferences for user and partner')
    .from('Partner as p')
    .where({ 'p.id': partnerId })
    .first('p.plugin')
  // If we require onload we get a cycle. This is cached so is safe
  // But it likely could be replaced if we dynamically register plugins
  const { loadPlugin } = require('../plugin/registration')
  const { displayPreferences = {} } = await loadPlugin([_.get(prefs, 'plugin', null)], 'settings')
  return displayPreferences
}

function updateUser(userId, changedFields) {
  return query('Update user details').from('User as u').where({ 'u.id': userId }).update(changedFields)
}

async function isUsernameAlreadyInUseBySomebodyElse(userId, username) {
  if (username) {
    const existingUserIdWithNewUsername = await getUserId(username)
    if (existingUserIdWithNewUsername) {
      if (existingUserIdWithNewUsername.id !== userId) {
        return Boom.conflict('Username already in use')
      }
    }
  }
  return null
}

async function getChangedFields(payload, existingRecord) {
  const changedFields = {}
  if (payload.newUsername && payload.newUsername !== existingRecord.name) {
    changedFields.name = payload.newUsername
  }
  if (payload.newPassword) {
    const passwordsMatch = await bcryptCompare(payload.newPassword, existingRecord.password)
    if (!passwordsMatch) {
      changedFields.password = await bcryptHash(payload.newPassword, parseInt(config.passwordSaltRounds, 10))
      changedFields.lastPasswordChange = new Date()
      if (existingRecord.legacyPassword) {
        changedFields.legacyPassword = 0
      }
    }
  }
  if (_.isBoolean(payload.userLockedOut) && payload.userLockedOut !== existingRecord.lockedOut) {
    changedFields.lockedOut = payload.userLockedOut
  }
  return changedFields
}

async function updateUsernameAndPasswordForLoggedInUser(request) {
  const { payload } = request

  let loggedInUser = await getUser(request.auth.credentials.name)

  if (!loggedInUser) {
    return Boom.notFound('User not Found')
  }
  const pwResult = await bcryptCompare(payload.currentPassword, loggedInUser.password)
  if (!pwResult) {
    return Boom.unauthorized('Incorrect password.')
  }

  if (payload.newUsername) {
    const usernameNotAvailable = await isUsernameAlreadyInUseBySomebodyElse(loggedInUser.id, payload.newUsername)
    if (usernameNotAvailable) {
      return usernameNotAvailable
    }
  }

  const changedFields = await getChangedFields(payload, loggedInUser)
  const now = new Date()
  if (payload.newPassword) {
    const passwordsMatch = await bcryptCompare(payload.newPassword, loggedInUser.password)
    if (!passwordsMatch) {
      changedFields.lockedOut = 0
      changedFields.failedPasswordAttempts = 0
      changedFields.legacyPassword = 0
      changedFields.password = await bcryptHash(payload.newPassword, parseInt(config.passwordSaltRounds, 10))
      changedFields.lastPasswordChange = now
    }
  }

  if (!_.isEmpty(changedFields)) {
    await updateUser(loggedInUser.id, changedFields)
    loggedInUser = await getUser(changedFields.name || loggedInUser.name)
  }

  const refreshToken = crypto.randomBytes(48).toString('base64')
  const { clientType = clientTypes.web, clientName, deviceTokenId } = payload
  let { clientId } = payload
  clientId = clientId || uuid.v4()

  await setRefreshToken({
    clientId,
    clientName,
    clientType,
    deviceTokenId,
    now,
    refreshToken,
    userId: loggedInUser.id,
  })

  const accessToken = await getAccessToken(loggedInUser)

  return {
    ok: true,
    data: {
      changedFields: Object.keys(_.pick(changedFields, ['name', 'password'])),
      username: loggedInUser.name,
    },
    access: accessToken,
    refresh: refreshToken,
    clientId,
    deviceTokenId,
  }
}

async function createResetPasswordToken(request) {
  const { params } = request

  const users = await query('Get user details from email address')
    .from('Person as p')
    .innerJoin('User as u', 'p.userId', 'u.id')
    .where({ 'p.email': params.email })
    .orWhere({ 'p.email2': params.email })
    .select('u.id', 'p.name', 'p.culture')

  if (users.length === 1) {
    const resetPasswordToken = uuid.v4()
    const now = new Date()
    const expires = new Date(now.getTime() + 3600000)
    const generatedEmail = await templateProcessor.process(
      'resetPassword',
      {
        name: users[0].name,
        aspectUrl: process.env.aspectUrl,
        resetPasswordToken,
      },
      users[0].culture
    )
    const inlineImageAttachments = await templateProcessor.getInlineImageAttachments(generatedEmail.html)

    await emailUtil.sendEmail(
      params.email,
      generatedEmail.subject,
      generatedEmail.html,
      generatedEmail.text,
      inlineImageAttachments
    )

    await query('Save reset password token').from('User as u').where('u.id', users[0].id).update({
      resetPasswordToken,
      resetPasswordTokenExpires: expires,
    })
  } else if (users.length > 1) {
    return Boom.conflict('Could not pinpoint the user from the email address provided')
  }

  return {
    ok: true,
  }
}

async function updatePasswordWithResetPasswordToken(request) {
  const { payload, params } = request

  const userDetails = await query('Get user with reset password token')
    .from('User as u')
    .where('u.resetPasswordToken', params.resetPasswordToken)
    .first('u.resetPasswordTokenExpires', 'u.id', 'u.name as username')

  if (userDetails) {
    const now = new Date()
    if (userDetails.resetPasswordTokenExpires < now) {
      return Boom.resourceGone('The reset password token is no longer valid')
    }
    await query('Save password for user')
      .from('User as u')
      .where('u.id', userDetails.id)
      .update({
        lockedOut: 0,
        failedPasswordAttempts: 0,
        legacyPassword: 0,
        password: await bcryptHash(payload.newPassword, parseInt(config.passwordSaltRounds, 10)),
        lastPasswordChange: now,
        resetPasswordToken: null,
        resetPasswordTokenExpires: null,
      })
  } else {
    return Boom.notFound('The reset password token was not found')
  }

  return {
    ok: true,
    username: userDetails ? userDetails.username : undefined,
  }
}

async function updateUsernameAndPasswordForPerson(request) {
  const { params, payload } = request

  // TODO: check access level permissions for currently logged in user

  const userLinkedToPerson = await getUserByPersonId(params.personId)

  if (payload.newUsername) {
    const usernameNotAvailable = await isUsernameAlreadyInUseBySomebodyElse(
      userLinkedToPerson ? userLinkedToPerson.id : 0,
      payload.newUsername
    )
    if (usernameNotAvailable) {
      return usernameNotAvailable
    }
  }

  const responseData = {
    personId: params.personId,
    userLockedOut: payload.userLockedOut,
  }
  let linkedUserId
  if (userLinkedToPerson) {
    const changedFields = await getChangedFields(payload, userLinkedToPerson)
    linkedUserId = userLinkedToPerson.id

    if (!_.isEmpty(changedFields)) {
      await updateUser(userLinkedToPerson.id, changedFields)
    }

    responseData.changedFields = Object.keys(_.omit(changedFields, ['lastPasswordChange']))
    responseData.username = userLinkedToPerson.name
    responseData.userId = userLinkedToPerson.userId
  } else {
    const [insertedUserId] = await query('Insert new user details')
      .from('User')
      .insert({
        name: payload.newUsername,
        password: await bcryptHash(payload.newPassword, parseInt(config.passwordSaltRounds, 10)),
        approved: 1,
        createdOn: new Date(),
        lockedOut: payload.userLockedOut || 0,
        failedPasswordAttempts: 0,
        legacyPassword: 0,
      })
    linkedUserId = insertedUserId
    responseData.changedFields = ['name', 'password', 'lockedOut']
    responseData.username = payload.newUsername
    responseData.userId = insertedUserId
  }
  await query('update person for details').from('Person').where('id', params.personId).update({
    userId: linkedUserId,
    canLogIn: true,
  })
  return {
    ok: true,
    data: responseData,
  }
}

async function getApplicableLicense(personId, partnerId) {
  const latestLicense = await query('Get latest applicable license and when user accepted it')
    .from('License as l')
    .leftOuterJoin('LicensePerson as lp', function () {
      this.on('l.id', '=', 'lp.licenseId').andOn('lp.personId', '=', personId)
    })
    .where('l.partnerId', partnerId)
    .orWhere('l.partnerId', null)
    .orderBy('l.partnerId', 'desc')
    .orderBy('l.createdOn', 'desc')
    .first('l.id', 'lp.acceptedOn')

  return latestLicense
}

async function getLicense(request) {
  const {
    query: { licenseId },
  } = request

  const license = await query('Get license').from('License').where('id', licenseId).first('id', 'createdOn', 'content')

  return { ok: true, data: license }
}

async function acceptLicense(request) {
  const {
    payload: { licenseId },
  } = request

  const loggedInUser = await getUser(request.auth.credentials.name)

  const licenseUpdates = {
    acceptedOn: new Date(),
    ip: getRemoteAddress(request),
  }

  await query('Insert or update accepted license for user').raw(
    'INSERT INTO LicensePerson set ? ON DUPLICATE KEY UPDATE ?',
    [
      {
        licenseId,
        personId: loggedInUser.personId,
        ...licenseUpdates,
      },
      licenseUpdates,
    ]
  )

  // need to return a new JWT, now without hasToAcceptLicenseId
  return refreshToken(request)
}

// / Revoke/Grant access to specific user
async function revokeUsersToken(userId, revoke) {
  await query('change revoked state for the specific user in refresh token tables')
    .from('RefreshToken')
    .where({ userId })
    .update({
      revoked: revoke,
    })
}

// Lockedout and grant access to login to specific user.
async function lockedOutUser(userId, lockedOut) {
  await query('change Lockout state for the specific user ').from('User').where({ id: userId }).update({
    lockedOut,
  })
}

async function getUserJobFunctions(request) {
  const { auth } = request
  const { id, name, partnerId } = await getUser(auth.credentials.name)
  const jobFunctions = await getJobFunctions(id, name, partnerId)
  return { ok: true, data: jobFunctions }
}

module.exports = {
  getUser,
  getUserByUserId,
  getUserByPersonId,
  authenticate,
  checkAuthentication,
  refreshToken,
  updateUsernameAndPasswordForLoggedInUser,
  updateUsernameAndPasswordForPerson,
  createResetPasswordToken,
  updatePasswordWithResetPasswordToken,
  getLicense,
  acceptLicense,
  revokeUsersToken,
  lockedOutUser,
  hasPermissions,
  clientTypes,
  getGeographyAccess,
  getUserJobFunctions,
  getPersonByPersonId,
  getDisplayPreferences,
}
