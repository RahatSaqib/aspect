const _ = require('lodash')
const Promise = require('bluebird')
const { format, startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO } = require('date-fns')
const { replaceOffset, getOffsetFromTimeZone, getDateTimeProjectionInUserTimeZone } = require('../shared/date')
const { XDR_RESISTANCES, /* XDR_RESISTANCES_COMBO, */ XDR_RESISTANCE_VALUES } = require('../shared/constants')
const { SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY } = require('../result/query')

const timeFramesToCalculate = ['month', 'day']

/**
 * commenting out below func which calculates combinations of resistances
 */
// const sumComboXdrResistances = knex =>
//   _.reduce(
//     XDR_RESISTANCES_COMBO,
//     (acc, comboNames) => {
//       const [resistanceName1, resistanceName2] = comboNames.split('_')
//       XDR_RESISTANCE_VALUES.forEach(resistanceValue => {
//         acc = [
//           ...acc,
//           knex.raw(`
//             SUM(
//               CASE
//                 WHEN
//                   (r.resultData ->> '$.allResistances.${resistanceName1}') = '${resistanceValue}'
//                   AND
//                   (r.resultData ->> '$.allResistances.${resistanceName2}') = '${resistanceValue}'
//                 THEN 1
//                 ELSE 0
//               END
//             ) as cnt_${resistanceName1}_${resistanceName2}_${resistanceValue}
//           `),
//         ]
//       })
//       return acc
//     },
//     []
//   )
const sumSingleXdrResistance = knex =>
  _.reduce(
    XDR_RESISTANCES,
    (acc, resistanceName) => {
      XDR_RESISTANCE_VALUES.forEach(resistanceValue => {
        let item
        if (resistanceValue === 'NotDetected') {
          item = knex.raw(`
            SUM(
              CASE
                WHEN 
                  (r.resultData ->> '$.allResistances.${resistanceName}') = '${resistanceValue}'
                  OR
                  (r.resultData ->> '$.allResistances.${resistanceName}') NOT IN ('Detected', 'Indeterminate')
                THEN 1
                ELSE 0
              END
            ) as cnt_${resistanceName}_${resistanceValue}
          `)
        } else {
          item = knex.raw(`
            SUM(
              CASE
                WHEN (r.resultData ->> '$.allResistances.${resistanceName}') = '${resistanceValue}'
                THEN 1
                ELSE 0
              END
            ) as cnt_${resistanceName}_${resistanceValue}
          `)
        }
        acc = [...acc, item]
      })
      return acc
    },
    []
  )

