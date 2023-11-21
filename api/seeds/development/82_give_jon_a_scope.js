const Promise = require('bluebird')
const { seed } = require('../utils')

module.exports = seed(async knex => {
  const jonPerson = await knex('Person').where('name', 'jon').first('id')
  const ohioStateGeography = await knex('State as s')
    .join('Geography as g', 'g.stateId', 's.id')
    .where('s.name', 'Ohio')
    .andWhere(qb => qb.whereNull('g.lgaId'))
    .first('g.id')
  await knex('Person').where('id', jonPerson.id).update({ geographyId: ohioStateGeography.id })
  const ohioClinics = await knex('State as st')
    .join('Geography as g', 'g.stateId', 'st.id')
    .join('Site as s', 'g.id', 's.geographyId')
    .where('st.name', 'Ohio')
    .andWhere(qb => qb.where('s.name', 'LIKE', '% Clinic').orWhere('s.name', 'LIKE', '% Hospital'))
    .select('s.id')
  const alabamaClinics = await knex('State as st')
    .join('Geography as g', 'g.stateId', 'st.id')
    .join('Site as s', 'g.id', 's.geographyId')
    .where('st.name', 'Alabama')
    .andWhere(qb => qb.where('s.name', 'LIKE', '% Clinic').orWhere('s.name', 'LIKE', '% Hospital'))
    .select('s.id')
  const clinicSiteType = await knex('SiteType').where('externalId', 'clinic').first('id')
  await knex('Site')
    .whereIn('id', [...alabamaClinics.map(ac => ac.id), ...ohioClinics.map(oc => oc.id)])
    .update({ siteTypeId: clinicSiteType.id })
  const clinicianJobFunction = await knex('JobFunction').where('externalId', 'clinician').first('id')
  await knex('JobContext').where('personId', jonPerson.id).delete()
  const alabamaClinicIds = alabamaClinics.map(ac => ac.id)
  const jonClinicIds = ohioClinics[0] ? [...alabamaClinicIds, ohioClinics[0].id] : alabamaClinicIds
  await Promise.each(jonClinicIds, async clinicId =>
    knex('JobContext').insert({
      jobFunctionId: clinicianJobFunction.id,
      personId: jonPerson.id,
      siteId: clinicId,
    })
  )
}, __filename)
