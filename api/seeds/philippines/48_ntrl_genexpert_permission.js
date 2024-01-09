const Promise = require('bluebird')

delete require.cache[require.resolve('../../src/shared/dictionary')]
const { deviceTypeToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  // get all jobs contexts that only have access to the NTRL device type and not the GeneXpert
  const deviceTypeIdNtrl = await deviceTypeToId('PhilippinesNtrl')
  const deviceTypeIdGeneXpert = await deviceTypeToId('CepheidGeneXpert')

  const jobContextIdsWithAccessToGeneXpert = await knex('JobContext')
    .where('deviceTypeId', deviceTypeIdGeneXpert)
    .select('id')

  const jobContextsWithAccessToNtrlOnly = await knex('JobContext')
    .where('deviceTypeId', deviceTypeIdNtrl)
    .whereNotIn('id', jobContextIdsWithAccessToGeneXpert)
    .select()

  // now, give all jobs that have access to NTRL also access to the GeneXpert device type:
  await Promise.each(jobContextsWithAccessToNtrlOnly, async jc => {
    await knex('JobContext').insert({
      personId: jc.personId,
      jobFunctionId: jc.jobFunctionId,
      geographyId: jc.geographyId,
      siteId: jc.siteId,
      assayTypeId: jc.assayTypeId,
      assayId: jc.assayid,
      deviceTypeId: deviceTypeIdGeneXpert,
      diseaseId: jc.diseaseId,
    })
  })
}

module.exports = require('../utils').seed(seed, __filename)
