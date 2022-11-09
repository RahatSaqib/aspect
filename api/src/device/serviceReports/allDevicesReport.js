// const { parseISO, addMonths } = require('date-fns')
// const min = require('lodash/min')

// const { knex } = require('../../db')
// const { getInventoryBySitesAndConsumableQuery } = require('../../inventory/common/db')
// const { getFirstAndLastResults } = require('../common/db')
// const { getConstraints } = require('../../auth/constraints')
// const { getArrayOfDaysInRange } = require('../../shared/date')

// async function getInventoryData(auth, query) {
//   const maxDate = min([parseISO(query.maxDate), new Date()])
//   const minDate = query.minDate ? parseISO(query.minDate) : addMonths(maxDate, -1)
//   const days = getArrayOfDaysInRange(
//     minDate,
//     maxDate,
//     null,
//     true
//   )
//   const dataConstraints = await getConstraints(auth.credentials)
//   const inventory = await getInventoryBySitesAndConsumableQuery({ query, auth }, dataConstraints)
//     .innerJoin('Device as d', 't2.id', 'd.siteId')
//     .leftJoin('DeviceCapacity as dc', 'd.deviceCapacityId', 'dc.id')
//     .leftJoin(getFirstAndLastResults(dataConstraints), 'd.id', 'firstAndLastResults.deviceId')
//     .leftJoin('Result as r', joinResultQuery => {
//       joinResultQuery.on('d.id', 'r.deviceId')

//       if (query.minDate) joinResultQuery.andOn('r.endedOn', '>', knex.raw(`'${minDate.toISOString()}'`))

//       if (query.maxDate) joinResultQuery.andOn('r.endedOn', '<=', knex.raw(`'${maxDate.toISOString()}'`))
//     })
//     .groupBy(
//       [
//         't2.siteName',
//         't2.consumableName',
//         't2.dailyConsumptionRate',
//         't2.quantityOnHand',
//         't2.daysStockLeft',
//         't2.projectedWaste',
//       ]
//     )
//     .select([
//       't2.siteName',
//         't2.consumableName',
//         't2.dailyConsumptionRate',
//         't2.quantityOnHand',
//         't2.daysStockLeft',
//         't2.projectedWaste',
//     ])
//   return inventory
// }

// module.exports = {
//   getInventoryData,
// }

const omit = require('lodash/omit')
const { knex } = require('../../db')
const { getInventoryBySitesAndConsumableQuery } = require('../../inventory/common/db')
const { getConstraints } = require('../../auth/constraints')

async function getInventoryData(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const inventory = await getInventoryBySitesAndConsumableQuery(
    { query: omit(query, ['minDate', 'maxDate']), auth },
    dataConstraints,
    null,
    [
      't2.siteName',
      't2.consumableName',
      't2.dailyConsumptionRate',
      knex.raw('t2.dailyConsumptionRate * 365 as projectedAnnualConsumption'),
      't2.quantityOnHand',
      't2.daysStockLeft',
      't2.projectedWaste',
    ]
  ).orderBy(['t2.siteName', 't2.consumableName'])

  return inventory
}

module.exports = {
  getInventoryData,
}
