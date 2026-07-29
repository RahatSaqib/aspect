const _ = require('lodash')
const { knex, sortPageParams, filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')
const { getBasicsForDevicesReport } = require('../common/db')
const { getBaseQueryForFactResultsDeviceByTimeFrame } = require('../../fact/common/db')
const { allResultCategoryToId } = require('../../shared/dictionary')

async function getErrorsByDevices(dataConstraints, query) {
  const { deviceQuery } = await getBasicsForDevicesReport(dataConstraints, query)
  const resultCategoryIds = await allResultCategoryToId()
  const errorCodes = [5011, 5007, 5006, 2008, 2005, 2037, 2025, 2022]

  const invalidCategories = query.noResults
    ? [resultCategoryIds.Invalid, resultCategoryIds.Indeterminate]
    : [resultCategoryIds.Invalid, resultCategoryIds.Indeterminate, resultCategoryIds.NoResult]

  const allCounts = getBaseQueryForFactResultsDeviceByTimeFrame(knex, {
    addConstraints,
    dataConstraints,
    filterParams,
    query,
    timeFrame: 'day',
  })
    .modify(filterParams, query, {
      assayIds: 'a.id',
    })
    .groupBy('r.deviceId')
    .sum({
      ..._.reduce(
        errorCodes,
        (acc, errorCode) => ({
          ...acc,
          [`${errorCode}`]: knex.raw(`
              CASE
                WHEN r.resultCategory1 = ${resultCategoryIds.Error}
                THEN r.xdrResistanceCounts ->> '$.errors."${errorCode}"'
                ELSE 0
              END`),
        }),
        {}
      ),
      otherErrors: knex.raw(`
        CASE
          WHEN r.resultCategory1 = ${resultCategoryIds.Error}
          THEN r.xdrResistanceCounts ->> "$.errors.other"
          ELSE 0
        END`),
      invalidResults: knex.raw(`
        CASE
          WHEN r.resultCategory1 IN (${invalidCategories})
          THEN r.xdrResistanceCounts ->> "$.errors.invalid"
          ELSE 0
        END`),
      noResults: knex.raw(`
        CASE
          WHEN r.resultCategory1 IN (${resultCategoryIds.NoResult}) THEN r.xdrResistanceCounts ->> "$.errors.invalid"
          ELSE 0
        END`),
    })
    .select('d.id as deviceId')

  const data = await deviceQuery
    .leftJoin(allCounts.as('counts'), 'd.id', 'counts.deviceId')
    .modify(sortPageParams, query, 'd.name')
    .distinct({
      ..._.reduce(
        errorCodes,
        (acc, errorCode) => ({
          ...acc,
          [`${errorCode}`]: knex.raw(`IFNULL(counts.\`${errorCode}\`, 0)`),
        }),
        {}
      ),
      otherErrors: knex.raw('IFNULL(counts.otherErrors, 0)'),
      invalidResults: knex.raw('IFNULL(counts.invalidResults, 0)'),
      noResults: knex.raw('IFNULL(counts.noResults, 0)'),
      deviceName: 'd.name',
      siteName: 's.name',
      /**
       * should select also device id for returning `distinct` entries, because
       * same device name with same counts may be found in different locations.
       */
      deviceId: 'd.id',
    })

  return data
}

module.exports = {
  getErrorsByDevices,
}
