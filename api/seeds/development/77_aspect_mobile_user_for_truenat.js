const isEmpty = require('lodash/isEmpty')
const { hashSync } = require('bcrypt')
const Promise = require('bluebird')
const { adminName } = require('./fixtures/partnerData')
const config = require('../../src/config')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  // Look up all the clinics that have TrueNAT results assigned
  // to them but don't have a clinician to report these results to yet
  const truenatResultSites = await knex('DeviceType as dt')
    .join('Assay as a', 'dt.id', 'a.deviceTypeId')
    .join('Result as r', 'a.id', 'r.assayId')
    .join('Site as s', 'r.reportableSiteId', 's.id')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .leftJoin('JobContext as jc', qb => {
      qb.on('s.id', 'jc.siteId').andOn('dt.id', 'jc.deviceTypeId')
    })
    .leftJoin('Job as j', 'jc.jobId', 'j.id')
    .leftJoin('JobFunction as jf', qb => {
      qb.on('j.jobFunctionId', 'jf.id').andOn(knex.raw(`jf.externalId = 'clinician'`))
    })
    .where('dt.externalId', 'molbioTruenat')
    .andWhere(qb => qb.whereNull('jf.id'))
    .select(
      's.id',
      'a.deviceTypeId',
      's.partnerId',
      's.shortName',
      's.geographyId',
      'g.countryId',
      'c.culture',
      'c.timezone'
    )
    .distinct()
  if (!isEmpty(truenatResultSites)) {
    const { id: adminId } = await knex('User').where('name', adminName).first('id')
    const now = new Date()
    const auditFields = {
      createdOn: now,
      createdBy: adminId,
      updatedOn: now,
      updatedBy: adminId,
    }
    const { id: clinicianJobFunctionId } = await knex('JobFunction').where('externalId', 'clinician').first()
    await Promise.each(truenatResultSites, async truenatResultSite => {
      const truenatClinicianName = `${truenatResultSite.shortName} Truenat Clinician`
      const truenatClinician =
        (await knex('Person as p').where('p.name', truenatClinicianName).first('p.id', 'p.userId')) || {}
      if (!truenatClinician.userId) {
        ;[truenatClinician.userId] = await knex('User').insert({
          name: truenatClinicianName,
          password: hashSync('TrueNAT07', saltRounds),
          approved: 1,
          createdOn: now,
          lockedOut: 0,
          failedPasswordAttempts: 0,
        })
      }
      if (!truenatClinician.id) {
        ;[truenatClinician.id] = await knex('Person').insert({
          userId: truenatClinician.userId,
          name: truenatClinicianName,
          geographyId: truenatResultSite.geographyId,
          lastCountryId: truenatResultSite.countryId,
          lastPartnerId: truenatResultSite.partnerId,
          timezone: truenatResultSite.timezone,
          culture: truenatResultSite.culture,
          canLogin: true,
          ...auditFields,
        })
      }
      const job =
        (await knex('Job as j')
          .leftJoin('JobContext as jc', qb => qb.on('j.id', 'jc.jobId').andOn('jc.siteId', truenatResultSite.id))
          .where('j.jobFunctionId', clinicianJobFunctionId)
          .andWhere('j.personId', truenatClinician.id)
          .first('j.id', 'jc.siteId')) || {}
      if (!job.id) {
        ;[job.id] = await knex('Job').insert({
          personId: truenatClinician.id,
          jobFunctionId: clinicianJobFunctionId,
        })
      }
      if (!job.siteId) {
        await knex('JobContext').insert({
          jobId: job.id,
          siteId: truenatResultSite.id,
          deviceTypeId: truenatResultSite.deviceTypeId,
        })
      }
    })
  }
}
