const { knex } = require('../../db')
const { filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

async function getModuleActivityReportData(minDate, dataConstraints, query) {
  const modulesWithLastResultBeforeMinDate = knex('Result as r')
    .where('r.endedOn', '<', minDate)
    .select(
      'r.siteId',
      'r.deviceId',
      'r.moduleName',
      'r.moduleSerial',
      knex.raw('max(r.id) as id'),
      knex.raw('max(r.endedOn) as endedOn')
    )
    .groupBy('r.deviceId', 'r.moduleName', 'r.moduleSerial')
    .having('endedOn', '<', minDate) // only bays with last result before minDate -> inactive
    .as('r')

  const moduleDisabledIssues = knex('Issue as i2')
    .join('IssueType as it', 'i2.issueTypeId', 'it.id')
    .where('it.externalId', 'ModuleDisabled')
    .whereIn('i2.id', function () {
      this.max('id').from('Issue').groupByRaw('deviceId, data->>"$.moduleName"')
    })
    .select(
      'i2.id',
      'i2.resultId',
      'i2.deviceId',
      knex.raw('i2.data->>"$.moduleName" as moduleName'),
      'i2.createdOn as dateLastIssue',
      'it.name as lastIssue'
    )
    .as('i')

  return knex(modulesWithLastResultBeforeMinDate)
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin(moduleDisabledIssues, function () {
      this.on('i.deviceId', 'r.deviceId').andOn('i.moduleName', 'r.moduleName')
    })
    .where('dt.externalId', 'CepheidGeneXpert')
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
