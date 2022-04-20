const { knex } = require('../../db')
const { filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

function getModuleActivityReportData(minDate, dataConstraints, query) {
  const maxResultBeforeMinDateSubquery = knex('Result as r')
    .where('r.endedOn', '<', minDate)
    .max('id')
    .groupBy('r.deviceId', 'r.moduleName')

  return knex('Result as r')
    .whereIn('r.id', maxResultBeforeMinDateSubquery)
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin(
      'Issue as i',
      'i.id',
      knex('Issue as ilast')
        .whereRaw('ilast.deviceId = r.deviceId')
        .andWhereRaw('ilast.data->>"$.moduleName" = r.moduleName')
        .max('ilast.id')
    )
    .leftJoin('IssueType as it', queryBuilder => {
      queryBuilder
        .on('it.id', 'i.issueTypeId')
        .andOn('it.externalId', knex.raw('?', 'ModuleDisabled'))
    })
    .whereNotExists(function () {
      // filter bays with results beyond mindate
      this.from('Result as r2')
        .whereRaw('r2.deviceId = r.deviceId')
        .whereRaw('r2.moduleName = r.moduleName')
        .where('r2.endedOn', '>', minDate)
    })
    .where('dt.externalId', 'CepheidGeneXpert')
    .select([
      'd.name as deviceName',
      knex.raw(`ifnull(r.moduleName, 'N/A') as moduleName`),
      'r.moduleSerial',
      knex.raw('max(r.endedOn) as lastSeen'),
      'it.name as lastIssue',
      'i.updatedOn as dateLastIssue',
    ])
    .groupBy('r.deviceId', 'r.moduleName')
    .orderBy([
      { column: 'lastSeen', order: 'desc' },
      'r.deviceId',
      'r.moduleName',
    ])
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
