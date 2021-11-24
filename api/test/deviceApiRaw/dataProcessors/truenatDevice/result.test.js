const chai = require('chai')
const proxyquire = require('proxyquire')
const Promise = require('bluebird')
const sinon = require('sinon')
const _ = require('lodash')

const { deviceSeen } = require('../../../../src/device/actions')
const { resultLogged } = require('../../../../src/result/actions')

const { assert, expect } = chai

describe.only('Truenat Result Upload Data Processor', () => {
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
  let knexInsertSpy
  let knexUpdateSpy
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
      } else {
        if (
          args.join(',') ===
          [
            'dak.deviceId',
            'd.partnerId',
            'd.siteId',
            's.geographyId',
            's.longitude',
            's.latitude',
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
        if (existingResult && knexSpy.chainedCalls.lastTable() === 'Result') {
          return Promise.resolve(existingResult)
        }
      }
      return Promise.resolve()
    }
    knexInsertSpy = sinon.spy()
    knex.insert = async function (...args) {
      knexInsertSpy(...args)
      knexSpy.chainedCalls.insert = [...knexSpy.chainedCalls.insert, args]
      if (newSampleId && knexSpy.chainedCalls.lastTable() === 'Sample') {
        return Promise.resolve([newSampleId])
      }
      if (newResultId && knexSpy.chainedCalls.lastTable() === 'Result') {
        return Promise.resolve([newResultId])
      }
      if (
        newResultWorkflowStatusLogId &&
        knexSpy.chainedCalls.lastTable() === 'ResultWorkflowLog'
      ) {
        return Promise.resolve([newResultWorkflowStatusLogId])
      }
      return Promise.resolve()
    }
    knexUpdateSpy = sinon.spy()
    knex.update = async function (...args) {
      knexUpdateSpy(...args)
      knexSpy.chainedCalls.update = [...knexSpy.chainedCalls.update, args]
      return Promise.resolve()
    }
    mockKnex = knex
    mockDb = {
      transact: async transaction => {
        return transaction(mockKnex)
      },
    }
    return proxyquire(
      '../../../../src/deviceApiRaw/dataProcessors/truenatDevice/result',
      {
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
          resultTypeToId: async resultTypeExternalId =>
            Promise.resolve(staticData.resultType[resultTypeExternalId]),
          allSampleTypeToId: async () => Promise.resolve(staticData.sampleType),
          allResultCategoryToId: async () =>
            Promise.resolve(staticData.resultCategory),
          allResultWorkflowStatusToId: async () =>
            Promise.resolve(staticData.resultWorkflowStatus),
        },
      }
    )
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
      resultCategory1i18nKey: 'resultCategoryMTB',
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
      let deviceApiKeyDetails = JSON.parse(
        JSON.stringify(defaultDeviceApiKeyDetails)
      )
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
      mockTruenatResultUploadDataProcessorBuilder.withDeviceApiKeyDetails =
        specifiedDeviceApiKeyDetails => {
          deviceApiKeyDetails = specifiedDeviceApiKeyDetails
          return mockTruenatResultUploadDataProcessorBuilder
        }
      mockTruenatResultUploadDataProcessorBuilder.withAssay =
        specifiedAssay => {
          assay = specifiedAssay
          return mockTruenatResultUploadDataProcessorBuilder
        }
      mockTruenatResultUploadDataProcessorBuilder.withSampleId =
        specifiedSampleId => {
          sampleId = specifiedSampleId
          return mockTruenatResultUploadDataProcessorBuilder
        }
      mockTruenatResultUploadDataProcessorBuilder.withNewSampleId =
        specifiedNewSampleId => {
          newSampleId = specifiedNewSampleId
          return mockTruenatResultUploadDataProcessorBuilder
        }
      mockTruenatResultUploadDataProcessorBuilder.withExistingResult =
        specifiedExistingResult => {
          existingResult = specifiedExistingResult
          return mockTruenatResultUploadDataProcessorBuilder
        }
      mockTruenatResultUploadDataProcessorBuilder.withNewResultId =
        specifiedNewResultId => {
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
        const TruenatResult = fluentMockTruenatResultUploadDataProcessor()
          .withDeviceApiKeyDetails({})
          .build()
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

    it('will create a new sample', async () => {
      const TruenatResult = fluentMockTruenatResultUploadDataProcessor().build()
      const truenatResultInstance = new TruenatResult(request, messageContext)
      await truenatResultInstance.processRequest()
      const {
        deviceTypeExternalId,
        siteExternalId,
        deviceDefaultReportableSiteId,
      } = defaultDeviceApiKeyDetails
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
      assert.isOk(
        knexInsertSpy.calledWith({
          externalId: sampleExternalId,
          sampleTypeId,
          originSiteId: deviceDefaultReportableSiteId,
        })
      )
    })
  })
})
