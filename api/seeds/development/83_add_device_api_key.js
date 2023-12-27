const { deviceApprovalToId, deviceTypeCategoryToId } = require('../../src/shared/dictionary')
const { createClientDeviceApiKey } = require('../common')

async function seed(knex) {
  const name = 'Zenysis test'
  const partnerId = 1
  const token = 'v6jp1u0dt8p90nx0tnc0'

  const { id: countryId } = await knex('Country').where('abbreviation', 'US').first()

  const [geographyId] = await knex('Geography').insert({
    countryId,
  })

  const deviceTypeCategoryInformationSystem = await deviceTypeCategoryToId('Client')

  const deviceTypePayload = {
    externalId: name,
    name,
    manufacturer: 'SystemOne',
    deviceTypeCategoryId: deviceTypeCategoryInformationSystem,
  }

  const devicePayload = {
    partnerId,
    geographyId,
    deviceApprovalId: await deviceApprovalToId('approved'),
    name,
    shortName: name,
  }

  const deviceApiKeyPayload = {
    token,
    geographyId,
    revoked: false,
    createdBy: 1,
    updatedBy: 1,
    partnerId,
  }

  return createClientDeviceApiKey(knex, { deviceTypePayload, devicePayload, deviceApiKeyPayload })
}

module.exports = require('../utils').seed(seed, __filename)
