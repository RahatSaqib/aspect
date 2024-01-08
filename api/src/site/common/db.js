const { knex, filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

const getExistingSite = async (name, shortName, externalId) =>
  getExistingSiteExcludingCurrent(null, name, shortName, externalId)

async function getExistingSiteExcludingCurrent(siteId, name, shortName, externalId) {
  return knex('Site')
    .whereNot({ id: siteId })
    .whereNot({ disabled: 1 })
    .where(qb => qb.orWhere({ name }).orWhere({ shortName }).orWhere({ externalId }))
    .first('name', 'shortName', 'externalId')
}

async function updateSite(siteId, params) {
  await knex('Site as s').where('s.id', siteId).update(params)
}

async function checkSiteAccess(siteId, dataConstraints) {
  return knex('Site as s').where('s.id', siteId).modify(addConstraints, dataConstraints, { site: 's' }).first('s.id')
}

const getSiteIdByName = async siteName => {
  const site = await knex('Site').where('name', siteName).first('id')
  return site ? site.id : null
}

const getLinkedResults = (dataConstraints, query) => {
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
    .where('Sample.registeredInAspect', 1)
    .whereBetween('r.endedOn', [minDate, maxDate])
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
      'r.reportableSiteId as reportableSite'
    )
}

const getResultsFollowUp = resultIds => {
  const followUpSubQuery = knex('ResultFollowUp')
    .select('id', 'resultId', 'followUpId', 'date', 'updatedOn')
    .whereIn('resultId', resultIds)
    .andWhere('isDeleted', false)
    .select(knex.raw('ROW_NUMBER() OVER(PARTITION BY resultId ORDER BY date DESC) AS rowNumber'))

  // get latest result followUps
  return knex('FollowUp as fup')
    .select('rf.resultId', 'rf.id as followUp', 'rf.date', 'fup.externalId as followUpExternalId')
    .from(followUpSubQuery.as('rf'))
    .leftJoin('FollowUp as fup', 'rf.followUpId', 'fup.id')
    .join('FollowUpType as fut', 'fut.id', 'fup.followUpTypeId')
    .where('rf.rowNumber', 1)
    .andWhere('fut.externalId', 'treatment')
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
    .select('s.id as siteId')
    .count('Sample.id as SampleCount')
}

const getSites = (dataConstraints, query) => {
  return knex('Site as s')
    .join('Geography as g', 'g.id', 's.geographyId')
    .select('s.id as siteId', 's.name as siteName')
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
}

module.exports = {
  getExistingSite,
  getExistingSiteExcludingCurrent,
  updateSite,
  checkSiteAccess,
  getSiteIdByName,
  getLinkedResults,
  getResultsFollowUp,
  getSamplesRegisteredCount,
  getSites,
}
