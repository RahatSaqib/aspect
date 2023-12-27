const { deviceApprovalToId, deviceTypeCategoryToId } = require('../../src/shared/dictionary')
const { createClientDeviceApiKey } = require('../common')

async function seed(knex) {
  const name = 'Zenysis'
  const partnerId = 1
  const token = 'w3wgnd8fnm67mcpfey30'

  const { id: countryId } = await knex('Country').where('abbreviation', 'MZ').first()

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
