const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const uuid = require('node-uuid')
const Boom = require('@hapi/boom')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const AWS = require('aws-sdk')
require('isomorphic-fetch')
const logger = require('../shared/logger')
const { messageStatusToId } = require('../shared/dictionary')

const config = require('../config')
const { query, knex } = require('../db')
const { gxAlertAuthenticate, gxAlertHashPassword } = require('./gxalert')
const { LOGIN_HISTORY_CODES, loginHistoryCodeDecorator } = require('./loginHistory')
const { convertTimezonetoIANA } = require('../shared/date')
const { sendEmail } = require('../email/emailUtil')

const clientTypes = {
  reporter_app: 'reporter_app',
  web: 'web',
  true_connect: 'true_connect',
}

const mobileClientTypes = [clientTypes.reporter_app, clientTypes.true_connect]

function isMobileClientType(clientType) {
  return mobileClientTypes.includes(clientType)
}

function isReporterAppClientType(clientType) {
  return clientType === clientTypes.reporter_app
}

const personProps = [
  'p.name as userName',
  'p.culture',
  'p.timezone',
  'tz.timeZone as timezoneIANA',
  'tzPerson.timeZone as personTimezoneIANA',
  'p.id as personId',
  'p.lastPartnerId as partnerId',
  'p.lastCountryId as countryId',
  'g.stateId',
  'p.userId',
  'c.abbreviation as countryAbbreviation',
  'p.phone',
  'p.cell',
  'p.email',
  'p.disabled',
  'p.canLogIn',
]

const userProps = [
  'u.lockedOut',
  'u.failedPasswordAttempts',
  'u.password',
  'u.legacyPassword',
  'u.id',
  'u.name',
  'c.timezone as defaultTimezone',
  ...personProps,
]
const partnerProps = [
  'p.activeStatus',
  'p.statusMessage',
  'p.serviceStartDate',
  'p.serviceEndDate',
  'p.notificationLimit',
  'p.notificationWarningMessage',
]

function getUser(username, options = {}) {
  const { partnerId = false } = options
  return query('Get basic user details')
    .from('User as u')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .leftJoin('Country as c', 'c.id', 'p.lastCountryId')
    .leftJoin('TimeZone as tz', 'tz.id', 'c.timezone')
    .leftJoin('TimeZone as tzPerson', 'tzPerson.id', 'p.timezone')
    .leftJoin('Geography as g', 'g.id', 'p.geographyId')
    .where({ 'u.name': username })
    .modify(q => {
      if (partnerId) q.where('p.lastPartnerId', partnerId)
    })
    .first(userProps)
}

function getPartner(id) {
  return query('Get account status from partner').from('Partner as p').where({ 'p.id': id }).first(partnerProps)
}

function getUserByPersonId(personId) {
  return query('Get user details for person')
    .from('Person as p')
    .innerJoin('User as u', 'p.userId', 'u.id')
    .leftJoin('Country as c', 'c.id', 'p.lastCountryId')
    .leftJoin('TimeZone as tz', 'tz.id', 'c.timezone')
    .leftJoin('TimeZone as tzPerson', 'tzPerson.id', 'p.timezone')
    .leftJoin('Geography as g', 'g.id', 'p.geographyId')
    .where({ 'p.id': personId })
    .first(userProps)
}

function getPersonByPersonId(personId) {
  return query('Get user details for person')
    .from('Person as p')
    .leftJoin('Country as c', 'c.id', 'p.lastCountryId')
    .leftJoin('TimeZone as tz', 'tz.id', 'c.timezone')
    .leftJoin('TimeZone as tzPerson', 'tzPerson.id', 'p.timezone')
    .leftJoin('Geography as g', 'g.id', 'p.geographyId')
    .where({ 'p.id': personId })
    .first(personProps)
}

