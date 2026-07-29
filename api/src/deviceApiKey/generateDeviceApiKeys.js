const _ = require('lodash')

const { knex } = require('../db')
const { randomToken } = require('../deviceApi/apiKey')
const { getUser } = require('../auth/service')

async function generateDeviceApiKeys(request) {
  const { auth, payload } = request

  let geographyId
  if (payload.countryId) {
    ;({ id: geographyId } = await knex('Geography as g')
      .where({
        'g.countryId': payload.countryId,
        'g.stateId': null,
        'g.lgaId': null,
      })
      .first('id'))
  }

  const now = new Date()
  const currentlyLoggedInUser = await getUser(auth.credentials.name)

  const deviceApiKeys = _.times(payload.count).map(() => ({
    token: randomToken(),
    revoked: 0,
    geographyId,
    siteId: payload.siteId,
    partnerId: payload.partnerId,
    createdOn: now,
    createdBy: currentlyLoggedInUser.id,
    updatedOn: now,
    updatedBy: currentlyLoggedInUser.id,
  }))

  await knex('DeviceApiKey').insert(deviceApiKeys)

  return { ok: true }
}

module.exports = {
  generateDeviceApiKeys,
}
