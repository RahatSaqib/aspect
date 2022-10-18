const { get } = require('lodash')
const { upsertJobFunctionFixture } = require('../common')
const partnerData = require('./fixtures/partnerData')

const seed = async knex => {
  const { id: partnerId } = await knex('Partner').where({ name: partnerData.partnerName }).first('id')
  if (partnerId) {
    await upsertJobFunctionFixture(knex, get(partnerData.fixtures, 'jobFunctions'), partnerId)
  }
}

module.exports = require('../utils').seed(seed, __filename)
