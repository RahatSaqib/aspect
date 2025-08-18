const _ = require('lodash')
const { knex, filterParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { INTERNAL_DEVICE_IDS } = require('../shared/constants')

const getReportingSites = async request => {
  const { query, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const sites = await getSites(dataConstraints, query)
  const linkedResults = await getLinkedResults(dataConstraints, query)
  const resultIds = linkedResults.map(item => item.resultId)
  const resultDownloaded = await knex('ResultDownloadLog')
    .distinct('ResultDownloadLog.resultId as resultDownloaded')
    .whereIn('resultId', resultIds)
    .select('ResultDownloadLog.resultId as resultId')
  const mappedDownloadResultIds = resultDownloaded.reduce((obj, item) => {
    obj[item.resultId] = true
    return obj
  }, {})
  const resultsWithTreatmentStatus = _.map(linkedResults, result => {
    const requiresFollowUp = result.rc1Treatment === 1 || result.rc2Treatment === 1 ? 1 : 0
    let followUpPending = 0
    let followUpNotPossible = 0
    let followUpConfirmed = 0
    if (requiresFollowUp) {
      if (result.treatmentStatus === 'OnTreatment') {
        followUpConfirmed = 1
      }
      if (result.treatmentStatus === 'NotPossible') {
        followUpNotPossible = 1
      }
      if (result.treatmentStatus === 'AwaitingTreatment' || result.treatmentStatus === null) {
        followUpPending = 1
      }
    }
    return {
      ...result,
      requiresFollowUp,
      followUpPending,
      followUpNotPossible,
      followUpConfirmed,
      downloaded: _.has(mappedDownloadResultIds, result.resultId) ? 1 : 0,
    }
  })
  const sampleCounts = await getSamplesRegisteredCount(dataConstraints, query)
  const sampleKeyAndValue = {}
  sampleCounts.forEach(sample => {
    sampleKeyAndValue[sample.siteId] = sample.SampleCount
  })
  const resultAggregate = _.reduce(
    resultsWithTreatmentStatus,
    (acc, elem) => {
      const site = elem.reportableSite
      if (!acc[site]) {
        acc[site] = {
          reportableSite: site,
          followUpPending: 0,
          followUpNotPossible: 0,
          followUpConfirmed: 0,
          requiresFollowUp: 0,
          resultsReporting: 0,
          downloaded: 0,
        }
      }
      acc[site].followUpPending += elem.followUpPending || 0
      acc[site].followUpNotPossible += elem.followUpNotPossible || 0
      acc[site].followUpConfirmed += elem.followUpConfirmed || 0
      acc[site].requiresFollowUp += elem.requiresFollowUp || 0
      acc[site].resultsReporting += 1
      acc[site].downloaded += elem.downloaded || 0
      return acc
    },
    {}
  )
  const reportingSites = sites.map(site => {
    return {
      siteName: site.siteName,
      followUpPending: resultAggregate[site.siteId]?.followUpPending || 0,
      followUpNotPossible: resultAggregate[site.siteId]?.followUpNotPossible || 0,
      followUpConfirmed: resultAggregate[site.siteId]?.followUpConfirmed || 0,
      requiresFollowUp: resultAggregate[site.siteId]?.requiresFollowUp || 0,
      resultsReporting: resultAggregate[site.siteId]?.resultsReporting || 0,
      resultsDownloaded: resultAggregate[site.siteId]?.downloaded || 0,
      samplesRegistered: sampleKeyAndValue[site.siteId] || 0,
    }
  })
  const paginatedData = paginateAndSort(reportingSites, query)
  return {
    ok: !!paginatedData,
    total: _.size(sites),
    length: _.size(paginatedData),
    data: paginatedData,
  }
}

const paginateAndSort = (data, query) => {
  const defaultSortCol = 'siteName'
  const defaultSortDirection = 'asc'
  const { page = 0, size = 10, sortCol = defaultSortCol, sortDir = defaultSortDirection } = query

  const sortedData = _.orderBy(
    data,
    [item => (typeof item[sortCol] === 'string' ? item[sortCol].toLowerCase() : item[sortCol])],
    [sortDir]
  )

  const start = page * size
  const end = (page + 1) * size
  const paginatedData = sortedData.slice(start, end)
  return paginatedData
}

const getSites = (dataConstraints, query) => {
  return knex('Site as s')
    .join('Geography as g', 'g.id', 's.geographyId')
    .modify(addConstraints, dataConstraints, {
      geography: 'g',
      site: 's',
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      siteId: 's.id',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    .whereNotIn('s.externalId', INTERNAL_DEVICE_IDS)
    .select('s.id as siteId', 's.name as siteName')
}

const getLinkedResults = async (dataConstraints, query) => {
  const { minDate, maxDate } = query

  return knex('Result as r')
    .join('Site as s', 's.id', 'r.reportableSiteId')
    .join('Geography as g', 'g.id', 's.geographyId')
    .join('Sample', 'Sample.id', 'r.sampleId')
    .leftJoin('ResultCategoryAssay as rca1', queryBuilder => {
      queryBuilder.on('rca1.resultCategoryId', 'r.resultCategory1').andOn('rca1.assayId', 'r.assayId')
    })
    .leftJoin('ResultCategoryAssay as rca2', queryBuilder => {
      queryBuilder.on('rca2.resultCategoryId', 'r.resultCategory2').andOn('rca2.assayId', 'r.assayId')
    })
    .leftOuterJoin('ResultTreatmentStatusLog as rtsl', 'r.treatmentStatusLogId', 'rtsl.id')
    .leftOuterJoin('ResultTreatmentStatus as rts', 'rts.id', 'rtsl.resultTreatmentStatusId')
    .where(queryBuilder => {
      queryBuilder.where('rca1.reportable', true).orWhere('rca2.reportable', true)
    })
    .whereRaw('IFNULL(??, ??) BETWEEN ? AND ?', ['r.endedOn', 'r.startedOn', minDate, maxDate])
    .modify(addConstraints, dataConstraints, {
      geography: 'g',
      site: 's',
      result: 'r',
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      siteId: 's.id',
      lgaId: 'g.lgaId',
      assay: 'r.assayId',
    })
    .select(
      'r.id as resultId',
      'rca1.requiresTreatment as rc1Treatment',
      'rca2.requiresTreatment as rc2Treatment',
      'r.reportableSiteId as reportableSite',
      'rts.externalId as treatmentStatus'
    )
}

const getSamplesRegisteredCount = (dataConstraints, query) => {
  const { minDate, maxDate } = query

  return knex('Site as s')
    .join('Geography as g', 'g.id', 's.geographyId')
    .join('Sample', 'Sample.originSiteId', '=', 's.id')
    .where('registeredInAspect', 1)
    .whereBetween('Sample.collectedOn', [minDate, maxDate])
    .groupBy('s.id')
    .modify(addConstraints, dataConstraints, {
      geography: 'g',
      site: 's',
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      siteId: 's.id',
      lgaId: 'g.lgaId',
    })
    .select('s.id as siteId')
    .count('Sample.id as SampleCount')
}

module.exports = {
  getReportingSites,
}
