const _ = require('lodash')
const Promise = require('bluebird')
const Boom = require('boom')
const { transact } = require('../../db')
const { getRemoteAddress } = require('../../shared/request')
const {
  formatDateOrDefault,
  getDateOrDefault,
  getUtcTime,
  dateEqual,
} = require('../../shared/date')
const { deviceSeen } = require('../../device/actions')
const { SynchronousDataProcessor } = require('./_base')
const {
  sampleTypeToId,
  assayToId,
  resultSourceToId,
  resultTypeToId,
  allResultCategoryToId,
  allResultWorkflowStatusToId,
} = require('../../src/shared/dictionary')

class DefaultPhilippinesNtrl extends SynchronousDataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.encryptRawData = false
    this.timeoutMilliseconds = 10000
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.response = {}
  }

  static async canProcessRequest(request) {
    const { payload } = request
    const payloadKeys = Object.keys(payload)
    return [
      'TimeStamp',
      'Serial Number',
      'Last Name',
      'First Name',
      'Middle Initial',
      'Address',
      'Referring Health Facility',
      'Culture Center',
      'Cat IV Screening Code',
      'MRF Date Requested',
      'Age',
      'Sex',
      'DST Center',
      'Requesting Physician',
      'Treatment Schedule',
      'Month of tx',
      'Enrolled',
      'Registration Group',
      'Treatment Category',
      'Type of Specimen',
      '(If Others) Specify',
      'Site',
      'Test Requested Smear',
      'Test Requested Culture',
      'Test Requested DST',
      'Test Requested LPA',
      'Test Requested Gx',
      'Date transfered to DST',
      'Presumptive DS or DR',
      'Lab No 1',
      'Date Collected 1',
      'Date Collected 2',
      'Date Collected 3',
      'Type of Collection 1',
      'Type of Collection 2',
      'Type of Collection 3',
      'Volume 1',
      'Volume 2',
      'Volume 3',
      'Consistency 1',
      'Consistency 2',
      'Consistence 3',
      'Prepared by',
      'Date Received',
      'Encoded By',
      'Date Encoded',
      'Smear Method',
      'Smear Method 2',
      'Smear Result 1',
      'Smear Result 2',
      'Smear Final Result',
      'Smear Date Released',
      'Smear Only Test Requested',
      'Smear Only Test Requested 2',
      'Smear TAT',
      'Smear Lab Tech',
      'Smear Encoded by',
      'Culture Date Inoculated',
      'Culture Med Tech',
      'Culture Result Status',
      'Culture DST Status',
      'Culture Method',
      'Culture Method 2',
      'Culture Result 1',
      'Culture Grade 1',
      'Culture Result 2',
      'Culture Grade 2',
      'Culture Final Result',
      'Culture Date Released',
      'Culture Encoded by',
      'Culture Lab Tech',
      'Culture TAT',
      'Culture Lab Manager',
      'Culture Remarks 1',
      'Culture Remarks 2',
      'TAT Culture Remarks',
      'DSSM&Culture Releasing Form Med Tech',
      'DSSM&Culture Releasing Form Date Released',
      'DSSM&Culture Releasing Form Laboratory Manager',
      'DST ID Result',
      'DST Date Inoculated',
      'DST MT Inoculated',
      'Streptomycin',
      'Isoniazid',
      'Rifampicin',
      'Ethambutol',
      'Kanamycin',
      'Levofloxacin',
      'Amikacin',
      'Capreomycin',
      'Pyrazinamide',
      'Ofloxacin',
      'Ciprofloxacin',
      'DST Date Read',
      'DST MT Read',
      'DST Date Released',
      'DST Lab Tech',
      'DST TAT',
      'DST Test Requested',
      'DST Laboratory Releasing Form Remarks',
      'DST Releasing Form MedTech',
      'DST Releasing Form Released Date',
      'DST Releasing Form Lab Manager',
      'DST Method Used',
      'DST Method Used Others',
      'DST Workbook Remarks',
      'DST Remarks',
      'DST Encoded by',
      'Gx Processing Date',
      'Gx MTB',
      'Gx Rifampicin',
      'Gx Date Released',
      'Gx Examiner',
      'Gx TAT',
      'Gx Laboratory Manager',
      'Gx Center',
      'Gx Laboratory Releasing Form Remarks',
      'LPA Male',
      'Gx Remarks',
      'TB Case Number',
      'LPA Kit Used',
      'LPA Kit Others',
      'LPA Date Processed',
      'LPA MTB Complex',
      'LPA Isoniazid Result',
      'LPA Rifampicin',
      'LPA Isoniazid',
      'LPA Rifampicin Result',
      'LPA Date Released',
      'LPA Ethambutol',
      'LPA Examiner',
      'LPA Fluoroquinolones',
      'LPA Aminoglycosides/ SLI',
      'LPA Mycobacterium Tb',
      'LPA Lab Manager',
      'LPA Remarks:',
      'LPA Center',
      'LPA Performed By',
      'LPA Reviewed By',
      'LPA Date of Release',
      'LPA Remarks',
      'LPA TAT',
      'Laboratory Releasing Form Remarks',
      'Laboratory Releasing Form Gx Remarks',
      'Laboratory Releasing Form Smear Remarks',
      'Laboratory Registry Remarks',
    ].every(expectedKey => payloadKeys.includes(expectedKey))
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request
    this.response = { deviceApiRawId: this.id, resultIds: [] }
    return transact(async knex => {
      const { deviceId } = await knex('DeviceApiKey')
        .where('token', auth.credentials.token)
        .first('deviceId')
      if (!deviceId) {
        throw Boom.badRequest(
          'Invalid device API key: Cannot determine which device this came from'
        )
      }
      this.response.deviceId = deviceId
      const dateKeys = [
        'MRF Date Requested',
        'Date transfered to DST',
        'Date Collected 1',
        'Date Collected 2',
        'Date Collected 3',
        'Date Received',
        'Date Encoded',
        'Smear Date Released',
        'Smear TAT',
        'Culture Date Inoculated',
        'Culture Date Released',
        'Culture TAT',
        'DSSM&Culture Releasing Form Date Released',
        'DST Date Inoculated',
        'DST Date Read',
        'DST Date Released',
        'DST Releasing Form Released Date',
        'Gx Processing Date',
        'Gx Date Released',
        'Gx TAT',
        'LPA Date Processed',
        'LPA Date Released',
        'LPA Date of Release',
        'LPA TAT',
      ]
      dateKeys.forEach(dateKey => {
        payload[dateKey] = getDateOrDefault(payload, dateKey)
      })
      const rawMessage = JSON.stringify(request.plugins.rawPayload)
      const utcNow = getUtcTime()
      const remoteAddress = getRemoteAddress(request)
      const [deviceLogId] = await knex('DeviceLog').insert({
        deviceId,
        source: 'Philippines NTRL DB Record Updated',
        createdOn: utcNow,
        senderIp: remoteAddress,
        rawMessage,
      })
      this.response.deviceLogId = deviceLogId
      await knex('Device')
        .where({ id: deviceId })
        .update({ lastSeenOn: utcNow, updatedOn: utcNow })
      const site = await knex('Device as d')
        .join('Site as s', 'd.siteId', 's.id')
        .where('d.id', deviceId)
        .first('s.*', 'd.name as deviceName')
      this.messageContext.dispatch(deviceSeen(deviceId))

      const sampleTypeMapping = {
        Sputum: 'Sputum',
        Isolates: 'Isolate',
        Others: 'Other',
      }
      const sampleTypeId = await sampleTypeToId(
        sampleTypeMapping[payload['Type of Specimen']] || 'Other'
      )
      const originSite = await knex('Site')
        .where('externalId', payload['Referring Health Facility'])
        .first()
      const ntrlLabRequestId = `PN-${formatDateOrDefault(
        payload['Date Encoded'],
        'YY'
      )}-${payload['Serial Number']}`
      const sampleOriginSiteId = originSite ? originSite.id : null
      const sampleCollectionDateKeys = [
        'Date Collected 1',
        'Date Collected 2',
        'Date Collected 3',
      ].filter(dateCollectedKey => _.isNil(payload[dateCollectedKey]))
      const samples = sampleCollectionDateKeys.map(dateCollectedKey => {
        const sample = {
          externalId: `${ntrlLabRequestId}`,
          collectedOn: payload[dateCollectedKey],
          sampleTypeId,
          originSiteId: sampleOriginSiteId,
        }
        if (sampleCollectionDateKeys.length > 1) {
          sample.externalId = `${ntrlLabRequestId}/${
            dateCollectedKey[dateCollectedKey.length - 1]
          }`
        }
        return sample
      })
      if (_.isEmpty(samples)) {
        samples.push({
          externalId: ntrlLabRequestId,
          sampleTypeId,
          originSiteId: sampleOriginSiteId,
        })
      }
      await Promise.each(samples, async sample => {
        let existingSample = await knex('Sample')
          .where('externalId', sample.externalId)
          .first()
        if (!existingSample) {
          existingSample = await knex('Sample')
            .where('externalId', ntrlLabRequestId)
            .first()
        }
        if (
          existingSample &&
          (existingSample.externalId !== sample.externalId ||
            existingSample.sampleTypeId !== sample.sampleTypeId ||
            !dateEqual(existingSample.collectedOn, sample.collectedOn) ||
            existingSample.sampleOriginSiteId !== sample.sampleOriginSiteId)
        ) {
          sample.id = existingSample.id
          await knex('Sample')
            .where('id', existingSample.id)
            .update(sample)
        } else {
          const [sampleId] = await knex('Sample').insert(sample)
          sample.id = sampleId
        }
      })
      const sampleIds = samples.map(sample => sample.id)
      const patientData = {
        serialNumber: payload['Serial Number'],
        mrfDateRequested: payload['MRF Date Requested'],
        referringHealthFacility: payload['Referring Health Facility'],
        requestingPhysician: payload['Requesting Physician'],
        lastName: payload['Last Name'],
        firstName: payload['First Name'],
        middleInitialOrName: payload['Middle Initial'],
        age: payload.Age,
        sex: payload.Sex,
        address: payload.Address,
        cultureCenter: payload['Culture Center'],
        dstCenter: payload['DST Center'],
        treatmentCategory: payload['Treatment Category'],
        registrationGroup: payload['Registration Group'],
        treatmentSchedule: payload['Treatment Schedule'],
        monthOfTreatment: payload['Month of tx'],
        typeOfSpecimen: payload['Type of Specimen'],
        ifOthersSpecify: payload['(If Others) Specify'],
        site: payload.Site,
        testRequestedSmear: payload['Test Requested Smear'],
        testRequestedCulture: payload['Test Requested Culture'],
        testRequestedDst: payload['Test Requested DST'],
        testRequestedLpa: payload['Test Requested LPA'],
        testRequestedGx: payload['Test Requested Gx'],
        dateTransferedToDst: payload['Date transfered to DST'],
        cultureMethod: payload['Culture Method'],
        presumptiveDsOrDr: payload['Presumptive DS or DR'],
        dateReceived: payload['Date Received'],
        labNo1: payload['Date Received'],
        tbCaseNumber: payload['TB Case Number'],
        dateCollected1: payload['Date Collected 1'],
        dateCollected2: payload['Date Collected 2'],
        dateCollected3: payload['Date Collected 3'],
        volume1: payload['Volume 1'],
        volume2: payload['Volume 2'],
        volume3: payload['Volume 3'],
        consistency1: payload['Consistency 1'],
        consistency2: payload['Consistency 3'],
        consistency3: payload['Consistency 4'],
        encodedBy: payload['Encoded By'],
        dateEncoded: payload['Date Encoded'],
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
        insertedOn: utcNow,
        insertedBy: null,
        updatedOn: utcNow,
        updatedBy: null,
      }

      const dstResultData = {
        testRequested: payload['DST Test Requested'],
        dateInoculated: payload['DST Date Inoculated'],
        inoculatedBy: payload['DST MT Inoculated'],
        idResult: payload['DST ID Result'],
        streptomycin: payload.Streptomycin,
        isoniazid: payload.Isoniazid,
        rifampicin: payload.Rifampicin,
        ethambutol: payload.Ethambutol,
        pyrazinamide: payload.Pyrazinamide,
        kanamycin: payload.Kanamycin,
        levofloxacin: payload.Levofloxacin,
        amikacin: payload.Amikacin,
        capreomycin: payload.Capreomycin,
        methodUsed: payload['DST Method Used'],
        otherMethodUsed: payload['DST Method Used Others'],
        remarks: payload['DST Remarks'],
        dateRead: payload['DST Date Read'],
        dateReleased: payload['DST Date Released'],
        readBy: payload['DST MT Read'],
        labTech: payload['DST Lab Tech'],
        encodedBy: payload['DST Encoded by'],
        reviewedBy: payload['DST Releasing Form Lab Manager'],
      }
      if (
        Object.values(dstResultData).some(
          value => value !== '' && !_.isNil(value)
        )
      ) {
        const assayBdMgitAstId = await assayToId('assayBdMgitAst')
        const assayGenericDstId = await assayToId('assayGenericDst')
        const result = (await knex('Result as r')
          .whereIn('r.sampleId', sampleIds)
          .whereIn('.r.assayId', [assayBdMgitAstId, assayGenericDstId])
          .andWhere({ deviceId })
          .first('r.*')) || {
          ...baseNewResult,
          assayId:
            dstResultData.methodUsed === 'Liquid Culture (MGIT 960)'
              ? assayBdMgitAstId
              : assayGenericDstId,
          sampleId: samples[0].id,
          startedOn: dstResultData.dateRead,
          endedOn: dstResultData.dateRead,
          resultData: JSON.stringify({
            encodedResult: dstResultData,
          }),
        }
        if (!result.resultCategory1) {
          result.resultCategory1 = resultCategories.Missing
        }
        if (!result.resultCategory2) {
          result.resultCategory2 = resultCategories.Missing
        }
        const resultCategory1Id = {
          'M. tuberculosis': resultCategories.PositiveMTB,
          'No growth after 6 weeks': resultCategories.NotDetected,
          'No growth after 8 weeks': resultCategories.NotDetected,
          'Non tuberculous mycobacteria': resultCategories.PositiveMOTT,
          Contaminated: resultCategories.Contaminated,
          'Not Done': resultCategories.Missing,
          'NON-VIABLE': resultCategories.Invalid,
        }[dstResultData.idResult]
        const resultCategory2IdMappings = {
          RESISTANT: resultCategories.Resistant,
          SUSCEPTIBLE: resultCategories.Susceptible,
          'NOT DONE': resultCategories.Missing,
          'NON VIABLE': resultCategories.Invalid,
          CONTAMINATED: resultCategories.Contaminated,
        }
        const resultsForDrugsTested = [
          dstResultData.isoniazid,
          dstResultData.rifampicin,
          dstResultData.ethambutol,
          dstResultData.pyrazinamide,
          dstResultData.kanamycin,
          dstResultData.levofloxacin,
          dstResultData.amikacin,
          dstResultData.capreomycin,
        ]
        let resultCategory2Id = resultCategories.Missing
        if (
          resultsForDrugsTested.some(
            resultForDrugsTested =>
              resultCategory2IdMappings[resultForDrugsTested] === 'Resistant'
          )
        ) {
          resultCategory2Id = resultCategories.Resistant
        } else if (
          resultsForDrugsTested.every(resultForDrugsTested =>
            ['Susceptible', 'Missing'].includes(
              resultCategory2IdMappings[resultForDrugsTested]
            )
          )
        ) {
          resultCategory2Id = resultCategories.Susceptible
        } else if (
          resultsForDrugsTested.some(
            resultForDrugsTested =>
              resultCategory2IdMappings[resultForDrugsTested] === 'Contaminated'
          )
        ) {
          resultCategory2Id = resultCategories.Contaminated
        } else if (
          resultsForDrugsTested.some(
            resultForDrugsTested =>
              resultCategory2IdMappings[resultForDrugsTested] === 'Invalid'
          )
        ) {
          resultCategory2Id = resultCategories.Invalid
        }
        const resultOverwritePriority = [
          resultCategories.PositiveMTB,
          resultCategories.PositiveMOTT,
          resultCategories.Resistant,
          resultCategories.Susceptible,
          resultCategories.Contaminated,
          resultCategories.Invalid,
          resultCategories.NotDetected,
          resultCategories.Missing,
        ]
        if (
          resultOverwritePriority.indexOf(resultCategory1Id) <
          result.resultCategory1
        ) {
          result.resultCategory1 = resultCategory1Id
        }
        if (
          resultOverwritePriority.indexOf(resultCategory2Id) <
          result.resultCategory2
        ) {
          result.resultCategory2 = resultCategory2Id
        }
        await this.upsertResult(
          knex,
          rawMessage,
          site,
          result,
          dstResultData,
          dstResultData.dateRead,
          dstResultData.dateRead,
          dstResultData.readBy,
          patientData,
          utcNow,
          resultCategories,
          resultWorkflowStatuses
        )
      }

      const cultureResultData = {
        dateInoculated: payload['Culture Date Inoculated'],
        medTech: payload['Culture Med Tech'],
        resultStatus: payload['Culture Result Status'],
        dstStatus: payload['Culture DST Status'],
        result1: payload['Culture Result 1'],
        grade1: payload['Culture Grade 1'],
        result2: payload['Culture Result 2'],
        grade2: payload['Culture Grade 2'],
        finalResult: payload['Culture Final Result'],
        remarks: payload['Culture Remarks 1'],
        dateReleased: payload['Culture Date Released'],
        encodedBy: payload['Culture Encoded by'],
        labTech: payload['Culture Lab Tech'],
      }
      const lpaResultData = {
        center: payload['LPA Center'],
        lpaKit: payload['LPA Kit Used'],
        lpaKitOther: payload['LPA Kit Others'],
        mtbComplex: payload['LPA MTB Complex'],
        rifampicin: payload['LPA Rifampicin Result'],
        isoniazid: payload['LPA Isoniazid Result'],
        ethmabutol: payload['LPA Ethambutol'],
        fluoroquinolones: payload['LPA Fluoroquinolones'],
        aminoglycoside: payload['LPA Aminoglycosides/ SLI'],
        remarks: payload['LPA Remarks:'],
        dateReleased: payload['LPA Date of Release'],
        performedBy: payload['LPA Performed By'],
        reviewedBy: payload['LPA Reviewed By'],
      }
      const smearResultData = {
        smearMethod: payload['Smear Method'],
        smearResult1: payload['Smear Result 1'],
        smearResult2: payload['Smear Result 2'],
        finalResult: payload['Smear Final Result'],
        dateReleased: payload['Smear Date Released'],
        encodedBy: payload['Smear Encoded by'],
        laboratoryTechnician: payload['Smear Lab Tech'],
      }
      const geneXpertResultData = {
        center: payload['Gx Center'],
        processingDate: payload['Gx Processing Date'],
        mtb: payload['Gx MTB'],
        rifampicin: payload['Gx Rifampicin'],
        remarks: payload['Gx Remarks'],
        dateReleased: payload['Gx Date Released'],
        examiner: payload['Gx Examiner'],
        labManager: payload['Gx Laboratory Manager'],
      }
    })
  }

  async upsertResult(
    knex,
    rawMessage,
    site,
    result,
    newResultData,
    resultStartedOn,
    resultEndedOn,
    operator,
    patientData,
    utcNow,
    resultCategories,
    resultWorkflowStatuses
  ) {
    const mergeDeep = (baseValue, sourceValue) => {
      if (_.isEmpty(baseValue) && !_.isEmpty(sourceValue)) {
        return sourceValue
      } else if (!_.isEmpty(baseValue) && _.isEmpty(sourceValue)) {
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
    }
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
    if (!result.id) {
      const [resultWorkflowStatusLogId] = await knex(
        'ResultWorkflowLog'
      ).insert(resultWorkflowLog)
      return resultWorkflowStatusLogId
    } else {
      const existingResultWorklfowLog = await knex('ResultWorkflowStatus')
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
        !existingResultWorklfowLog ||
        resultWorkflowStatusPriority.indexOf(resultWorkflowStatusId) <
          resultWorkflowStatusPriority.indexOf(
            existingResultWorklfowLog.resultWorkflowStatusId
          )
      ) {
        const [resultWorkflowStatusLogId] = await knex(
          'ResultWorkflowLog'
        ).insert(resultWorkflowLog)
        return resultWorkflowStatusLogId
      }
    }
    return Promise.resolve()
  }
}

module.exports = DefaultPhilippinesNtrl
