const { knex } = require('../../db')
const { filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')
const { moduleDisabledIssues, modulesWithLastResult } = require('../common/db')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../shared/date')

async function getModuleActivityReportData(dataConstraints, query, timezone) {
  return knex(modulesWithLastResult())
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin(moduleDisabledIssues(), function () {
      this.on('i.deviceId', 'r.deviceId').andOn('i.moduleSerial', 'r.moduleSerial')
    })
    .whereNot('dt.externalId', 'GxAlert')
    .distinct([
      'd.name as deviceName',
      's.name as siteName',
      knex.raw(`ifnull(r.moduleName, 'N/A') as moduleName`),
      'r.moduleSerial',
      getDateTimeProjectionInTimeZoneIANA(knex, 'd.lastPingOn', timezone, 'lastSeen'),
      'i.lastIssue',
      getDateTimeProjectionInTimeZoneIANA(knex, 'i.dateLastIssue', timezone, 'dateLastIssue'),
    ])
    .groupBy('r.deviceId', 'r.moduleSerial', 'r.moduleName')
    .orderBy([{ column: 'lastSeen', order: 'desc' }, 'r.deviceId', 'r.moduleSerial', 'r.moduleName'])

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
