const { deviceApprovalToId, deviceTypeCategoryToId } = require('../../src/shared/dictionary')
const { createClientDeviceApiKey } = require('../common')

const { clientApiDetails } = require('./fixtures/partnerData')

async function seed(knex) {
  const { name, partnerId, token, manufacturer, externalId } = clientApiDetails.find(
    item => (item.id = 'zenysisTestAggregate')
  )

  const { id: countryId } = await knex('Country').where('abbreviation', 'US').first()

  const [geographyId] = await knex('Geography').insert({
    countryId,
  })

  const deviceTypeCategoryInformationSystem = await deviceTypeCategoryToId('Client')

  const deviceTypePayload = {
    externalId,
    name,
    manufacturer,
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
