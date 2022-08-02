const { format } = require('date-fns')
const _ = require('lodash')
const patients = require('./fixtures/patients.json')
const { errorCodes } = require('./fixtures/errorCodes.js')
const { generateResults, normalizeTreatmentStatusDistributionByResults } = require('../commonGenerateResults')
module.exports = require('../utils').seed(seed, `${__filename}-${format(new Date(), 'yyyy-MM-dd')}`)

async function seed(knex) {
  // Create admin user and audit fields
  const { partnerId } = await knex('Partner as p').where('p.name', 'Wakanda').first('p.id as partnerId')
  const { adminId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where('p.lastPartnerId', partnerId)
    .first('u.id as adminId')

  const results = await generateResults(knex, adminId, partnerId, patients, errorCodes, 'WK', false, 0, 0, 0, 20)
  await normalizeTreatmentStatusDistributionByResults(
    knex,
    await knex('Result as r')
      .join('ResultCategoryAssay as rca', function () {
        this.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
      })
      .whereIn(
        'r.id',
        _.map(results, elem => elem.id)
      )
      .where('rca.requiresTreatment', true)
      .select('r.id', 'r.createdOn', 'r.assayId', 'r.createdBy'),
    85,
    90
  )
}
