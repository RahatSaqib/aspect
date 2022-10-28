const { knex } = require('../../db')
const { filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')
const { joinModuleAvailability } = require('../common/db')

async function getModuleStatusReportData(minDate, maxDate, dataConstraints, query) {
  const moduleReplacedIssuesForPeriod = knex('Issue as issueModuleReplaced')
    .join('IssueType as it', 'issueModuleReplaced.issueTypeId', 'it.id')
    .where('it.name', 'Module Replaced')
    .where('issueModuleReplaced.createdOn', '>=', minDate)
    .where('issueModuleReplaced.createdOn', '<', maxDate)
    .select('issueModuleReplaced.deviceId')
    .count('issueModuleReplaced.id as qty')
    .groupBy('issueModuleReplaced.deviceId')

  return knex('Device as d')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('State as state', 'state.id', 'g.stateId')
    .innerJoin('Lga as lga', 'lga.id', 'g.lgaId')
    .modify(await joinModuleAvailability(dataConstraints, query))
    .leftJoin(moduleReplacedIssuesForPeriod.as('mr'), function () {
      this.on('mr.deviceId', 'd.id')
    })
    .where('dt.externalId', 'CepheidGeneXpert')
    .select([
      'd.name as deviceName',
      'd.serial as deviceSerial',
      'state.name as State',
      'lga.name as Lga',
      knex.raw('ifnull(moduleAvailability.enabled, 0) as functionalModules'),
      knex.raw('ifnull(moduleAvailability.disabled, 0) as disabledModules'),
      knex.raw('ifnull(mr.qty, 0) as replacedModules'),
    ])
    .groupBy('d.id')
    .orderBy(['d.name'])
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
  getModuleStatusReportData,
}
