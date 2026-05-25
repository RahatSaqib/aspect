const {
  partner: { externalId: partnerExternalId },
  statsQueryDeviceApiToken,
} = require('./fixtures/partnerData')
module.exports = require('../utils').seed(async knex => {
  const now = new Date()

  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const { partnerId } = await knex('Partner').where('externalId', partnerExternalId).first('id as partnerId')

  const { geographyId } = await knex('Geography as g')
    .join('Country as c', 'c.id', 'g.countryId')
    .where({ stateId: null, 'c.abbreviation': 'PK' })
    .first('g.id as geographyId')

  await knex('DeviceApiKey').insert({
    token: statsQueryDeviceApiToken,
    revoked: 0,
    partnerId,
    geographyId,
    ...auditFields,
  })
}, __filename)
