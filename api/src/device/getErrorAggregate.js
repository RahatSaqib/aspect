const { getConstraints, getUserFromCredentials } = require('../auth/constraints')
const { knex } = require('../db')
const { getBaseQuery } = require('../result/query')
const { getOffsetFromUser } = require('../shared/date')
const { allResultCategoryToId, allAssayToId } = require('../shared/dictionary')


const sharedAggQuery = (knex, assayIds, dataConstraints, offset) => {
    const offsetString = `CONVERT_TZ(r.endedOn, "+00:00", "${offset}")`
    return getBaseQuery(knex, dataConstraints)
    .join('Device as d', 'd.id', 'r.deviceId')
    .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .whereIn('a.id', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra])
    .where('dt.externalId', 'CepheidGeneXpert')
    .whereRaw(`${offsetString} >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)`)
    .select(knex.raw(`YEAR(${offsetString}) AS year, MONTH(${offsetString}) AS month, COUNT(*) AS total_data`))
    .groupBy(knex.raw(`YEAR(${offsetString}), MONTH(${offsetString})`))
    .orderBy('year', 'month');
}


const getCategoryResults = async (knex, dataConstraints, assayIds, resultCategory, offset) => {
    return sharedAggQuery(knex, assayIds, dataConstraints, offset).where('r.resultCategory1', resultCategory)
}

const getTotalTestPerMonth = (knex, assayIds, dataConstraints, offset) => {
    return sharedAggQuery(knex, assayIds, dataConstraints, offset)
}

const calculatePercentages = (resultsAgg, totalTestPerMonth) => {
    return resultsAgg.map(result => {
        const totalDataMonth = totalTestPerMonth.find(monthData => 
            monthData.year === result.year && monthData.month === result.month
        );
        if (totalDataMonth && totalDataMonth.total_data > 0) {
            result.percentage = (result.total_data / totalDataMonth.total_data * 100).toFixed(1) + '%';
        } else {
            result.percentage = '0%'
        }
        return result;
    });
}

const getMtbErrorsAgg = async request => {
    const { auth } = request
    const dataConstraints = await getConstraints(auth.credentials)
    
    const offset = await getOffsetFromUser(knex, auth.credentials.name)
    
    const assayIds = await allAssayToId()
  
    const resultCategoryIds = await allResultCategoryToId()

    const [totalTestPerMonth, invalidResultsAgg, errorResultsAgg, noResultsAgg] = await Promise.all([
        getTotalTestPerMonth(knex, assayIds, dataConstraints, offset),
        getCategoryResults(knex, dataConstraints, assayIds, resultCategoryIds.Invalid, offset),
        getCategoryResults(knex, dataConstraints, assayIds, resultCategoryIds.Error, offset),
        getCategoryResults(knex, dataConstraints, assayIds, resultCategoryIds.NoResult, offset)
    ])

    const invalidResultsGraphData = calculatePercentages(invalidResultsAgg, totalTestPerMonth);
    const errorResultsGraphData = calculatePercentages(errorResultsAgg, totalTestPerMonth);
    const noResultsGraphData = calculatePercentages(noResultsAgg, totalTestPerMonth);
  
    const data = {
        invalidResultsGraphData,
        errorResultsGraphData,
        noResultsGraphData,
    }
  
    return { ok: true, data }
  }

module.exports = getMtbErrorsAgg



