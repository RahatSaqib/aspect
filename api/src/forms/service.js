const _ = require('lodash')
const Promise = require('bluebird')
const { getConstraints /* , addConstraints */ } = require('../auth/constraints')
const { knex, filterParams } = require('../db')
const formDictionary = require('./formsFileDictionary')
const { getListSitesForSelectList } = require('../site/service')
const { stateSelectList } = require('../geography/service')

function createFormObject(formQuery) {
  const forms = {}
  // eslint-disable-next-line no-return-assign
  _.each(formQuery, form => {
    forms[form.externalId] = {
      ...formDictionary[form.jsonSchemaFileName],
      assayId: form.assayId,
      diseaseId: form.diseaseId,
      formTypeId: form.formTypeId,
    }
  })
  return forms
}

async function getForms(request) {
  const { auth, query } = request
  const {
    partner: { id: partnerId },
  } = await getConstraints(auth.credentials)
  const formQuery = await getFormsBaseQuery(partnerId, query)

  return createFormObject(formQuery)
}

const replaceOptionSourceProp = async (customFields, partnerId, countryId) => {
  await Promise.each(
    _.filter(customFields, elem => elem.itemsSource),
    async field => {
      const { itemsSource, itemsSourceConfig } = field
      if (itemsSource === 'lga' || itemsSource === 'state') {
        const { data: statesOrLgas } = await stateSelectList({
          params: {
            countryId,
          },
        })
        field.items = _.map(statesOrLgas, geography => ({
          key: geography.id,
          value: geography.name,
        }))
      } else if (itemsSource === 'all-sites') {
        const dataConstraints = {
          partner: {
            id: partnerId,
          },
          country: {
            id: countryId,
          },
        }
        const { data: items } = await getListSitesForSelectList(dataConstraints, {})

        if (!field.InputControlData) {
          field.InputControlData = {}
        }
        field.items = _.map(items, item => ({
          key: item[itemsSourceConfig?.key || 'externalId'],
          value: item[itemsSourceConfig?.value || 'name'],
          state: item.stateName,
          lga: item.lgaName,
          ...JSON.parse(item.customProperties || '{}'),
        }))
      }

      if (itemsSourceConfig?.extraItems) {
        const extraItems = itemsSourceConfig.extraItems
          .sort((ei1, ei2) => ei1.order - ei2.order)
          .map(extraItem => ({
            key: extraItem.key,
            value: extraItem.value,
          }))

        field.items = [...field.items, ...extraItems]
      }

      delete field.itemsSource
    }
  )
}

// const getUserScopedCustomFields = async dataConstraints => {
//   await getFormsBaseQuery(partnerId, {
//     formType: 'gxConnectForm',
//     assayId,
//     diseaseId,
//   })
//   .modify(addConstraints, dataConstraints, {

//   })
// }

const getCustomFieldsBaseQuery = async (partnerId, deviceId, assayId = null, diseaseId = null) =>
  getFormsBaseQuery(partnerId, {
    formType: 'gxConnectForm',
    assayId,
    diseaseId,
  })
    .leftJoin('Disease as di', 'di.id', 'fd.diseaseId')
    .leftJoin('AssayType as assayType', 'di.id', 'assayType.diseaseId')
    .leftJoin('Assay as a', 'assayType.id', 'a.assayTypeId')
    .leftJoin('DeviceType as dt', 'a.devicetypeid', 'dt.id')
    .leftJoin('Device as d', 'd.deviceTypeId', 'dt.id')
    .leftJoin('Assay as formAssay', 'fd.assayId', 'formAssay.id')
    .where(qb => {
      if (deviceId) {
        qb.where('d.id', deviceId)
        qb.orWhereNull('fd.diseaseId')
      }
    })
    .whereNotNull('fd.externalId')
    .select([
      // A form can be scoped to one specific assay
      knex.raw('formAssay.externalId AS assayExternalId'),
      // Or can be scoped to many assays, determined by the disease
      knex.raw('GROUP_CONCAT(DISTINCT a.externalId) AS assayExternalIdFromDisease'),
    ])
    .groupBy('fd.id')

const setFormAssayToCustomFields = (form, customFields) => {
  const fields = _.map(customFields, field => ({
    ...field,
    assayExternalId: form.assayExternalId
      ? [form.assayExternalId]
      : form.assayExternalIdFromDisease
      ? form.assayExternalIdFromDisease.split(',')
      : [],
    diseaseId: form.diseaseId,
  }))
  return fields
}

const getCustomFieldPlaceholdersForNotifications = async partnerId => {
  const formQuery = await getCustomFieldsBaseQuery(partnerId)

  const placeholders = []
  await Promise.each(formQuery, async form => {
    const formPlaceholders = setFormAssayToCustomFields(form, formDictionary[form.jsonSchemaFileName].fields).map(
      field => ({
        id: `result.customFields.${field.id}`,
        nameI18nKey: `${field.i18nKey}`,
        name: `${field.title}`,
        assayWhitelist: field.assayExternalId,
      })
    )
    placeholders.push(...formPlaceholders)
  })

  return placeholders
}

const getCustomFields = async (partnerId, deviceId, countryId, assayId = null, diseaseId = null) => {
  const formQuery = await getCustomFieldsBaseQuery(partnerId, deviceId, assayId, diseaseId)

  const formFields = []
  await Promise.each(formQuery, async form => {
    const fields = setFormAssayToCustomFields(form, formDictionary[form.jsonSchemaFileName].fields)
    await replaceOptionSourceProp(fields, partnerId, countryId)
    formFields.push(...fields)
  })

  const forms = { fields: _.sortBy(formFields, ['order', 'name']) }

  return forms
}
function getFormsBaseQuery(partnerId, query) {
  const queryForm = knex('FormType AS ft')
    .join('FormDefinition as fd', 'fd.formTypeId', 'ft.id')
    .join('FormDefinitionSchema as fschema', 'fd.formDefinitionSchemaId', 'fschema.id')
    .where('fd.partnerId', partnerId)
    .modify(filterParams, query, {
      externalsId: 'fd.externalId',
      formType: 'ft.externalId',
    })
    .modify(q => {
      if (query.assayId)
        q.andWhere(whereAssay => whereAssay.where('fd.assayId', query.assayId).orWhereNull('fd.assayId'))

      if (query.diseaseId)
        q.andWhere(whereAssay => whereAssay.where('fd.diseaseId', query.diseaseId).orWhereNull('fd.diseaseId'))
    })
    .distinct(
      'fd.externalId',
      'fd.assayId',
      'fd.diseaseId',
      'ft.externalId as formTypeId',
      knex.raw("REPLACE(fschema.jsonSchemaFile, '.json', '') as jsonSchemaFileName")
    )
  return queryForm
}
module.exports = {
  getForms,
  getCustomFields,
  createFormObject,
  replaceOptionSourceProp,
  getCustomFieldPlaceholdersForNotifications,
}
