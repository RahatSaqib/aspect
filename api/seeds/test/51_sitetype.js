module.exports = require('../utils').seed(async knex => {
  const { id: adminId } = await knex('User').where('name', 'admin').first('id')
  const auditoryFields = {
    createdOn: new Date(),
    updatedOn: new Date(),
    createdBy: adminId,
    updatedBy: adminId,
  }
  const [siteTypeLabId] = await knex('SiteType').insert({
    name: 'Lab',
    externalId: 'lab',
    ...auditoryFields,
  })

  const [siteTypeClinicId] = await knex('SiteType').insert({
    name: 'Clinic',
    externalId: 'clinic',
    ...auditoryFields,
  })

  await knex('SiteType').insert({
    name: 'Warehouse',
    externalId: 'warehouse',
    ...auditoryFields,
  })

  await setAsLabSitesWithDevices(knex, siteTypeLabId)

  await setAsClinicSitesWithoutDevices(knex, siteTypeClinicId)
}, __filename)

async function setAsClinicSitesWithoutDevices(knex, siteTypeClinicId) {
  await knex('Site')
    .update({
      siteTypeId: siteTypeClinicId,
    })
    .whereNull('siteTypeId')
    .where('id', '>', 0)
}

async function setAsLabSitesWithDevices(knex, siteTypeLabId) {
  await knex('Site')
    .update({
      siteTypeId: siteTypeLabId,
    })
    .whereExists(function () {
      this.select('id')
        .from('Device as d')
        .where({ 'd.siteId': knex.raw(`Site.id`) })
    })
    .where('id', '>', 0)
}
