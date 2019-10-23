module.exports = require('../utils').seed(seed, __filename)
const config = require('../../src/config')

const {
  getRandomResults,
  generateResults,
  createDevicesForAllMissingTypes,
} = require('../commonGenerateResults')

const patients = require('./fixtures/patients.json')
const { errorCodes } = require('./fixtures/errorCodes.js')
const { allResultCategoryToId } = require('../../src/shared/dictionary')
const {
  updateMGITAssays,
  getMGITResultFromTBPossitive,
} = require('../commonTB')

const Promise = require('bluebird')
const _ = require('lodash')
// result categories

async function seed(knex) {
  const { Detected: resultCategoryDetectedId } = await allResultCategoryToId()

  const MGITAssays = await knex('Assay')
    .whereIn('externalid', ['assayBdMgitAst', 'assayBdMgitGnd'])
    .select('id')

  const queryBuilderFunction = queryBuilder =>
    queryBuilder
      .whereRaw('RAND()*100<=80')
      .where('r.resultCategory1', resultCategoryDetectedId)

  const results = await getRandomResults(knex, queryBuilderFunction)
  const deviceTypeBDMGIT = await knex('DeviceType')
    .where('externalId', 'BDMGIT')
    .select('id')

  const partners = await knex('Person as p')
    .join('User as u', 'u.id', 'p.userId')
    .where('u.name', 'like', '%admin%')
    .select(
      'p.lastPartnerId as partnerId',
      'u.id as userId',
      'u.name as userName'
    )
    .distinct()
  await Promise.each(partners, async partner => {
    const siteData = await knex('Site')
      .where('partnerId', partner.partnerId)
      .select()
    await createDevicesForAllMissingTypes(knex, siteData, partner.partnerId, {
      createdOn: new Date(),
      createdBy: partner.userId,
      updatedOn: new Date(),
      updatedBy: partner.userId,
    })
  })
  // / this is only for test in development the
  // next lines for generating results are going to be deleted.
  const admin = _.find(partners, part => part.userName === 'admin')

  await generateResults(
    knex,
    admin.userId,
    admin.partnerId,
    patients,
    errorCodes,
    'US',
    config.resultMultiplier,
    config.resultMultiplier,
    config.resultMultiplier
  )
  const devicesMGIT = await knex('Device')
    .where({ deviceTypeId: deviceTypeBDMGIT })
    .select()
  await updateMGITAssays(knex, deviceTypeBDMGIT)
  await Promise.each(results, result => {
    if (devicesMGIT.length > 0)
      knex('Result').insert(
        getMGITResultFromTBPossitive(result, MGITAssays, devicesMGIT)
      )
  })
}
