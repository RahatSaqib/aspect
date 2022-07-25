module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const _ = require('lodash')
const { getRandomResults, createDevicesForAllMissingTypes } = require('../commonGenerateResults')
const { getMGITResultFromTBPositive } = require('../commonTB')

const { allResultCategoryToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const { Detected: resultCategoryDetectedId, 'Trace Detected': resultCategoryTraceDetectedId } =
    await allResultCategoryToId()
  const MGITAssays = await knex('Assay').whereIn('externalid', ['assayBdMgitAst', 'assayBdMgitGnd']).select('id')
  const queryBuilderFunction = queryBuilder =>
    queryBuilder
      .whereRaw('RAND()*100<=80')
      .whereIn('r.resultCategory1', [resultCategoryDetectedId, resultCategoryTraceDetectedId])

  const results = await getRandomResults(knex, queryBuilderFunction)

  const partner = await knex('Person as p')
    .join('User as u', 'u.id', 'p.userId')
    .where('u.name', 'admin')
    .first('p.lastPartnerId as partnerId', 'u.id as userId', 'u.name as userName')

  const siteData = await knex('Site as s')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('partnerId', partner.partnerId)
    .where('c.A3', 'USA')
    .select('s.*')

  await createDevicesForAllMissingTypes(knex, siteData, partner.partnerId, {
    createdOn: new Date(),
    createdBy: partner.userId,
    updatedOn: new Date(),
    updatedBy: partner.userId,
  })

  const devicesMGIT = await knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where('dt.externalId', 'BDMGIT')
    .select('d.*')

  // adding existing mgit results for tb positive results.
  await Promise.each(results, async result => {
    const elegibleDevices = _.filter(devicesMGIT, device => device.siteId === result.siteId)
    if (elegibleDevices.length > 0)
      await knex('Result').insert(await getMGITResultFromTBPositive(result, MGITAssays, elegibleDevices))
  })
}
