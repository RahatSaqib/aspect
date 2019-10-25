const { format } = require('date-fns')
module.exports = require('../utils').seed(
  seed,
  `${__filename}-${format(new Date(), 'yyyy-MM-dd')}`
)
const patients = require('./fixtures/patients.json')
const { errorCodes } = require('./fixtures/errorCodes.js')

const {
  generateResults,
  normalizeTreatmentStatusDistributionByResults,
} = require('../commonGenerateResults')
const _ = require('lodash')

async function seed(knex) {
  // Create admin user and audit fields
  const users = await knex('User').select('*')
  const adminId = _.sample(users).id

  const partnerOne = await knex('Partner').first()
  const partnerOneId = partnerOne.id
  const results = await generateResults(
    knex,
    adminId,
    partnerOneId,
    patients,
    errorCodes
  )

  // generate random treatment
  await normalizeTreatmentStatusDistributionByResults(knex, results)
}
