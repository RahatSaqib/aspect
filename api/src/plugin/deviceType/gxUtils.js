const _ = require('lodash')
const Boom = require('@hapi/boom')
const Promise = require('bluebird')
const { insertSite } = require('../../site/common/db')
const { createUniqueIdForResult } = require('../../result/service')
const { parseDateOrDefault } = require('../../shared/date')
const { shouldTriggerModuleDisabled } = require('../utils')
const {
  result1CategoryMapping,
  mapResultCategory2,
  getResultCategoriesHivVL,
  getResultCategoriesHcv,
  getVLCopies,
  getXdrDetectedResistanceCategoryTypes,
  getBacterialLoad,
} = require('./GxConnect/resultCategories/resultCategoriesMapping')
const { splitResultTextValues, sanitizeResultTextValue } = require('./GxConnect/resultCategories/utils')
const { assayNameToExternalId } = require('../../shared/assayNameToExternalId')

/*
The purpose of this plugin is to ensure that results are captured
even when the assay name in the result is unknown to Aspect
If the device is unknown, ignore this request
If an unknown assay is detected, create it
*/
async function preProcessMergeResult(context) {
  const { partnerPluginName, knex, payload, findResult, partnerId } = context

  const startedOn = _.get(payload, 'startedOn') || _.get(payload, 'endedOn')
  const endedOn = _.get(payload, 'endedOn') || startedOn
  if (!startedOn) {
    throw Boom.badRequest('Start date or end date is required for a result from GxConnect')
  }

  // Override assay.id
  const payloadAssayName = _.get(payload, 'data.assay', '')
  const mappedAssayExternalId = assayNameToExternalId[payloadAssayName.toUpperCase()] || 'GxUnknown'
  _.set(payload, 'assay.id', mappedAssayExternalId)

  if (!_.isEmpty(payload.data)) {
    const resultText = _.get(payload, 'data.resultText')
    payload.category = getResultCategories(mappedAssayExternalId, resultText)
  } else {
    payload.data = {}
  }
  const instrumentSerial = _.get(payload, 'instrument.serial', null)
  const cartridgeSerial = _.get(payload, 'consumable[0].serial', null)

  // Lazy load the loadPlugin function to avoid circular dependency, as we are in a plugin function already
  const { loadPlugin } = require('../loadPlugin')
  const extractSampleIdPlugin = await loadPlugin(partnerPluginName, null, 'extractSampleId')
  const sampleId = extractSampleIdPlugin(payload)
  _.set(payload, 'sample.id', sampleId)

  if (payload.id) {
    payload.data.geneXpertTestId = payload.id
  }
  let generatedExternalId = createUniqueIdForResult(instrumentSerial, startedOn, endedOn, sampleId)
  const gxAlertUniqueId = _.get(payload, 'data.gxAlertTestUniqueId', generatedExternalId)
  const geneXpertTestId = _.get(payload, 'id') || _.get(payload, 'data.id')

  const potentialAssayIds = [mappedAssayExternalId]
  if (potentialAssayIds.includes('GxMtbRif') && !potentialAssayIds.includes('GxMtbRifUltra')) {
    potentialAssayIds.push('GxMtbRifUltra')
  }
  if (potentialAssayIds.includes('GxMtbRifUltra') && !potentialAssayIds.includes('GxMtbRif')) {
    potentialAssayIds.push('GxMtbRif')
  }

  const additionalData = getAdditionalDataFromPayload(payload, potentialAssayIds)
  payload.data = _.assign(payload.data, additionalData)

  const resultFindings = await findResult(
    {
      partnerId,
      geneXpertTestId,
      gxAlertUniqueId,
      cartridgeSerial,
      instrumentSerial,
      potentialSampleIds: [sampleId],
      siteId: context.device.siteId,
      potentialAssayIds,
      startedOn: payload.startedOn,
    },
    knex
  )

  const { matchingResult: existingResult } = resultFindings

  if (existingResult) {
    context.existingResultId = existingResult.id // adding the existing result id to the context to make it available for the rest of the process

    if (_.get(existingResult, 'externalId') !== generatedExternalId) {
      try {
        await knex('Result').where('id', existingResult.id).update({ externalId: generatedExternalId })
      } catch (err) {
        // generatedExternalId = createUniqueIdForResult(... can return a duplicate value as explained
        //  in the comments to that function. If this update violates the unique constraints in the Result
        //  table, the externalId can remain as is and Aspect can uignore the error.
        if (err.code === 'ER_DUP_ENTRY') {
          generatedExternalId = payload.id ? payload.id : existingResult.externalId
        } else {
          throw err
        }
      }
    }
  }
  payload.id = generatedExternalId
}

