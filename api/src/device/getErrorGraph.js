const { getConstraints, addConstraints, getUserFromCredentials } = require('../auth/constraints')
const { knex } = require('../db')
const { allResultCategoryToId, allAssayToId } = require('../shared/dictionary')

const generateDataForPastFiveYears = (existingData = []) => {
  const filledData = []
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1 // Adjust to human-readable format (1-12)

  // Determine the start year for the 5-year period
  let startYear = currentYear - 5

  // Calculate total months to be generated
  let totalMonths = (currentYear - startYear + 1) * 12 - (12 - currentMonth)

  // Create a map of existing data for quick lookup
  const dataMap = new Map(existingData.map(item => [`${item.year}-${item.month}`, item.percentage]))

  // Generate data for each month in the calculated range
  for (let i = 0; i < totalMonths; i++) {
    // Calculate year and month from the index
    let year = startYear + Math.floor(i / 12)
    let month = (i % 12) + 1

    // Check if the year and month already exist in the passed data
    let key = `${year}-${month}`
    let percentage = dataMap.get(key) !== undefined ? dataMap.get(key) : 0

    filledData.push({
      year: year,
      month: month,
      percentage: percentage, // Use existing data or default to 0
    })
  }

  return filledData
}

const calculatePercentage = errorResultAgg => {
  const filteredData = errorResultAgg.filter(item => item.categoryTotal > 0)

  return filteredData.map(item => {
    const percentage = ((item.categoryTotal / item.total) * 100).toFixed(1)
    return {
      year: item.year,
      month: item.month,
      percentage: Number(percentage),
    }
  })
}

const getErrorResultAgg = (knex, assayIds, dataConstraints, categoryId, timezoneIANA, state) => {
  const tzOffset = `CONVERT_TZ(r.endedOn, "+00:00", "${timezoneIANA}")`

  const uniqueResults = knex('Result as r')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('Geography as g', 'si.geographyId', 'g.id')
    .join('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('Assay as a', 'a.deviceTypeId', 'dt.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      geography: 'g',
      site: 'si',
      device: 'd',
      deviceType: 'dt',
    })
    .whereIn('r.assayId', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra])
    .where('dt.externalId', 'CepheidGeneXpert')
    .whereRaw(`${tzOffset} >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)`)
    .distinct('r.id')
    .select('r.resultCategory1', knex.raw(`YEAR(${tzOffset}) AS year, MONTH(${tzOffset}) AS month`))
    .orderBy('year', 'month')
    .modify(queryBuilder => {
      if (state) {
        const stateIds = state
          .split(',')
          .map(Number)
          .filter(n => !Number.isNaN(n))
        queryBuilder.join('State as s', 'g.stateId', 's.id').whereIn('s.id', stateIds)
      }
    })

  const query = knex({ ur: uniqueResults })
    .select(
      knex.raw(`COUNT(*) AS total`),
      'year',
      'month',
      knex.raw(`SUM(CASE WHEN ur.resultCategory1 = ? THEN 1 ELSE 0 END) AS categoryTotal`, [categoryId])
    )
    .groupBy('year', 'month')
    .orderBy('year', 'month')

  return query
}

const getMtbErrorGraph = async request => {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const { category, state } = query

  const assayIds = await allAssayToId()
  const resultCategoryIds = await allResultCategoryToId()

  const categoryMap = {
    invalid: resultCategoryIds.Invalid,
    error: resultCategoryIds.Error,
    noResult: resultCategoryIds.NoResult,
  }

  const user = await getUserFromCredentials(auth.credentials)

  const { timezoneIANA } = user

  const errorResultAgg = await getErrorResultAgg(
    knex,
    assayIds,
    dataConstraints,
    categoryMap[category],
    timezoneIANA,
    state
  )

  const graphData = calculatePercentage(errorResultAgg)

  const formattedData = generateDataForPastFiveYears(graphData)

  console.log(formattedData)

  return { ok: true, data: formattedData }
}

module.exports = getMtbErrorGraph
