const _ = require('lodash')
const Promise = require('bluebird')
const bcrypt = require('bcrypt')
const { addMinutes, subMonths } = require('date-fns')
const truenatDeviceTypes = require('./fixtures/truenatDevice/DeviceType.json')
const truenatAssays = require('./fixtures/truenatDevice/Assays.json')
const truenatPatientDataSchema = require('./fixtures/truenatDevice/PatientDataSchema.json')
const truenatResultDataSchema = require('./fixtures/truenatDevice/ResultDataSchema.json')
const { seedPartnerAssay, seedPartnerDisease } = require('./utils')
const { deviceApprovalToId } = require('../src/shared/dictionary')
const { randomToken } = require('../src/deviceApi/apiKey')
const { passwordSaltRounds } = require('../src/config')
const upsertConsumables = require('./common/upsert_consumables')
const { insertSite } = require('../src/site/common/db')
const { insertDeviceWithGeneratedName } = require('./common/insertDeviceWithGeneratedName')

async function upsertTruenatDeviceTypeAndAssays(
  knex,
  assays = truenatAssays,
  defaultPatientDataSchema = truenatPatientDataSchema,
  defaultResultDataSchema = truenatResultDataSchema
) {
  const deviceTypeIds = {}
  await Promise.each(truenatDeviceTypes, async truenatDeviceType => {
    if (!_.some(assays, assay => assay.deviceTypeId === truenatDeviceType.externalId)) {
      return Promise.resolve()
    }
    const { id: existingDeviceTypeId } =
      (await knex('DeviceType').where('externalId', truenatDeviceType.externalId).first('id')) || {}
    const { id: deviceTypeCategoryId } =
      (await knex('DeviceTypeCategory').where('name', truenatDeviceType.deviceTypeCategoryId).first('id')) || {}
    if (!existingDeviceTypeId) {
      const [createdDeviceTypeId] = await knex('DeviceType').insert({
        ...truenatDeviceType,
        deviceTypeCategoryId,
      })
      deviceTypeIds[truenatDeviceType.externalId] = createdDeviceTypeId
    } else {
      await knex('DeviceType')
        .where('id', existingDeviceTypeId)
        .update({
          ...truenatDeviceType,
          deviceTypeCategoryId,
        })
      deviceTypeIds[truenatDeviceType.externalId] = existingDeviceTypeId
    }
  })
  const assayIds = {}
  await Promise.each(assays, async truenatAssay => {
    const { id: existingAssayId } = (await knex('Assay').where('externalId', truenatAssay.externalId).first('id')) || {}
    if (!existingAssayId) {
      const { id: assayTypeId } =
        (await knex('AssayType').where('externalId', truenatAssay.assayTypeId).first('id')) || {}
      const deviceTypeId = deviceTypeIds[truenatAssay.deviceTypeId]
      const { id: resultSourceId } =
        (await knex('ResultSource').where('externalId', truenatAssay.resultSourceId).first('id')) || {}
      const [createdAssayId] = await knex('Assay').insert({
        patientDataSchema: JSON.stringify(defaultPatientDataSchema),
        resultDataSchema: JSON.stringify(defaultResultDataSchema),
        ...truenatAssay,
        assayTypeId,
        deviceTypeId,
        resultSourceId,
      })
      assayIds[truenatAssay.externalId] = createdAssayId
      await upsertConsumables(knex, true, [truenatAssay.externalId])
    } else {
      assayIds[truenatAssay.externalId] = existingAssayId
    }
  })

  const assayTruenatMtbResultCategories = ['Detected', 'NotDetected', 'Invalid', 'NoResult', 'Error']
  const positiveResultCategories = ['Detected', 'Resistant']
  await Promise.each(assayTruenatMtbResultCategories, async truenatMtbResultCategory => {
    const { id: resultCategoryId } =
      (await knex('ResultCategory').where('externalId', truenatMtbResultCategory).first('id')) || {}
    const sharedTruenatMtbResultCategoryAssayProperties = {
      emphasize: false,
      requiresTreatment: positiveResultCategories.includes(truenatMtbResultCategory),
      reportable: true,
    }
    await Promise.each(['assayTruenatMtb', 'assayTruenatMtbPlus'], async truenatMtbAssayId => {
      const resultCategoryAssayTruenatMtb = {
        assayId: assayIds[truenatMtbAssayId],
        resultCategoryId,
      }
      const existingResultCategoryAssayTruenatMtb = await knex('ResultCategoryAssay')
        .where(resultCategoryAssayTruenatMtb)
        .first()
      if (!existingResultCategoryAssayTruenatMtb) {
        return knex('ResultCategoryAssay').insert({
          ...resultCategoryAssayTruenatMtb,
          ...sharedTruenatMtbResultCategoryAssayProperties,
        })
      }
    })
  })

  const assayTruenatMtbRifDxResultCategories = ['Resistant', 'Susceptible', 'Invalid', 'NoResult', 'Error']
  await Promise.each(assayTruenatMtbRifDxResultCategories, async truenatMtbRifDxResultCategory => {
    const { id: resultCategoryId } =
      (await knex('ResultCategory').where('externalId', truenatMtbRifDxResultCategory).first('id')) || {}
    const resultCategoryAssayTruenatMtbRifDx = {
      assayId: assayIds.assayTruenatRif,
      resultCategoryId,
    }
    const existingResultCategoryAssayTruenatMtbRifDx = await knex('ResultCategoryAssay')
      .where(resultCategoryAssayTruenatMtbRifDx)
      .first()
    if (!existingResultCategoryAssayTruenatMtbRifDx) {
      return knex('ResultCategoryAssay').insert({
        ...resultCategoryAssayTruenatMtbRifDx,
        emphasize: truenatMtbRifDxResultCategory === 'Resistant',
        requiresTreatment: positiveResultCategories.includes(truenatMtbRifDxResultCategory),
        reportable: true,
      })
    }
  })

  const assayTruenatUnknownResultCategories = ['Unknown', 'Missing']
  await Promise.each(assayTruenatUnknownResultCategories, async assayTruenatUnknownResultCategory => {
    const { id: resultCategoryId } =
      (await knex('ResultCategory').where('externalId', assayTruenatUnknownResultCategory).first('id')) || {}
    const resultCategoryAssayTruenatUnknown = {
      assayId: assayIds.assayTruenatUnknown,
      resultCategoryId,
      emphasize: false,
      requiresTreatment: false,
      reportable: false,
    }
    const existingResultCategoryAssayTruenatUnknown = await knex('ResultCategoryAssay')
      .where({
        assayId: assayIds.assayTruenatUnknown,
        resultCategoryId,
      })
      .first()
    if (!existingResultCategoryAssayTruenatUnknown) {
      await knex('ResultCategoryAssay').insert(resultCategoryAssayTruenatUnknown)
    }
  })

  await seedPartnerAssay(knex)
  await seedPartnerDisease(knex)
}

