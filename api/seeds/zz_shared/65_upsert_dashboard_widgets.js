/* eslint-disable import/no-dynamic-require */
const fs = require('fs')
const { upsertDashboardWidgets } = require('../common')

const { partner } = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)
const relativeReportPath = `../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/dashboardWidget.js`
const absolutePath = `${__dirname}${relativeReportPath.substring(2)}`.replace(/(\/|\\)zz_shared/, '')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await knex('Partner').where({ externalId: partner.externalId }).first('id')
  const dashboardWidgets = fs.existsSync(absolutePath) ? require(relativeReportPath) : {}
  await upsertDashboardWidgets(knex, partnerId, dashboardWidgets)
}, __filename)
