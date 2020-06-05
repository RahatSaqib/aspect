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
  const usedAssayIds = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .modify(addConstraints, dataConstraints, { device: 'd', result: 'r' })
    .distinct('r.assayId')
    .pluck('assayId')

  // no get the assays with a field for hasResults
  const assayQuery = knex('Assay as a')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .leftJoin('Disease as d', 'at.diseaseId', 'd.id')
    .innerJoin('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
    .modify(addConstraints, dataConstraints, {
      assayType: 'at',
      assay: 'a',
      deviceType: 'dt',
      disease: 'd',
    })
    .modify(filterParams, query, { name: 'a.name' })

  // get total count for paging
  const getCount = assayQuery.clone().count('a.id as count').first()

  // get rows
  const getItems = assayQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  const [{ count: total }, rawAssays] = await Promise.all([getCount, getItems])

  // get resultCategories for all assays
  const rawResultCategories = await knex('ResultCategory as rc')
    .innerJoin('ResultCategoryAssay as rca', 'rc.id', 'rca.resultCategoryId')
    .whereIn('rca.assayId', _.map(rawAssays, 'id'))
    .select(SELECT_LIST_RESULT_CATEGORY_FIELDS)

  const resultCategoriesByAssayId = _.groupBy(rawResultCategories, 'assayId')

  const rawPartnerAssays = await knex('PartnerAssay as pa')
    .innerJoin('Partner as p', 'pa.partnerId', 'p.id')
    .whereIn('pa.assayId', _.map(rawAssays, 'id'))
    .distinct(
      'pa.assayId',
      'pa.partnerId',
      'p.name as partnerName',
      'pa.canCreate',
      'pa.canDelete',
      'pa.canEdit'
    )
  const abilitiesByAssayId = _.groupBy(rawPartnerAssays, 'assayId')

  // map rawAssays with extra values
  const assays = _.map(rawAssays, assay => {
    const abilities = abilitiesByAssayId[assay.id].map(ability => ({
      ...ability,
      canCreate: ability.canCreate === 1,
      canDelete: ability.canDelete === 1,
      canEdit: ability.canEdit === 1,
    }))
    return {
      ...assay,
      hasResults: usedAssayIds.includes(assay.id),
      resultDataSchema: JSON.parse(assay.resultDataSchema),
      resultCategories: resultCategoriesByAssayId[assay.id],
      abilities,
      patientDataSchema:
        assay.patientDataSchema && JSON.parse(assay.patientDataSchema),
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
      if (assayId) queryBuilder.where('a.id', assayId)
    }, assayId)
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      device: 'd',
      deviceType: 'dt',
      assayType: 'at',
    })
    .where('d.partnerId', partnerId)
    .distinct(
      'a.id',
      'a.name',
      'a.externalId',
      'at.diseaseId',
      'a.resultDataSchema',
      'a.patientDataSchema'
    )
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