function getAdditionalDataFromPayload(payload, assays) {
  const data = {}
  if (assays.includes('GxMtbRif') && _.get(payload, 'data.resultText')) {
    const bacterialLoad = getBacterialLoad(_.get(payload, 'data.resultText'))
    if (bacterialLoad) data.bacterialLoad = bacterialLoad
  }

  if (assays.includes('GxHiv1Vl')) {
    const copies = getVLCopies(_.get(payload, 'data.resultText'))
    if (copies) data.copies = copies
  }

  if (assays.includes('GxMtbXdr')) {
    const { detectedResistance, allResistances } = getXdrDetectedResistanceCategoryTypes(
      _.get(payload, 'data.resultText')
    )
    data.detectedResistance = detectedResistance
    data.allResistances = allResistances
  }

  return data
}

async function transformMergeResultPayload({ deviceId, payload, knex }) {
  const resultCoordinates = _.get(payload, 'location')
  if (deviceId && (_.isEmpty(resultCoordinates) || (!resultCoordinates.latitude && !resultCoordinates.longitude))) {
    const siteCoordinates = await knex('Device as d')
      .join('Site as s', 'd.siteId', 's.id')
      .where('d.id', deviceId)
      .first('s.latitude', 's.longitude')

    if (!_.isEmpty(siteCoordinates) && (siteCoordinates.longitude || siteCoordinates.latitude)) {
      payload.location = siteCoordinates
    }
  }
  return Promise.resolve(payload)
}

async function postProcessUpdateDeviceConfiguration({ knex, payload, device: { id: deviceId }, now, messageContext }) {
  const configurationData = _.get(payload, 'configuration.data') || {}

  if (configurationData.disabledModules) {
    await Promise.each(configurationData.disabledModules, modules =>
      shouldTriggerModuleDisabled(knex, messageContext, device, modules)
    )
  }

  //
  let device = {}
  if (!_.isEmpty(_.get(payload, 'data'))) {
    const {
      data: { macAddress, hostId, culture, timezone, deviceSerialNumber, lastPingOn, state, lga, latitude, longitude },
    } = payload

    const deviceDetails = {
      hostId,
      culture,
      timezone,
      lastSeenOn: now,
      updatedOn: now,
      updatedBy: null,
    }
    if (macAddress && macAddressValid(macAddress)) {
      deviceDetails.macAddress = macAddress
    }
    if (lastPingOn) {
      deviceDetails.lastPingOn = parseDateOrDefault(lastPingOn)
    }
    if (deviceSerialNumber) {
      deviceDetails.serial = deviceSerialNumber
    }
    if (state || !_.isUndefined(latitude) || !_.isUndefined(latitude)) {
      const currentDeviceGeography = await knex('Device as d')
        .leftJoin('Site as s', 'd.siteId', 's.id')
        .leftJoin('Geography as g', 's.geographyId', 'g.id')
        .leftJoin('State as st', 'g.stateId', 'st.id')
        .leftJoin('Lga as l', 'g.lgaId', 'l.id')
        .where('d.id', deviceId)
        .first(
          'g.countryId',
          'g.stateId',
          'st.name as stateName',
          'g.lgaId',
          'l.name as lgaName',
          'd.siteId',
          's.latitude',
          's.longitude'
        )
      const siteUpdateDetails = {}
      if (!_.isEmpty(currentDeviceGeography)) {
        let newStateId = currentDeviceGeography.stateId
        let newLgaId = currentDeviceGeography.lgaId
        if (state !== currentDeviceGeography.stateName) {
          ;[newStateId] = await knex('Geography as g')
            .join('State as s', 'g.stateId', 's.id')
            .where('g.countryId', currentDeviceGeography.countryId)
            .andWhere('s.name', state)
            .pluck('s.id')
        }
        if (newStateId && lga) {
          if (lga !== currentDeviceGeography.lgaName) {
            ;[newLgaId] = await knex('Geography as g')
              .join('Lga as l', 'g.lgaId', 'l.id')
              .where('g.stateId', newStateId)
              .andWhere('l.name', lga)
              .pluck('l.id')
          } else if (newStateId !== currentDeviceGeography.stateId) {
            newLgaId = null
          }
        }
        newStateId = newStateId || null
        newLgaId = newLgaId || null
        if (newStateId !== currentDeviceGeography.stateId || newLgaId !== currentDeviceGeography.lgaId) {
          const newGeography = await knex('Geography as g')
            .where({
              countryId: currentDeviceGeography.countryId,
              stateId: newStateId,
              lgaId: newLgaId,
            })
            .first('g.id')
          if (newGeography) {
            if (currentDeviceGeography.siteId) {
              siteUpdateDetails.geographyId = newGeography.id
            }
          }
        }
        if (!_.isUndefined(latitude) && currentDeviceGeography.latitude !== latitude) {
          siteUpdateDetails.latitude = latitude
        }
        if (!_.isUndefined(longitude) && currentDeviceGeography.longitude !== longitude) {
          siteUpdateDetails.longitude = longitude
        }
        if (!_.isEmpty(siteUpdateDetails)) {
          await knex('Site').where({ id: currentDeviceGeography.siteId }).update(siteUpdateDetails)
        }
      }
    }
    if (deviceId) {
      await updateDeviceDetails(knex, deviceId, _.omitBy(deviceDetails, _.isNil), now)
      device = await getDeviceInfo(knex, deviceId)
    }
  }
  return { device }
}