function getUserByUserId(userId) {
  return query('Get user details for user')
    .from('User as u')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .leftJoin('Country as c', 'c.id', 'p.lastCountryId')
    .leftJoin('TimeZone as tz', 'tz.id', 'c.timezone')
    .leftJoin('TimeZone as tzPerson', 'tzPerson.id', 'p.timezone')
    .leftJoin('Geography as g', 'g.id', 'p.geographyId')
    .where({ 'u.id': userId })
    .first(userProps)
}

function getUserId(username) {
  return query('Get user ID for username').from('User as u').where({ 'u.name': username }).first('u.id')
}

function getTokenExpiry(clientType, currentTime) {
  const expiresTime = isMobileClientType(clientType) ? 30 * 86400000 : 7 * 86400000
  return new Date(currentTime.getTime() + expiresTime)
}

async function serviceModification() {
  try {
    const s3 = new AWS.S3({
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      region: config.aws.region,
    })
    const params = {
      Bucket: config.aws.serviceBucket,
      Key: config.serviceStatusFile,
    }
    const data = await s3.getObject(params).promise()
    const jsonString = data.Body.toString('utf-8')
    const jsonData = JSON.parse(jsonString)

    jsonData.map(async data => {
      const {
        activeStatus,
        statusMessage,
        partnerId,
        serviceStartDate,
        serviceEndDate,
        notificationLimit,
        notificationWarningMessage,
        notificationWarningSendEmails,
      } = data
      // Update the Partner table
      await query('Update partner active status')
        .from('Partner')
        .where({ id: partnerId })
        .update({
          activeStatus,
          statusMessage,
          serviceStartDate,
          serviceEndDate,
          notificationLimit,
          notificationWarningMessage,
          notificationWarningSendEmails: JSON.stringify(notificationWarningSendEmails),
        })
    })
  } catch (error) {
    console.error('Error while updating partner active status:', error)
  }
}

async function serviceNotificationInformation() {
  try {
    const s3 = new AWS.S3({
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      region: config.aws.region,
    })
    const params = {
      Bucket: config.aws.serviceBucket,
      Key: config.serviceStatusFile,
    }
    const data = await s3.getObject(params).promise()
    const jsonString = data.Body.toString('utf-8')
    const jsonData = JSON.parse(jsonString)

    jsonData.map(async data => {
      const {
        partnerId,
        serviceStartDate,
        serviceEndDate,
        notificationLimit,
        notificationWarningMessage,
        notificationWarningSendEmails,
      } = data
      if (!serviceStartDate || !serviceEndDate || !notificationWarningSendEmails || !notificationLimit) return
      // send notification info based on conditions
      const emailList = notificationWarningSendEmails
      const smsMessageCount = await smsCount({ serviceStartDate, serviceEndDate }, partnerId)
      const emailMessageCount = await emailCount({ serviceStartDate, serviceEndDate }, partnerId)
      if (
        smsMessageCount?.count >= notificationLimit &&
        serviceStartDate &&
        new Date(serviceEndDate || '2099-01-01') > new Date()
      ) {
        emailList.forEach(email => {
          sendEmail(email, 'Notification Limit Exceeded', notificationWarningMessage, ``, []).catch(err =>
            logger.error(err)
          )
        })
      }
      if (
        emailMessageCount?.count >= notificationLimit &&
        serviceStartDate &&
        new Date(serviceEndDate || '2099-01-01') > new Date()
      ) {
        emailList.forEach(email => {
          sendEmail(email, 'Notification Limit Exceeded', notificationWarningMessage, ``, []).catch(err =>
            logger.error(err)
          )
        })
      }
    })
  } catch (error) {
    console.error('Error while updating partner active status:', error)
  }
}

