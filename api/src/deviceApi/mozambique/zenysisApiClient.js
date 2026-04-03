const _ = require('lodash')

const { knex } = require('../../db')
const { formatDateOrDefault } = require('../../shared/date')

const getDeviceKeyGeography = auth => {
  return knex('DeviceApiKey as k')
    .leftJoin('Geography as g', 'g.id', 'k.geographyId')
    .where({ 'k.id': auth.credentials.deviceApiKeyId })
    .first('g.countryId')
}

const getTestAggregate = async request => {
  const {
    auth,
    query: { dateFrom, dateTo },
  } = request

  // get countryId for deviceApi key
  const { countryId } = await getDeviceKeyGeography(auth)

  const sites = await knex('Site')
    .leftJoin('Geography as geography', 'geography.id', 'Site.geographyId')
    .leftJoin('Device as device', 'device.siteId', 'Site.id')
    .leftJoin('Result as result', 'result.deviceId', 'device.id')
    .leftJoin('Assay as assay', 'assay.id', 'result.assayId')
    .leftJoin('Lga', 'Lga.id', 'geography.lgaId')
    .leftJoin('State', 'State.id', 'geography.stateId')
    .leftJoin('ResultCategory as rc1', 'rc1.id', 'result.resultCategory1')
    .leftJoin('ResultCategory as rc2', 'rc2.id', 'result.resultCategory2')
    .leftJoin('DeviceApproval as deviceApproval', 'device.deviceApprovalId', 'deviceApproval.id')
    .leftJoin(
      'DeviceMaintenanceStatusLog as deviceMaintenanceStatusLog',
      'device.deviceMaintenanceStatusLogId',
      'deviceMaintenanceStatusLog.id'
    )
    .join(
      'DeviceMaintenanceStatus as deviceMaintenanceStatus',
      'deviceMaintenanceStatusLog.deviceMaintenanceStatusId',
      'deviceMaintenanceStatus.id'
    )
    .join('ResultType as __constraints_ResultType', 'result.resultTypeId', '__constraints_ResultType.id')
    .where(builder => {
      builder
        .whereRaw('IFNULL(result.endedOn, result.startedOn) > ?', dateFrom)
        .andWhereRaw('IFNULL(result.endedOn, result.startedOn) < ?', dateTo)
    })
    .andWhere('assay.externalId', 'in', ['GxMtbRif', 'GxMtbRifUltra'])
    .andWhere(queryBuilder => {
      queryBuilder.whereNull('Site.id').orWhere('Site.disabled', 0)
    })
    .andWhere(queryBuilder => {
      queryBuilder.where('deviceApproval.token', 'approved').orWhereNull('deviceApproval.token')
    })
    .andWhere(queryBuilder => {
      queryBuilder
        .whereNull('deviceMaintenanceStatus.externalId')
        .orWhereNot('deviceMaintenanceStatus.externalId', 'inactiveDecommissioned')
    })
    .andWhere('geography.countryId', countryId)
    .andWhere('__constraints_ResultType.excluded', false)
    .groupBy('Site.id')
    .select({
      province: 'State.name',
      district: 'Lga.name',
      healthFacility: 'Site.name',
      numberOfTests: knex.raw('COUNT(result.id)'),
      numberOfMtbDetected: knex.raw('COALESCE(SUM(rc1.externalId = "Detected"), 0)'),
      numberOfMtbNotDetected: knex.raw('COALESCE(SUM(rc1.externalId = "NotDetected"), 0)'),
      numberOfMtbInvalid: knex.raw('COALESCE(SUM(rc1.externalId = "Invalid"), 0)'),
      numberOfMtbError: knex.raw('COALESCE(SUM(rc1.externalId = "Error"), 0)'),
      numberOfMtbNoResult: knex.raw('COALESCE(SUM(rc1.externalId = "NoResult"), 0)'),
      numberOfRifDetected: knex.raw('COALESCE(SUM(rc2.externalId = "Detected"), 0)'),
      numberOfMtbIndeterminate: knex.raw('COALESCE(SUM(rc2.externalId = "Indeterminate"), 0)'),
    })

  const formattedDate = formatDateOrDefault(new Date(), 'yyyy-MM-dd')

  const testResultsAggregate = _.map(sites, site => {
    const {
      province,
      district,
      healthFacility,
      numberOfTests,
      numberOfMtbDetected,
      numberOfMtbNotDetected,
      numberOfMtbInvalid,
      numberOfMtbNoResult,
      numberOfRifDetected,
      numberOfMtbError,
      numberOfMtbIndeterminate,
    } = site

    return {
      province,
      district,
      health_facility: healthFacility,
      test_results: {
        Tests: numberOfTests,
        Tests_MTB_NOT_DETECTED: numberOfMtbNotDetected,
        Tests_MTB_DETECTED: numberOfMtbDetected,
        Tests_ERROR: numberOfMtbError,
        Tests_NO_RESULT: numberOfMtbNoResult,
        Tests_INVALID: numberOfMtbInvalid,
        Tests_RIF_DETECTED: numberOfRifDetected,
        Tests_RIF_INDETERMINATE: numberOfMtbIndeterminate,
      },
      date: formattedDate,
    }
  })

  return testResultsAggregate
}

module.exports = {
  getTestAggregate,
}
