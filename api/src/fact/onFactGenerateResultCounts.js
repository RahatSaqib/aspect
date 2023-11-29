const _ = require('lodash')
const Promise = require('bluebird')
const { subDays, startOfMonth, endOfMonth, parseISO } = require('date-fns')
const {
  startOfDayUtc,
  slideDateToTimeZoneISO,
  getOffsetFromTimeZone,
  getDateTimeProjectionInUserTimeZone,
} = require('../shared/date')
const { resultWorkflowStatusToId } = require('../shared/dictionary')
const { XDR_RESISTANCES, /* XDR_RESISTANCES_COMBO, */ XDR_RESISTANCE_VALUES } = require('../shared/constants')
const { daysToCalculate } = require('./common/constants')
const { factGenerateResultCounts } = require('./actions')

const daysToCalculateCountOfDeliveredResults = [30, 60]
const timeFramesToCalculate = ['month']

async function onFactGenerateResultCounts(action, context) {
  if (action.deviceId != null) {
    // specialization if device id specified, otherwise query for devices below.
    return onFactGenerateResultCountsForDevice(action, context)
  }
  const messageContext = context.messageContext.bindActionCreators({
    factGenerateResultCounts,
  })
  return messageContext.run(async knex => {
    const items = await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .where('dtc.hasResults', 1)
      .select('d.id as deviceId')
    await Promise.each(items, async ({ deviceId }) => messageContext.factGenerateResultCounts(deviceId))
  })
}

