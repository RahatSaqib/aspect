const _ = require('lodash')
const bcrypt = require('bcrypt')
const addMinutes = require('date-fns/addMinutes')

const { knex } = require('../db')

async function lookupUsingCredentials(username, password) {
  const nowTime = new Date().getTime()
  const deviceApiKey = await knex('DeviceApiKey as dak')
    .leftJoin('Device as d', 'd.deviceApiKeyId', 'dak.id')
    .where('dak.username', username)
    .first('dak.*', 'd.id as deviceId')

  const pwResult = deviceApiKey
    ? await bcrypt.compare(password, _.get(deviceApiKey, 'password')).catch(() => false)
    : false

  if (!deviceApiKey || !pwResult) {
    return {
      authenticated: false,
      reason: 'invalid',
      data: deviceApiKey,
    }
  }

  if (deviceApiKey.revoked) {
    return {
      authenticated: false,
      reason: 'revoked',
      data: deviceApiKey,
    }
  }

  if (deviceApiKey.expiresOn < nowTime) {
    const newExpiresOn = addMinutes(new Date(), 15)
    deviceApiKey.expiresOn = newExpiresOn
    await knex('DeviceApiKey').where('id', deviceApiKey.id).update({
      expiresOn: newExpiresOn,
    })
  }

  return {
    authenticated: true,
    data: deviceApiKey,
  }
}

module.exports = {
  lookupUsingCredentials,
}
