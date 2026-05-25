const {
  partner: { externalId: partnerExternalId },
  statsQueryDeviceApiToken,
} = require('./fixtures/partnerData')
module.exports = require('../utils').seed(async knex => {
  const now = new Date()

  const { deviceApprovalToId, deviceTypeCategoryToId } = require('../../src/shared/dictionary')

  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const { partnerId } = await knex('Partner').where('externalId', partnerExternalId).first('id as partnerId')

  const deviceTypeCategoryInformationSystem = await deviceTypeCategoryToId('Information System')
  const [deviceTypeId] = await knex('DeviceType').insert({
    externalId: 'APIConsumer',
    name: 'API Consumer',
    manufacturer: 'SystemOne',
    plugin: null,
    deviceTypeCategoryId: deviceTypeCategoryInformationSystem,
  })

  const [deviceId] = await knex('Device').insert({
    name: 'API Consumer',
    deviceApprovalId: await deviceApprovalToId('approved'),
    partnerId,
    siteId: null,
    lastPingOn: new Date(),
    lastSeenOn: new Date(),
    deviceTypeId,
    ...auditFields,
  })

  const deviceApiKey = await knex('DeviceApiKey').where('token', statsQueryDeviceApiToken).first('id')
  await knex('Device').where('id', deviceId).update({ deviceApiKeyId: deviceApiKey.id })
}, __filename)
