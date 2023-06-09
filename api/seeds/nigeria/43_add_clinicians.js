const Promise = require('bluebird')
const bcrypt = require('bcrypt')
const _ = require('lodash')
const clinicians = require('./fixtures/clinicians')
const config = require('../../src/config')
const {
  partner: { externalId: partnerExternalId },
  adminUserName,
  defaultPassword,
} = require('./fixtures/partnerData')
const logger = require('../../src/shared/logger')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await knex('Partner').where('externalId', partnerExternalId).first()
  const {
    culture,
    timezone,
    id: countryId,
  } = await knex('Country').where({ abbreviation: 'NG' }).first('culture', 'timezone', 'id')
  const { id: adminId } = await knex('User').where('name', adminUserName).first()
  const auditFields = {
    createdOn: new Date(),
    createdBy: adminId,
    updatedOn: new Date(),
    updatedBy: adminId,
  }
  const { id: jobFunctionId } = await knex('JobFunction').where('externalId', 'clinician').first()
  await Promise.each(clinicians, async clinician => {
    const now = new Date()
    const [userId] = await knex('User').insert({
      name: clinician.email,
      password: bcrypt.hashSync(defaultPassword, saltRounds),
      approved: 1,
      createdOn: now,
      lockedOut: 0,
      failedPasswordAttempts: 0,
    })
    let { geographyId, id: siteId } =
      (await knex('Site as s').where('name', clinician.site).first('geographyId', 'id')) || {}

    if (!siteId) {
      ;({ geographyId } =
        (await knex('Lga as l')
          .join('Geography as g', 'g.lgaId', 'l.id')
          .where({
            'l.name': clinician.lga,
          })
          .first('g.id as geographyId')) || {})
      ;[siteId] = await knex('Site').insert({
        ...auditFields,
        name: clinician.site.replace(/\w+/g, _.capitalize),
        shortName: clinician.site.substr(0, 45),
        externalId: clinician.site.substr(0, 45),
        partnerId,
        geographyId,
      })
    }
    if (geographyId) {
      const [personId] = await knex('Person').insert({
        name: clinician.officer.replace(/\w+/g, _.capitalize),
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        email: clinician.email,
        cell: clinician.phoneNumber,
        geographyId,
        culture,
        timezone,
        userId,
        canLogIn: 1,
        ...auditFields,
      })
      const [jobId] = await knex('Job').insert({ personId, jobFunctionId })
      await knex('JobContext').insert({ jobId, siteId })
    } else {
      logger.warning(`NOT found geography for:${clinician.lga} and ${clinician.site}`)
    }
  })
}, __filename)
