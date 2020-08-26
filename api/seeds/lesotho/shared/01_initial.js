const Promise = require('bluebird')
const _ = require('lodash')
const { sep } = require('path')
const bcrypt = require('bcrypt')
const config = require('../../../src/config')
const utils = require('../../utils')
const { partnerTypeToId } = require('../../../src/shared/dictionary')
const {
  upsertGeneXpertDeviceTypeAndAssays,
  commonUpserts,
} = require('../../common')
const geography = require('./fixtures/geography.json')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

module.exports = async function (
  knex,
  patientData,
  adminUsername,
  adminPasssword,
  partnerName,
  gxAlertDeviceApiKeyToken
) {
  const previouslyRunSeeds = await knex('AspectSeed')
    .where('fileName', 'LIKE', `lesotho${sep}%`)
    .andWhere(knex.raw('SUBSTRING(fileName, 9)'), 'NOT LIKE', `%${sep}%`)
    .select()
  await Promise.each(previouslyRunSeeds, async previouslyRunSeed => {
    await knex('AspectSeed')
      .where('id', previouslyRunSeed.id)
      .update(
        'fileName',
        knex.raw(`CONCAT('lesotho${sep}tb${sep}', SUBSTRING(fileName, 9))`)
      )
    await knex('AspectSeed').insert({
      ..._.omit(previouslyRunSeed, ['id', 'fileName']),
      fileName: `lesotho${sep}hiv${sep}${previouslyRunSeed.fileName.substring(
        8
      )}`,
    })
  })
  if (
    _.some(previouslyRunSeeds, previouslyRunSeed =>
      previouslyRunSeed.endsWith(`${sep}01_initial.js`)
    )
  ) {
    return
  }
  utils.hasSeededStaticData = true

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: adminUsername,
    password: bcrypt.hashSync(adminPasssword, saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const [partnerId] = await knex('Partner').insert({
    name: partnerName,
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'https://lesotho.aspect.id',
  })
  await commonUpserts(
    knex,
    partnerId,
    adminId,
    geography,
    'LS',
    gxAlertDeviceApiKeyToken
  )
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    [
      'GxUnknown',
      'GxHiv',
      'GxMtbRif',
      'GxMtbRifUltra',
      'GxHiv1Vl',
      'GxHiv1Qual',
    ],
    patientData
  )
}
