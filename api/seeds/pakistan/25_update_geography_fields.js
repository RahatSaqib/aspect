const { upsertGeography } = require('../common')
const geography = require('./fixtures/geography.json')

async function seed(knex) {
  await upsertGeography(knex, geography)
}

module.exports = require('../utils').seed(seed, __filename)
