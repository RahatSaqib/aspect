const { upsertTruenatDeviceTypeAndAssays } = require('../commonTruenat')
const { createDevicesForAllMissingTypes } = require('../commonGenerateResults')

module.exports = require('../utils').seed(async knex => {
  await upsertTruenatDeviceTypeAndAssays(knex)
  const { partnerId, countryAbbreviation, userId } = await knex('Person as p')
    .join('User as u', 'p.userId', 'u.id')
    .join('Geography as g', 'p.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('u.name', 'admin')
    .first(
      'p.lastPartnerId as partnerId',
      'c.abbreviation as countryAbbreviation',
      'p.userId'
    )

  const siteDatas = await knex('Site as s')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('s.partnerId', partnerId)
    .where('c.abbreviation', countryAbbreviation)
    .select('s.*')

  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }

  await createDevicesForAllMissingTypes(
    knex,
    siteDatas,
    partnerId,
    auditFields,
    1,
    ['molbioTruenat']
  )
}, __filename)
