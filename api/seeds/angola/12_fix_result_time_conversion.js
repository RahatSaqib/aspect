module.exports = require('../utils').seed(seed, __filename)
const fixResultTimeConversion = require('../common/20211214_fix_result_time_conversion')

async function seed(knex) {
  await fixResultTimeConversion(knex)
}
