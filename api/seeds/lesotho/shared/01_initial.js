const Promise = require('bluebird')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const config = require('../../../src/config')
const utils = require('../../utils')
const { partnerTypeToId } = require('../../../src/shared/dictionary')
const {
  upsertGeneXpertDeviceTypeAndAssays,
  commonUpserts,
} = require('../../common')
const geography = require('./fixtures/geography.json')
const tbPartnerVariables = require('../tb/fixtures/partnerData')
const tbGeneXpertPatientDataSchema = require('../tb/fixtures/geneXpertPatientDataSchema.json')
const hivPartnerVariables = require('../hiv/fixtures/partnerData')
const hivGeneXpertPatientDataSchema = require('../hiv/fixtures/geneXpertPatientDataSchema.json')
const upsertPartnerData = require('../../common/upsert_partner_data')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  utils.hasSeededStaticData = true

  const adminDetails = {
    approved: 1,
    createdOn: new Date(),
    lockedOut: 0,
    failedPasswordAttempts: 0,
  }
  const previouslyRunSeeds = await knex('AspectSeed')
    .where('fileName', 'LIKE', `lesotho%`)
    .andWhere(knex.raw('SUBSTRING(fileName, 9)'), 'NOT LIKE', `%/%`)
    .select()
  await Promise.each(previouslyRunSeeds, async previouslyRunSeed => {
    await knex('AspectSeed')
      .where('id', previouslyRunSeed.id)
      .update(
        'fileName',
        knex.raw(`CONCAT('lesotho/tb/', SUBSTRING(fileName, 9))`)
      )
    await knex('AspectSeed').insert({
      ..._.omit(previouslyRunSeed, ['id', 'fileName']),
      fileName: `lesotho/hiv/${previouslyRunSeed.fileName.substring(8)}`,
    })
  })
  const previouslyRunInitialSeed = _.find(
    previouslyRunSeeds,
    previouslyRunSeed => previouslyRunSeed.fileName.endsWith(`/01_initial.js`)
  )
  if (previouslyRunInitialSeed) {
    await knex('AspectSeed').where('id', previouslyRunInitialSeed.id).del()
  }

  await knex('Partner').where('name', 'Lesotho').update({
    name: tbPartnerVariables.partnerName,
  })
  const hivPartnerId = await upsertPartnerData(knex, {
    ...hivPartnerVariables,
    partnerTypeId: await partnerTypeToId('Operating'),
  })

  let { id: hivAdminId } =
    (await knex('User')
      .where('name', hivPartnerVariables.adminUserName)
      .first('id')) || {}
  if (!hivAdminId) {
    ;[hivAdminId] = await knex('User').insert({
      ...adminDetails,
      name: hivPartnerVariables.adminUserName,
      password: bcrypt.hashSync(hivPartnerVariables.adminPassword, saltRounds),
    })
  }
  await commonUpserts(
    knex,
    hivPartnerId,
    hivAdminId,
    geography,
    'LS',
    hivPartnerVariables.gxAlertDeviceApiKey
  )
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    ['GxHiv', 'GxHiv1Vl', 'GxHiv1Qual'],
    hivGeneXpertPatientDataSchema.patientData
  )

  let { id: tbAdminId } =
    (await knex('User')
      .where('name', tbPartnerVariables.adminUserName)
      .first('id')) || {}
  if (!tbAdminId) {
    ;[tbAdminId] = await knex('User').insert({
      ...adminDetails,
      name: tbPartnerVariables.adminUserName,
      password: bcrypt.hashSync(tbPartnerVariables.adminPassword, saltRounds),
    })
  }
  const tbPartnerId = await upsertPartnerData(knex, {
    ...tbPartnerVariables,
    partnerTypeId: await partnerTypeToId('Operating'),
    name: tbPartnerVariables.partnerName,
  })

  await commonUpserts(
    knex,
    tbPartnerId,
    tbAdminId,
    geography,
    'LS',
    tbPartnerVariables.gxAlertDeviceApiKey
  )
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    ['GxUnknown', 'GxMtbRif', 'GxMtbRifUltra'],
    tbGeneXpertPatientDataSchema.patientData
  )
}

module.exports = seed
