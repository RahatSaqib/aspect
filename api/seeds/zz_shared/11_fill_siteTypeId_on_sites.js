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

  await knex('SiteType').insert({
    name: 'Clinic',
    externalId: 'clinic',
    ...auditoryFields,
  })

  await knex('SiteType').insert({
    name: 'Warehouse',
    externalId: 'warehouse',
    ...auditoryFields,
  })

  await knex('Site').update({ siteTypeId: siteTypeLabId })
}, __filename)
