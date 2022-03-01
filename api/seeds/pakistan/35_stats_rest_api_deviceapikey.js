const partnerData = require('./fixtures/partnerData')
module.exports = require('../utils').seed(async knex => {
  const now = new Date()

  const { id: adminId } = await knex('User')
    .where({ name: 'admin' })
    .first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const { partnerId } = await knex('Partner')
    .where('name', partnerData.partnerName)
    .first('id as partnerId')

  const { geographyId } = await knex('Geography')
    .where({ stateId: null, countryId: 1 })
    .first('id as geographyId')

  await knex('DeviceApiKey').insert({
    token: 'kcf2ve9wy96pp800kdk0',
    revoked: 0,
    partnerId,
    geographyId,
    deviceId: null,
    ...auditFields,
  })
}, __filename)
