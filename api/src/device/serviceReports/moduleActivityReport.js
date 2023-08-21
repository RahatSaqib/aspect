const { knex } = require('../../db')
const { filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')
const { moduleDisabledIssues, modulesWithLastResultBeforeMinDate } = require('../common/db')

async function getModuleActivityReportData(minDate, dataConstraints, query) {
  return knex(modulesWithLastResultBeforeMinDate(minDate))
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin(moduleDisabledIssues(), function () {
      this.on('i.deviceId', 'r.deviceId').andOn('i.moduleName', 'r.moduleName')
    })
    .whereNot('dt.externalId', 'GxAlert')
    .distinct([
      'd.name as deviceName',
      knex.raw(`ifnull(r.moduleName, 'N/A') as moduleName`),
      'r.moduleSerial',
      knex.raw('d.lastPingOn as lastSeen'),
      'i.lastIssue',
      'i.dateLastIssue',
    ])
    .groupBy('r.deviceId', 'r.moduleName')
    .orderBy([{ column: 'lastSeen', order: 'desc' }, 'r.deviceId', 'r.moduleName'])

    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      partner: 'p',
    })

    .modify(filterParams, query, {
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
}

module.exports = {
  getModuleActivityReportData,
}
