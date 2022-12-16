const _ = require('lodash')
const Promise = require('bluebird')
const { getConstraints } = require('../auth/constraints')
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
        const { data: items } = await getListSitesForSelectList(dataConstraints)
        if (!field.InputControlData) {
          field.InputControlData = {}
        }
        field.items = _.map(items, item => ({
          key: item[itemsSourceConfig?.key || 'externalId'],
          value: item[itemsSourceConfig?.value || 'name'],
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

const getCustomFields = async (partnerId, deviceId, countryId, assayId = null, diseaseId = null) => {
  const formQuery = await getFormsBaseQuery(partnerId, {
    formType: 'gxConnectForm',
    assayId,
    diseaseId,
  })
    .join('Disease as di', 'di.id', 'fd.diseaseId')
    .join('AssayType as assayType', 'di.id', 'assayType.diseaseId')
    .join('Assay as a', 'assayType.id', 'a.assayTypeId')
    .join('DeviceType as dt', 'a.devicetypeid', 'dt.id')
    .join('Device as d', 'd.deviceTypeId', 'dt.id')
    .leftJoin('Assay as formAssay', 'fd.assayId', 'formAssay.id')
    .where('d.id', deviceId)
    .select(knex.raw('GROUP_CONCAT(DISTINCT formAssay.externalId) AS assayExternalId'))
    .groupBy('fd.id')

  let forms = { fields: [] }
  await Promise.each(formQuery, async form => {
    const fields = _.map(formDictionary[form.jsonSchemaFileName].fields, field => ({
      ...field,
      assayExternalId: form.assayExternalId ? form.assayExternalId.split(',') : [],
      diseaseId: form.diseaseId,
    }))
    await replaceOptionSourceProp(fields, partnerId, countryId)
    forms = { fields: _.concat(forms.fields, fields) }
  })

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
}