async function onFactGenerateResultCountsForDevice({ deviceId, options = {} }, { messageContext }) {
  const { assayId, resultCategory1, resultCategory2, endedOn: resultEndedOn } = options
  return messageContext.transact(async knex => {
    const now = new Date()

    const { timeZone: timeZoneIANA } = await knex('Device as d')
      .join('Geography as g', 'g.id', 'd.geographyId')
      .join('Country as c', 'c.id', 'g.countryId')
      .join('TimeZone as tz', 'c.timezone', 'tz.id')
      .first('tz.timeZone')
      .where('d.id', deviceId)

    const offset = getOffsetFromTimeZone(timeZoneIANA, resultEndedOn)

    const query = knex('Result as r')
      .join('ResultType as rt', 'rt.id', 'r.resultTypeId')
      .where({ deviceId })
      .where('rt.excluded', false)

    query.modify(queryBuilder => {
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

    // calculate by device - make sure it still exists
    const device = await knex('Device').where({ id: deviceId }).first('deviceId')
    if (!device) {
      return
    }

    await messageContext.initDictionaryTables()

    await Promise.each(daysToCalculate, async days => {
      const from = slideDateToTimeZoneISO(startOfDayUtc(subDays(now, days)), timeZoneIANA)

      // query for selecting data for the device
      const query = knex('Result as r')
        .join('ResultType as rt', 'rt.id', 'r.resultTypeId')
        .where('r.deviceId', deviceId)
        .where('r.endedOn', '>=', from)
        .where('rt.excluded', false)
      const factResultsDevice = {
        calculatedOn: now,
      }
      if (daysToCalculateCountOfDeliveredResults.includes(days)) {
        const deliveredResultWorkfowStatusId = await resultWorkflowStatusToId('Delivered')
        const countByDevice = (await query
          .clone()
          .leftJoin('ResultWorkflowLog as rwl', queryBuilder => {
            queryBuilder
              .on('r.resultWorkflowStatusLogId', 'rwl.id')
              .andOn(knex.raw('rwl.resultWorkflowStatusId = ?', deliveredResultWorkfowStatusId))
              .andOn(knex.raw('rwl.changedOn > ?', from))
          })
          .first(
            knex.raw('COUNT(DISTINCT r.id) as resultCount'),
            knex.raw('SUM(CASE WHEN rwl.id IS NULL THEN 0 ELSE 1 END) as resultsDeliveredCount')
          )) || { resultCount: 0 }
        factResultsDevice.resultCount = countByDevice.resultCount
        factResultsDevice.resultsDeliveredCount = countByDevice.resultsDeliveredCount
      } else {
        const countByDevice = await query.clone().count('r.id as resultCount').select('r.deviceId').first()
        factResultsDevice.resultCount = countByDevice.resultCount
      }

      const existingFactResultsDeviceRecord = await knex('FactResultsDevice').where({ deviceId, days }).first()
      if (existingFactResultsDeviceRecord) {
        await knex('FactResultsDevice').where({ deviceId, days }).update(factResultsDevice)
      } else {
        await knex('FactResultsDevice').insert({
          ...factResultsDevice,
          deviceId,
          days,
        })
      }

      // ...grouped by assay
      const countsByAssay = await query
        .clone()
        .whereNotNull('r.assayId')
        .groupBy('r.assayid')
        .count('r.id as resultCount')
        .select('r.assayId')

      await Promise.each(countsByAssay, async count => {
        const factResultsDeviceByAssay = await knex('FactResultsDeviceByAssay')
          .where({ deviceId, assayId: count.assayId, days })
          .first()
        if (factResultsDeviceByAssay) {
          await knex('FactResultsDeviceByAssay').where({ deviceId, assayId: count.assayId, days }).update({
            resultCount: count.resultCount,
            calculatedOn: now,
          })
        } else {
          await knex('FactResultsDeviceByAssay').insert({
            deviceId,
            assayId: count.assayId,
            days,
            resultCount: count.resultCount,
            calculatedOn: now,
          })
        }
      })

      // ...grouped by assay, resultCategory
      const countsByCategory = await query
        .clone()
        .whereNotNull('r.assayId')
        .whereNotNull('r.resultCategory1')
        .groupBy('r.assayId', 'r.resultCategory1')
        .count('r.id as resultCount')
        .select('r.assayId', 'r.resultCategory1')

      await Promise.each(countsByCategory, async count => {
        const factResultsDeviceByCategory1 = await knex('FactResultsDeviceByCategory1')
          .where({
            deviceId,
            assayId: count.assayId,
            resultCategory1: count.resultCategory1,
            days,
          })
          .first()
        if (factResultsDeviceByCategory1) {
          await knex('FactResultsDeviceByCategory1')
            .where({
              deviceId,
              assayId: count.assayId,
              resultCategory1: count.resultCategory1,
              days,
            })
            .update({ resultCount: count.resultCount, calculatedOn: now })
        } else {
          await knex('FactResultsDeviceByCategory1').insert({
            deviceId,
            assayId: count.assayId,
            resultCategory1: count.resultCategory1,
            days,
            resultCount: count.resultCount,
            calculatedOn: now,
          })
        }
      })

      // ...grouped by assay, resultCategory 1 & 2
      const countsByCategories = await query
        .clone()
        .whereNotNull('r.assayId')
        .whereNotNull('r.resultCategory1')
        .whereNotNull('r.resultCategory2')
        .groupBy('r.assayId', 'r.resultCategory1', 'r.resultCategory2')
        .count('r.id as resultCount')
        .select('r.assayId', 'r.resultCategory1', 'r.resultCategory2')

      await Promise.each(countsByCategories, async count => {
        const factResultsDeviceByCategory1And2 = await knex('FactResultsDeviceByCategory1And2')
          .where({
            deviceId,
            assayId: count.assayId,
            resultCategory1: count.resultCategory1,
            resultCategory2: count.resultCategory2,
            days,
          })
          .first()
        if (factResultsDeviceByCategory1And2) {
          await knex('FactResultsDeviceByCategory1And2')
            .where({
              deviceId,
              assayId: count.assayId,
              resultCategory1: count.resultCategory1,
              resultCategory2: count.resultCategory2,
              days,
            })
            .update({
              resultCount: count.resultCount,
              calculatedOn: now,
            })
        } else {
          await knex('FactResultsDeviceByCategory1And2').insert({
            deviceId,
            assayId: count.assayId,
            resultCategory1: count.resultCategory1,
            resultCategory2: count.resultCategory2,
            days,
            resultCount: count.resultCount,
            calculatedOn: now,
          })
        }
      })
    })
    await Promise.each(timeFramesToCalculate, async timeFrame => {
      // ...grouped by assay, resultCategory 1 & 2
      const countsByCategories = await query
        .clone()
        .whereNotNull('r.assayId')
        .whereNotNull('r.resultCategory1')
        .groupBy('r.assayId', 'r.resultCategory1', 'r.resultCategory2', 'startedOnTimeFrame')
        .count('r.id as resultCount')
        .modify(qb => {
          if (resultEndedOn) {
            // TODO: we'll have to account for different timeframes here if we ever want to calculate more than just month
            qb.whereBetween('r.endedOn', [
              slideDateToTimeZoneISO(startOfMonth(parseISO(resultEndedOn)), timeZoneIANA),
              slideDateToTimeZoneISO(endOfMonth(parseISO(resultEndedOn)), timeZoneIANA),
            ])
          }
        })
        .select([
          'r.assayId',
          'r.resultCategory1',
          'r.resultCategory2',
          ...sumSingleXdrResistance(knex),
          /**
           * commenting out below line which calculates combinations of resistances
           */
          // ...sumComboXdrResistances(knex),
          knex.raw(
            `DATE_FORMAT(${getDateTimeProjectionInUserTimeZone(
              knex,
              knex.raw(`IFNULL(r.endedOn, r.startedOn)`),
              offset
            )}, "%Y-%m-01") as startedOnTimeFrame`
          ),
        ])

      // if we didn't get an endedOn, generate all time frames since first result from device
      await Promise.each(countsByCategories, async count => {
        const factResultsDeviceByTimeFrame = await knex('FactResultsDeviceByTimeFrame')
          .where({
            deviceId,
            assayId: count.assayId,
            resultCategory1: count.resultCategory1,
            resultCategory2: count.resultCategory2,
            timeFrame,
            startedOn: count.startedOnTimeFrame,
          })
          .first()
        let { xdrResistanceCounts } = factResultsDeviceByTimeFrame || {}
        if (xdrResistanceCounts) {
          xdrResistanceCounts = _.isString(xdrResistanceCounts) ? JSON.parse(xdrResistanceCounts) : xdrResistanceCounts
        } else {
          xdrResistanceCounts = {
            /**
             * keep this object empty.
             * It has the following structure:
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
          _.set(xdrResistanceCounts, [resistanceName, 'detected'], cntDetected)
          _.set(xdrResistanceCounts, [resistanceName, 'notDetected'], cntNotDetected)
          _.set(xdrResistanceCounts, [resistanceName, 'indeterminate'], cntIndeterminate)
        })
        if (factResultsDeviceByTimeFrame) {
          await knex('FactResultsDeviceByTimeFrame')
            .where({
              deviceId,
              assayId: count.assayId,
              resultCategory1: count.resultCategory1,
              resultCategory2: count.resultCategory2,
              timeFrame,
              startedOn: count.startedOnTimeFrame,
            })
            .update({
              resultCount: count.resultCount,
              calculatedOn: now,
              xdrResistanceCounts: JSON.stringify(xdrResistanceCounts),
            })
        } else {
          await knex('FactResultsDeviceByTimeFrame').insert({
            deviceId,
            assayId: count.assayId,
            resultCategory1: count.resultCategory1,
            resultCategory2: count.resultCategory2,
            timeFrame,
            resultCount: count.resultCount,
            calculatedOn: now,
            startedOn: count.startedOnTimeFrame,
            xdrResistanceCounts: JSON.stringify(xdrResistanceCounts),
          })
        }
      })
    })

    // delete orphan data (=not updated in the loop)
    await knex('FactResultsDevice').where({ deviceId }).whereRaw('calculatedOn < ?', now).delete()

    await knex('FactResultsDeviceByAssay')
      .where({ deviceId })
      .whereRaw('calculatedOn < ?', now)
      .modify(queryBuilder => {
        if (assayId) {
          queryBuilder.where({ assayId })
        }
      })
      .delete()

    await knex('FactResultsDeviceByCategory1')
      .where({ deviceId })
      .whereRaw('calculatedOn < ?', now)
      .modify(queryBuilder => {
        if (assayId) {
          queryBuilder.where({ assayId })
        }
        if (resultCategory1) {
          queryBuilder.where({ resultCategory1 })
        }
      })
      .delete()

    await knex('FactResultsDeviceByCategory1And2')
      .where({ deviceId })
      .whereRaw('calculatedOn < ?', now)
      .modify(queryBuilder => {
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
      .delete()
  })
}

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

module.exports = onFactGenerateResultCounts
