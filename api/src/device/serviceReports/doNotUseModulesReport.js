const { knex } = require('../../db')
const { filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')
const { modulesWithLastResultBeforeMinDate, moduleDisabledIssues } = require('../common/db')

async function getDoNotUseModulesReportData(minDate, dataConstraints, query) {
  return knex(modulesWithLastResultBeforeMinDate(minDate))
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin(moduleDisabledIssues(true), function () {
      this.on('i.deviceId', 'r.deviceId').andOn('i.moduleName', 'r.moduleName')
    })
    .where('dt.externalId', 'CepheidGeneXpert')
    .distinct([
      'd.name as deviceName',
      knex.raw(`ifnull(r.moduleName, 'N/A') as moduleName`),
      'r.moduleSerial',
      'i.dateLastIssue',
      'r.totalTestsRun',
    ])
    .groupBy('r.deviceId', 'r.moduleName')
    .orderBy([{ column: 'dateLastIssue', order: 'desc' }, 'r.deviceId', 'r.moduleName'])
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
  getDoNotUseModulesReportData,
}
