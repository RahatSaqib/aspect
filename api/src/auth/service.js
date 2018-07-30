const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const uuid = require('node-uuid')
const { promisify } = require('util')
const Boom = require('boom')
const _ = require('lodash')
const bcrypt = require('bcrypt')
require('isomorphic-fetch')
const emailUtil = require('../email/emailUtil')
const templateProcessor = require('../email/templateProcessor')

const bcryptCompare = promisify(bcrypt.compare)
const bcryptHash = promisify(bcrypt.hash)

const config = require('../config')
const { query } = require('../db')
const { validateUserAtGxAlert } = require('./gxalert')

async function checkAuthentication() {
  return { message: 'Welcome to the API!' }
}

function getUser(username) {
  return query('Get basic user details')
    .from('User as u')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .where({ 'u.name': username })
    .first(
      'u.lockedOut',
      'u.failedPasswordAttempts',
      'u.password',
      'u.legacyPassword',
      'u.id',
      'u.name',
      'p.culture',
      'p.timezone',
      'p.id as personId',
      'p.lastPartnerId as partnerId',
      'p.lastCountryId as countryId'
    )
}

function getUserByPersonId(personId) {
  return query('Get user details for person')
    .from('Person as p')
    .innerJoin('User as u', 'p.userId', 'u.id')
    .where({ 'p.id': personId })
    .first(
      'u.lockedOut',
      'u.failedPasswordAttempts',
      'u.password',
      'u.legacyPassword',
      'u.id',
      'u.name',
      'p.culture',
      'p.timezone',
      'p.id as personId',
      'p.lastPartnerId as partnerId',
      'p.lastCountryId as countryId'
    )
}

function getUserId(username) {
  return query('Get user ID for username')
    .from('User as u')
    .where({ 'u.name': username })
    .first('u.id')
}

async function authenticate(request) {
  const { payload } = request

  let user = await getUser(payload.name)

  if (!user) {
    // no user with such username in Aspect yet - check it in GxAlert
    user = await validateUserAtGxAlert(payload.name, payload.password)
    if (!user) {
      return Boom.unauthorized('Authentication failed. Wrong password.')
    }
  } else if (user.lockedOut === 1) {
    return Boom.unauthorized('Your account is locked.')
  }

  if (user.lockedOut === 1) {
    return Boom.unauthorized('Your account is locked.')
  }

  // if password isn't a bcrypt hash, user was migrated from
  // GxAlert and password wasn't set yet in aspect:
  if (user.password && user.legacyPassword) {
    // check login at GxAlert and return created/updated user from Aspect if login match in GxAlert
    user = await validateUserAtGxAlert(payload.name, payload.password, user)
    if (!user) {
      return Boom.unauthorized('Authentication failed. Wrong password.')
    }
  } else {
    // this is for "regular" accounts that were either created in aspect
    // or migrated from GxAlert and updated their password
    const pwResult = await bcryptCompare(payload.password, user.password)
    if (!pwResult) {
      const lock =
        user.failedPasswordAttempts + 1 >= config.passwordAttempts ? 1 : 0
      const updateFailedPass = query(
        'Update failed password attempts and set locked out status on user'
      )
        .from('User')
        .where({ id: user.id })
        .update({
          failedPasswordAttempts: user.failedPasswordAttempts + 1,
          lockedOut: lock,
        })

      await updateFailedPass
      return Boom.unauthorized('Authentication failed. Wrong password.')
    }
  }

  const now = new Date()
  const refreshToken = crypto.randomBytes(48).toString('base64')
  const clientId = payload.clientId || uuid.v4()

  await setRefreshToken(
    user.id,
    payload.clientName,
    clientId,
    refreshToken,
    now
  )

  await query('Update failed password attempts to 0')
    .from('User')
    .where({ id: user.id })
    .update({
      failedPasswordAttempts: 0,
      lastLogin: now,
      lastActive: now,
    })

  const accessToken = await getAccessToken(user)
  const displayPreferences = await getDisplayPreferences(user)
  return {
    access: accessToken,
    refresh: refreshToken,
    clientId,
    culture: user.culture || 'en-US',
    timezone: user.timezone || 'Eastern Standard Time',
    displayPreferences,
  }
}

