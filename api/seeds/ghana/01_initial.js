module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const jobFunctionsFixture = require('../fixtures/jobFunctions')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')

const { commonUpserts, upsertGeneXpertDeviceTypeAndAssays, baseGxAlertMigration } = require('../common')
const partnerData = require('./fixtures/partnerData')
const upsertPartnerData = require('../common/upsert_partner_data')
const { upsertTruenatDeviceTypeAndAssays } = require('../commonTruenat')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const now = new Date()
const { adminUserName, adminPassword, deviceApiToken, partnerAbbreviation } = partnerData

async function seed(knex) {
  const partnerId = await upsertPartnerData(knex, {
    ...partnerData,
    partnerTypeId: await partnerTypeToId('operating'),
  })
  const [adminId] = await knex('User').insert({
    name: adminUserName,
    password: bcrypt.hashSync(adminPassword, saltRounds),
    approved: 1,
    lockedOut: 0,
    failedPasswordAttempts: 0,
    createdOn: now,
  })

  await commonUpserts(knex, partnerId, adminId, geography, partnerAbbreviation, null, partnerData)

  await baseGxAlertMigration(
    {
      admin: {
        name: adminUserName,
        password: adminPassword,
      },
      partner: {
        name: partnerData.partner.name,
        externalId: partnerData.partner.externalId,
        serverUrl: partnerData.serverUrl,
      },
      geographyFromGxAlert: geography,
      gxAlertDevice: {
        deviceApiKeyToken: deviceApiToken,
      },
      sitesFromGxAlert,
      jobFunctionsFixture,
      contactsFromGxAlert,
    },
    knex,
    partnerData
  )

  await upsertGeneXpertDeviceTypeAndAssays(knex, [
    'GxUnknown',
    'GxHcv',
    'GxHiv',
    'GxMtbRif',
    'GxMtbRifUltra',
    'GxMtbXdr',
    'GxHiv1Vl',
    'GxHiv1Qual',
    'GxEbola',
    'assayGXCovid19',
  ])

  return upsertTruenatDeviceTypeAndAssays(knex)
}
