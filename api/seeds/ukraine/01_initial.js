module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')

const {
  commonUpserts,
  upsertGeneXpertDeviceTypeAndAssays,
} = require('../common')
const { upsertMGITDeviceTypeAndAssays } = require('../commonTB')
const partnerData = require('./fixtures/partnerData')
const upsertPartnerData = require('../common/upsert_partner_data')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const lowerLevelUserPassword = 'TOVpMx3nHP'
const now = new Date()
const { adminUserName, adminPassword, deviceApiToken } = partnerData
async function seed(knex) {
  const partnerId = await upsertPartnerData(knex, {
    ...partnerData,
    partnerTypeId: await partnerTypeToId('Operating'),
  })

  const [adminId] = await knex('User').insert({
    name: adminUserName,
    password: bcrypt.hashSync(adminPassword, saltRounds),
    approved: 1,
    lockedOut: 0,
    failedPasswordAttempts: 0,
    createdOn: now,
  })

  // Common upserts
  await commonUpserts(
    knex,
    partnerId,
    adminId,
    geography,
    'UA',
    deviceApiToken,
    {
      password: lowerLevelUserPassword,
    },
    partnerData
  )

  // GeneXpert
  await upsertGeneXpertDeviceTypeAndAssays(knex, [
    'GxUnknown',
    'GxHcv',
    'GxHiv',
    'GxMtbRif',
    'GxMtbRifUltra',
    'GxHiv1Vl',
    'GxHiv1Qual',
    'GxEbola',
  ])

  // MGIT
  await upsertMGITDeviceTypeAndAssays(knex)
}
