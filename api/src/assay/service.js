const _ = require('lodash')
const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'a.id',
  'a.externalId',
  'a.i18nKey',
  'at.id as assayTypeId',
  'd.id as diseaseId',
  'a.name',
  'at.name as assayTypeName',
  'dt.id as deviceTypeId',
  'dt.externalId as deviceTypeExternalId',
  'dt.name as deviceTypeName',
  'a.resultCategory1Label',
  'a.resultCategory1i18nKey',
  'a.resultCategory2Label',
  'a.resultCategory2i18nKey',
  'a.resultDataSchema',
  'a.patientDataSchema',
  'a.abbreviation',
  'at.abbreviation as assayTypeAbbreviation',
  knex.raw('SUM(f.resultCount) as resultCount'),
]

const SELECT_LIST_RESULT_CATEGORY_FIELDS = [
  'rc.id',
  'rc.name',
  'rc.i18nKey',
  'rc.externalId',
  'rca.assayId',
  'rca.emphasize',
  'rca.requirestreatment',
]

const SELECT_LIST_RESULT_CATEGORY_GROUP_FIELDS = [
  'rcg.id',
  'rcg.externalId',
  'rcg.name',
  'rcg.i18nKey',
  'rcg.resultCategory1Id',
  'rcg.resultCategory2Id',
  'rcg.assayId',
]

async function listAssaysResultSchema(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const assaysList = await knex('Assay as a')
    .innerJoin('DeviceType as dt', 'a.devicetypeId', 'dt.id')
    .innerJoin('AssayType as at', 'a.assaytypeId', 'at.id')
    .modify(addConstraints, dataConstraints, {
      assayType: 'at',
      assay: 'a',
      deviceType: 'dt',
    })
    .select(
      'a.id as assayId',
      'a.externalId',
      'at.id as assayTypeId',
      'a.name',
      'at.name as assayTypeName',
      'dt.externalId as deviceTypeExternalId',
      'dt.name as deviceTypeName',
      'a.resultCategory1Label',
      'a.resultCategory1i18nKey',
      'a.resultCategory2Label',
      'a.resultCategory2i18nKey',
      'a.resultDataSchema',
      'a.patientDataSchema',
      'a.abbreviation',
      'at.abbreviation as assayTypeAbbreviation'
    )
    .distinct()

  const rawResultCategories = await knex('ResultCategory as rc')
    .innerJoin('ResultCategoryAssay as rca', 'rc.id', 'rca.resultCategoryId')
    .whereIn('rca.assayId', _.map(assaysList, 'assayId'))
    .select(SELECT_LIST_RESULT_CATEGORY_FIELDS)

  const resultCategoriesByAssayId = _.groupBy(rawResultCategories, 'assayId')
  const assays = _.map(assaysList, elem => {
    const resultDataSchema = JSON.parse(elem.resultDataSchema)
    const patientDataSchema = JSON.parse(elem.patientDataSchema)
    const categories = resultCategoriesByAssayId[elem.assayId]
    const assay = {
      ...elem,
      resultDataSchema,
      patientDataSchema,
      resultCategories: _.map(categories, category => ({
        name: category.name,
        i18nKey: category.i18nKey,
        externalId: category.externalId,
        emphasize: category.emphasize,
        requirestreatment: category.requirestreatment,
      })),
    }
    return assay
  })
  return assays
}

