const _ = require('lodash')
const bcrypt = require('bcrypt')

const { knex } = require('../db')

async function lookupUsingCredentials(username, password) {
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

  return {
    authenticated: true,
    data: deviceApiKey,
  }
}

module.exports = {
  lookupUsingCredentials,
}
