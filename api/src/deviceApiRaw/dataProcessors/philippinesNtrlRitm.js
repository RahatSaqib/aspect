const _ = require('lodash')
const Promise = require('bluebird')
const Boom = require('boom')
const { transact } = require('../../db')
const { getRemoteAddress } = require('../../shared/request')
const { getDateOrDefault, getUtcTime, dateEqual } = require('../../shared/date')
const { convertStringToFloat } = require('../../shared/string')
const { deviceSeen } = require('../../device/actions')
const { SynchronousDataProcessor } = require('./_base')
const {
  sampleTypeToId,
  assayToId,
  resultSourceToId,
  resultTypeToId,
  allResultCategoryToId,
  allResultWorkflowStatusToId,
} = require('../../shared/dictionary')

class PhilippinesNtrlRitm extends SynchronousDataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.encryptRawData = false
    this.timeoutMilliseconds = 60000
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.response = {}
  }

  static async canProcessRequest(request) {
    const { payload } = request
    const payloadKeys = Object.keys(payload)
    return (
      [
        'database',
        'table',
        'TimeStamp',
        'Serial Code RN-14-',
        'Last Name',
        'First Name',
        'Middle Name',
        'Age / Sex',
        'Date of Birth',
        'RITM Hospital No',
        'Date of Admission',
        'Requisitioner',
        'Address',
        'Reason for Examination',
        'History of Treatment',
        'Registration Group',
        'Presumptive DS or DR',
        'Specimen Type',
        'Accession No',
        'Laboratory No',
        'Culture Method',
        'Date and Time of Specimen Collection',
        'Date and Time of Specimen Receipt',
        'Encoded by',
        'Date and Time of Release of AFB Result',
        'Laboratory Test Performed Acid Fast Bacili Microscopy',
        'Smear Result 1',
        'Smear Result 2',
        'Smear Result 3',
        'FINAL RESULT',
        'Comments',
        'Smear Encoded by',
        'Performed by',
        'Validated by',
        'Noted by',
        'OPD',
        'Referral',
        'INPATIENT',
        'INPATIENT REMARKS',
        'MRF Encoded by',
        'MRF Date Encoded',
        'Smear',
        'Culture',
        'DST',
        'GeneXpert',
        'Date transfered to DST',
        'TBC Laboratory Test Performed',
        'TBC Test Result 1st Sample',
        'TBC Test Result 2nd Sample',
        'TBC Test Result 3rd Sample',
        'TBC FINAL RESULT',
        'Date and Time of Release of TBC Result',
        'TBC Comments',
        'TBC Encoded by',
        'TBC Performed by',
        'TBC Validated by',
        'TBC Noted by',
        'DST Laboratory Test Performed',
        'Streptomycin',
        'Isoniazid',
        'Rifampicin',
        'Ethambutol',
        'Pyrazinamide',
        'Kanamycin',
        'Capreomycin',
        'Amikacin',
        'Ofloxacin',
        'Levofloxacin',
        'DST Test Result 3rd Sample',
        'DST Final Result',
        'Date and Time of Release of DST Result',
        'DST Comments',
        'DST Encoded by',
        'DST Performed by',
        'DST Validated by',
        'DST Noted by',
        'GX Laboratory Test Performed',
        'MTB',
        'Rifampicin:',
        'GX Test Result 3rd Sample',
        'Date and Time of Release of Gx Result',
        'GX Comments',
        'GX Encoded by',
        'GX Performed by',
        'GX Validated by',
        'Referring Facility',
        'GX Noted by',
        'Smear Result 1 Date Collected',
        'Smear Result 2 Date Collected',
        'Smear Result 3 Date Collected',
      ].every(expectedKey => payloadKeys.includes(expectedKey)) &&
      payload.database.indexOf('RITM') === 0
    )
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request
    this.response = { deviceApiRawId: this.id, resultIds: [] }
    return transact(async knex => {
      const { deviceId, partnerId, geographyId } = await knex('DeviceApiKey')
        .where('token', auth.credentials.token)
        .first('deviceId', 'partnerId', 'geographyId')
      if (!deviceId) {
        throw Boom.badRequest(
          'Invalid device API key: Cannot determine which device this came from'
        )
      }
      this.response.deviceId = deviceId
      const dateKeys = [
        'Date of Birth',
        'Date of Admission',
        'Date and Time of Specimen Collection',
        'Date and Time of Specimen Receipt',
        'Date and Time of Release of AFB Result',
        'MRF Date Encoded',
        'Date transfered to DST',
        'Date and Time of Release of TBC Result',
        'Date and Time of Release of DST Result',
        'Date and Time of Release of Gx Result',
        'Smear Result 1 Date Collected',
        'Smear Result 2 Date Collected',
        'Smear Result 3 Date Collected',
      ]
      dateKeys.forEach(dateKey => {
        payload[dateKey] = getDateOrDefault(payload, dateKey)
      })
      const rawMessage = JSON.stringify(request.plugins.rawPayload)
      const utcNow = getUtcTime()
      await knex('Device')
        .where({ id: deviceId })
        .update({ lastSeenOn: utcNow, updatedOn: utcNow })
      const site = await knex('Device as d')
        .join('Site as s', 'd.siteId', 's.id')
        .where('d.id', deviceId)
        .first(
          's.*',
          'd.name as deviceName',
          'd.defaultReportableSiteId as deviceDefaultReportableSiteId'
        )

      this.messageContext.dispatch(deviceSeen(deviceId))

      const sampleTypeMapping = {
        Sputum: 'Sputum',
        CSF: 'CSF',
        'Pleural Fluid': 'Effusion',
        'Ascitic Fluid': 'Effusion',
        'Pericardial Fluid': 'Effusion',
        'Peritoneal Fluid': 'Effusion',
        'Pleural Fluid (L.)': 'Effusion',
        'Pleural Effusion Aspirate': 'Effusion',
        'Pleural Fluid (Left)': 'Effusion',
        'Pleural Fluid (Right)': 'Effusion',
        'Pleural Effusion': 'Effusion',
        'Retroperitoneal Fluid': 'Effusion',
        'Pleural Fluid (R.)': 'Effusion',
        'Gastric Aspirate': 'Gastric Lavage',
        'Gastric fluid': 'Gastric Lavage',
        'Wound Discharge': 'Pus',
        'Wound Secretion': 'Pus',
        Isolates: 'Isolate',
        Others: 'Other',
      }
      const sampleTypeId = await sampleTypeToId(
        sampleTypeMapping[payload['Specimen Type']] || 'Other'
      )
      const sanitizeReferringFacility = rawValue => {
        let facilityName = (rawValue || '').replace(/c\/o|,|\(|\)/gi, ' ')
        while (facilityName.indexOf('  ') > -1) {
          facilityName = facilityName.replace(/\s\s/g, ' ').trim()
        }
        if (
          ['DOTS', 'NO DATA', 'CD', 'D', 'C'].includes(
            facilityName.toUpperCase()
          )
        ) {
          facilityName = null
        }
        return facilityName
      }
      let referringFacility = sanitizeReferringFacility(payload.Address)
      if (!referringFacility) {
        referringFacility = sanitizeReferringFacility(
          payload['Referring Facility']
        )
      }
      let originSite
      if (referringFacility) {
        originSite = await knex('Site')
          .where('partnerId', partnerId)
          .andWhere(function() {
            this.where('externalId', referringFacility)
              .orWhere('name', referringFacility)
              .orWhere('shortName', referringFacility)
          })
          .first()
        if (!originSite) {
          const shortName =
            referringFacility.length > 45
              ? referringFacility.substring(0, 45)
              : referringFacility
          const countryDetails =
            (await knex('Geography as siteGeography')
              .join(
                'Country as country',
                'siteGeography.countryId',
                'country.id'
              )
              .join(
                'Geography as countryGeography',
                'siteGeography.countryId',
                'countryGeography.countryId'
              )
              .where('siteGeography.id', geographyId)
              .whereNull('countryGeography.stateId')
              .whereNull('countryGeography.lgaId')
              .first(
                'countryGeography.id as countryGeographyId',
                'country.timezone'
              )) || {}
          const [originSiteId] = await knex('Site').insert({
            name: referringFacility,
            shortName,
            externalId: referringFacility,
            partnerId,
            geographyId: countryDetails.countryGeographyId,
            timezoneId: countryDetails.timezone,
            createdOn: utcNow,
            updatedOn: utcNow,
          })
          originSite = await knex('Site')
            .where('id', originSiteId)
            .first()
        }
      }
      const labRequestIdPrefix =
        payload.database === 'RITM'
          ? 'RN-19-'
          : `RN-${payload.database.substr(payload.database.length - 2)}-`
      const ntrlLabRequestId = `${labRequestIdPrefix}${payload['Serial Code RN-14-']}`
      const sampleOriginSiteId = originSite ? originSite.id : null
      const reportableSiteId =
        sampleOriginSiteId || site.deviceDefaultReportableSiteId || site.id

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
          externalId:
            numberOfSamples > 1
              ? `${ntrlLabRequestId}-${sampleNumber}`
              : `${ntrlLabRequestId}`,
          collectedOn:
            payload[`Smear Result ${sampleNumber} Date Collected`] ||
            payload['Date and Time of Specimen Collection'],
          sampleTypeId,
          originSiteId: sampleOriginSiteId,
        }
        return sample
      })
      await Promise.each(samples, async (sample, index) => {
        let existingSample = await knex('Sample')
          .where('externalId', sample.externalId)
          .first()
        if (!existingSample && index === 0) {
          existingSample = await knex('Sample')
            .where('externalId', ntrlLabRequestId)
            .first()
        }
        if (
          existingSample &&
          (existingSample.externalId !== sample.externalId ||
            existingSample.sampleTypeId !== sample.sampleTypeId ||
            !dateEqual(existingSample.collectedOn, sample.collectedOn) ||
            existingSample.originSiteId !== sample.originSiteId)
        ) {
          sample.id = existingSample.id
          await knex('Sample')
            .where('id', existingSample.id)
            .update(sample)
        } else if (!existingSample) {
          const [sampleId] = await knex('Sample').insert(sample)
          sample.id = sampleId
        }
      })
      const sampleIds = samples.map(sample => sample.id)
      let patientNameId = payload['Last Name'] || ''
      if (payload['First Name']) {
        if (patientNameId) {
          patientNameId += ', '
        }
        patientNameId += payload['First Name']
      }
      if (patientNameId && payload['Middle Name']) {
        patientNameId += ` ${payload['Middle Name']}`
      }
      const ageSex = payload['Age / Sex']
      let age = null
      let sex = null
      if (ageSex) {
        const ageSexRegex = new RegExp(
          '(\\d*)(\\s?[|m|o|s]*)(\\/|\\?)(m|f)',
          'gi'
        )
        const ageSexRegexMatch = ageSexRegex.exec(ageSex)
        if (ageSexRegexMatch) {
          age = convertStringToFloat(ageSexRegexMatch[1])
          if (age && ageSexRegexMatch[2]) {
            age /= 10
          }
          if (ageSexRegexMatch[4]) {
            sex = { M: 'Male', F: 'Female' }[ageSexRegexMatch[4]]
          }
        }
      }

      const patientData = {
        id:
          payload['RITM Hospital No'] ||
          patientNameId ||
          payload['Laboratory No'] ||
          ntrlLabRequestId,
        serialNumber: payload['Serial Code RN-14-'],
        referringHealthFacility:
          payload.Address || payload['Referring Facility'],
        requestingPhysician: payload.Requisitioner,
        lastName: payload['Last Name'],
        firstName: payload['First Name'],
        middleInitialOrName: payload['Middle Name'],
        dateOfAdmission: payload['Date of Admission'],
        age,
        sex,
        dateOfBirth: payload['Date of Birth'],
        address: payload.Address,
        treatmentCategory: payload['History of Treatment'],
        registrationGroup: payload['Registration Group'],
        treatmentSchedule: payload['Reason for Examination'],
        typeOfSpecimen: payload['Specimen Type'],
        accessionNo: payload['Accession No'],
        testRequestedSmear: payload.Smear,
        testRequestedCulture: payload.Culture,
        testRequestedDst: payload.DST,
        testRequestedGx: payload.GeneXpert,
        dateTransferedToDst: payload['Date transfered to DST'],
        cultureMethod: payload['Culture Method'],
        presumptiveDsOrDr: payload['Presumptive DS or DR'],
        dateReceived: payload['Date and Time of Specimen Receipt'],
        labNo1: payload['Laboratory No'],
        tbCaseNumber: payload['RITM Hospital No'],
        dateCollected1: payload['Date and Time of Specimen Collection'],
        encodedBy: payload['MRF Encoded by'],
        dateEncoded: payload['MRF Date Encoded'],
        healthCareSystem: 'RITM',
      }
      const resultSourceId = await resultSourceToId('LIMS')
      const resultTypeId = await resultTypeToId('Patient')
      const resultCategories = await allResultCategoryToId()
      const resultWorkflowStatuses = await allResultWorkflowStatusToId()
      const baseNewResult = {
        partnerId: site.partnerId,
        geographyId: site.geographyId,
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

      const objectHasValues = o =>
        Object.values(o).some(
          value => !_.isNil(value) && `${value}`.trim() !== ''
        )

      const dstResultData = {
        testRequested: payload['DST Laboratory Test Performed'],
        idResult: payload['DST Final Result'] || payload['TBC FINAL RESULT'],
        streptomycin: payload.Streptomycin,
        isoniazid: payload.Isoniazid,
        rifampicin: payload.Rifampicin,
        ethambutol: payload.Ethambutol,
        pyrazinamide: payload.Pyrazinamide,
        kanamycin: payload.Kanamycin,
        levofloxacin: payload.Levofloxacin,
        amikacin: payload.Amikacin,
        capreomycin: payload.Capreomycin,
        ofloxacin: payload.Ofloxacin,
        methodUsed: payload['DST Laboratory Test Performed'],
        remarks: payload['DST Comments'],
        dateReleased: payload['Date and Time of Release of DST Result'],
        readBy: payload['DST MT Read'],
        labTech: payload['DST Performed by'],
        encodedBy: payload['DST Encoded by'],
        reviewedBy: payload['DST Validated by'],
        notedBy: payload['DST Noted by'],
      }
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
      if (
        objectHasValues(
          _.omit(dstResultData, [
            'readBy',
            'labTech',
            'encodedBy',
            'reviewedBy',
          ])
        )
      ) {
        // TODO: Update MGIT Data processor to lookup results for assayGenericDst as well
        const assayBdMgitAstId = await assayToId('assayBdMgitAst')
        const assayGenericDstId = await assayToId('assayGenericDst')
        const externalId = `${site.externalId}_${samples[0].externalId}_DST`
        const result = (await knex('Result')
          .where({ externalId, deviceId })
          .orWhere(function() {
            this.whereIn('sampleId', sampleIds)
              .whereIn('assayId', [assayBdMgitAstId, assayGenericDstId])
              .andWhere('siteId', site.id)
          })
          .first()) || {
          ...baseNewResult,
          externalId,
          assayId:
            (dstResultData.methodUsed || '').indexOf('MGIT') > -1
              ? assayBdMgitAstId
              : assayGenericDstId,
          sampleId: samples[0].id,
          startedOn: dstResultData.dateReleased,
          endedOn: dstResultData.dateReleased,
          resultData: JSON.stringify({
            encodedResult: dstResultData,
          }),
          senderOperator: dstResultData.labTech,
          reportableSiteId,
        }
        const dstResultCategory1Id =
          {
            'Mycobacterium tuberculosis': resultCategories.PositiveMTB,
            ' No growth after 8 weeks': resultCategories.NotDetected,
            'No growth after 8 weeks': resultCategories.NotDetected,
            'Non-tuberculous mycobacteria': resultCategories.PositiveMOTT,
            Contaminated: resultCategories.Contaminated,
            'Incomplete: Did Not Sumbit 2 Samples': resultCategories.Missing,
            'Incomplete: Did Not Submit 2 Samples w/in 3 days':
              resultCategories.Missing,
            'Incomplete: Not submitted 2 samples w/in 3 days':
              resultCategories.Missing,
          }[dstResultData.idResult] || resultCategories.Missing
        const dstResultCategory2IdMappings = {
          RESISTANT: resultCategories.Resistant,
          SUSCEPTIBLE: resultCategories.Susceptible,
          'NOT TESTED': resultCategories.Missing,
        }
        const dstResultsForDrugsTested = [
          dstResultData.streptomycin,
          dstResultData.isoniazid,
          dstResultData.rifampicin,
          dstResultData.ethambutol,
          dstResultData.pyrazinamide,
          dstResultData.kanamycin,
          dstResultData.levofloxacin,
          dstResultData.amikacin,
          dstResultData.capreomycin,
          dstResultData.ofloxacin,
        ]
        let resultCategory2Id = resultCategories.Missing
        if (
          dstResultsForDrugsTested.some(
            resultForDrugsTested =>
              dstResultCategory2IdMappings[resultForDrugsTested] ===
              resultCategories.Resistant
          )
        ) {
          resultCategory2Id = resultCategories.Resistant
        } else if (
          dstResultsForDrugsTested.some(
            resultForDrugsTested =>
              dstResultCategory2IdMappings[resultForDrugsTested] ===
              resultCategories.Contaminated
          )
        ) {
          resultCategory2Id = resultCategories.Contaminated
        } else if (
          dstResultsForDrugsTested.some(
            resultForDrugsTested =>
              dstResultCategory2IdMappings[resultForDrugsTested] ===
              resultCategories.Susceptible
          )
        ) {
          resultCategory2Id = resultCategories.Susceptible
        } else if (
          dstResultsForDrugsTested.some(
            resultForDrugsTested =>
              dstResultCategory2IdMappings[resultForDrugsTested] ===
              resultCategories.Invalid
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
          dstResultData,
          dstResultData.dateRead,
          dstResultData.dateRead,
          dstResultData.readBy,
          dstResultData.remarks,
          patientData,
          utcNow,
          resultCategories,
          resultWorkflowStatuses,
          dstResultOverwritePriority
        )
      }

      const cultureResultData = {
        medTech: payload['TBC Performed by'],
        methodUsed1: payload['TBC Laboratory Test Performed'],
        result1: payload['TBC Test Result 1st Sample'],
        result2: payload['TBC Test Result 2nd Sample'],
        result3: payload['TBC Test Result 3rd Sample'],
        finalResult: payload['TBC FINAL RESULT'],
        remarks: payload['TBC Comments'],
        dateReleased: payload['Date and Time of Release of TBC Result'],
        encodedBy: payload['TBC Encoded by'],
        validatedBy: payload['TBC Validated by'],
        notedBy: payload['TBC Noted by'],
      }
      if (
        objectHasValues(
          _.omit(cultureResultData, ['methodUsed1', 'encodedBy', 'notedBy'])
        )
      ) {
        // TODO: Update MGIT Data processor to lookup results for assayCulture as well
        const assayBdMgitGndId = await assayToId('assayBdMgitGnd')
        const assayCultureId = await assayToId('assayCulture')
        const cultureSamples = []
        if (cultureResultData.result1) {
          cultureSamples.push(samples[0])
        }
        if (cultureResultData.result2 && samples.length > 1) {
          cultureSamples.push(samples[1])
        }
        if (cultureResultData.result3 && samples.length > 2) {
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
        await Promise.each(cultureSamples, async (cultureSample, index) => {
          const externalId = `${site.externalId}_${cultureSample.externalId}_CULTURE`
          const result = (await knex('Result')
            .where({ externalId, deviceId })
            .orWhere(function() {
              this.whereIn('assayId', [assayBdMgitGndId, assayCultureId])
                .andWhere('sampleId', cultureSample.id)
                .andWhere('siteId', site.id)
            })
            .first()) || {
            ...baseNewResult,
            externalId,
            assayId:
              (cultureResultData.methodUsed1 || '').indexOf('MGIT') > -1
                ? assayBdMgitGndId
                : assayCultureId,
            sampleId: cultureSample.id,
            reportableSiteId,
            startedOn: cultureResultData.dateReleased,
            endedOn: cultureResultData.dateReleased,
            resultData: JSON.stringify({
              encodedResult: cultureResultData,
            }),
            senderOperator: cultureResultData.medTech,
          }
          const resultCategory1Id =
            resultCategoryMappings[cultureResultData[`result${index + 1}`]] ||
            resultCategories.Missing
          const resultCategory2Id =
            resultCategoryMappings[cultureResultData.finalResult] ||
            resultCategories.Missing
          await this.upsertResult(
            knex,
            rawMessage,
            site,
            result,
            resultCategory1Id,
            resultCategory2Id,
            cultureResultData,
            cultureResultData.dateReleased,
            cultureResultData.dateReleased,
            cultureResultData.labTech,
            cultureResultData.remarks,
            patientData,
            utcNow,
            resultCategories,
            resultWorkflowStatuses,
            cultureResultOverwritePriority
          )
        })
      }

      const smearResultData = {
        smearMethod:
          payload['Laboratory Test Performed Acid Fast Bacili Microscopy'],
        smearDateCollected1: payload['Smear Result 1 Date Collected'],
        smearResult1: payload['Smear Result 1'],
        smearDateCollected2: payload['Smear Result 2 Date Collected'],
        smearResult2: payload['Smear Result 2'],
        smearDateCollected3: payload['Smear Result 3 Date Collected'],
        smearResult3: payload['Smear Result 3'],
        finalResult: payload['FINAL RESULT'],
        dateReleased: payload['Date and Time of Release of AFB Result'],
        comments: payload.Comments,
        encodedBy: payload['Smear Encoded by'],
        laboratoryTechnician: payload['Performed by'],
        validatedBy: payload['Validated by'],
        notedBy: payload['Noted by'],
      }
      if (
        objectHasValues(
          _.omit(smearResultData, [
            'encodedBy',
            'laboratoryTechnician',
            'notedBy',
          ])
        )
      ) {
        const assaySmearId = await assayToId('assaySmear')
        const smearSamples = []
        if (smearResultData.smearResult1) {
          smearSamples.push(samples[0])
        }
        if (smearResultData.smearResult2 && samples.length > 1) {
          smearSamples.push(samples[1])
        }
        if (smearResultData.smearResult3 && samples.length > 2) {
          smearSamples.push(samples[2])
        }
        const resultCategoryMappings = {
          '0': resultCategories.NotDetected,
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
        await Promise.each(smearSamples, async (smearSample, index) => {
          const externalId = `${site.externalId}_${smearSample.externalId}_SMEAR`
          const result = (await knex('Result')
            .where({ externalId, deviceId })
            .orWhere(function() {
              this.where('assayId', assaySmearId)
                .andWhere('sampleId', smearSample.id)
                .andWhere('siteId', site.id)
            })
            .first()) || {
            ...baseNewResult,
            externalId,
            assayId: assaySmearId,
            sampleId: smearSample.id,
            reportableSiteId,
            startedOn: smearResultData.dateReleased,
            endedOn: smearResultData.dateReleased,
            resultData: JSON.stringify({
              encodedResult: smearResultData,
            }),
            senderOperator: smearResultData.laboratoryTechnician,
          }
          const resultCategory1Id =
            resultCategoryMappings[smearResultData[`smearResult${index + 1}`]]
          const resultCategory2Id =
            resultCategoryMappings[smearResultData.finalResult]
          await this.upsertResult(
            knex,
            rawMessage,
            site,
            result,
            resultCategory1Id,
            resultCategory2Id,
            smearResultData,
            smearResultData.dateReleased,
            smearResultData.dateReleased,
            smearResultData.laboratoryTechnician,
            null,
            patientData,
            utcNow,
            resultCategories,
            resultWorkflowStatuses,
            smearResultOverwritePriority
          )
        })
      }

      const geneXpertResultData = {
        center: payload['GX Laboratory Test Performed'],
        mtb: payload.MTB,
        rifampicin: payload['Rifampicin:'],
        remarks: payload['GX Comments'],
        dateReleased: payload['Date and Time of Release of Gx Result'],
        encodedBy: payload['GX Encoded by'],
        examiner: payload['GX Performed by'],
        labManager: payload['GX Validated by'],
        notedBy: payload['GX Noted by'],
      }
      if (
        objectHasValues(
          _.omit(geneXpertResultData, [
            'center',
            'encodedBy',
            'examiner',
            'labManager',
            'notedBy',
          ])
        )
      ) {
        const assayGeneXpertMtbRifId = await assayToId('GxMtbRif')
        const assayGeneXpertMtbRifUltraId = await assayToId('GxMtbRifUltra')

        const externalId = `${site.externalId}_${samples[0].externalId}_GX`
        const result = (await knex('Result')
          .where({ externalId, deviceId })
          .orWhere(function() {
            this.where('sampleId', samples[0].id)
              .whereIn('assayId', [
                assayGeneXpertMtbRifId,
                assayGeneXpertMtbRifUltraId,
              ])
              .andWhere('siteId', site.id)
          })
          .first()) || {
          ...baseNewResult,
          externalId,
          assayId: assayGeneXpertMtbRifId,
          sampleId: samples[0].id,
          reportableSiteId,
          startedOn: geneXpertResultData.dateReleased,
          endedOn: geneXpertResultData.dateReleased,
          resultData: JSON.stringify({
            encodedResult: geneXpertResultData,
          }),
          senderOperator: geneXpertResultData.examiner,
        }
        const resultCategory1Id = {
          DETECTED: resultCategories.Detected,
          'NOT DETECTED': resultCategories.NotDetected,
          'NOT DETECTED/ NOT DETECTED': resultCategories.NotDetected,
        }[geneXpertResultData.mtb]
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
              }[geneXpertResultData.rifampicin]
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
          geneXpertResultData,
          geneXpertResultData.dateReleased,
          geneXpertResultData.dateReleased,
          geneXpertResultData.examiner,
          geneXpertResultData.remarks,
          patientData,
          utcNow,
          resultCategories,
          resultWorkflowStatuses,
          resultOverwritePriority
        )
      }
    })
  }

  async upsertResult(
    knex,
    rawMessage,
    site,
    result,
    resultCategory1Id,
    resultCategory2Id,
    newResultData,
    resultStartedOn,
    resultEndedOn,
    operator,
    remarks,
    patientData,
    utcNow,
    resultCategories,
    resultWorkflowStatuses,
    resultOverwritePriority
  ) {
    const mergeDeep = (baseValue, sourceValue) => {
      if (_.isEmpty(baseValue) && !_.isEmpty(sourceValue)) {
        return sourceValue
      }
      if (!_.isEmpty(baseValue) && _.isEmpty(sourceValue)) {
        return baseValue
      }
      if (_.isArray(baseValue) && _.isArray(sourceValue)) {
        return [...(baseValue || []), ...(sourceValue || [])]
      }
      if (_.isPlainObject(baseValue) || _.isPlainObject(sourceValue)) {
        return
      }
      return sourceValue || baseValue
    }
    if (!result.resultCategory1) {
      result.resultCategory1 = resultCategories.Missing
    }
    if (!result.resultCategory2) {
      result.resultCategory2 = resultCategories.Missing
    }
    if (
      resultOverwritePriority.indexOf(resultCategory1Id) <
      resultOverwritePriority.indexOf(result.resultCategory1)
    ) {
      result.resultCategory1 = resultCategory1Id
    }
    if (
      resultOverwritePriority.indexOf(resultCategory2Id) <
      resultOverwritePriority.indexOf(result.resultCategory2)
    ) {
      result.resultCategory2 = resultCategory2Id
    }
    if (remarks && (!result.notes || !result.notes.includes(remarks.trim()))) {
      if (!result.notes) {
        result.notes = ''
      } else {
        result.notes += '\n'
      }
      result.notes += remarks
    }
    if (result.id) {
      if (!result.siteId) {
        result.siteId = site.id
      }
      if (site.longitude) {
        result.longitude = site.longitude
      }
      if (site.latitude) {
        result.latitude = site.latitude
      }
      if (!result.startedOn) {
        result.startedOn = resultStartedOn
      }
      if (!result.endedOn) {
        result.endedOn = resultEndedOn
      }
      const resultData = JSON.parse(result.resultData || '{}')
      resultData.encodedResult = newResultData
      result.resultData = JSON.stringify(resultData)
      const resultPatientData = JSON.parse(result.patientData || '{}')
      result.patientData = JSON.stringify(
        mergeDeep(resultPatientData, patientData)
      )
      if (result.rawData) {
        result.rawData += `\n${rawMessage}`
      } else {
        result.rawData = rawMessage
      }
      result.updatedOn = utcNow
      result.updatedBy = null
    }
    if (!result.id) {
      const [resultId] = await knex('Result').insert(result)
      result.id = resultId
    } else {
      await knex('Result')
        .where('id', result.id)
        .update(result)
    }
    await this.appendDeviceLog(
      knex,
      result.deviceId,
      result.id,
      rawMessage,
      utcNow
    )
    const resultWorkflowStatusLogId = await this.appendResultWorkflowLog(
      knex,
      result,
      site,
      operator,
      utcNow,
      resultCategories,
      resultWorkflowStatuses
    )
    if (resultWorkflowStatusLogId) {
      await knex('Result')
        .where('id', result.id)
        .update({ resultWorkflowStatusLogId })
    }
    this.response.resultIds = [...this.response.resultIds, result.id]
  }

  async appendResultWorkflowLog(
    knex,
    result,
    site,
    operator,
    utcNow,
    resultCategories,
    resultWorkflowStatuses
  ) {
    const resultWorkflowStatusId =
      result.resultCategory1 === resultCategories.Missing &&
      result.resultCategory2 === resultCategories.Missing
        ? resultWorkflowStatuses.Ordered
        : resultWorkflowStatuses.Processed
    const resultWorkflowLog = {
      resultId: result.id,
      resultWorkflowStatusId,
      operator,
      reason: `Data from ${site.deviceName}`,
      changedOn: utcNow,
      createdOn: utcNow,
    }
    if (!result.id || !result.resultWorkflowStatusLogId) {
      const [resultWorkflowStatusLogId] = await knex(
        'ResultWorkflowLog'
      ).insert(resultWorkflowLog)
      return resultWorkflowStatusLogId
    }
    const existingResultWorkflowLog = await knex('ResultWorkflowLog')
      .where('id', result.resultWorkflowStatusLogId)
      .first()
    const resultWorkflowStatusPriority = [
      resultWorkflowStatuses.Purged,
      resultWorkflowStatuses.Flagged,
      resultWorkflowStatuses.Acknowledged,
      resultWorkflowStatuses.Delivered,
      resultWorkflowStatuses.Deliverable,
      resultWorkflowStatuses.Validated,
      resultWorkflowStatuses.Error,
      resultWorkflowStatuses.Processed,
      resultWorkflowStatuses.InProgress,
      resultWorkflowStatuses.Ordered,
      resultWorkflowStatuses.OK,
    ]
    if (
      !existingResultWorkflowLog ||
      resultWorkflowStatusPriority.indexOf(resultWorkflowStatusId) <
        resultWorkflowStatusPriority.indexOf(
          existingResultWorkflowLog.resultWorkflowStatusId
        )
    ) {
      const [resultWorkflowStatusLogId] = await knex(
        'ResultWorkflowLog'
      ).insert(resultWorkflowLog)
      return resultWorkflowStatusLogId
    }
    return Promise.resolve()
  }

  async appendDeviceLog(knex, deviceId, resultId, rawMessage, utcNow) {
    const remoteAddress = getRemoteAddress(this.request)
    const [deviceLogId] = await knex('DeviceLog').insert({
      deviceId,
      resultId,
      source: 'Philippines NTRL DB Record Updated',
      createdOn: utcNow,
      senderIp: remoteAddress,
      rawMessage,
    })
    if (_.isNil(this.response.deviceLogIds)) {
      this.response.deviceLogIds = []
    }
    this.response.deviceLogIds = [...this.response.deviceLogIds, deviceLogId]
  }
}

module.exports = PhilippinesNtrlRitm