async function updateDeviceDetails(knex, deviceId, deviceDetails, now) {
  // Compare existing device to these details
  // which field vakues are different?
  const existingDevice = await knex('Device as d').where({ 'd.id': deviceId }).first()
  /* validates if the tz is included in our db */
  if (deviceDetails.timezone && existingDevice.timezone !== deviceDetails.timezone) {
    const { timeZone: defaultTimeZone } =
      (await knex('Site as s')
        .join('Geography as g', 's.geographyId', 'g.id')
        .join('Country as c', 'g.countryId', 'c.id')
        .where('s.id', existingDevice.siteId)
        .first(knex.raw('COALESCE(s.timezoneId, c.timezone) as timeZone'))) ||
      (await knex('Country as c').first('c.timezone as timeZone'))
    const { existingTimeZone } = (await knex('TimeZone')
      .where('id', deviceDetails.timezone)
      .first('id as existingTimeZone')) || {
      existingTimeZone: defaultTimeZone,
    }

    deviceDetails.timezone = existingTimeZone
  }
  const changedDetails = _.omitBy(
    deviceDetails,
    (v, k) => ['id', 'createdOn', 'createdBy'].includes(k) || existingDevice[k] == v // eslint-disable-line eqeqeq
  )
  if (!_.isEmpty(changedDetails)) {
    await knex('Device')
      .where({ id: deviceId })
      .update(
        _.merge({}, changedDetails, {
          updatedBy: null,
          updatedOn: now,
        })
      )
  }
}

async function getDeviceInfo(knex, deviceId) {
  const device = await knex('Device as d')
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .where({ 'd.id': deviceId })
    .first('d.*', 'g.id as geographyId')
  delete device.configurationData
  return device
}

