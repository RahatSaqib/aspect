const _ = require('lodash')
const Promise = require('bluebird')
const { getConstraints } = require('../auth/constraints')
const { knex, filterParams } = require('../db')
const formDictionary = require('./formsFileDictionary')
const { getListSitesForSelectList } = require('../site/service')
const { stateSelectList } = require('../geography/service')
const { normalizePhoneNumber } = require('../shared/phoneNormalization')
const { getSiteIdByName } = require('../site/common/db')
const { SITE_TYPE_EXTERNAL_IDS } = require('../shared/constants')

function createFormObject(formQuery) {
  const forms = {}
  _.each(formQuery, form => {
    forms[form.externalId] = {
      ...formDictionary[form.jsonSchemaFileName],
      assayId: form.assayId,
      diseaseId: form.diseaseId,
      formTypeId: form.formTypeId,
      formDefinitionExternalId: form.externalId,
      assayExternalId: form.assayExternalId != null ? form.assayExternalId : null,
      diseaseExternalId: form.diseaseExternalId != null ? form.diseaseExternalId : null,
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

async function getFormsByFormDefinitionExternalIds(partnerId, formDefinitionExternalIds) {
  const formQuery = await getFormsBaseQuery(partnerId, {
    externalsId: formDefinitionExternalIds,
  })
  return createFormObject(formQuery)
}

const replaceOptionSourceProp = async (customFields, partnerId, countryId) => {
  await Promise.each(
    _.filter(customFields, elem => elem.itemsSource),
    async field => {
      const { itemsSource, itemsSourceConfig } = field
      if (itemsSource === 'state') {
        const { data: statesOrLgas } = await stateSelectList({
          params: {
            countryId,
          },
        })
        field.items = _.map(statesOrLgas, geography => ({
          key: geography.id,
          value: geography.name,
        }))
      } else if (itemsSource === 'lga') {
        const { data: statesOrLgas } = await stateSelectList({
          params: {
            countryId,
          },
        })
        field.items = statesOrLgas.reduce((acc, state) => {
          const lgas = state.lgas.map(lga => ({
            stateId: state.id,
            key: lga.id,
            value: lga.name,
          }))
          return [...acc, ...lgas]
        }, [])
      } else if (itemsSource === 'all-sites') {
        if (!field.InputControlData) {
          field.InputControlData = {}
        }
        field.items = await getAllSites(partnerId, countryId, itemsSourceConfig)
      } else if (itemsSource === 'all-sites-clinics') {
        if (!field.InputControlData) {
          field.InputControlData = {}
        }
        field.items = await getAllSites(partnerId, countryId, itemsSourceConfig, {
          siteTypeExternalIds: [SITE_TYPE_EXTERNAL_IDS.CLINIC],
        })
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

const getCustomFieldsBaseQuery = async (partnerId, deviceTypeId, assayId = null, diseaseId = null) =>
  getFormsBaseQuery(partnerId, {
    formType: 'gxConnectForm',
    assayId,
    diseaseId,
  })
    .leftJoin('Disease as di', 'di.id', 'fd.diseaseId')
    .leftJoin('AssayType as assayType', 'di.id', 'assayType.diseaseId')
    .leftJoin('Assay as a', 'assayType.id', 'a.assayTypeId')
    .leftJoin('DeviceType as dt', 'a.devicetypeid', 'dt.id')
    .leftJoin('Assay as formAssay', 'fd.assayId', 'formAssay.id')
    .where(qb => {
      if (deviceTypeId) {
        qb.where('dt.id', deviceTypeId)
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
        id: `result.customFields.${field.source}`,
        nameI18nKey: `${field.i18nKey}`,
        name: `${field.title}`,
        assayWhitelist: field.assayExternalId,
      })
    )
    placeholders.push(...formPlaceholders)
  })

  return placeholders
}

const getCustomFields = async (partnerId, deviceTypeId, countryId, assayId = null, diseaseId = null) => {
  const formQuery = await getCustomFieldsBaseQuery(partnerId, deviceTypeId, assayId, diseaseId)

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
    .leftJoin('Disease as mobDisease', 'mobDisease.id', 'fd.diseaseId')
    .leftJoin('Assay as mobAssay', 'mobAssay.id', 'fd.assayId')
    .where('fd.partnerId', partnerId)
    .modify(filterParams, query, {
      externalsId: 'fd.externalId',
      formType: 'ft.externalId',
    })
    .modify(q => {
      if (query.assayId) {
        const assayId = _.isArray(query.assayId) ? query.assayId : [query.assayId]
        q.andWhere(whereAssay => whereAssay.whereIn('fd.assayId', assayId).orWhereNull('fd.assayId'))
      }
      if (query.diseaseId) {
        const diseaseId = _.isArray(query.diseaseId) ? query.diseaseId : [query.diseaseId]
        q.andWhere(whereAssay => whereAssay.whereIn('fd.diseaseId', diseaseId).orWhereNull('fd.diseaseId'))
      }
    })
    .distinct(
      'fd.externalId',
      'fd.assayId',
      'fd.diseaseId',
      'ft.externalId as formTypeId',
      knex.raw("REPLACE(fd.jsonSchemaFile, '.json', '') as jsonSchemaFileName"),
      knex.raw('mobDisease.externalId as diseaseExternalId'),
      knex.raw('mobAssay.externalId as assayExternalId')
    )
  return queryForm
}

/*
 * Create an object for merging with the result to save it directly in the database
 */
const getCustomFieldsFromPayload = async (payload, countryAbbreviation, partnerId, assayId, diseaseId = null) => {
  const forms = createFormObject(await getFormsBaseQuery(partnerId, { formType: 'gxConnectForm', assayId, diseaseId }))
  const fields = Object.values(forms).flatMap(form => form.fields)

  const obj = {}

  for (const field of fields) {
    const { payloadOriginPath = `data.customFieldData.${field.id}.value`, migrateFromId, source, fieldType } = field
    const oldPayloadOriginPath = `data.customFieldData.${migrateFromId}.value`

    const value = _.get(payload, payloadOriginPath) || _.get(payload, oldPayloadOriginPath)
    if (value && source) {
      if (_.includes(['patientCellphone', 'clinicianCellphone', 'phone'], fieldType))
        _.set(obj, source, normalizePhoneNumber(value, countryAbbreviation))
      else if (source === 'referringSiteId') {
        // This case will be removed in the future because the payloadOriginPath should take the key instead of the value
        const key =
          _.get(payload, `data.customFieldData.${field.id}.key`) ||
          _.get(payload, `data.customFieldData.${migrateFromId}.key`) // Might not be necessary, but it's safer to check it as well.
        // eslint-disable-next-line no-await-in-loop
        const siteId = key || (await getSiteIdByName(value))
        _.set(obj, source, siteId)
      } else _.set(obj, source, value)
    }
  }

  return obj
}

const getAllSites = async (partnerId, countryId, itemsSourceConfig, opt = {}) => {
  const dataConstraints = {
    partner: {
      id: partnerId,
    },
    country: {
      id: countryId,
    },
  }
  const { data: items } = await getListSitesForSelectList(dataConstraints, opt)

  return _.map(items, item => {
    const geographyData =
      itemsSourceConfig.stateLgaMode === 'id'
        ? {
            stateId: item.stateId,
            lgaId: item.lgaId,
          }
        : {
            state: item.stateName,
            lga: item.lgaName,
          }
    return {
      key: item[itemsSourceConfig?.key || 'externalId'],
      value: item[itemsSourceConfig?.value || 'name'],
      ...geographyData,
      ...JSON.parse(item.customProperties || '{}'),
    }
  })
}

module.exports = {
  getForms,
  getCustomFields,
  createFormObject,
  replaceOptionSourceProp,
  getCustomFieldPlaceholdersForNotifications,
  getCustomFieldsFromPayload,
  getFormsByFormDefinitionExternalIds,
}
