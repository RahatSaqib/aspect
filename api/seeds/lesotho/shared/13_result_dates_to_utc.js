const resultDatesToUtc = require('../../common/20200821_result_dates_to_utc')

module.exports = async function (knex) {
  await resultDatesToUtc(knex)
}
