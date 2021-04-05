const { deviceTypeToId } = require('../../src/shared/dictionary')
module.exports = require('../utils').seed(seed, __filename)

const now = new Date()

async function seed(knex) {
  const { id: geographyId } = await knex('Geography as g')
    .innerJoin('Country as c', 'c.id', 'g.countryId')
    .where({ 'c.a3': 'USA' })
    .first('g.id')
  await knex('DeviceConfiguration').insert({
    deviceTypeId: await deviceTypeToId('CepheidGeneXpert'),
    geographyId,
    data: JSON.stringify({
      EnableInventoryModule: false,
      AspectUploadExcludePatientId: false,
      GxAlertUploadExcludePatientId: false,
    }),
    updatedOn: now,
  })
}
