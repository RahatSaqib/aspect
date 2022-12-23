/* eslint-disable import/no-dynamic-require */
const fs = require('fs')
const { upsertDashboardWidgets } = require('../common')

const { partnerName } = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)
const relativeReportPath = `../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/dashboardWidget.js`
const absolutePath = `${__dirname}${relativeReportPath.substring(2)}`.replace(/(\/|\\)zz_shared/, '')
function exists(path) {
  return fs.existsSync(path)
}
module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await knex('Partner').where({ name: partnerName }).first()
  const fixture = (await exists(absolutePath)) ? require(relativeReportPath) : {}
  await upsertDashboardWidgets(knex, partnerId, fixture, ['personTitle'])
}, __filename)
