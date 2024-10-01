const uuid = require('node-uuid')
const Boom = require('@hapi/boom')
const Promise = require('bluebird')
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

async function updateSiteConsumable(siteId, { modify, consumableId }, _knex = knex) {
  if (modify === 'add') {
    return _knex('SiteConsumable')
      .insert({
        siteId,
        consumableId,
      })
      .onConflict(['siteId', 'consumableId'])
      .ignore()
  }
  const exists = await _knex('InventoryItem').where({ siteId, consumableId }).first()
  if (exists) {
    throw Boom.conflict('Unable to remove the cartridge')
  } else {
    return _knex('SiteConsumable').where({ siteId, consumableId }).del()
  }
}

async function checkSiteAccess(siteId, dataConstraints) {
  return knex('Site as s').where('s.id', siteId).modify(addConstraints, dataConstraints, { site: 's' }).first('s.id')
}

const getSiteIdByName = async siteName => {
  const site = await knex('Site').where('name', siteName).first('id')
  return site ? site.id : null
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
      siteName: 's.name',
    })
}

const insertSiteConsumables = (siteId, consumableIds) => {
  return Promise.each(consumableIds, async consumableId => {
    await knex('SiteConsumable')
      .insert({
        siteId,
        consumableId,
      })
      .onConflict(['siteId', 'consumableId'])
      .ignore()
  })
}
const insertSite = (knex, site) => {
  if (!site.guid) site.guid = uuid.v4()
  if (!site.institutionGuid) site.institutionGuid = uuid.v4()
  if (!site.institutionName) site.institutionName = site.name

  return knex('Site').insert(site)
}

module.exports = {
  getExistingSite,
  getExistingSiteExcludingCurrent,
  updateSite,
  updateSiteConsumable,
  insertSiteConsumables,
  checkSiteAccess,
  getSiteIdByName,
  getLinkedResults,
  getSamplesRegisteredCount,
  getSites,
  insertSite,
}
