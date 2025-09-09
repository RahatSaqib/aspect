const _ = require('lodash')
const Promise = require('bluebird')
const Boom = require('@hapi/boom')
const { insertSite } = require('../../../site/common/db')
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
const facilityMappings = require('./facilityMappings')
const expectedKeys = require('./expectedKeys')
const dateKeys = require('./dateKeys')
const { getResultDateOrDefault } = require('../common/utils')
const { mapPatientData, sampleTypeMapping, resultDataMappings } = require('./mappings')
const { testTypes } = require('../common/mapping')

class PhilippinesNtrlPmdt extends PhilippinesNtrlDatabase {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    // A set of the raw values received from thr NTRL database
    //  mapped to the site external IDs that should be used to
    //  determine sample collection site.
    this.facilityMappings = facilityMappings
  }

  static async canProcessRequest(request) {
    return PhilippinesNtrlDatabase.isRequestFromNtrlDatabase(
      request,
      expectedKeys,
      'PMDT',
      'RECORDS_WITH_SIGN_OFFS_PMDT'
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

        const sampleTypeId = await sampleTypeToId(sampleTypeMapping[payload['Type of Specimen']] || 'Other')
        const referringHealthFacilityExternalId = payload['Referring Health Facility']
          ? this.facilityMappings[payload['Referring Health Facility'].trim().toLowerCase()] ||
            payload['Referring Health Facility'].trim()
          : null
        let originSite
        if (referringHealthFacilityExternalId) {
          originSite = await knex('Site').where('externalId', referringHealthFacilityExternalId).first()
          if (!originSite) {
            const shortName =
              referringHealthFacilityExternalId.length > 45
                ? referringHealthFacilityExternalId.substring(0, 45)
                : referringHealthFacilityExternalId
            const countryDetails =
              (await knex('Geography as siteGeography')
                .join('Country as country', 'siteGeography.countryId', 'country.id')
                .join('Geography as countryGeography', 'siteGeography.countryId', 'countryGeography.countryId')
                .where('siteGeography.id', geographyId)
                .whereNull('countryGeography.stateId')
                .whereNull('countryGeography.lgaId')
                .first('countryGeography.id as countryGeographyId', 'country.timezone')) || {}
            const [originSiteId] = await insertSite(knex, {
              name: referringHealthFacilityExternalId,
              shortName,
              externalId: referringHealthFacilityExternalId,
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
          payload.database === 'PMDT' || payload.table === 'RECORDS_WITH_SIGN_OFFS_PMDT'
            ? 'PN-19-'
            : payload.database.indexOf('PMDT') === 0
            ? `PN-${payload.database.substr(payload.database.length - 2)}-`
            : `PN-${payload.table.substr(payload.table.length - 2)}-`
        const ntrlLabRequestId = `${labRequestIdPrefix}${payload['Serial Number']}`
        const sampleOriginSiteId = originSite ? originSite.id : null
        const reportableSiteId = sampleOriginSiteId || site.deviceDefaultReportableSiteId || site.id
        const now = new Date()
        const numberOfSamples =
          !!payload['Date Collected 3'] ||
          !!payload['Type of Collection 3'] ||
          !!payload['Volume 3'] ||
          !!payload['Consistence 3']
            ? 3
            : !!payload['Date Collected 2'] ||
              !!payload['Type of Collection 2'] ||
              !!payload['Volume 2'] ||
              !!payload['Consistency 2'] ||
              !!payload['Smear Method 2'] ||
              !!payload['Smear Result 2'] ||
              !!payload['Culture Method 2'] ||
              !!payload['Culture Result 2'] ||
              !!payload['Culture Grade 2'] ||
              !!payload['Culture Remarks 2']
            ? 2
            : 1
        const samples = _.range(1, numberOfSamples + 1).map(sampleNumber => {
          const sample = {
            externalId: numberOfSamples > 1 ? `${ntrlLabRequestId}-${sampleNumber}` : `${ntrlLabRequestId}`,
            collectedOn: payload[`Date Collected ${sampleNumber}`],
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
          } else {
            const [sampleId] = await knex('Sample').insert({ ...sample, createdOn: now, source: 'result' })
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
          const assayBdMgitAstId = await assayToId('assayBdMgitAst')
          const assayGenericDstId = await assayToId('assayGenericDst')
          if (!assayBdMgitAstId && !assayGenericDstId) {
            throw Boom.notImplemented('MGIT AST & TB DST Assays are not currently supported on this instance of Aspect')
          }
          const externalId = `${site.externalId}_${samples[0].externalId}_DST`
          const resultSignOff = this.getResultSignOff('DST', payload)

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
            startedOn:
              encodedResult.dateTransferredToDst ||
              encodedResult.dateRead ||
              encodedResult.dateReleased ||
              encodedResult.dateEncoded ||
              utcNow,
            endedOn:
              encodedResult.dstTat ||
              encodedResult.dateRead ||
              encodedResult.dateReleased ||
              encodedResult.dateEncoded ||
              utcNow,
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
          const resultCategory1Id =
            {
              'M. tuberculosis': resultCategories.PositiveMTB,
              'No growth after 6 weeks': resultCategories.NotDetected,
              'No growth after 8 weeks': resultCategories.NotDetected,
              'Non tuberculous mycobacteria': resultCategories.PositiveMOTT,
              Contaminated: resultCategories.Contaminated,
              'Not Done': resultCategories.Missing,
              'NON-VIABLE': resultCategories.Invalid,
            }[encodedResult.idResult] || resultCategories.Missing
          const resultCategory2IdMappings = {
            RESISTANT: resultCategories.Resistant,
            SUSCEPTIBLE: resultCategories.Susceptible,
            'NOT DONE': resultCategories.Missing,
            'NON VIABLE': resultCategories.Invalid,
            CONTAMINATED: resultCategories.Contaminated,
          }
          const resultsForDrugsTested = [
            encodedResult.streptomycin,
            encodedResult.isoniazid,
            encodedResult.rifampicin,
            encodedResult.ethambutol,
            encodedResult.pyrazinamide,
            encodedResult.kanamycin,
            encodedResult.levofloxacin,
            encodedResult.amikacin,
            encodedResult.capreomycin,
          ]
          let resultCategory2Id = resultCategories.Missing
          if (
            resultsForDrugsTested.some(
              resultForDrugsTested => resultCategory2IdMappings[resultForDrugsTested] === resultCategories.Resistant
            )
          ) {
            resultCategory2Id = resultCategories.Resistant
          } else if (
            resultsForDrugsTested.some(
              resultForDrugsTested => resultCategory2IdMappings[resultForDrugsTested] === resultCategories.Contaminated
            )
          ) {
            resultCategory2Id = resultCategories.Contaminated
          } else if (
            resultsForDrugsTested.some(
              resultForDrugsTested => resultCategory2IdMappings[resultForDrugsTested] === resultCategories.Susceptible
            )
          ) {
            resultCategory2Id = resultCategories.Susceptible
          } else if (
            resultsForDrugsTested.some(
              resultForDrugsTested => resultCategory2IdMappings[resultForDrugsTested] === resultCategories.Invalid
            )
          ) {
            resultCategory2Id = resultCategories.Invalid
          }
          const resultOverwritePriority = [
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

          await this.upsertResult(
            knex,
            rawMessage,
            site,
            result,
            resultCategory1Id,
            resultCategory2Id,
            mappedResultData,
            resultSignOff,
            getResultDateOrDefault(patientData, encodedResult),
            getResultDateOrDefault(patientData, encodedResult),
            encodedResult.readBy,
            encodedResult.remarks,
            patientData,
            utcNow,
            resultCategories,
            resultWorkflowStatuses,
            resultOverwritePriority
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
          const resultSignOff = this.getResultSignOff('Culture', payload)
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
              startedOn: encodedResult.dateReleased,
              endedOn: encodedResult.dateReleased,
              resultData: JSON.stringify({
                ...mappedResultData,
                resultSignOff,
              }),
              senderOperator: encodedResult.medTech || encodedResult.labTech || encodedResult.encodedBy,
            }
            const resultData = JSON.parse(result.resultData)
            if (resultData.testStartDateTime) {
              result.startedOn = parseDateOrDefault(resultData.testStartDateTime)
            }
            if (resultData.testEndedDateTime) {
              result.endedOn = parseDateOrDefault(resultData.testEndedDateTime)
            }
            const resultCategoryMappings = {
              'M. tuberculosis': resultCategories.PositiveMTB,
              'No growth after 8 weeks': resultCategories.NotDetected,
              'No growth after 6 weeks': resultCategories.NotDetected,
              Contaminated: resultCategories.Contaminated,
              Spillage: resultCategories.Invalid,
              'On-going': resultCategories.Missing,
              'Non-tuberculous mycobacteria': resultCategories.PositiveMOTT,
              'No Specimen': resultCategories.NoResult,
              QNS: resultCategories.Invalid,
              'NON-VIABLE': resultCategories.Invalid,
              'Not Done': resultCategories.NoResult,
            }
            const resultCategory1Id =
              resultCategoryMappings[encodedResult[`result${index + 1}`]] || resultCategories.Missing
            const resultCategory2Id = resultCategoryMappings[encodedResult.finalResult] || resultCategories.Missing
            const resultOverwritePriority = [
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
            await this.upsertResult(
              knex,
              rawMessage,
              site,
              result,
              resultCategory1Id,
              resultCategory2Id,
              mappedResultData,
              resultSignOff,
              getResultDateOrDefault(patientData, encodedResult),
              getResultDateOrDefault(patientData, encodedResult),
              encodedResult.labTech,
              encodedResult.remarks,
              patientData,
              utcNow,
              resultCategories,
              resultWorkflowStatuses,
              resultOverwritePriority
            )
          })
        }

        ;({ mapResultData, isPayloadValid } = resultDataMappings[testTypes.LPA])
        if (isPayloadValid(payload)) {
          const mappedResultData = mapResultData(payload)
          const { encodedResult } = mappedResultData
          const assayLpaId = await assayToId('assayLPA')
          const externalId = `${site.externalId}_${samples[0].externalId}_LPA`
          const resultSignOff = this.getResultSignOff('LPA', payload)

          const performedOn = getResultDateOrDefault(patientData, encodedResult)
          const result = (await knex('Result')
            .where({ externalId, deviceId })
            .orWhere(queryBuilder => {
              queryBuilder.whereIn('sampleId', sampleIds).andWhere('assayId', assayLpaId).andWhere('siteId', site.id)
            })
            .first()) || {
            ...baseNewResult,
            externalId,
            assayId: assayLpaId,
            sampleId: samples[0].id,
            reportableSiteId,
            startedOn: performedOn,
            endedOn: performedOn,
            resultData: JSON.stringify({
              ...mappedResultData,
              resultSignOff,
            }),
            senderOperator: encodedResult.performedBy,
          }
          const resultCategory1Id = {
            'M. TB DETECTED': resultCategories.Detected,
            'M. TB NOT DETECTED': resultCategories.NotDetected,
            INVALID: resultCategories.Invalid,
            'MTB DETECTED': resultCategories.Detected,
            'MTB NOT DETECTED': resultCategories.NotDetected,
          }[encodedResult.mtbComplex?.toUpperCase()]
          const resultCategory2IdMappings = {
            'High-level resistance detected': resultCategories.Resistant,
            'Low-level resistance detected': resultCategories.Resistant,
            'Resistance not detected': resultCategories.Susceptible,
            'Resistance Detected': resultCategories.Resistant,
            'Resistance Not Detected': resultCategories.Susceptible,
          }
          const resultsForFirstLineDrugsTested = [
            encodedResult.rifampicin,
            encodedResult.isoniazid,
            encodedResult.ethambutol,
          ]
          const resultsForSecondLineDrugsTested = [encodedResult.fluoroquinolones, encodedResult.aminoglycoside]
          const resultsForDrugsTested = [...resultsForFirstLineDrugsTested, ...resultsForSecondLineDrugsTested]
          let resultCategory2Id = resultCategories.Missing
          if (
            resultsForDrugsTested.some(
              resultForDrugsTested => resultCategory2IdMappings[resultForDrugsTested] === resultCategories.Resistant
            )
          ) {
            resultCategory2Id = resultCategories.Resistant
          } else if (
            resultsForFirstLineDrugsTested.every(resultForDrugsTested =>
              [resultCategories.Susceptible].includes(resultCategory2IdMappings[resultForDrugsTested])
            ) ||
            resultsForSecondLineDrugsTested.every(resultForDrugsTested =>
              [resultCategories.Susceptible].includes(resultCategory2IdMappings[resultForDrugsTested])
            )
          ) {
            resultCategory2Id = resultCategories.Susceptible
          }
          const resultOverwritePriority = [
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
            encodedResult.performedBy,
            encodedResult.remarks,
            patientData,
            utcNow,
            resultCategories,
            resultWorkflowStatuses,
            resultOverwritePriority
          )
        }

        ;({ mapResultData, isPayloadValid } = resultDataMappings[testTypes.SMEAR])
        if (isPayloadValid(payload)) {
          const mappedResultData = mapResultData(payload)
          const { encodedResult } = mappedResultData
          const assaySmearId = await assayToId('assaySmear')
          const smearSamples = []
          if (encodedResult.smearResult1) {
            smearSamples.push(samples[0])
          }
          if (encodedResult.smearResult2 && samples.length > 1) {
            smearSamples.push(samples[1])
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
            'POSITIVE FOR Acid Fast Bacilli': resultCategories.Detected,
            'NEGATIVE FOR Acid Fast Bacilli': resultCategories.NotDetected,
          }
          const resultSignOff = this.getResultSignOff('Smear', payload)
          const performedOn = getResultDateOrDefault(patientData, encodedResult)
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
            const resultCategory1Id =
              resultCategoryMappings[index === 0 ? encodedResult.smearResult1 : encodedResult.smearResult2]
            const resultCategory2Id = resultCategoryMappings[encodedResult.finalResult]
            const resultOverwritePriority = [
              resultCategories.Positive3,
              resultCategories.Positive2,
              resultCategories.Positive1,
              resultCategories.Detected,
              resultCategories.Invalid,
              resultCategories.NotDetected,
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
              encodedResult.laboratoryTechnician,
              null,
              patientData,
              utcNow,
              resultCategories,
              resultWorkflowStatuses,
              resultOverwritePriority
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
                .whereIn('sampleId', sampleIds)
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
            POSITIVE: resultCategories.Detected,
            NEGATIVE: resultCategories.NotDetected,
          }[encodedResult.mtb]
          const resultCategory2Id = {
            SUSCEPTIBLE: resultCategories.NotDetected,
            RESISTANT: resultCategories.Detected,
            INDETERMINATE: resultCategories.Indeterminate,
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
            senderOperator: encodedResult.laboratoryTechnician || encodedResult.examiner,
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

module.exports = PhilippinesNtrlPmdt