async function authenticate(request, response) {
  const { payload } = request
  let user = await getUser(payload.name)
  if (!user || (user.password && user.legacyPassword)) {
    // GxAlert authentication
    if (user && user.password && user.password.includes(';')) {
      const [passwordHash, passwordKey] = user.password.split(';')
      if (gxAlertHashPassword(payload.password, passwordKey) !== passwordHash) {
        return loginHistoryCodeDecorator(
          Boom.unauthorized('Authentication failed. Wrong username or password.'),
          LOGIN_HISTORY_CODES.wrongPassword,
          user.id
        )
      }
      // update user password to the new aspect hashing method
      const pw = await bcrypt.hash(payload.password, parseInt(config.passwordSaltRounds, 10))
      await knex('User').update({ password: pw, legacyPassword: 0 }).where({ id: user.id })
    } else if (config.gxAlertRemoteAuthentication) {
      // The user might exist or not, but try logging in to gxAlert anyway
      try {
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
            Boom.unauthorized('There was a conflict with your GxAlert credentials', JSON.stringify(data)),
            LOGIN_HISTORY_CODES.unexpected
          )
        }

        return loginHistoryCodeDecorator(
          Boom.internal('Authentication failed because an internal server error', JSON.stringify(data)),
          LOGIN_HISTORY_CODES.unexpected
        )
      }
    } else {
      return loginHistoryCodeDecorator(
        Boom.unauthorized('Authentication failed. Wrong username or password.'),
        LOGIN_HISTORY_CODES.wrongPassword
      )
    }
  } else {
    // Aspect
    // this is for "regular" accounts that were either created in aspect
    // or migrated from GxAlert and updated their password
    const pwResult = await bcrypt.compare(payload.password, user.password)

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

  if (user.lockedOut === 1 || user.disabled === 1 || user.canLogIn === 0) {
    return loginHistoryCodeDecorator(
      Boom.forbidden('Your account is locked.'),
      user.lockedOut ? LOGIN_HISTORY_CODES.lockedOut : LOGIN_HISTORY_CODES.disabled,
      user.id
    )
  }

  const now = new Date()
  const refreshToken = crypto.randomBytes(48).toString('base64')
  const { clientType = clientTypes.web, clientName } = payload
  let { clientId } = payload
  clientId = clientId || uuid.v4()
  // handle 'deviceTokenId' only for mobile apps (reporter_app, true_connect)
  let { deviceTokenId = null } = payload
  if (!isMobileClientType(clientType)) {
    deviceTokenId = null
  }

  await query('Update failed password attempts to 0').from('User').where({ id: user.id }).update({
    failedPasswordAttempts: 0,
    lastLogin: now,
    lastActive: now,
  })

  const { permissions } = await getUserPermissions(user.id, user.partnerId)
  if (_.isEmpty(permissions)) {
    return loginHistoryCodeDecorator(
      Boom.expectationFailed('Your credentials were not configured properly. Please, contact your administrator.'),
      LOGIN_HISTORY_CODES.missingPermissions,
      user.id
    )
  }

  const partner = await getPartner(user.partnerId)
  if (partner.activeStatus === 2) {
    return loginHistoryCodeDecorator(
      Boom.forbidden(partner?.statusMessage),
      user.lockedOut ? LOGIN_HISTORY_CODES.lockedOut : LOGIN_HISTORY_CODES.disabled,
      user.id
    )
  }
  let notificationWarningMessage = null
  const smsMessageCount = await smsCount(partner, user.partnerId)

  if (
    smsMessageCount?.count > partner?.notificationLimit ||
    (partner?.serviceStartDate && new Date(partner?.serviceEndDate || '2099-01-01') > new Date())
  ) {
    notificationWarningMessage = partner?.notificationWarningMessage
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

  const accessToken = await getAccessToken(user, clientType)
  const displayPreferences = await getDisplayPreferences(user)

  return {
    access: accessToken,
    refresh: refreshToken,
    clientId,
    clientType,
    culture: user.culture || 'en-US',
    timezone: user.timezone || user.defaultTimezone,
    timezoneIANA: convertTimezonetoIANA(user.timezone || user.defaultTimezone),
    displayPreferences,
    countryId: user.countryId,
    countryAbbreviation: user.countryAbbreviation,
    deviceTokenId,
    userId: user.id,
    personId: user.personId,
    activeStatus: partner.activeStatus,
    statusMessage: partner?.statusMessage,
    notificationWarningMessage,
  }
}

async function smsCount({ serviceStartDate, serviceEndDate }, partnerId) {
  const pendingMessageStatusId = await messageStatusToId('Pending')
  const sentMessageStatusId = await messageStatusToId('Sent')
  const smsCountQuery = knex('SmsMessage as sm')
    .join('Device as d', 'sm.deviceId', 'd.id')
    .andWhere('d.partnerId', partnerId)
    .andWhere('sm.messageStatusId', 'in', [pendingMessageStatusId, sentMessageStatusId])
    .first('*')
    .count('* as count')
  if (serviceStartDate && serviceEndDate) {
    smsCountQuery.where('sm.createdOn', '>', serviceStartDate)
    smsCountQuery.where('sm.createdOn', '<', serviceEndDate)
  }
  return smsCountQuery
}

async function emailCount({ serviceStartDate, serviceEndDate }, partnerId) {
  const pendingMessageStatusId = await messageStatusToId('Pending')
  const sentMessageStatusId = await messageStatusToId('Sent')
  const emailCountQuery = knex('EmailMessage as em')
    .join('Device as d', 'em.deviceId', 'd.id')
    .andWhere('d.partnerId', partnerId)
    .andWhere('em.messageStatusId', 'in', [pendingMessageStatusId, sentMessageStatusId])
    .first('*')
    .count('* as count')
  if (serviceStartDate && serviceEndDate) {
    emailCountQuery.where('em.createdOn', '>', serviceStartDate)
    emailCountQuery.where('em.createdOn', '<', serviceEndDate)
  }
  return emailCountQuery
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
  deviceTokenId = isMobileClientType(clientType) ? deviceTokenId : null
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

  // handle 'deviceTokenId' only for mobile apps
  let { deviceTokenId = null } = request.payload
  if (!isMobileClientType(clientType)) {
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

  const accessToken = await getAccessToken(data, data.clientType)
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
    userId: data.userId,
    personId: data.personId,
  }
}

async function hasPermissions(auth, modules) {
  return _.intersection(auth.credentials.permissions, modules).length > 0
}

// generate a new jwt for the given user data
async function getAccessToken({ id, name, partnerId, personId, userName }, clientType = clientTypes.web) {
  const resolvedClientType = clientType || clientTypes.web
  const { permissions, jobFunctionNames } = await getUserPermissions(id, partnerId)
  const applicableLicense = await getApplicableLicense(personId, partnerId)

  // create a new token
  const token = jwt.sign(
    {
      userId: id,
      personId,
      name,
      fullName: userName,
      jobFunctionNames,
      permissions,
      clientType: resolvedClientType,
      hasToAcceptLicenseId:
        isMobileClientType(resolvedClientType) || !applicableLicense || applicableLicense.acceptedOn
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

async function getUserPermissions(userId, partnerId) {
  return query('Get permissions for user and partner')
    .from('Permission as p')
    .innerJoin('JobFunctionPermission as jfp', 'p.id', 'jfp.permissionId')
    .innerJoin('JobFunction as jf', 'jfp.jobFunctionId', 'jf.id')
    .innerJoin('JobContext as jc', 'jc.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'jc.personId', 'ps.id')
    .where({ 'ps.userId': userId, 'jf.partnerId': partnerId })
    .orderBy(['p.module', 'p.activity'])
    .distinct('p.module', 'p.activity', 'jf.name')
    .then(data => {
      const permissions = []
      const jobFunctionNamesSet = new Set()

      data?.forEach(item => {
        permissions.push(`${item.module}:${item.activity}`)
        jobFunctionNamesSet.add(item.name)
      })

      return { permissions, jobFunctionNames: [...jobFunctionNamesSet] }
    })
}

function getGeographyAccess(personId, partnerId) {
  return query('Get list of geographies which user can access')
    .from('JobContext as jc')
    .innerJoin('JobFunction as jf', 'jc.jobFunctionId', 'jf.id')
    .leftJoin('Geography as g', 'jc.geographyId', 'g.id')
    .leftJoin('Site as s', 'jc.siteId', 's.id')
    .leftJoin('Geography as gs', 's.geographyId', 'gs.id')
    .where('jc.personId', personId)
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

  const partnerPluginName = _.get(prefs, 'plugin', null)

  // If we require onload we get a cycle. This is cached so is safe
  // But it likely could be replaced if we dynamically register plugins
  const { loadPlugin } = require('../plugin/loadPlugin')
  const { displayPreferences = {} } = await loadPlugin(partnerPluginName, undefined, 'settings')
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
        return Boom.conflict('Username already in use', {
          errorKeyCode: 'usernameAlreadyInUse',
        })
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
    const passwordsMatch = await bcrypt.compare(payload.newPassword, existingRecord.password)
    if (!passwordsMatch) {
      changedFields.password = await bcrypt.hash(payload.newPassword, parseInt(config.passwordSaltRounds, 10))
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
  const pwResult = await bcrypt.compare(payload.currentPassword, loggedInUser.password)
  if (!pwResult) {
    // 403 (not 401): user is authenticated; wrong current password must not trigger client logout
    return Boom.forbidden('Incorrect password.')
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
    const passwordsMatch = await bcrypt.compare(payload.newPassword, loggedInUser.password)
    if (!passwordsMatch) {
      changedFields.lockedOut = 0
      changedFields.failedPasswordAttempts = 0
      changedFields.legacyPassword = 0
      changedFields.password = await bcrypt.hash(payload.newPassword, parseInt(config.passwordSaltRounds, 10))
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

  const accessToken = await getAccessToken(loggedInUser, clientType)

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
        password: await bcrypt.hash(payload.newPassword, parseInt(config.passwordSaltRounds, 10)),
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
  const { params, payload, auth } = request

  // Self-service credential changes must go through /auth/update-login-details (requires current password)
  if (Number(params.personId) === Number(auth.credentials.personId)) {
    return Boom.forbidden('Changing your own login details requires your current password')
  }

  // TODO: check access level permissions for currently logged in user
  const responseData = {
    personId: params.personId,
    canLogIn: payload.canLogIn,
  }
  const userLinkedToPerson = await getUserByPersonId(params.personId)
  // Doesn't matter if the user can login or not, the user ID should be kept so we don't end having orphan users with user names that cannot be reused
  let linkedUserId = userLinkedToPerson?.id || null

  // If the use can login, then it is worth to analyze the user credential changes
  if (payload.canLogIn) {
    if (payload.newUsername) {
      const usernameNotAvailable = await isUsernameAlreadyInUseBySomebodyElse(
        userLinkedToPerson ? userLinkedToPerson.id : 0,
        payload.newUsername
      )
      if (usernameNotAvailable) {
        return usernameNotAvailable
      }
    }

    responseData.userLockedOut = payload.userLockedOut

    if (userLinkedToPerson) {
      const changedFields = await getChangedFields(payload, userLinkedToPerson)

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
          password: await bcrypt.hash(payload.newPassword, parseInt(config.passwordSaltRounds, 10)),
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
  }

  await query('update person for details').from('Person').where('id', params.personId).update({
    userId: linkedUserId,
    canLogIn: payload.canLogIn,
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

module.exports = {
  getUser,
  getUserByUserId,
  getUserByPersonId,
  authenticate,
  refreshToken,
  updateUsernameAndPasswordForLoggedInUser,
  updateUsernameAndPasswordForPerson,
  updatePasswordWithResetPasswordToken,
  hasPermissions,
  clientTypes,
  isMobileClientType,
  isReporterAppClientType,
  mobileClientTypes,
  getGeographyAccess,
  getPersonByPersonId,
  getDisplayPreferences,
  serviceModification,
  serviceNotificationInformation,
}