async function listAssays(request) {
  const { query, auth } = request

  // get all assays that have results that user has access to
  const dataConstraints = await getConstraints(auth.credentials)
  const usedAssay = knex('FactResultsDeviceByAssay as f')
    .innerJoin('Device as d', 'f.deviceId', 'd.id')
    .innerJoin('Assay as a', 'f.assayId', 'a.id')
    .modify(addConstraints, dataConstraints, { device: 'd', assay: 'a' })
    .where('f.resultCount', '>', 0)
    .groupBy('f.assayId')
    .select({
      assayId: 'f.assayId',
      resultCount: knex.raw('SUM(f.resultCount)'),
    })

  // no get the assays with a field for hasResults
  const assayQuery = knex('Assay as a')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .leftJoin('Disease as d', 'at.diseaseId', 'd.id')
    .innerJoin('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
    .leftJoin(usedAssay.as('f'), 'a.id', 'f.assayId')
    .modify(addConstraints, dataConstraints, {
      assayType: 'at',
      assay: 'a',
      deviceType: 'dt',
      disease: 'd',
    })
    .modify(filterParams, query, { name: 'a.name' })
    .groupBy('a.id')

  // get total count for paging
  const getCount = assayQuery.clone().count('a.id as count').first()

  // get rows
  const getItems = assayQuery.clone().modify(sortPageParams, query, 'name').select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  const [{ count: total }, rawAssays] = await Promise.all([getCount, getItems])

  // list of assayId's for using in next queries
  const assayIds = _.map(rawAssays, 'id')

  // get resultCategories for all assays
  const rawResultCategories = await knex('ResultCategory as rc')
    .innerJoin('ResultCategoryAssay as rca', 'rc.id', 'rca.resultCategoryId')
    .whereIn('rca.assayId', assayIds)
    .select(SELECT_LIST_RESULT_CATEGORY_FIELDS)
  const resultCategoriesByAssayId = _.groupBy(rawResultCategories, 'assayId')

  const rawResultCategoryGroups = await knex('ResultCategoryGroup as rcg')
    .whereIn('rcg.assayId', assayIds)
    .select(SELECT_LIST_RESULT_CATEGORY_GROUP_FIELDS)
  const resultCategoryGroupsByAssayId = _.groupBy(rawResultCategoryGroups, 'assayId')

  const rawPartnerAssays = await knex('PartnerAssay as pa')
    .innerJoin('Partner as p', 'pa.partnerId', 'p.id')
    .whereIn('pa.assayId', assayIds)
    .distinct('pa.assayId', 'pa.partnerId', 'p.name as partnerName', 'pa.canCreate', 'pa.canDelete', 'pa.canEdit')
  const abilitiesByAssayId = _.groupBy(rawPartnerAssays, 'assayId')

  // map rawAssays with extra values
  const assays = _.map(rawAssays, assay => {
    let abilities = null
    if (abilitiesByAssayId[assay.id]) {
      abilities = abilitiesByAssayId[assay.id].map(ability => ({
        ...ability,
        canCreate: ability.canCreate === 1,
        canDelete: ability.canDelete === 1,
        canEdit: ability.canEdit === 1,
      }))
    }
    return {
      ...assay,
      hasResults: assay.resultCount > 0,
      resultDataSchema: JSON.parse(assay.resultDataSchema),
      resultCategories: resultCategoriesByAssayId[assay.id],
      resultCategoryGroups: resultCategoryGroupsByAssayId[assay.id],
      abilities,
      patientDataSchema: assay.patientDataSchema && JSON.parse(assay.patientDataSchema),
    }
  })
  const result = { ok: true, total, length: assays.length, data: assays }

  return result
}

async function listAssayTypes(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const assayTypes = await knex('AssayType as at')
    .modify(addConstraints, dataConstraints, {
      assayType: 'at',
    })
    .select()
  const result = {
    ok: true,
    total: assayTypes.length,
    length: assayTypes.length,
    data: assayTypes,
  }
  return result
}

async function getAllAssaySchemas(partnerId, userId, assayId = null) {
  const dataConstraints = await getConstraints({ userId })
  const query = knex('Assay as a')
    .innerJoin('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('Device as d', 'dt.id', 'd.deviceTypeId')
    .modify((queryBuilder, assayId) => {
      if (assayId && _.isArray(assayId)) queryBuilder.whereIn('a.id', assayId)
      else if (assayId && !_.isArray(assayId)) queryBuilder.where('a.id', assayId)
    }, assayId)
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      device: 'd',
      deviceType: 'dt',
      assayType: 'at',
    })
    .where('d.partnerId', partnerId)
    .distinct('a.id', 'a.name', 'a.externalId', 'at.diseaseId', 'a.resultDataSchema', 'a.patientDataSchema')
  return query
}

async function getAssayResultCategories(assayId) {
  return knex('ResultCategory as rc')
    .innerJoin('ResultCategoryAssay as rca', 'rc.id', 'rca.resultCategoryId')
    .where('rca.assayId', assayId)
    .select(SELECT_LIST_RESULT_CATEGORY_FIELDS)
}

module.exports = {
  listAssays,
  listAssayTypes,
  getAllAssaySchemas,
  listAssaysResultSchema,
  getAssayResultCategories,
}