function setRefreshToken(userId, clientName, clientId, refreshToken, now) {
  const expires = new Date(now.getTime() + 7 * 86400000) // 7 days from now
  // upsert refresh token
  return query('Create new refresh token for the user').raw(
    'INSERT INTO RefreshToken set ? ON DUPLICATE KEY UPDATE ?',
    [
      {
        userId,
        clientId,
        clientName,
        token: refreshToken,
        expires,
        createdOn: now,
      },
      {
        token: refreshToken,
        expires,
      },
    ]
  )
}

async function refreshToken(request) {
  // find the token in the db
  const { clientId, token } = request.payload
  const data = await query('Find existing token for client ID')
    .from('RefreshToken as rt')
    .innerJoin('User as u', 'rt.userId', 'u.id')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .where({ clientId, token, revoked: 0 })
    .first(
      'rt.userId as id',
      'rt.expires',
      'u.name',
      'p.culture',
      'p.timezone',
      'p.lastPartnerId as partnerId',
      'p.lastCountryId as countryId'
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
  const expires = new Date(now.getTime() + 7 * 86400000) // 7 days from now
  const refreshToken = crypto.randomBytes(48).toString('base64')

  await query('Update refresh token expiry date')
    .from('RefreshToken')
    .where({ token })
    .update({ token: refreshToken, expires })

  const accessToken = await getAccessToken(data)
  return {
    access: accessToken,
    refresh: refreshToken,
    clientId,
  }
}

async function getFeatures(id, name, partnerId) {
  const modules = await query('Get features for user and partner')
    .from('Feature as f')
    .innerJoin('JobFunctionFeature as jff', 'f.id', 'jff.featureId')
    .innerJoin('JobFunction as jf', 'jff.jobFunctionId', 'jf.id')
    .innerJoin('Job as j', 'j.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'j.personId', 'ps.id')
    .where({ 'ps.userId': id, 'jf.partnerId': partnerId })
    .orderBy(['f.module'])
    .distinct('f.module')
  return modules
}

async function hasFeature(userId, partnerId, module) {
  const userFeature = await query('Get features for user and partner')
    .from('Feature as f')
    .innerJoin('JobFunctionFeature as jff', 'f.id', 'jff.featureId')
    .innerJoin('JobFunction as jf', 'jff.jobFunctionId', 'jf.id')
    .innerJoin('Job as j', 'j.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'j.personId', 'ps.id')
    .where({
      'f.module': module,
      'ps.userId': userId,
      'jf.partnerId': partnerId,
    })
    .first('f.module')
  return !_.isEmpty(userFeature)
}

// generate a new jwt for the given user data
function getAccessToken({ id, name, partnerId }) {
  return query('Get permissions for user and partner')
    .from('Permission as p')
    .innerJoin('JobFunctionPermission as jfp', 'p.id', 'jfp.permissionId')
    .innerJoin('JobFunction as jf', 'jfp.jobFunctionId', 'jf.id')
    .innerJoin('Job as j', 'j.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'j.personId', 'ps.id')
    .where({ 'ps.userId': id, 'jf.partnerId': partnerId })
    .orderBy(['p.module', 'p.activity'])
    .distinct('p.module', 'p.activity')
    .then(async data => {
      // create a new token
      const token = jwt.sign(
        {
          name,
          permissions: data.map(p => `${p.module}:${p.activity}`),
        },
        config.secret,
        {
          expiresIn: '1 hour',
          issuer: 'https://www.aspect.id',
        }
      )

      return token
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
  const { displayPreferences = {} } = await loadPlugin(
    [_.get(prefs, 'plugin', null)],
    'settings'
  )
  return displayPreferences
}

function updateUser(userId, changedFields) {
  return query('Update user details')
    .from('User as u')
    .where({ 'u.id': userId })
    .update(changedFields)
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
    const passwordsMatch = await bcryptCompare(
      payload.newPassword,
      existingRecord.password
    )
    if (!passwordsMatch) {
      changedFields.password = await bcryptHash(
        payload.newPassword,
        parseInt(config.passwordSaltRounds, 10)
      )
      changedFields.lastPasswordChange = new Date()
      if (existingRecord.legacyPassword) {
        changedFields.legacyPassword = 0
      }
    }
  }
  return changedFields
}

async function updateUsernameAndPasswordForLoggedInUser(request) {
  const { payload } = request

  let loggedInUser = await getUser(request.auth.credentials.name)

  if (!loggedInUser) {
    return Boom.notFound('User not Found')
  }
  const pwResult = await bcryptCompare(
    payload.currentPassword,
    loggedInUser.password
  )
  if (!pwResult) {
    return Boom.forbidden('Incorrect password.')
  }

  if (payload.newUsername) {
    const usernameNotAvailable = await isUsernameAlreadyInUseBySomebodyElse(
      loggedInUser.id,
      payload.newUsername
    )
    if (usernameNotAvailable) {
      return usernameNotAvailable
    }
  }

  const changedFields = await getChangedFields(payload, loggedInUser)
  const now = new Date()
  if (payload.newPassword) {
    const passwordsMatch = await bcryptCompare(
      payload.newPassword,
      loggedInUser.password
    )
    if (!passwordsMatch) {
      changedFields.lockedOut = 0
      changedFields.failedPasswordAttempts = 0
      changedFields.legacyPassword = 0
      changedFields.password = await bcryptHash(
        payload.newPassword,
        parseInt(config.passwordSaltRounds, 10)
      )
      changedFields.lastPasswordChange = now
    }
  }

  if (!_.isEmpty(changedFields)) {
    await updateUser(loggedInUser.id, changedFields)
    loggedInUser = await getUser(changedFields.name || loggedInUser.name)
  }

  const refreshToken = crypto.randomBytes(48).toString('base64')
  const clientId = payload.clientId || uuid.v4()

  await setRefreshToken(
    loggedInUser.id,
    payload.clientName,
    clientId,
    refreshToken,
    now
  )

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
    const inlineImageAttachments = await templateProcessor.getInlineImageAttachments(
      generatedEmail.html
    )

    await emailUtil.sendEmail(
      params.email,
      generatedEmail.subject,
      generatedEmail.html,
      generatedEmail.text,
      inlineImageAttachments
    )

    await query('Save reset password token')
      .from('User as u')
      .where('u.id', users[0].id)
      .update({
        resetPasswordToken,
        resetPasswordTokenExpires: expires,
      })
  } else if (users.length > 1) {
    return Boom.conflict(
      'Could not pinpoint the user from the email address provided'
    )
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
        password: await bcryptHash(
          payload.newPassword,
          parseInt(config.passwordSaltRounds, 10)
        ),
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
  }
  if (userLinkedToPerson) {
    const changedFields = await getChangedFields(payload, userLinkedToPerson)
    if (!_.isEmpty(changedFields)) {
      await updateUser(userLinkedToPerson.id, changedFields)
    }

    responseData.changedFields = Object.keys(
      _.omit(changedFields, ['lastPasswordChange'])
    )
    responseData.username = userLinkedToPerson.name
  } else {
    await query('Insert new user details')
      .from('User')
      .insert({
        name: payload.newUsername,
        password: await bcryptHash(
          payload.newPassword,
          parseInt(config.passwordSaltRounds, 10)
        ),
        approved: 1,
        createdOn: new Date(),
        lockedOut: 0,
        failedPasswordAttempts: 0,
        legacyPassword: 0,
      })

    responseData.changedFields = ['name', 'password']
    responseData.username = payload.newUsername
  }

  return {
    ok: true,
    data: responseData,
  }
}

async function getUserFeatures(request) {
  const { auth } = request
  const { id, name, partnerId } = await getUser(auth.credentials.name)
  const featureModules = await getFeatures(id, name, partnerId)
  return { ok: true, data: featureModules }
}

module.exports = {
  getUser,
  authenticate,
  checkAuthentication,
  refreshToken,
  updateUsernameAndPasswordForLoggedInUser,
  updateUsernameAndPasswordForPerson,
  createResetPasswordToken,
  updatePasswordWithResetPasswordToken,
  getUserFeatures,
  hasFeature,
}
