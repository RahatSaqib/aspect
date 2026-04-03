module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')

const { commonUpserts, upsertGeneXpertDeviceTypeAndAssays } = require('../common')
const partnerData = require('./fixtures/partnerData')
const upsertPartnerData = require('../common/upsert_partner_data')
const { upsertTruenatDeviceTypeAndAssays } = require('../commonTruenat')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const now = new Date()
const { adminUserName, adminPassword, partnerAbbreviation } = partnerData

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

  await upsertTruenatDeviceTypeAndAssays(knex)
}
