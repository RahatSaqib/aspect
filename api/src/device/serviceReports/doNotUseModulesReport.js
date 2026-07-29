const { knex } = require('../../db')
const { filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')
const { modulesWithLastResult, moduleDisabledIssues } = require('../common/db')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../shared/date')

function getDoNotUseModulesReportData(dataConstraints, query, timezone) {
  return knex(modulesWithLastResult())
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin(moduleDisabledIssues(true), function () {
      this.on('i.deviceId', 'r.deviceId').andOn('i.moduleSerial', 'r.moduleSerial')
    })
    .whereNot('dt.externalId', 'GxAlert')
    .distinct([
      'd.name as deviceName',
      's.name as siteName',
      knex.raw(`ifnull(r.moduleName, 'N/A') as moduleName`),
      'r.moduleSerial',
      getDateTimeProjectionInTimeZoneIANA(knex, 'i.dateLastIssue', timezone, 'dateLastIssue'),
      'r.totalTestsRun',
      getDateTimeProjectionInTimeZoneIANA(knex, 'r.endedOn', timezone, 'lastTestUploadedDate'),
    ])
    .groupBy('r.deviceId', 'r.moduleSerial', 'r.moduleName')
    .orderBy([{ column: 'dateLastIssue', order: 'desc' }, 'r.deviceId', 'r.moduleSerial', 'r.moduleName'])
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
