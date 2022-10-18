const { format } = require('date-fns')
module.exports = require('../utils').seed(seed, `${__filename}-${format(new Date(), 'yyyy-MM-dd')}`)
const _ = require('lodash')
const Promise = require('bluebird')
const patients = require('./fixtures/patients.json')
const { errorCodes } = require('./fixtures/errorCodes.js')
const { resultCategoryToId } = require('../../src/shared/dictionary')
const { generateResults, normalizeTreatmentStatusDistributionByResults } = require('../commonGenerateResults')
const { getMGITResultFromTBPositive } = require('../commonTB')

async function seed(knex) {
  // Create admin user and audit fields
  const users = await knex('User').select('*')
  const adminId = _.sample(users).id

  const partnerOne = await knex('Partner').first()
  const partnerOneId = partnerOne.id
  const results = await generateResults(knex, adminId, partnerOneId, patients, errorCodes)
  const MGITAssays = await knex('Assay').whereIn('externalid', ['assayBdMgitAst', 'assayBdMgitGnd']).select('id')

  const devicesMGIT = await knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where('dt.externalId', 'BDMGIT')
    .select('d.*')

  const tbResults = await knex('Result as r')
    .join('Assay as a', 'r.assayId', 'a.id')
    .join('AssayType as at', 'a.assayTypeId', 'at.id')
    .whereIn(
      'r.id',
      _.map(
        _.filter(results, elem => elem),
        elem => elem.id
      )
    )
    .where('at.externalId', 'assayTypeMtbRif')
    .where('r.resultCategory1', await resultCategoryToId('Detected'))
    .select('r.*')

  await Promise.each(tbResults, async result => {
    if (devicesMGIT.length > 0 && MGITAssays && MGITAssays.length > 0)
      return knex('Result').insert(await getMGITResultFromTBPositive(result, MGITAssays, devicesMGIT))
  })

  // generate random treatment
  await normalizeTreatmentStatusDistributionByResults(knex, results)
}
