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
  const jonsJobs = await knex('Job').where('personId', jonPerson.id).select('id')
  await knex('JobContext')
    .whereIn(
      'jobId',
      jonsJobs.map(j => j.id)
    )
    .delete()
  await knex('Job')
    .whereIn(
      'id',
      jonsJobs.map(j => j.id)
    )
    .delete()
  const [jonsNewJobId] = await knex('Job').insert({
    jobFunctionId: clinicianJobFunction.id,
    personId: jonPerson.id,
  })
  await Promise.each([...alabamaClinics.map(ac => ac.id), ohioClinics[0].id], async clinicId =>
    knex('JobContext').insert({
      jobId: jonsNewJobId,
      siteId: clinicId,
    })
  )
}, __filename)
