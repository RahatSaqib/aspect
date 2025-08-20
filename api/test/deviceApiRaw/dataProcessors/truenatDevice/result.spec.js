const chai = require('chai')
const proxyquire = require('proxyquire')
const Promise = require('bluebird')
const sinon = require('sinon')
const _ = require('lodash')

const { assert, expect } = chai

describe('Truenat Result Upload Data Processor', () => {
  const defaultPayload = {
    Age: '55',
    Ct1: '19.0',
    Ct2: '10.39',
    Ct3: 'ND',
    CtLabel1: 'Control',
    CtLabel2: 'E gene',
    CtLabel3: 'Orf1A',
    CtResult1: 'DETECTED High',
    CtResult2: 'DETECTED High',
    CtResult3: 'NOT DETECTED',
    Date: '2020-09-27',
    DoctorName: 'Dr Alban Aloha',
    FinalResult: 'Positive',
    Gender: 'Male',
    LabName: 'Some Molbio Truenat Lab',
    Notes: 'The test ran and the result was interpreted',
    PatientID: '23894723890472349',
    PatientName: 'James Teether',
    SampleType: 'Sputum',
    Status: 'Stopped',
    TestName: 'MTB Plus',
    Time: '22-40-58',
    User: 'InitTesti',
    ValidityStatus: 'Valid',
  }
  const staticData = {
    resultSource: {
      DiagnosticDevice: 1,
    },
    resultType: {
      Patient: 2,
    },
    sampleType: {
      Sputum: 3,
    },
    resultCategory: {
      Unknown: 4,
      Detected: 5,
      NotDetected: 6,
      Invalid: 7,
      Indeterminate: 8,
      Error: 9,
      Missing: 10,
    },
    resultWorkflowStatus: {
      Purged: 11,
      Flagged: 12,
      Acknowledged: 13,
      Delivered: 14,
      Deliverable: 15,
      Validated: 16,
      Error: 17,
      Processed: 18,
      InProgress: 19,
      Ordered: 20,
      OK: 30,
    },
  }
  let mockDeviceService
  let mockSharedRequestService
  let mockDb
  let knexSpy
  let knexInsertSpies
  let knexUpdateSpies
  let mockKnex
  function mockTruenatResultUploadDataProcessor(
    deviceApiKeyDetails,
    assay,
    sampleId,
    newSampleId,
    existingResult,
    newResultId,
    newResultWorkflowStatusLogId
  ) {
    mockDeviceService = {
      postPayloadFromDevice: async () => Promise.resolve(987),
    }
    sinon.spy(mockDeviceService, 'postPayloadFromDevice')
    mockSharedRequestService = {
      getRemoteAddress: () => '10.11.12.13',
    }
    sinon.spy(mockSharedRequestService, 'getRemoteAddress')
    knexSpy = sinon.spy()
    knexSpy.chainedCalls = {
      tables: [],
      join: [],
      where: [],
      orWhere: [],
      first: [],
      insert: [],
      update: [],
      lastTable: () => _.last(knexSpy.chainedCalls.tables)[0],
    }
    function knex(...args) {
      knexSpy.chainedCalls.tables = [...knexSpy.chainedCalls.tables, args]
      knexSpy(args)
      return knex
    }
    knex.join = function (...args) {
      knexSpy.chainedCalls.join = [...knexSpy.chainedCalls.join, args]
      return knex
    }
    knex.where = function (...args) {
      knexSpy.chainedCalls.where = [...knexSpy.chainedCalls.where, args]
      return knex
    }
    knex.orWhere = function (...args) {
      knexSpy.chainedCalls.orWhere = [...knexSpy.chainedCalls.orWhere, args]
      return knex
    }
    knex.first = async function (...args) {
      knexSpy.chainedCalls.first = [...knexSpy.chainedCalls.first, args]
      if (_.isEmpty(args)) {
        if (knexSpy.chainedCalls.lastTable() === 'Assay') {
          return Promise.resolve(assay)
        }
        if (existingResult && knexSpy.chainedCalls.lastTable() === 'Result') {
          return Promise.resolve(existingResult)
        }
      } else {
        if (
          args.join(',') ===
          [
            'dak.deviceId',
            'dak.username',
            'dak.id as deviceApiKeyId',
            'd.partnerId',
            'd.siteId',
            'd.deviceApprovalId',
            'd.name as deviceName',
            's.geographyId',
            's.longitude',
            's.latitude',
            's.name as siteName',
            'd.defaultReportableSiteId as deviceDefaultReportableSiteId',
            's.externalId as siteExternalId',
            'dt.externalId as deviceTypeExternalId',
          ].join(',')
        ) {
          return Promise.resolve(deviceApiKeyDetails)
        }
        if (sampleId && knexSpy.chainedCalls.lastTable() === 'Sample') {
          return Promise.resolve({ id: sampleId })
        }
      }
      return Promise.resolve()
    }
    knexInsertSpies = {}
    knex.insert = async function (...args) {
      const lastTableName = knexSpy.chainedCalls.lastTable()
      if (!knexInsertSpies[lastTableName]) {
        knexInsertSpies[lastTableName] = sinon.spy()
      }
      knexInsertSpies[lastTableName](...args)
      knexSpy.chainedCalls.insert = [...knexSpy.chainedCalls.insert, args]
      if (newSampleId && knexSpy.chainedCalls.lastTable() === 'Sample') {
        return Promise.resolve([newSampleId])
      }
      if (newResultId && knexSpy.chainedCalls.lastTable() === 'Result') {
        return Promise.resolve([newResultId])
      }
      if (newResultWorkflowStatusLogId && knexSpy.chainedCalls.lastTable() === 'ResultWorkflowLog') {
        return Promise.resolve([newResultWorkflowStatusLogId])
      }
      return Promise.resolve()
    }
    knexUpdateSpies = {}
    knex.update = async function (...args) {
      const lastTableName = knexSpy.chainedCalls.lastTable()
      if (!knexUpdateSpies[lastTableName]) {
        knexUpdateSpies[lastTableName] = sinon.spy()
      }
      knexUpdateSpies[lastTableName](...args)
      knexSpy.chainedCalls.update = [...knexSpy.chainedCalls.update, args]
      return Promise.resolve()
    }
    mockKnex = knex
    mockDb = {
      transact: async transaction => {
        return transaction(mockKnex)
      },
    }
    return proxyquire('../../../../src/deviceApiRaw/dataProcessors/truenatDevice/result', {
      '../_base': {
        SynchronousDataProcessor: class {
          constructor(request, messageContext) {
            this.request = request
            this.messageContext = messageContext
          }
        },
      },
      '../../../shared/request': mockSharedRequestService,
      '../../../db': mockDb,
      '../../../device/service': mockDeviceService,
      '../../../shared/dictionary': {
        resultSourceToId: async resultSourceExternalId =>
          Promise.resolve(staticData.resultSource[resultSourceExternalId]),
        resultTypeToId: async resultTypeExternalId => Promise.resolve(staticData.resultType[resultTypeExternalId]),
        allSampleTypeToId: async () => Promise.resolve(staticData.sampleType),
        allResultCategoryToId: async () => Promise.resolve(staticData.resultCategory),
        allResultWorkflowStatusToId: async () => Promise.resolve(staticData.resultWorkflowStatus),
      },
    })
  }

  describe('canProcessRequest', () => {
    it('requires a path of /truelab/results/upload to be accepted', async () => {
      const TruenatResult = mockTruenatResultUploadDataProcessor()
      let canProcessRequest = await TruenatResult.canProcessRequest({})
      assert.isFalse(canProcessRequest)
      canProcessRequest = await TruenatResult.canProcessRequest({
        payload: defaultPayload,
        params: 'some random array of params',
      })
      assert.isFalse(canProcessRequest)
      canProcessRequest = await TruenatResult.canProcessRequest({
        params: { params: 'truelab/results/upload' },
      })
      assert.isTrue(canProcessRequest)
    })
  })

  describe('processRequest', () => {
    const request = {
      auth: { credentials: { token: 'Some device API Key' } },
      payload: defaultPayload,
      params: { params: 'truelab/results/upload' },
      plugins: {
        rawPayload: JSON.stringify(defaultPayload),
      },
    }
    const defaultDeviceApiKeyDetails = {
      deviceId: 123,
      partnerId: 1,
      siteId: 321,
      geographyId: 111,
      longitude: 10.123,
      latitude: 11.321,
      deviceDefaultReportableSiteId: 222,
      siteExternalId: 'Truenat Lab',
      deviceTypeExternalId: 'molbioTruenat',
    }
    const defaultAssay = {
      id: 36,
      name: 'Truenat MTB Plus',
      i18nKey: 'assayTruenatMtbPlus',
      externalId: 'assayTruenatMtbPlus',
      assayTypeId: 1,
      deviceTypeId: 15,
      resultSourceId: 1,
      resultCategory1Label: 'MTB',
      resultCategory1i18nKey: 'resultCategoryMtb',
      resultCategory2Label: null,
      resultCategory2i18nKey: null,
      resultDataSchema:
        '{"ct1": {"type": "number", "order": 4, "title": "Ct1"}, "ct2": {"type": "number", "order": 7, "title": "Ct2"}, "ct3": {"type": "number", "order": 10, "title": "Ct3"}, "status": {"type": "string", "order": 1, "title": "Status"}, "labName": {"type": "string", "order": 12, "title": "Lab Name"}, "ctLabel1": {"type": "string", "order": 3, "title": "Ct Label 1"}, "ctLabel2": {"type": "string", "order": 6, "title": "Ct Label 2"}, "ctLabel3": {"type": "string", "order": 9, "title": "Ct Label 31"}, "testName": {"type": "string", "order": 13, "title": "Test Name"}, "ctResult1": {"type": "string", "order": 5, "title": "Ct Result 1"}, "ctResult2": {"type": "string", "order": 8, "title": "Ct Result 2"}, "ctResult3": {"type": "string", "order": 11, "title": "Ct Result 3"}, "finalResult": {"type": "string", "order": 0, "title": "Final Result"}, "validityStatus": {"type": "string", "order": 2, "title": "Validity Status"}}',
      patientDataSchema:
        '{"id": {"type": "string", "order": 1, "title": "Patient ID"}, "age": {"type": "number", "order": 4, "title": "Age"}, "gender": {"type": "string", "order": 3, "title": "Gender"}, "doctorName": {"type": "string", "order": 0, "title": "Referred By"}, "patientName": {"type": "string", "order": 2, "title": "Patient Name"}}',
      abbreviation: 'MTB',
    }
    const defaultSampleId = undefined
    const defaultNewSampleId = 333
    const defaultExisitingResult = undefined
    const defaultNewResultId = 444
    const defaultNewResultWorkflowStatusLogId = 555

    let messageContext
    beforeEach(() => {
      messageContext = { dispatch: () => {} }
      sinon.spy(messageContext, 'dispatch')
    })

    function fluentMockTruenatResultUploadDataProcessor() {
      let deviceApiKeyDetails = JSON.parse(JSON.stringify(defaultDeviceApiKeyDetails))
      let assay = JSON.parse(JSON.stringify(defaultAssay))
      let sampleId = defaultSampleId
      let newSampleId = defaultNewSampleId
      let existingResult = defaultExisitingResult
      let newResultId = defaultNewResultId
      let newResultWorkflowStatusLogId = defaultNewResultWorkflowStatusLogId
      const mockTruenatResultUploadDataProcessorBuilder = {
        build: () => {
          return mockTruenatResultUploadDataProcessor(
            deviceApiKeyDetails,
            assay,
            sampleId,
            newSampleId,
            existingResult,
            newResultId,
            newResultWorkflowStatusLogId
          )
        },
      }
      mockTruenatResultUploadDataProcessorBuilder.withDeviceApiKeyDetails = specifiedDeviceApiKeyDetails => {
        deviceApiKeyDetails = specifiedDeviceApiKeyDetails
        return mockTruenatResultUploadDataProcessorBuilder
      }
      mockTruenatResultUploadDataProcessorBuilder.withAssay = specifiedAssay => {
        assay = specifiedAssay
        return mockTruenatResultUploadDataProcessorBuilder
      }
      mockTruenatResultUploadDataProcessorBuilder.withSampleId = specifiedSampleId => {
        sampleId = specifiedSampleId
        return mockTruenatResultUploadDataProcessorBuilder
      }
      mockTruenatResultUploadDataProcessorBuilder.withNewSampleId = specifiedNewSampleId => {
        newSampleId = specifiedNewSampleId
        return mockTruenatResultUploadDataProcessorBuilder
      }
      mockTruenatResultUploadDataProcessorBuilder.withExistingResult = specifiedExistingResult => {
        existingResult = specifiedExistingResult
        return mockTruenatResultUploadDataProcessorBuilder
      }
      mockTruenatResultUploadDataProcessorBuilder.withNewResultId = specifiedNewResultId => {
        newResultId = specifiedNewResultId
        return mockTruenatResultUploadDataProcessorBuilder
      }
      mockTruenatResultUploadDataProcessorBuilder.withNewResultWorkflowStatusLogId =
        specifiedNewResultWorkflowStatusLogId => {
          newResultWorkflowStatusLogId = specifiedNewResultWorkflowStatusLogId
          return mockTruenatResultUploadDataProcessorBuilder
        }
      return mockTruenatResultUploadDataProcessorBuilder
    }

    describe('when device ID cannot be determined from the device API key specified', () => {
      it('will respond with 400', async () => {
        const TruenatResult = fluentMockTruenatResultUploadDataProcessor().withDeviceApiKeyDetails({}).build()
        const truenatResultInstance = new TruenatResult(request, messageContext)
        try {
          await truenatResultInstance.processRequest()
          assert.fail('400 Response not returned!')
        } catch (e) {
          expect(e).to.containSubset({
            output: {
              statusCode: 400,
              payload: {
                statusCode: 400,
                error: 'Bad Request',
                message: `Invalid device API key: Cannot determine which device this came from`,
              },
            },
          })
        }
      })
    })

    describe('when the sample does not yet exist', () => {
      it.only('will create a new sample', async () => {
        const TruenatResult = fluentMockTruenatResultUploadDataProcessor().build()
        const truenatResultInstance = new TruenatResult(request, messageContext)
        await truenatResultInstance.processRequest()
        const { deviceTypeExternalId, siteExternalId, deviceDefaultReportableSiteId } = defaultDeviceApiKeyDetails
        const { abbreviation } = defaultAssay
        const patientId = _.get(request, 'payload.PatientID')
        const patientName = _.get(request, 'payload.PatientName')
        const sampleTypeName = _.get(request, 'payload.SampleType')
        const sampleTypeMappings = { Sputum: 'Sputum' }
        const sampleExternalId = `${deviceTypeExternalId}_${abbreviation}_${siteExternalId}_${
          patientId || patientName
        }_${sampleTypeMappings[sampleTypeName] || 'Unknown'}`
        const sampleTypeId = sampleTypeMappings[sampleTypeName]
          ? staticData.sampleType[sampleTypeMappings[sampleTypeName]]
          : null
        const sampleInsertArgs = knexInsertSpies.Sample.getCalls().map(call => call.args[0])
        expect(sampleInsertArgs[0]).to.deep.include({
          externalId: sampleExternalId,
          sampleTypeId,
          originSiteId: deviceDefaultReportableSiteId,
        })
      })
    })

    describe('when the result & sample already exist', () => {
      it('will use the existing sample when updating the result', async () => {
        const existingSampleId = 777
        const TruenatResult = fluentMockTruenatResultUploadDataProcessor()
          .withExistingResult({
            id: 5018,
            externalId: 'UQTB-13-RKHWGN4J-D',
            assayId: defaultAssay.id,
            partnerId: defaultDeviceApiKeyDetails.partnerId,
            siteId: defaultDeviceApiKeyDetails.siteId,
            deviceId: defaultDeviceApiKeyDetails.deviceId,
            patientCaseId: 551,
            resultWorkflowStatusLogId: 5734,
            treatmentStatusLogId: 5734,
            longitude: defaultDeviceApiKeyDetails.longitude,
            latitude: defaultDeviceApiKeyDetails.latitude,
            resultSourceId: staticData.resultSource.DiagnosticDevice,
            resultTypeId: staticData.resultType.Patient,
            sampleId: existingSampleId,
            sampleRunNumber: 1,
            resultCategory1: staticData.resultCategory.Missing,
            resultCategory2: null,
            resultData:
              '{"ct1": 29, "ct2": 12.1, "ct3": 19.8, "status": "Complete", "labName": "Town TB Lab", "ctLabel1": "Control Ct", "ctLabel2": "MTB Plus", "ctLabel3": "MTB Plus", "testName": "Truenat MTB", "ctResult1": "Detected", "ctResult2": "Detected", "ctResult3": "Detected", "finalResult": "Detected High", "validityStatus": "Valid"}',
            startedOn: new Date(2021, 10, 19, 13, 25, 14),
            endedOn: null,
            consumableSerial: 'Lot 3\tS-1234-1',
            consumableExpirationDate: null,
            consumableLot: 'R-ID-13',
            instrumentSerial: null,
            moduleName: null,
            moduleSerial: null,
            researchId: null,
            patientData:
              '{"id": "13-061-5364", "age": 47, "gender": "Male", "doctorName": "", "patientName": "Christina Kazembe"}',
            senderVersion: null,
            senderOperator: 'Marsha',
            notes: 'This is a test... result',
            oemData: null,
            rawData: null,
            errorCode: null,
            errorNotes: null,
            createdOn: new Date(2021, 10, 19, 15, 25, 14),
            createdBy: 1,
            updatedOn: new Date(2021, 10, 19, 15, 25, 14),
            updatedBy: 1,
            formData: null,
            reportableSiteId: null,
            firstViewedOn: null,
            resultStatusLogId: 72,
          })
          .withSampleId(existingSampleId)
          .build()
        const truenatResultInstance = new TruenatResult(request, messageContext)
        await truenatResultInstance.processRequest()
        const { partnerId, longitude, latitude, siteId, deviceId, deviceDefaultReportableSiteId } =
          defaultDeviceApiKeyDetails
        const patientId = _.get(request, 'payload.PatientID')
        const patientName = _.get(request, 'payload.PatientName')
        assert.isUndefined(knexInsertSpies.Sample)
        const finalResult = _.get(request, 'payload.FinalResult')
        const { resultCategory: resultCategoryIds } = staticData
        const resultCategory1Id =
          defaultAssay.externalId === 'assayTruenatUnknown'
            ? resultCategoryIds.Unknown
            : {
                Positive: resultCategoryIds.Detected,
                Detected: resultCategoryIds.Detected,
                Negative: resultCategoryIds.NotDetected,
                'Not Detected': resultCategoryIds.NotDetected,
                Invalid: resultCategoryIds.Invalid,
                Indeterminate: resultCategoryIds.Indeterminate,
                Error: resultCategoryIds.Error,
              }[finalResult] || resultCategoryIds.Missing
        expect(knexUpdateSpies.Result.firstCall.args[0]).to.containSubset({
          partnerId,
          siteId,
          deviceId,
          assayId: defaultAssay.id,
          longitude,
          latitude,
          resultSourceId: staticData.resultSource.DiagnosticDevice,
          resultTypeId: staticData.resultType.Patient,
          patientData: JSON.stringify({
            doctorName: _.get(request, 'payload.DoctorName'),
            id: patientId,
            patientName,
            gender: _.get(request, 'payload.Gender'),
            age: _.get(request, 'payload.Age'),
          }),
          resultData: JSON.stringify({
            finalResult,
            status: _.get(request, 'payload.Status'),
            validityStatus: _.get(request, 'payload.ValidityStatus'),
            ctLabel1: _.get(request, 'payload.CtLabel1'),
            ct1: _.get(request, 'payload.Ct1'),
            ctResult1: _.get(request, 'payload.CtResult1'),
            ctLabel2: _.get(request, 'payload.CtLabel2'),
            ct2: _.get(request, 'payload.Ct2'),
            ctResult2: _.get(request, 'payload.CtResult2'),
            cLabel3: _.get(request, 'payload.CtLabel3'),
            ct3: _.get(request, 'payload.Ct3'),
            ctResult3: _.get(request, 'payload.CtResult3'),
            labName: _.get(request, 'payload.LabName'),
            testName: _.get(request, 'payload.TestName'),
            resultText: finalResult,
          }),
          sampleId: existingSampleId,
          resultCategory1: resultCategory1Id || resultCategoryIds.Missing,
          senderOperator: _.get(request, 'payload.User'),
          notes: _.get(request, 'payload.Notes'),
          reportableSiteId: deviceDefaultReportableSiteId,
        })
      })

      it("will NOT overwrite the result's reportable site ID", async () => {
        const existingResultReportableSiteId = 202
        const existingSampleId = 777
        const TruenatResult = fluentMockTruenatResultUploadDataProcessor()
          .withExistingResult({
            id: 5018,
            externalId: 'UQTB-13-RKHWGN4J-D',
            assayId: defaultAssay.id,
            partnerId: defaultDeviceApiKeyDetails.partnerId,
            siteId: defaultDeviceApiKeyDetails.siteId,
            deviceId: defaultDeviceApiKeyDetails.deviceId,
            patientCaseId: 551,
            resultWorkflowStatusLogId: 5734,
            treatmentStatusLogId: 5734,
            longitude: defaultDeviceApiKeyDetails.longitude,
            latitude: defaultDeviceApiKeyDetails.latitude,
            resultSourceId: staticData.resultSource.DiagnosticDevice,
            resultTypeId: staticData.resultType.Patient,
            sampleId: existingSampleId,
            sampleRunNumber: 1,
            resultCategory1: staticData.resultCategory.Missing,
            resultCategory2: null,
            resultData:
              '{"ct1": 29, "ct2": 12.1, "ct3": 19.8, "status": "Complete", "labName": "Town TB Lab", "ctLabel1": "Control Ct", "ctLabel2": "MTB Plus", "ctLabel3": "MTB Plus", "testName": "Truenat MTB", "ctResult1": "Detected", "ctResult2": "Detected", "ctResult3": "Detected", "finalResult": "Detected High", "validityStatus": "Valid"}',
            startedOn: new Date(2021, 10, 19, 13, 25, 14),
            endedOn: null,
            consumableSerial: 'Lot 3\tS-1234-1',
            consumableExpirationDate: null,
            consumableLot: 'R-ID-13',
            instrumentSerial: null,
            moduleName: null,
            moduleSerial: null,
            researchId: null,
            patientData:
              '{"id": "13-061-5364", "age": 47, "gender": "Male", "doctorName": "", "patientName": "Christina Kazembe"}',
            senderVersion: null,
            senderOperator: 'Marsha',
            notes: 'This is a test... result',
            oemData: null,
            rawData: null,
            errorCode: null,
            errorNotes: null,
            createdOn: new Date(2021, 10, 19, 15, 25, 14),
            createdBy: 1,
            updatedOn: new Date(2021, 10, 19, 15, 25, 14),
            updatedBy: 1,
            formData: null,
            reportableSiteId: existingResultReportableSiteId,
            firstViewedOn: null,
            resultStatusLogId: 72,
          })
          .withSampleId(existingSampleId)
          .build()
        const truenatResultInstance = new TruenatResult(request, messageContext)
        await truenatResultInstance.processRequest()
        assert.notEqual(
          knexUpdateSpies.Result.lastCall.args[0].reportableSiteId,
          defaultDeviceApiKeyDetails.deviceDefaultReportableSiteId
        )
        assert.notEqual(knexUpdateSpies.Result.lastCall.args[0].reportableSiteId, defaultDeviceApiKeyDetails.siteId)
      })
    })

    describe('when the device does not have a default reportable site ID', () => {
      it("will use the device site ID as a fallback for the result's reportable site ID", async () => {
        const TruenatResult = fluentMockTruenatResultUploadDataProcessor()
          .withDeviceApiKeyDetails({
            ...defaultDeviceApiKeyDetails,
            deviceDefaultReportableSiteId: null,
          })
          .build()
        const truenatResultInstance = new TruenatResult(request, messageContext)
        await truenatResultInstance.processRequest()
        expect(knexInsertSpies.Result.lastCall.args[0]).to.containSubset({
          reportableSiteId: defaultDeviceApiKeyDetails.siteId,
        })
      })
    })

    describe('when the device has a default reportable site ID', () => {
      it("will assign the result's reportable site ID", async () => {
        const TruenatResult = fluentMockTruenatResultUploadDataProcessor().build()
        const truenatResultInstance = new TruenatResult(request, messageContext)
        await truenatResultInstance.processRequest()
        expect(knexInsertSpies.Result.lastCall.args[0]).to.containSubset({
          reportableSiteId: defaultDeviceApiKeyDetails.deviceDefaultReportableSiteId,
        })
      })
    })
  })
})
