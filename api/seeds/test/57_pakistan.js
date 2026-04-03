module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('../pakistan/fixtures/geography.json')
const partnerData = require('../pakistan/fixtures/partnerData')

const utils = require('../utils')

const { commonUpserts, upsertGeneXpertDeviceTypeAndAssays } = require('../common')
const upsertPartnerData = require('../common/upsert_partner_data')

const updateReportsAndJobFunctions = require('../common/upsert_reports_and_job_functions')
const jobFunctionFixture = require('../pakistan/fixtures/jobFunctions')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const now = new Date()

async function seed(knex) {
  const { partner, adminPassword, adminUserName, lowerLevelUserPassword, partnerAbbreviation, assayTypes } = partnerData

  const partnerId = await upsertPartnerData(knex, {
    ...partnerData,
    partnerTypeId: await partnerTypeToId('operating'),
  })

  const { id: adminId } = await utils.upsertSingle(
    knex,
    'User',
    { name: `pk_${adminUserName}` },
    {
      name: `pk_${adminUserName}`,
      password: bcrypt.hashSync(adminPassword, saltRounds),
      approved: 1,
      lockedOut: 0,
      failedPasswordAttempts: 0,
      createdOn: now,
    }
  )

  await commonUpserts(
    knex,
    partnerId,
    adminId,
    geography,
    partnerAbbreviation,
    {
      password: lowerLevelUserPassword,
    },
    partnerData
  )

  // GeneXpert
  await upsertGeneXpertDeviceTypeAndAssays(knex, assayTypes)

  await updateReportsAndJobFunctions(knex, jobFunctionFixture, partner.externalId)

  const { id: personId } = await knex('Person').where('userId', adminId).first('id')
  const { id: licenseId } = await knex('License')
    .where('partnerId', partnerId)
    .orWhereNull('partnerId')
    .orderBy('partnerId', 'desc')
    .orderBy('createdOn', 'desc')
    .first('id')
  await knex('LicensePerson').insert({
    personId,
    licenseId,
    ip: '127.0.0.1',
    acceptedOn: new Date(),
  })
}