async function calculateFactResultsDeviceByTimeFrame(deviceId, siteId, assayId, resultCategory1, resultCategory2, endedOn, knex) {
  // make sure device still exists
  const device = await knex('Device as d')
    .join('Site as s', 's.id', 'd.siteId')
    .join('Geography as g', 'g.id', 's.geographyId')
    .join('Country as c', 'c.id', 'g.countryId')
    .join('TimeZone as tz', 'c.timezone', 'tz.id')
    .where('d.id', deviceId)
    .first('tz.timeZone', 'd.siteId')
  if (!device) {
    return
  }
  const { timeZone: timeZoneIANA } = device
  const offset = getOffsetFromTimeZone(timeZoneIANA, endedOn)

  const baseQuery = knex('Result as r')
    .join('ResultType as rt', 'rt.id', 'r.resultTypeId')
    .innerJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .leftOuterJoin('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
    .where({ deviceId })
    .where('rt.excluded', false)

  baseQuery.modify(queryBuilder => {
    if (assayId) {
      queryBuilder.where({ assayId })
    }
    if (resultCategory1) {
      queryBuilder.where({ resultCategory1 })
    }
    if (resultCategory2) {
      queryBuilder.where({ resultCategory2 })
    }
  })

  const { mtbNoResultInvalidIndeterminate, mtbErrorByCode, mtbOtherErrorsNotIn } =
    SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY
  const errorCodes = [5011, 5007, 5006, 2008, 2005, 2037, 2025, 2022]
  const errorCodesCsv = errorCodes.map(errorCode => `'${errorCode}'`).join(',')
  const byErrorCodes = _.reduce(
    errorCodes,
    (acc, errorCode) => ({ ...acc, [`${errorCode}`]: mtbErrorByCode(errorCode) }),
    {}
  )

  return Promise.each(timeFramesToCalculate, async timeFrame => {
    const timeFrameFormat = timeFrame === 'month' ? '%Y-%m-01' : '%Y-%m-%d'
    // ...grouped by assay, resultCategory 1 & 2
    const countsByCategories = await baseQuery
      .clone()
      .leftJoin('Sample as sa', 'r.sampleId', 'sa.id')
      .whereNotNull('r.assayId')
      .whereNotNull('r.resultCategory1')
      .groupBy('r.assayId', 'r.resultCategory1', 'r.resultCategory2', 'startedOnTimeFrame')
      .count('r.id as resultCount')
      .modify(qb => {
        if (endedOn) {
          const startOf = timeFrame === 'month' ? startOfMonth : startOfDay
          const endOf = timeFrame === 'month' ? endOfMonth : endOfDay
          qb.whereBetween('r.endedOn', [
            replaceOffset(startOf(parseISO(endedOn)), timeZoneIANA),
            replaceOffset(endOf(parseISO(endedOn)), timeZoneIANA),
          ])
        }
      })
      .select([
        'r.assayId',
        'r.resultCategory1',
        'r.resultCategory2',
        'r.siteId',
        ...sumSingleXdrResistance(knex),
        /**
         * commenting out below line which calculates combinations of resistances
         */
        // ...sumComboXdrResistances(knex),
        knex.raw(`
            SUM(
              CASE
                WHEN 
                  sa.originSiteId IS NOT NULL
                  AND
                  sa.originSiteId = ${device.siteId || 0}
                THEN 1
                ELSE 0
              END
            ) as cntSameOriginSite
          `),
        knex.raw(
          `DATE_FORMAT(
              ${getDateTimeProjectionInUserTimeZone(knex, knex.raw(`IFNULL(r.endedOn, r.startedOn)`), offset)}, 
              "${timeFrameFormat}"
            ) as startedOnTimeFrame`
        ),
      ])
      .select({
        /**
         * same fields as for report `Critical Errors by Device` in
         * api/src/device/serviceReports/getErrorsByDevices.js
         */
        ...byErrorCodes,
        invalidResults: mtbNoResultInvalidIndeterminate,
        otherErrors: mtbOtherErrorsNotIn(errorCodesCsv),
      })
    /**
     * assemble a bulk insert for all values in a single operation
     * TODO: if length of countsByCategories array is too big (i.e. 10.000 or more)
     * then consider assembling bulk insert for each N items.
     * See MySql parameter `max_allowed_packet` for details -
     * https://dev.mysql.com/doc/refman/8.0/en/packet-too-large.html
     */
    if (countsByCategories.length) {
      /**
       * 1. bulk delete all records for this deviceId for selected dates for current timeFrame
       */
      // get string array of unique dates (wrapped with single quot)
      const startedOnDates = [...new Set(countsByCategories.map(it => it.startedOnTimeFrame))].map(
        startedOn => `'${startedOn}'`
      )
      await knex.raw(`
          DELETE FROM FactResultsDeviceByTimeFrame 
          WHERE deviceId = ${deviceId} AND
            timeFrame = '${timeFrame}' AND
            startedOn in (${startedOnDates.join(',')})
        `)
      /**
       * 2. construct bulk insert
       */
      let values = []
      countsByCategories.forEach(count => {
        const objCounts = {
          /**
           * set empty object with the following structure:
           * [resistanceName]: {
           *    detected: CNT1,
           *    indeterminate: CNT2,
           *    notDetected: CNT3,
           * }
           * i.e.:
           * INH: {
           *    detected: 87,
           *    indeterminate: 5,
           *    notDetected: 1234,
           * }
           */
        }
          /**
           * fill all XDR resistance counts
           * ---> add `...XDR_RESISTANCES_COMBO` to below array for counting combination of resistances
           */
          ;[...XDR_RESISTANCES].forEach(resistanceName => {
            // see pattern for field alias in funcs `sumSingleXdrResistance` and `sumComboXdrResistances` above
            const cntDetected = count[`cnt_${resistanceName}_Detected`] || 0
            const cntNotDetected = count[`cnt_${resistanceName}_NotDetected`] || 0
            const cntIndeterminate = count[`cnt_${resistanceName}_Indeterminate`] || 0
            _.set(objCounts, [resistanceName, 'detected'], cntDetected)
            _.set(objCounts, [resistanceName, 'notDetected'], cntNotDetected)
            _.set(objCounts, [resistanceName, 'indeterminate'], cntIndeterminate)
          })
        _.set(objCounts, ['cntSameOriginSite'], count.cntSameOriginSite)
        /**
         * critical errors
         */
        objCounts.errors = {
          invalid: count.invalidResults,
          other: count.otherErrors,
        }
        errorCodes.forEach(errorCode => {
          _.set(objCounts.errors, `${errorCode}`, count[`${errorCode}`])
        })

        const now = new Date()
        /**
         * array `values` with `(...)` strings
         */
        values = [
          ...values,
          `(
              ${deviceId},
              ${count.siteId ?? siteId},
              '${timeFrame}',
              '${count.startedOnTimeFrame}',
              ${count.assayId},
              ${count.resultCategory1},
              ${count.resultCategory2 || 'null'},
              ${count.resultCount},
              '${format(now, 'yyyy-MM-dd HH:mm:ss')}',
              '${JSON.stringify(objCounts)}'
            )`,
        ]
      })
      await knex.raw(`
          INSERT INTO FactResultsDeviceByTimeFrame
            (
              deviceId,
              siteId,
              timeFrame,
              startedOn,
              assayId,
              resultCategory1,
              resultCategory2,
              resultCount,
              calculatedOn,
              xdrResistanceCounts
            )
          VALUES
            ${values.join(',')}
          `)
    }
  })
}

module.exports = calculateFactResultsDeviceByTimeFrame
