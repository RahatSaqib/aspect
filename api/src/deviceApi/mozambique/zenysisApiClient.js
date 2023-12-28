const Boom = require('@hapi/boom')
const _ = require('lodash')

const { knex } = require('../../db')
const { formatDateOrDefault } = require('../../shared/date')
const { addConstraints } = require('../../auth/constraints')

const caseBuilder = condition => {
  return `SUM(CASE WHEN ${condition} THEN 1 ELSE 0 END)`
}

const getDeviceKeyGeography = auth => {
  return knex('DeviceApiKey as k')
    .leftJoin('Geography as g', 'g.id', 'k.geographyId')
    .where({ 'k.id': auth.credentials.keyId })
    .first('g.countryId', 'g.stateId', 'g.lgaId')
}

const getTestAggregate = async request => {
  const {
    auth,
    query: { dateFrom, dateTo },
  } = request

  // get geography for deviceApi key
  const { countryId, stateId, lgaId } = await getDeviceKeyGeography(auth)

  if (stateId || lgaId) {
    throw Boom.unauthorized('Invalid Credentials')
  }

  const sites = await knex('Site')
    .leftJoin('Geography as geography', 'geography.id', 'Site.geographyId')
    .leftJoin('Device as device', 'device.siteId', 'Site.id')
    .leftJoin('Result as result', 'result.deviceId', 'device.id')
    .leftJoin('Assay as assay', 'assay.id', 'result.assayId')
    .leftJoin('Lga', 'Lga.id', 'geography.lgaId')
    .leftJoin('State', 'State.id', 'geography.stateId')
    .leftJoin('ResultCategory as rc1', 'rc1.id', 'result.resultCategory1')
    .leftJoin('ResultCategory as rc2', 'rc2.id', 'result.resultCategory2')
    .where(builder => {
      builder
        .whereRaw('IFNULL(result.endedOn, result.startedOn) > ?', dateFrom)
        .andWhereRaw('IFNULL(result.endedOn, result.startedOn) < ?', dateTo)
    })
    .andWhere('assay.externalId', 'in', ['GxMtbRif', 'GxMtbRifUltra'])
    .groupBy('Site.id')
    .modify(
      addConstraints,
      { country: { id: countryId } },
      {
        result: 'result',
        device: 'device',
        geography: 'geography',
      },
      {
        external: true,
      }
    )
    .select(
      'State.name as province',
      'Lga.name as district',
      'Site.name as healthFacility',
      knex.raw(`${caseBuilder('result.id IS NOT NULL')} as numberOfTests`),
      knex.raw(`${caseBuilder("rc1.externalId = 'Detected'")} as numberOfMtbDetected`),
      knex.raw(`${caseBuilder("rc1.externalId = 'NotDetected'")} as numberOfMtbNotDetected`),
      knex.raw(`${caseBuilder("rc1.externalId = 'Invalid'")} as numberOfMtbInvalid`),
      knex.raw(`${caseBuilder("rc1.externalId = 'Error'")} as numberOfMtbError`),
      knex.raw(`${caseBuilder("rc1.externalId = 'NoResult'")} as numberOfMtbNoResult`),
      knex.raw(`${caseBuilder("rc2.externalId = 'Detected'")} as numberOfRifDetected`),
      knex.raw(`${caseBuilder("rc2.externalId = 'Indeterminate'")} as numberOfMtbIndeterminate`)
    )

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
