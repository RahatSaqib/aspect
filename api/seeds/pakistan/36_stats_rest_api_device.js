const { partnerName, statsQueryDeviceApiToken } = require('./fixtures/partnerData')
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

  const { partnerId } = await knex('Partner').where('name', partnerName).first('id as partnerId')

  const { geographyId } = await knex('Geography as g')
    .join('Country as c', 'c.id', 'g.countryId')
    .whereNull('stateId')
    .whereNull('lgaId')
    .where({ 'c.abbreviation': 'PK' })
    .first('g.id as geographyId')

  const deviceTypeCategoryInformationSystem = await deviceTypeCategoryToId('Information System')
  const [deviceTypeId] = await knex('DeviceType').insert({
    externalId: 'APIConsumer',
    name: 'API Consumer',
    manufacturer: 'SystemOne',
    plugin: null,
    deviceTypeCategoryId: deviceTypeCategoryInformationSystem,
  })

  const { siteId } = await knex('Site as s').where({ externalId: 'Aspect' }).first('s.id as siteId')

  const [deviceId] = await knex('Device').insert({
    name: 'API Consumer',
    deviceApprovalId: await deviceApprovalToId('approved'),
    partnerId,
    geographyId,
    siteId,
    lastPingOn: new Date(),
    lastSeenOn: new Date(),
    deviceTypeId,
    ...auditFields,
  })

  await knex('DeviceApiKey').where('token', statsQueryDeviceApiToken).update({ deviceId })
}, __filename)
