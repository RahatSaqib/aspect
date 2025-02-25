module.exports = require('../utils').seed(async knex => {
  // All the admins that are restricted by geography, site, assayType, assay, deviceType, or disease will be changed to regionalAdmins.
  // This seeding file may fail if the JobFunction with externalId 'regionalAdmin' does not exist.
  // If so, check the country's seedings to see why 'regionalAdmin' wasn't created.
  await knex('JobContext as jc')
    .innerJoin('JobFunction as jf', 'jf.id', 'jc.jobFunctionId')
    .leftJoin('Geography as g', 'g.id', 'jc.geographyId')
    .where('jf.externalId', 'superAdmin')
    .andWhere(qb => {
      qb.whereNotNull('g.stateId') // Excluding those that are not geographically restricted.
      qb.orWhereNotNull('siteId')
      qb.orWhereNotNull('assayTypeId')
      qb.orWhereNotNull('assayId')
      qb.orWhereNotNull('deviceTypeId')
      qb.orWhereNotNull('diseaseId')
    })
    .update({
      jobFunctionId: knex('JobFunction').where('externalId', 'regionalAdmin').first('id'),
    })
}, __filename)