async function getOrCreateSite(knex, device, payload, now, countryCode, deviceName, deviceShortName, fromGxAlert) {
  let sites = []
  if (!countryCode) {
    countryCode = _.get(payload, 'configuration.data.country')
    if (!countryCode) {
      if (!countryCode && device) {
        ;[countryCode] = await knex('Device as d')
          .leftJoin('Site as s', 's.id', 'd.siteId')
          .leftJoin('Geography as g', 's.geographyId', 'g.id')
          .leftJoin('Country as c', 'g.countryId', 'c.id')
          .where('d.id', device.id)
          .pluck('c.abbreviation')
      }
    }
  }
  if (!deviceName) {
    deviceName = _.get(payload, 'name')
  }
  if (!deviceShortName) {
    deviceShortName = _.get(payload, 'configuration.data.shortName')
  }
  if (deviceName && countryCode) {
    if (device.siteId && !fromGxAlert) {
      sites = await knex.from('Site as s').where('s.id', device.siteId).select()
    }
    const payloadSiteId = _.get(payload, 'site.id')
    if (_.isEmpty(sites) && payloadSiteId) {
      sites = await knex
        .from('Site as s')
        .where({
          's.externalId': payloadSiteId,
          's.partnerId': device.partnerId,
        })
        .select()
    }
    if (_.isEmpty(sites) && device.id && !fromGxAlert) {
      sites = await knex
        .from('Device as d')
        .join('Site as s', 'd.siteId', 's.id')
        .where({ 'd.id': device.id })
        .select('s.*')
    }
    if (_.isEmpty(sites)) {
      const matchingSites = await knex
        .from('Site as s')
        .join('Geography as g', 's.geographyId', 'g.id')
        .join('Country as c', 'g.countryId', 'c.id')
        .where({
          's.partnerId': device.partnerId,
          'c.abbreviation': countryCode,
          's.disabled': 0,
        })
        .andWhere(function () {
          if (deviceName) {
            this.where({ 's.name': deviceName }).orWhere({
              's.externalId': deviceName,
            })
          }
          if (deviceShortName) {
            this.orWhere({
              's.externalId': deviceShortName,
            })
          }
        })
        .select('s.*')
      if (matchingSites.length === 1) {
        sites = matchingSites.splice(0, 1)
      } else if (matchingSites.length > 1) {
        throw Boom.conflict(
          `Cannot uniquely determine which site this request came from comparing the device name with the site name or site external id, or the device short name with the site external ID. More than one site were found for the device name ${deviceName} and the device short name ${deviceShortName}. The sites IDs are: ${matchingSites.join(
            ', '
          )}.`
        )
      }
      if (_.isEmpty(sites)) {
        // If we cannot determine the site by name, external ID or device
        // create a new site
        const country = await knex.from('Country as c').where({ abbreviation: countryCode }).first('c.id')
        if (country == null) {
          throw Boom.notFound(`Cannot determine the country from ${countryCode}.`)
        }
        const { id: countryId } = country
        const [geography] = await knex
          .from('Geography as g')
          .where({ 'g.countryId': countryId })
          .whereNull('g.stateId')
          .whereNull('g.lgaId')
          .select('g.id')
        if (_.isEmpty(geography)) {
          const [geographyId] = await knex('Geography').insert({ countryId })
          geography.id = geographyId
        }

        const newSite = {
          name: deviceName,
          shortName: deviceShortName || deviceName,
          externalId: deviceName,
          partnerId: device.partnerId,
          geographyId: geography.id,
          createdOn: now,
          updatedOn: now,
        }
        if (newSite.name.length > 255) {
          newSite.name = newSite.name.substr(0, 255)
        }
        if (newSite.shortName.length > 45) {
          newSite.shortName = newSite.shortName.substr(0, 45)
        }
        if (newSite.externalId.length > 255) {
          newSite.externalId = newSite.externalId.substr(0, 255)
        }
        const [newSiteId] = await insertSite(knex, newSite)
        sites = await knex.from('Site as s').where('s.id', newSiteId).select()
      }
    }
  } else {
    throw Boom.notFound(
      `Cannot determine which site this request came from - deviceName: ${deviceName}, countryCode: ${countryCode}`
    )
  }
  return _.head(sites)
}

function getResultCategories(assayExternalId, resultText) {
  const categories = []

  if (resultText) {
    const parts = splitResultTextValues(resultText)

    if (parts.length === 0) return categories

    const status = sanitizeResultTextValue(parts[0])

    if (assayExternalId === 'GxHcv') {
      const hivCategory = getResultCategoriesHcv(status)
      return [{ id: hivCategory }]
    }

    if (assayExternalId === 'GxHiv1Vl') {
      const hivCategory = getResultCategoriesHivVL(status)
      if (hivCategory) categories.push({ id: hivCategory })
    }

    if (categories.length === 0) {
      const category1 = result1CategoryMapping[status]
      if (category1) categories.push({ id: category1 })
    }

    const category2 = mapResultCategory2(assayExternalId, parts)
    if (category2) categories.push({ id: category2 })
  } else if (assayExternalId === 'GxHiv1Vl') categories.push({ id: 'NoResult' })

  return categories
}

function macAddressValid(macAddress) {
  return (
    !_.isEmpty(macAddress) &&
    macAddress.indexOf('MAC') === 0 &&
    macAddress.trim().length > 3 &&
    macAddress !== 'MAC005345000000'
  )
}

module.exports = {
  getOrCreateSite,
  preProcessMergeResult,
  transformMergeResultPayload,
  postProcessUpdateDeviceConfiguration,
  getAdditionalDataFromPayload,
  getResultCategories,
}
