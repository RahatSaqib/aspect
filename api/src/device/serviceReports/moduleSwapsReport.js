const { parseISO, subMonths } = require('date-fns')
const { knex, sortPageParams } = require('../../db')
const { getDeviceBaseExtendedQuery } = require('../common/db')
const { issueTypeToId } = require('../../shared/dictionary')

async function getModuleSwapsReportData(dataConstraints, query) {
  const {
    minDate,
    maxDate,
    minDateFormatted = minDate || subMonths(new Date(), 12),
    maxDateFormatted = maxDate ? parseISO(maxDate) : new Date(),
  } = query

  const issueTypeId = await issueTypeToId('ModuleReplaced')
  // get rows
  const swaps = await getDeviceBaseExtendedQuery(query, dataConstraints)
    .innerJoin('Issue as i', 'i.deviceId', 'd.id')
    .join('Result as newModuleResult', 'i.resultid', 'newModuleResult.id')
    .join('Result as oldResult', builder => builder.on(knex.raw('i.data->>"$.oldResultId" = oldResult.id ')))
    .select(
      'd.name as deviceName',
      'd.serial',
      's.id as siteId',
      's.name as siteName',
      'newModuleResult.moduleName',
      'newModuleResult.instrumentSerial',
      'newModuleResult.moduleSerial as newModuleSerial',
      'oldResult.moduleSerial as oldModuleSerial',
      knex.raw(
        'DATEDIFF(COALESCE(newModuleResult.endedOn,newModuleResult.startedOn), COALESCE(oldResult.endedOn,oldResult.startedOn)) as daysDifference'
      ),
      'da.name as deviceApprovalStatus',
      knex.raw('COALESCE(newModuleResult.endedOn,newModuleResult.startedOn) as lastResultNewModule'),
      knex.raw('COALESCE(oldResult.endedOn,oldResult.startedOn) as lastResultOldModule')
    )
    .andWhere(knex.raw('i.createdOn between ? and ?', [minDateFormatted, maxDateFormatted]))
    .andWhere('i.issueTypeId', issueTypeId)
    .modify(sortPageParams, query, 'name')

  const totalModuleSwaps = swaps.length
  const numberOfSites = new Set(swaps.map(s => s.siteId)).size

  return {
    data: {
      rows: swaps,
      totalModuleSwaps,
      numberOfSites,
    },
  }
}

module.exports = {
  getModuleSwapsReportData,
}
