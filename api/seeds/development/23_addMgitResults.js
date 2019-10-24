module.exports = require('../utils').seed(seed, __filename)

const {
  getRandomResults,
  createDevicesForAllMissingTypes,
} = require('../commonGenerateResults')
const { getMGITResultFromTBPossitive } = require('../commonTB')

const { allResultCategoryToId } = require('../../src/shared/dictionary')
const Promise = require('bluebird')

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

  const devicesMGIT = await knex('Device')
    .where({ deviceTypeId: deviceTypeBDMGIT })
    .select()
  // adding existing mgit results for tb possitive results.
  await Promise.each(results, async result => {
    if (devicesMGIT.length > 0)
      knex('Result').insert(
        await getMGITResultFromTBPossitive(result, MGITAssays, devicesMGIT)
      )
  })
}