async function upsertTruenatDevices(knex, truenatDevices, partnerExternalId, adminUserName, countryAbbreviation) {
  await upsertTruenatDeviceTypeAndAssays(knex)
  // Initial Test Truenat Device
  const now = new Date()
  const { id: partnerId } = await knex('Partner').where('externalId', partnerExternalId).first('id')
  const { id: adminId } = await knex('User').where('name', adminUserName).first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  await Promise.each(truenatDevices, async truenatDevice => {
    const { id: geographyId } = await knex('Country as c')
      .join('Geography as g', 'c.id', 'g.countryId')
      .join('State as s', 'g.stateId', 's.id')
      .join('Lga as l', 'g.lgaId', 'l.id')
      .where('c.abbreviation', countryAbbreviation)
      .andWhere('s.name', truenatDevice.stateName)
      .andWhere('l.name', truenatDevice.lgaName)
      .first('g.id')

    if (truenatDevice.siteShortName && truenatDevice.siteShortName.length > 45) {
      truenatDevice.siteShortName = truenatDevice.siteShortName.substring(0, 45)
    }
    if (truenatDevice.deviceShortName && truenatDevice.deviceShortName.length > 45) {
      truenatDevice.deviceShortName = truenatDevice.deviceShortName.substring(0, 45)
    }
    let truenatLab = await knex('Site')
      .where('externalId', truenatDevice.siteExternalId)
      .andWhere('partnerId', partnerId)
      .andWhere('geographyId', geographyId)
      .first()
    if (!truenatLab) {
      const [truenatLabId] = await insertSite(knex, {
        ...auditFields,
        name: truenatDevice.siteName,
        shortName: truenatDevice.siteShortName,
        externalId: truenatDevice.siteExternalId,
        partnerId,
        geographyId,
        createdOn: new Date(),
        updatedOn: new Date(),
      })
      truenatLab = await knex('Site').where('id', truenatLabId).first()
    }
    const [truenatDeviceTypeId] = await knex('DeviceType').where({ externalId: 'molbioTruenat' }).pluck('id')
    const deviceApprovalApprovedId = await deviceApprovalToId('approved')
    let existingTruenatDevice = await knex('Device')
      .where('siteId', truenatLab.id)
      .andWhere('deviceTypeId', truenatDeviceTypeId)
      .first()
    if (!existingTruenatDevice) {
      const { id: newTruenatDeviceId } = await insertDeviceWithGeneratedName(knex, {
        ...auditFields,
        deviceTypeId: truenatDeviceTypeId,
        deviceApprovalId: deviceApprovalApprovedId,
        partnerId,
        siteId: truenatLab.id,
        defaultReportableSiteId: truenatLab.id,
        serial: truenatDevice.deviceSerial,
        createdOn: new Date(),
        updatedOn: new Date(),
        lastPingOn: new Date(),
        lastPingFromIp: `3.41.60.${Math.floor(Math.random() * 255)}`,
        lastSeenOn: new Date(),
        putInService: subMonths(new Date(), 2),
      })
      existingTruenatDevice = await knex('Device').where('id', newTruenatDeviceId).first()
      if (existingTruenatDevice.deviceApprovalId !== deviceApprovalApprovedId) {
        await knex('Device').where('id', newTruenatDeviceId).update({
          deviceApprovalId: deviceApprovalApprovedId,
          updatedOn: new Date(),
        })
      }
    } else {
      const deviceUpdates = {}
      if (truenatDevice.deviceName && existingTruenatDevice.name !== truenatDevice.deviceName) {
        deviceUpdates.name = truenatDevice.deviceName
      }
      if (truenatDevice.deviceShortName && existingTruenatDevice.shortName !== truenatDevice.deviceShortName) {
        deviceUpdates.shortName = truenatDevice.deviceShortName
      }
      if (truenatLab.id && existingTruenatDevice.siteId !== truenatLab.id) {
        deviceUpdates.siteId = truenatLab.id
      }
      if (truenatDevice.deviceSerial && existingTruenatDevice.serial !== truenatDevice.deviceSerial) {
        deviceUpdates.serial = truenatDevice.deviceSerial
      }
      if (!_.isEmpty(deviceUpdates)) {
        deviceUpdates.updatedOn = new Date()
        deviceUpdates.updatedBy = auditFields.updatedBy
        await knex('Device').where('id', existingTruenatDevice.id).update(deviceUpdates)
      }
    }
    const truenatDeviceApiKey = await knex('DeviceApiKey')
      .where('id', existingTruenatDevice.deviceApiKeyId)
      .whereNotNull('username')
      .whereNotNull('password')
      .andWhere('revoked', 0)
      .first()
    const password = await bcrypt.hash(truenatDevice.password, parseInt(passwordSaltRounds, 10))
    if (!truenatDeviceApiKey) {
      const [deviceApiKeyId] = await knex('DeviceApiKey').insert({
        token: randomToken(),
        revoked: 0,
        partnerId,
        geographyId,
        siteId: truenatLab.id,
        username: truenatDevice.username,
        password,
        expiresOn: addMinutes(new Date(), 15),
        ...auditFields,
      })

      await knex('Device').where('id', existingTruenatDevice.id).update({ deviceApiKeyId })
    } else {
      const deviceApiKeyFixtureChanged =
        truenatDeviceApiKey.geographyId !== geographyId ||
        truenatDeviceApiKey.siteId !== truenatLab.id ||
        truenatDeviceApiKey.username !== truenatDevice.username ||
        truenatDeviceApiKey.password !== password
      if (deviceApiKeyFixtureChanged) {
        await knex('DeviceApiKey').where('id', truenatDeviceApiKey.id).update({
          geographyId,
          siteId: truenatLab.id,
          username: truenatDevice.username,
          password,
          updatedOn: auditFields.updatedOn,
          updatedBy: auditFields.updatedBy,
        })
      }
    }
  })
}

module.exports = {
  upsertTruenatDeviceTypeAndAssays,
  upsertTruenatDevices,
}
