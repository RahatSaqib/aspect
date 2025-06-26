const _ = require('lodash')
const { format, startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO } = require('date-fns')
const { replaceOffset, getDateTimeProjectionInTimeZoneIANA } = require('../shared/date')
const { XDR_RESISTANCES, /* XDR_RESISTANCES_COMBO, */ XDR_RESISTANCE_VALUES } = require('../shared/constants')
const {
  SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY: { mtbNoResultInvalidIndeterminate, mtbErrorByCode, mtbOtherErrorsNotIn },
} = require('../result/query')

const errorCodes = [5011, 5007, 5006, 2008, 2005, 2037, 2025, 2022]
const errorCodesCsv = errorCodes.map(errorCode => `'${errorCode}'`).join(',')
const byErrorCodes = errorCodes.reduce(
  (acc, errorCode) => ({ ...acc, [`${errorCode}`]: mtbErrorByCode(errorCode) }),
  {}
)

// Is slower, but we need to improve the granularMode when a result is updating with new data (endedOn or resultCategories)
const granularMode = false

const getResultBaseQuery = (knex, { deviceId, assayId, resultCategory1, resultCategory2 }) => {
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
    if (granularMode) {
      if (resultCategory1) {
        queryBuilder.where({ resultCategory1 })
      }
      if (resultCategory2) {
        queryBuilder.where({ resultCategory2 })
      }
    }
  })

  return baseQuery.clone()
}

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
  XDR_RESISTANCES.reduce((acc, resistanceName) => {
    XDR_RESISTANCE_VALUES.forEach(resistanceValue => {
      const item = knex.raw(`
          SUM(
            CASE
              WHEN
                (r.resultData ->> '$.allResistances.${resistanceName}') = '${resistanceValue}'
                ${
                  resistanceValue === 'NotDetected'
                    ? `OR (r.resultData ->> '$.allResistances.${resistanceName}') NOT IN ('Detected', 'Indeterminate')`
                    : ''
                }
              THEN 1
              ELSE 0
            END
          ) as cnt_${resistanceName}_${resistanceValue}
        `)

      acc = [...acc, item]
    })
    return acc
  }, [])

const deleteFactResultsDeviceByTimeFrame = (
  knex,
  { dates, deviceId, assayId, resultCategory1, resultCategory2, timeFrame }
) => {
  const deleteQuery = knex('FactResultsDeviceByTimeFrame').where('deviceId', deviceId).andWhere('timeFrame', timeFrame)

  if (granularMode) {
    deleteQuery.whereIn('startedOn', dates)
  }

  deleteQuery.modify(queryBuilder => {
    if (assayId) {
      queryBuilder.where({ assayId })
    }
    if (granularMode) {
      if (resultCategory1) {
        queryBuilder.where({ resultCategory1 })
      }
      if (resultCategory2) {
        queryBuilder.where({ resultCategory2 })
      }
    }
  })

  return deleteQuery.delete()
}

async function calculateTimeFrame(device, assayId, resultCategory1, resultCategory2, endedOn, knex, timeFrame) {
  const { deviceId, siteId, timeZone: timeZoneIANA } = device

  const timeFrameFormat = timeFrame === 'month' ? '%Y-%m-01' : '%Y-%m-%d'
  // ...grouped by assay, resultCategory 1 & 2
  const countsByCategories = await getResultBaseQuery(knex, { deviceId, assayId, resultCategory1, resultCategory2 })
    .leftJoin('Sample as sa', 'r.sampleId', 'sa.id')
    .whereNotNull('r.assayId')
    .whereNotNull('r.resultCategory1')
    .whereRaw('COALESCE(r.endedOn, r.startedOn) IS NOT NULL')
    .groupBy('r.assayId', 'r.resultCategory1', 'r.resultCategory2', 'startedOnTimeFrame', 'r.siteId')
    .count('r.id as resultCount')
    .modify(qb => {
      if (granularMode && endedOn) {
        // If we receive an 'endedOn' value, it indicates that the process was triggered by a result
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
        CASE WHEN sa.originSiteId IS NOT NULL AND sa.originSiteId = ${siteId || 0} THEN 1 ELSE 0 END
      ) as cntSameOriginSite
    `),
      knex.raw(
        `DATE_FORMAT(
        ${getDateTimeProjectionInTimeZoneIANA(knex, knex.raw(`IFNULL(r.endedOn, r.startedOn)`), timeZoneIANA)},
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

  if (countsByCategories.length) {
    /**
     * 1. bulk delete all records for this deviceId for selected dates for current timeFrame
     */
    // get array of unique dates
    const datesToDelete = [...new Set(countsByCategories.map(it => it.startedOnTimeFrame))]
    await deleteFactResultsDeviceByTimeFrame(knex, {
      deviceId,
      assayId,
      resultCategory1,
      resultCategory2,
      timeFrame,
      dates: datesToDelete,
    })

    /**
     * 2. prepare new records
     */
    const factResultsDeviceByTimeFrameToInsert = countsByCategories.map(count => {
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
      const newFactTableRecord = {
        deviceId,
        siteId: count.siteId,
        timeFrame,
        startedOn: count.startedOnTimeFrame,
        assayId: count.assayId,
        resultCategory1: count.resultCategory1,
        resultCategory2: count.resultCategory2,
        resultCount: count.resultCount,
        calculatedOn: format(now, 'yyyy-MM-dd HH:mm:ss'),
        xdrResistanceCounts: JSON.stringify(objCounts),
      }

      return newFactTableRecord
    })

    // Bulk insert
    /**
     * assemble a bulk insert for all values in a single operation
     * TODO: if length of countsByCategories array is too big (i.e. 10.000 or more)
     * then consider assembling bulk insert for each N items.
     * See MySql parameter `max_allowed_packet` for details -
     * https://dev.mysql.com/doc/refman/8.0/en/packet-too-large.html
     */
    if (factResultsDeviceByTimeFrameToInsert.length > 0) {
      await knex('FactResultsDeviceByTimeFrame').insert(factResultsDeviceByTimeFrameToInsert)
    }
  }
}

async function calculateFactResultsDeviceByTimeFrame(
  knex,
  deviceId,
  assayId,
  resultCategory1,
  resultCategory2,
  endedOn
) {
  const device = await knex('Device as d')
    .join('Site as s', 's.id', 'd.siteId')
    .join('Geography as g', 'g.id', 's.geographyId')
    .join('Country as c', 'c.id', 'g.countryId')
    .join('TimeZone as tz', 'c.timezone', 'tz.id')
    .where('d.id', deviceId)
    .first('d.id AS deviceId', 'd.siteId', 'tz.timeZone')

  // make sure device still exists
  if (!device) {
    return
  }

  await calculateTimeFrame(device, assayId, resultCategory1, resultCategory2, endedOn, knex, 'month')
  await calculateTimeFrame(device, assayId, resultCategory1, resultCategory2, endedOn, knex, 'day')
}

module.exports = { calculateFactResultsDeviceByTimeFrame }
