const _ = require('lodash')
const Promise = require('bluebird')
const Boom = require('@hapi/boom')
const { transact } = require('../../../db')
const { getDateOrDefault, parseDateOrDefault, dateEqual } = require('../../../shared/date')
const { deviceSeen } = require('../../../device/actions')
const PhilippinesNtrlDatabase = require('../philippinesNtrlDatabase')
const {
  sampleTypeToId,
  assayToId,
  resultSourceToId,
  resultTypeToId,
  allResultCategoryToId,
  allResultWorkflowStatusToId,
} = require('../../../shared/dictionary')
const expectedKeys = require('./expectedKeys')
const dateKeys = require('./dateKeys')
const { getResultDateOrDefault } = require('../common/utils')
const { mapPatientData, sampleTypeMapping, resultDataMappings } = require('./mappings')
const { testTypes } = require('../common/mapping')
const { insertSite } = require('../../../site/common/db')

class PhilippinesNtrlRitm extends PhilippinesNtrlDatabase {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
  }

  static async canProcessRequest(request) {
    return PhilippinesNtrlDatabase.isRequestFromNtrlDatabase(
      request,
      expectedKeys,
      'RITM',
      'RECORDS_WITH_SIGN_OFFS_RITM'
    )
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request
    this.response = { deviceApiRawId: this.id, resultIds: [] }
    return transact(async knex => {
      try {
        const { deviceId, partnerId, geographyId } =
          (await knex('DeviceApiKey')
            .where('token', auth.credentials.token)
            .first('deviceId', 'partnerId', 'geographyId')) || {}
        if (!deviceId) {
          throw Boom.badRequest('Invalid device API key: Cannot determine which device this came from')
        }
        this.response.deviceId = deviceId
        dateKeys.forEach(dateKey => {
          payload[dateKey] = getDateOrDefault(payload, dateKey)
        })
        const rawMessage = JSON.stringify(request.plugins.rawPayload)
        const utcNow = new Date()

        await knex('Device').where({ id: deviceId }).update({ lastSeenOn: utcNow, updatedOn: utcNow })
        const site = await knex('Device as d')
          .join('Site as s', 'd.siteId', 's.id')
          .where('d.id', deviceId)
          .first('s.*', 'd.name as deviceName', 'd.defaultReportableSiteId as deviceDefaultReportableSiteId')

        this.messageContext.dispatch(deviceSeen(deviceId))

        const sampleTypeId = await sampleTypeToId(sampleTypeMapping[payload['Specimen Type']] || 'Other')
        const sanitizeReferringFacility = rawValue => {
          let facilityName = (rawValue || '').replace(/c\/o|,|\(|\)/gi, ' ')
          while (facilityName.indexOf('  ') > -1) {
            facilityName = facilityName.replace(/\s\s/g, ' ').trim()
          }
          if (['DOTS', 'NO DATA', 'CD', 'D', 'C'].includes(facilityName.toUpperCase())) {
            facilityName = null
          }
          return facilityName
        }
        let referringFacility = sanitizeReferringFacility(payload.Address)
        if (!referringFacility) {
          referringFacility = sanitizeReferringFacility(payload['Referring Facility'])
        }
        let originSite
        if (referringFacility) {
          originSite = await knex('Site')
            .where('partnerId', partnerId)
            .andWhere(queryBuilder => {
              queryBuilder
                .where('externalId', referringFacility)
                .orWhere('name', referringFacility)
                .orWhere('shortName', referringFacility)
            })
            .first()
          if (!originSite) {
            const shortName = referringFacility.length > 45 ? referringFacility.substring(0, 45) : referringFacility
            const countryDetails =
              (await knex('Geography as siteGeography')
                .join('Country as country', 'siteGeography.countryId', 'country.id')
                .join('Geography as countryGeography', 'siteGeography.countryId', 'countryGeography.countryId')
                .where('siteGeography.id', geographyId)
                .whereNull('countryGeography.stateId')
                .whereNull('countryGeography.lgaId')
                .first('countryGeography.id as countryGeographyId', 'country.timezone')) || {}
            const [originSiteId] = await insertSite(knex, {
              name: referringFacility,
              shortName,
              externalId: referringFacility,
              partnerId,
              geographyId: countryDetails.countryGeographyId,
              timezoneId: countryDetails.timezone,
              createdOn: utcNow,
              updatedOn: utcNow,
            })
            originSite = await knex('Site').where('id', originSiteId).first()
          }
        }
        const labRequestIdPrefix =
          payload.database === 'RITM' || payload.table === 'RECORDS_WITH_SIGN_OFFS_RITM'
            ? 'RN-19-'
            : payload.database.indexOf('RITM') === 0
            ? `RN-${payload.database.substr(payload.database.length - 2)}-`
            : `RN-${payload.table.substr(payload.table.length - 2)}-`
        const ntrlLabRequestId = `${labRequestIdPrefix}${payload['Serial Code RN-14-']}`
        const sampleOriginSiteId = originSite ? originSite.id : null
        const reportableSiteId = sampleOriginSiteId || site.deviceDefaultReportableSiteId || site.id
        const now = new Date()
        const numberOfSamples =
          !!payload['Smear Result 3'] ||
          !!payload['TBC Test Result 3rd Sample'] ||
          !!payload['DST Test Result 3rd Sample'] ||
          !!payload['GX Test Result 3rd Sample'] ||
          !!payload['Smear Result 3 Date Collected']
            ? 3
            : !!payload['Smear Result 2'] ||
              !!payload['TBC Test Result 2nd Sample'] ||
              !!payload['Smear Result 2 Date Collected']
            ? 2
            : 1
        const samples = _.range(1, numberOfSamples + 1).map(sampleNumber => {
          const sample = {
            externalId: numberOfSamples > 1 ? `${ntrlLabRequestId}-${sampleNumber}` : `${ntrlLabRequestId}`,
            collectedOn:
              payload[`Smear Result ${sampleNumber} Date Collected`] || payload['Date and Time of Specimen Collection'],
            sampleTypeId,
            originSiteId: sampleOriginSiteId,
            updatedOn: now,
          }
          return sample
        })
        await Promise.each(samples, async (sample, index) => {
          let existingSample = await knex('Sample').where('externalId', sample.externalId).first()
          if (!existingSample && index === 0) {
            existingSample = await knex('Sample').where('externalId', ntrlLabRequestId).first()
          }
          if (existingSample) {
            sample.id = existingSample.id
            if (
              existingSample.externalId !== sample.externalId ||
              existingSample.sampleTypeId !== sample.sampleTypeId ||
              !dateEqual(existingSample.collectedOn, sample.collectedOn) ||
              existingSample.originSiteId !== sample.originSiteId
            ) {
              await knex('Sample').where('id', existingSample.id).update(sample)
            }
          } else if (!existingSample) {
            const [sampleId] = await knex('Sample').insert({ ...sample, createdOn: now })
            sample.id = sampleId
          }
        })
        const sampleIds = samples.map(sample => sample.id)
        const patientData = mapPatientData(payload, ntrlLabRequestId)
        const resultSourceId = await resultSourceToId('LIMS')
        const resultTypeId = await resultTypeToId('Patient')
        const resultCategories = await allResultCategoryToId()
        const resultWorkflowStatuses = await allResultWorkflowStatusToId()
        const baseNewResult = {
          partnerId: site.partnerId,
          siteId: site.id,
          deviceId,
          longitude: site.longitude,
          latitude: site.latitude,
          resultSourceId,
          resultTypeId,
          resultCategory1: resultCategories.Missing,
          resultCategory2: resultCategories.Missing,
          patientData: JSON.stringify(patientData),
          rawData: rawMessage,
          createdOn: utcNow,
          createdBy: null,
          updatedOn: utcNow,
          updatedBy: null,
        }

        let { mapResultData, isPayloadValid } = resultDataMappings[testTypes.DST]
        if (isPayloadValid(payload)) {
          const mappedResultData = mapResultData(payload)
          const { encodedResult } = mappedResultData
          const dstResultOverwritePriority = [
            resultCategories.PositiveMTB,
            resultCategories.PositiveMOTT,
            resultCategories.Detected,
            resultCategories.Resistant,
            resultCategories.Susceptible,
            resultCategories.Contaminated,
            resultCategories.Invalid,
            resultCategories.NotDetected,
            resultCategories.Missing,
          ]
          const assayBdMgitAstId = await assayToId('assayBdMgitAst')
          const assayGenericDstId = await assayToId('assayGenericDst')
          if (!assayBdMgitAstId && !assayGenericDstId) {
            throw Boom.notImplemented('MGIT AST & TB DST Assays are not currently supported on this instance of Aspect')
          }
          const externalId = `${site.externalId}_${samples[0].externalId}_DST`
          const resultSignOff = this.getResultSignOff('DST', payload)
          const performedOn = getResultDateOrDefault(patientData, encodedResult)
          const result = (await knex('Result')
            .where({ externalId, deviceId })
            .orWhere(queryBuilder => {
              queryBuilder
                .whereIn('sampleId', sampleIds)
                .whereIn(
                  'assayId',
                  [assayBdMgitAstId, assayGenericDstId].filter(a => !!a)
                )
                .andWhere('siteId', site.id)
            })
            .first()) || {
            ...baseNewResult,
            externalId,
            assayId:
              !assayGenericDstId || (encodedResult.methodUsed || '').includes('MGIT')
                ? assayBdMgitAstId
                : assayGenericDstId,
            sampleId: samples[0].id,
            startedOn: performedOn,
            endedOn: performedOn,
            resultData: JSON.stringify({
              ...mappedResultData,
              resultSignOff,
            }),
            senderOperator: encodedResult.labTech,
            reportableSiteId,
          }
          const resultData = JSON.parse(result.resultData)
          if (resultData.testStartDateTime) {
            result.startedOn = parseDateOrDefault(resultData.testStartDateTime)
          }
          if (resultData.testEndedDateTime) {
            result.endedOn = parseDateOrDefault(resultData.testEndedDateTime)
          }
          const dstResultCategory1Id =
            {
              'Mycobacterium tuberculosis': resultCategories.PositiveMTB,
              ' No growth after 8 weeks': resultCategories.NotDetected,
              'No growth after 8 weeks': resultCategories.NotDetected,
              'Non-tuberculous mycobacteria': resultCategories.PositiveMOTT,
              Contaminated: resultCategories.Contaminated,
              'Incomplete: Did Not Sumbit 2 Samples': resultCategories.Missing,
              'Incomplete: Did Not Submit 2 Samples w/in 3 days': resultCategories.Missing,
              'Incomplete: Not submitted 2 samples w/in 3 days': resultCategories.Missing,
            }[encodedResult.idResult] || resultCategories.Missing
          const dstResultCategory2IdMappings = {
            RESISTANT: resultCategories.Resistant,
            SUSCEPTIBLE: resultCategories.Susceptible,
            'NOT TESTED': resultCategories.Missing,
          }
          const dstResultsForDrugsTested = [
            encodedResult.streptomycin,
            encodedResult.isoniazid,
            encodedResult.rifampicin,
            encodedResult.ethambutol,
            encodedResult.pyrazinamide,
            encodedResult.kanamycin,
            encodedResult.levofloxacin,
            encodedResult.amikacin,
            encodedResult.capreomycin,
            encodedResult.ofloxacin,
          ]
          let resultCategory2Id = resultCategories.Missing
          if (
            dstResultsForDrugsTested.some(
              resultForDrugsTested => dstResultCategory2IdMappings[resultForDrugsTested] === resultCategories.Resistant
            )
          ) {
            resultCategory2Id = resultCategories.Resistant
          } else if (
            dstResultsForDrugsTested.some(
              resultForDrugsTested =>
                dstResultCategory2IdMappings[resultForDrugsTested] === resultCategories.Contaminated
            )
          ) {
            resultCategory2Id = resultCategories.Contaminated
          } else if (
            dstResultsForDrugsTested.some(
              resultForDrugsTested =>
                dstResultCategory2IdMappings[resultForDrugsTested] === resultCategories.Susceptible
            )
          ) {
            resultCategory2Id = resultCategories.Susceptible
          } else if (
            dstResultsForDrugsTested.some(
              resultForDrugsTested => dstResultCategory2IdMappings[resultForDrugsTested] === resultCategories.Invalid
            )
          ) {
            resultCategory2Id = resultCategories.Invalid
          }
          await this.upsertResult(
            knex,
            rawMessage,
            site,
            result,
            dstResultCategory1Id,
            resultCategory2Id,
            mappedResultData,
            resultSignOff,
            performedOn,
            performedOn,
            encodedResult.readBy,
            encodedResult.remarks,
            patientData,
            utcNow,
            resultCategories,
            resultWorkflowStatuses,
            dstResultOverwritePriority
          )
        }

        ;({ mapResultData, isPayloadValid } = resultDataMappings[testTypes.CULTURE])
        if (isPayloadValid(payload)) {
          const mappedResultData = mapResultData(payload)
          const { encodedResult } = mappedResultData
          const assayBdMgitGndId = await assayToId('assayBdMgitGnd')
          const assayGenericCultureId = await assayToId('assayGenericCulture')
          if (!assayBdMgitGndId && !assayGenericCultureId) {
            throw Boom.notImplemented(
              'MGIT GND & Generic Culture Assays are not currently supported on this instance of Aspect'
            )
          }
          const cultureSamples = []
          if (encodedResult.result1) {
            cultureSamples.push(samples[0])
          }
          if (encodedResult.result2 && samples.length > 1) {
            cultureSamples.push(samples[1])
          }
          if (encodedResult.result3 && samples.length > 2) {
            cultureSamples.push(samples[2])
          }
          const resultCategoryMappings = {
            'Mycobacterium tuberculosis': resultCategories.PositiveMTB,
            'No growth after 6 weeks': resultCategories.NotDetected,
            'No growth after 8 weeks': resultCategories.NotDetected,
            Contaminated: resultCategories.Contaminated,
            Spillage: resultCategories.Invalid,
            'Non-tuberculous mycobacteria': resultCategories.PositiveMOTT,
            QNS: resultCategories.Invalid,
          }
          const cultureResultOverwritePriority = [
            resultCategories.PositiveMTB,
            resultCategories.Detected,
            resultCategories.PositiveMOTT,
            resultCategories.Resistant,
            resultCategories.Susceptible,
            resultCategories.Contaminated,
            resultCategories.Invalid,
            resultCategories.NotDetected,
            resultCategories.NoResult,
            resultCategories.Missing,
          ]
          const resultSignOff = this.getResultSignOff('Culture', payload)
          const performedOn = getResultDateOrDefault(patientData, encodedResult)
          await Promise.each(cultureSamples, async (cultureSample, index) => {
            const externalId = `${site.externalId}_${cultureSample.externalId}_CULTURE`
            const result = (await knex('Result')
              .where({ externalId, deviceId })
              .orWhere(queryBuilder => {
                queryBuilder
                  .whereIn('assayId', [assayBdMgitGndId, assayGenericCultureId])
                  .andWhere('sampleId', cultureSample.id)
                  .andWhere('siteId', site.id)
              })
              .first()) || {
              ...baseNewResult,
              externalId,
              assayId:
                !assayGenericCultureId || (encodedResult.methodUsed1 || '').includes('MGIT')
                  ? assayBdMgitGndId
                  : assayGenericCultureId,
              sampleId: cultureSample.id,
              reportableSiteId,
              startedOn: performedOn,
              endedOn: performedOn,
              resultData: JSON.stringify({
                ...mappedResultData,
                resultSignOff,
              }),
              senderOperator: encodedResult.medTech,
            }
            const resultData = JSON.parse(result.resultData)
            if (resultData.testStartDateTime) {
              result.startedOn = parseDateOrDefault(resultData.testStartDateTime)
            }
            if (resultData.testEndedDateTime) {
              result.endedOn = parseDateOrDefault(resultData.testEndedDateTime)
            }
            const resultCategory1Id =
              resultCategoryMappings[encodedResult[`result${index + 1}`]] || resultCategories.Missing
            const resultCategory2Id = resultCategoryMappings[encodedResult.finalResult] || resultCategories.Missing
            await this.upsertResult(
              knex,
              rawMessage,
              site,
              result,
              resultCategory1Id,
              resultCategory2Id,
              mappedResultData,
              resultSignOff,
              performedOn,
              performedOn,
              encodedResult.labTech,
              encodedResult.remarks,
              patientData,
              utcNow,
              resultCategories,
              resultWorkflowStatuses,
              cultureResultOverwritePriority
            )
          })
        }

        ;({ mapResultData, isPayloadValid } = resultDataMappings[testTypes.SMEAR])
        if (isPayloadValid(payload)) {
          const mappedResultData = mapResultData(payload)
          const { encodedResult } = mappedResultData
          const performedOn = getResultDateOrDefault(patientData, encodedResult)
          const assaySmearId = await assayToId('assaySmear')
          const smearSamples = []
          if (encodedResult.smearResult1) {
            smearSamples.push(samples[0])
          }
          if (encodedResult.smearResult2 && samples.length > 1) {
            smearSamples.push(samples[1])
          }
          if (encodedResult.smearResult3 && samples.length > 2) {
            smearSamples.push(samples[2])
          }
          const resultCategoryMappings = {
            0: resultCategories.NotDetected,
            '+1': resultCategories.Detected,
            '+2': resultCategories.Detected,
            '+3': resultCategories.Detected,
            '+4': resultCategories.Detected,
            '+5': resultCategories.Detected,
            '+6': resultCategories.Detected,
            '+7': resultCategories.Detected,
            '+8': resultCategories.Detected,
            '+9': resultCategories.Detected,
            '+10': resultCategories.Detected,
            '+11': resultCategories.Detected,
            '+12': resultCategories.Detected,
            '+13': resultCategories.Detected,
            '+14': resultCategories.Detected,
            '+15': resultCategories.Detected,
            '+16': resultCategories.Detected,
            '+17': resultCategories.Detected,
            '+18': resultCategories.Detected,
            '+19': resultCategories.Detected,
            '+20': resultCategories.Detected,
            '+21': resultCategories.Detected,
            '+22': resultCategories.Detected,
            '+23': resultCategories.Detected,
            '+24': resultCategories.Detected,
            '+25': resultCategories.Detected,
            '+26': resultCategories.Detected,
            '+27': resultCategories.Detected,
            '+28': resultCategories.Detected,
            '+29': resultCategories.Detected,
            '1+': resultCategories.Positive1,
            '2+': resultCategories.Positive2,
            '3+': resultCategories.Positive3,
            QNS: resultCategories.Invalid,
            'NON-VIABLE': resultCategories.Invalid,
            'NOT DONE': resultCategories.NoResult,
            'POSITIVE for Acid Fast Bacilli': resultCategories.Detected,
            'NEGATIVE for Acid Fast Bacilli': resultCategories.NotDetected,
          }
          const smearResultOverwritePriority = [
            resultCategories.Positive3,
            resultCategories.Positive2,
            resultCategories.Positive1,
            resultCategories.Detected,
            resultCategories.Invalid,
            resultCategories.NotDetected,
            resultCategories.NoResult,
            resultCategories.Missing,
          ]
          const resultSignOff = this.getResultSignOff('Smear', payload)
          await Promise.each(smearSamples, async (smearSample, index) => {
            const externalId = `${site.externalId}_${smearSample.externalId}_SMEAR`
            const result = (await knex('Result')
              .where({ externalId, deviceId })
              .orWhere(queryBuilder => {
                queryBuilder
                  .where('assayId', assaySmearId)
                  .andWhere('sampleId', smearSample.id)
                  .andWhere('siteId', site.id)
              })
              .first()) || {
              ...baseNewResult,
              externalId,
              assayId: assaySmearId,
              sampleId: smearSample.id,
              reportableSiteId,
              startedOn: performedOn,
              endedOn: performedOn,
              resultData: JSON.stringify({
                ...mappedResultData,
                resultSignOff,
              }),
              senderOperator: encodedResult.laboratoryTechnician,
            }
            const resultCategory1Id = resultCategoryMappings[encodedResult[`smearResult${index + 1}`]]
            const resultCategory2Id = resultCategoryMappings[encodedResult.finalResult]
            await this.upsertResult(
              knex,
              rawMessage,
              site,
              result,
              resultCategory1Id,
              resultCategory2Id,
              mappedResultData,
              resultSignOff,
              performedOn,
              performedOn,
              encodedResult.laboratoryTechnician,
              null,
              patientData,
              utcNow,
              resultCategories,
              resultWorkflowStatuses,
              smearResultOverwritePriority
            )
          })
        }

        ;({ mapResultData, isPayloadValid } = resultDataMappings[testTypes.GENEXPERT])
        if (isPayloadValid(payload)) {
          const mappedResultData = mapResultData(payload)
          const { encodedResult } = mappedResultData
          const assayGeneXpertMtbRifId = await assayToId('GxMtbRif')
          const assayGeneXpertMtbRifUltraId = await assayToId('GxMtbRifUltra')
          const performedOn = getResultDateOrDefault(patientData, encodedResult)
          const externalId = `${site.externalId}_${samples[0].externalId}_GX`
          const resultSignOff = this.getResultSignOff('GeneXpert', payload)
          const result = (await knex('Result')
            .where({ externalId, deviceId })
            .orWhere(queryBuilder => {
              queryBuilder
                .where('sampleId', samples[0].id)
                .whereIn('assayId', [assayGeneXpertMtbRifId, assayGeneXpertMtbRifUltraId])
                .andWhere('siteId', site.id)
            })
            .first()) || {
            ...baseNewResult,
            externalId,
            assayId: assayGeneXpertMtbRifId,
            sampleId: samples[0].id,
            reportableSiteId,
            startedOn: performedOn,
            endedOn: performedOn,
            resultData: JSON.stringify({
              ...mappedResultData,
              resultSignOff,
            }),
            senderOperator: encodedResult.examiner,
          }
          const resultData = JSON.parse(result.resultData)
          if (resultData.testStartedOn) {
            result.startedOn = parseDateOrDefault(resultData.testStartedOn)
          }
          if (resultData.testEndedOn) {
            result.endedOn = parseDateOrDefault(resultData.testEndedOn)
          }
          const resultCategory1Id = {
            DETECTED: resultCategories.Detected,
            'NOT DETECTED': resultCategories.NotDetected,
            'NOT DETECTED/ NOT DETECTED': resultCategories.NotDetected,
          }[encodedResult.mtb]
          const resultCategory2Id =
            resultCategory1Id === resultCategories.NotDetected
              ? resultCategories.NotDetected
              : {
                  DETECTED: resultCategories.Detected,
                  'NOT DETECTED': resultCategories.NotDetected,
                  'NOT DETECTED/ NOT DETECTED': resultCategories.NotDetected,
                  'N/A': resultCategories.Missing,
                  INDETERMINATE: resultCategories.Indeterminate,
                  'N/A / N/A': resultCategories.Missing,
                }[encodedResult.rifampicin]
          const resultOverwritePriority = [
            resultCategories.Detected,
            resultCategories.NotDetected,
            resultCategories.Error,
            resultCategories.Indeterminate,
            resultCategories.Invalid,
            resultCategories.NoResult,
            resultCategories.Missing,
          ]
          await this.upsertResult(
            knex,
            rawMessage,
            site,
            result,
            resultCategory1Id,
            resultCategory2Id,
            mappedResultData,
            resultSignOff,
            performedOn,
            performedOn,
            encodedResult.examiner,
            encodedResult.remarks,
            patientData,
            utcNow,
            resultCategories,
            resultWorkflowStatuses,
            resultOverwritePriority
          )
        }

        ;({ mapResultData, isPayloadValid } = resultDataMappings[testTypes.TBLAMP])
        if (isPayloadValid(payload)) {
          const mappedResultData = mapResultData(payload)
          const { encodedResult } = mappedResultData
          const assayTbLampId = await assayToId('assayTbLamp')
          const resultCategoryMappings = {
            POSITIVE: resultCategories.Positive,
            NEGATIVE: resultCategories.Negative,
            INDETERMINATE: resultCategories.Inconclusive,
          }
          const resultSignOff = this.getResultSignOff('TBLAMP', payload)
          const externalId = `${site.externalId}_${samples[0].externalId}_TB_LAMP`
          const performedOn = getResultDateOrDefault(patientData, encodedResult)
          const result = (await knex('Result')
            .where({ externalId, deviceId })
            .orWhere(queryBuilder => {
              queryBuilder.whereIn('sampleId', sampleIds).andWhere('assayId', assayTbLampId).andWhere('siteId', site.id)
            })
            .first()) || {
            ...baseNewResult,
            externalId,
            assayId: assayTbLampId,
            sampleId: samples[0].id,
            reportableSiteId,
            startedOn: performedOn,
            endedOn: performedOn,
            resultData: JSON.stringify({
              ...mappedResultData,
              resultSignOff,
            }),
            senderOperator: encodedResult.examiner,
          }
          const resultCategory1Id = resultCategoryMappings[encodedResult.tbLampResult]
          const resultOverwritePriority = [
            resultCategories.Positive,
            resultCategories.Negative,
            resultCategories.Inconclusive,
            resultCategories.Indeterminate,
            resultCategories.Invalid,
            resultCategories.NoResult,
            resultCategories.Missing,
          ]
          await this.upsertResult(
            knex,
            rawMessage,
            site,
            result,
            resultCategory1Id,
            null,
            mappedResultData,
            resultSignOff,
            performedOn,
            performedOn,
            encodedResult.notedBy,
            null,
            patientData,
            utcNow,
            resultCategories,
            resultWorkflowStatuses,
            resultOverwritePriority
          )
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(payload)
        throw e
      }
    })
  }
}

module.exports = PhilippinesNtrlRitm
