const { deviceApprovalToId, deviceTypeCategoryToId } = require('../../src/shared/dictionary')
const { createClientDeviceApiKey, getOrInsertGeography } = require('../common')

const {
  clientApiDetails,
  partner: { externalId },
  adminUserName,
} = require('./fixtures/partnerData')

async function seed(knex) {
  const { name, token, manufacturer } = clientApiDetails.find(item => (item.id = 'zenysisTestAggregate'))

  const { id: countryId } = await knex('Country').where('abbreviation', 'MZ').first()
  const { id: adminUserId } = await knex('User').where({ name: adminUserName }).first('id')
  const { id: partnerId } = await knex('Partner').where({ externalId }).first('id')

  const geographyId = await getOrInsertGeography(knex, countryId)

  const deviceTypeCategoryClient = await deviceTypeCategoryToId('Client')

  const deviceTypePayload = {
    externalId,
    name,
    manufacturer,
    deviceTypeCategoryId: deviceTypeCategoryClient,
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
    createdBy: adminUserId,
    updatedBy: adminUserId,
    partnerId,
  }

  return createClientDeviceApiKey(knex, { deviceTypePayload, devicePayload, deviceApiKeyPayload })
}

module.exports = require('../utils').seed(seed, __filename)
