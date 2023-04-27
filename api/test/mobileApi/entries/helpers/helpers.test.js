const { expect } = require('chai')
const { subDays } = require('date-fns')
const {
  data22,
  expected22,
  data477,
  expected477,
  followUp477,
  data5782,
  expected5782,
  data2997,
  expected2997,
} = require('./data')
const { extractFromDataById } = require('../../../../src/mobileApi/entries/entry/common/helpers/extractFromDataById')
const { buildHistoryTimeline } = require('../../../../src/mobileApi/entries/entry/common/helpers/buildHistoryTimeline')
const { generateSeverity } = require('../../../../src/mobileApi/entries/entry/common/helpers/generateSeverity')
const { getFollowUpByType } = require('../../../../src/mobileApi/entries/entry/common/helpers/getFollowUpByType')
const { transformAssayAvatar } = require('../../../../src/mobileApi/entries/entry/common/helpers/transformAssayAvatar')
const { transformEntryType } = require('../../../../src/mobileApi/entries/entry/common/helpers/transformEntryType')
const { transformResultText } = require('../../../../src/mobileApi/entries/entry/common/helpers/transformResultText')
const { generateSearchKeys } = require('../../../../src/mobileApi/entries/entry/common/helpers/generateSearchKeys')
const { transformSampleData } = require('../../../../src/mobileApi/entries/entry/common/helpers/transformSample')
const {
  transformTreatmentStatus,
} = require('../../../../src/mobileApi/entries/entry/common/helpers/transformTreatmentStatus')
const {
  transFormResultResponse,
} = require('../../../../src/mobileApi/entries/entry/common/helpers/transFormResultResponse')
const {
  transformTestInformation,
} = require('../../../../src/mobileApi/entries/entry/common/helpers/transformTestInformation')
const {
  transformPatientDataBySchema,
} = require('../../../../src/mobileApi/entries/entry/common/helpers/transformPatientDataBySchema')
const {
  transformClinicalResponse,
} = require('../../../../src/mobileApi/entries/entry/common/helpers/transformClinicalResponse')
const {
  generateTransferStatus,
} = require('../../../../src/mobileApi/entries/entry/common/helpers/generateTransferStatus')
const {
  getResultUpdatedOnDate,
} = require('../../../../src/mobileApi/entries/entry/common/helpers/getTrueUpdatedOnDates')

describe('Entries helpers', () => {
  describe('extractFromDataById', () => {
    const data = [
      { id: 1, resultId: 100, updatedOn: '2023-01-01' },
      { id: 2, resultId: 200, updatedOn: '2023-01-02' },
      { id: 3, resultId: 100, updatedOn: '2023-01-03' },
      { id: 4, resultId: 300, updatedOn: '2023-01-04' },
    ]

    it('returns filtered and ordered data without resultId key', () => {
      const key = 'resultId'
      const id = 100
      const expectedOutput = [
        { id: 3, resultId: 100, updatedOn: '2023-01-03' },
        { id: 1, resultId: 100, updatedOn: '2023-01-01' },
      ]

      const output = extractFromDataById(data, key, id)
      expect(output).to.deep.eq(expectedOutput)
    })
  })

  describe('buildHistoryTimeline', () => {
    it('should return the correct output', () => {
      const data = {
        resultSampleId: 1,
        sampleTypeExternalId: 'sample123',
        sampleSiteName: 'Site A',
        sampleCollectedOn: '2023-01-01T00:00:00Z',
      }

      const followUps = [
        { id: 2, followUpName: 'Follow Up 1', updatedOn: '2023-01-02T00:00:00Z' },
        { id: 3, followUpName: 'Follow Up 2', updatedOn: '2023-01-03T00:00:00Z' },
      ]

      const expectedOutput = [
        {
          id: 3,
          event: 'followUpCreated',
          name: 'Follow Up 2',
          siteName: null,
          updatedOn: '2023-01-03T00:00:00Z',
        },
        {
          id: 2,
          event: 'followUpCreated',
          name: 'Follow Up 1',
          siteName: null,
          updatedOn: '2023-01-02T00:00:00Z',
        },
        {
          id: 1,
          event: 'sampleCollected',
          name: 'sample123',
          siteName: 'Site A',
          updatedOn: '2023-01-01T00:00:00Z',
        },
      ]

      const output = buildHistoryTimeline(data, followUps)
      expect(output).to.deep.eq(expectedOutput)
    })
  })

  describe('getResultUpdatedOnDate', () => {
    const data = {
      updatedOn: '2022-01-01',
      sampleCollectedOn: '2022-01-05',
      resultWorkflowStatusChangedOn: '2022-01-10',
    }
    const followUps = [{ updatedOn: '2022-01-03' }, { updatedOn: '2022-01-06' }]
    const comments = [{ updatedOn: '2022-01-07' }, { updatedOn: '2022-01-09' }]

    it('returns correct date for the provided input data', () => {
      const result = getResultUpdatedOnDate(data, followUps, comments)
      expect(result).to.eq('2022-01-10')
    })

    it('returns correct date if no followUps are provided', () => {
      const followUps = []
      const result = getResultUpdatedOnDate(data, followUps, comments)
      expect(result).to.eq('2022-01-10')
    })
  })

  describe('generateSeverity', () => {
    it('should return "info" if daysDiff is less than or equal to 16', () => {
      const data = { resultTreatmentStatusChangedOn: subDays(new Date(), 10) }
      const followUps = []
      const result = generateSeverity(data, followUps)
      expect(result).to.eq('info')
    })
    it('should return "success" if on treatment', () => {
      const data = { resultTreatmentStatusChangedOn: '2022-01-01' }
      const followUps = [{ id: 1, followUpTypeExternalId: 'treatment', updatedOn: '2022-01-04' }]
      const result = generateSeverity(data, followUps)
      expect(result).to.eq('success')
    })

    it('should return "warning" if daysDiff is greater than 16', () => {
      const data = { resultTreatmentStatusChangedOn: subDays(new Date(), 18) }
      const followUps = []
      const result = generateSeverity(data, followUps)
      expect(result).to.eq('warning')
    })

    it('should return "danger" if daysDiff is greater than 32', () => {
      const data = { resultTreatmentStatusChangedOn: subDays(new Date(), 34) }
      const followUps = []
      const result = generateSeverity(data, followUps)
      expect(result).to.eq('danger')
    })
  })

  describe('generateTransferStatus()', () => {
    const TRANSFERRED = {
      AWAY: 'away',
      HERE: 'here',
    }
    it('should return an object with transferStatus = null when transferStatusLogData is null', () => {
      const data = { transferStatusLogData: null }
      const result = generateTransferStatus(data)
      expect(result).to.eql({})
    })

    it('should return an object with transferStatus = "away" when siteId is not equal to reportableSiteId and equal to previousReportableSiteId', () => {
      const data = {
        transferStatusLogData: '{"siteId": "123", "reportableSiteId": "456", "previousReportableSiteId": "123"}',
        transferredOn: '2023-01-01',
        transferredBy: 'John Doe',
      }
      const result = generateTransferStatus(data)
      expect(result).to.eql({
        transferStatus: TRANSFERRED.AWAY,
        siteId: '123',
        reportableSiteId: '456',
        previousReportableSiteId: '123',
        transferredOn: '2023-01-01',
        transferredBy: 'John Doe',
      })
    })

    it('should return an object with transferStatus = "here" when siteId is equal to reportableSiteId and not equal to previousReportableSiteId', () => {
      const data = {
        transferStatusLogData: '{"siteId": "123", "reportableSiteId": "123", "previousReportableSiteId": "456"}',
        transferredOn: '2023-01-01',
        transferredBy: 'John Doe',
      }
      const result = generateTransferStatus(data)
      expect(result).to.eql({
        transferStatus: TRANSFERRED.HERE,
        siteId: '123',
        reportableSiteId: '123',
        previousReportableSiteId: '456',
        transferredOn: '2023-01-01',
        transferredBy: 'John Doe',
      })
    })

    it('should return an object with transferStatus = null when siteId, reportableSiteId and previousReportableSiteId are equal', () => {
      const data = {
        transferStatusLogData: '{"siteId": "123", "reportableSiteId": "123", "previousReportableSiteId": "123"}',
        transferredOn: '2023-01-01',
        transferredBy: 'John Doe',
      }
      const result = generateTransferStatus(data)
      expect(result).to.eql({
        transferStatus: null,
        siteId: '123',
        reportableSiteId: '123',
        previousReportableSiteId: '123',
        transferredOn: '2023-01-01',
        transferredBy: 'John Doe',
      })
    })
  })

  describe('getFollowUpByType', () => {
    const followUps = [
      { followUpTypeExternalId: 'type1', data: 'data1' },
      { followUpTypeExternalId: 'type2', data: 'data2' },
      { followUpTypeExternalId: 'type3', data: 'data3' },
    ]

    it('returns correct followUp for the given type', () => {
      const expectedFollowUp = { followUpTypeExternalId: 'type2', data: 'data2' }
      const actualFollowUp = getFollowUpByType(followUps, 'type2')
      expect(actualFollowUp).to.deep.eq(expectedFollowUp)
    })

    it("returns undefined when type doesn't exist in followUps", () => {
      const actualFollowUp = getFollowUpByType(followUps, 'type4')
      expect(actualFollowUp).to.eq(undefined)
    })

    it('returns undefined when followUps array is empty', () => {
      const actualFollowUp = getFollowUpByType([], 'type3')
      expect(actualFollowUp).to.eq(undefined)
    })
  })

  describe('transformAssayAvatar', () => {
    it('returns correct backgroundColor and foregroundColor when assayTypeAbbreviation exists in assayAvatarColorsIcon', () => {
      const data = { assayTypeAbbreviation: 'TB' }
      const result = transformAssayAvatar(data)
      expect(result).to.have.property('backgroundColor').eq('purple')
      expect(result).to.have.property('foregroundColor').eq('secondary')
    })
    it('returns correct backgroundColor and foregroundColor when assayTypeAbbreviation exists in assayAvatarColorsIcon', () => {
      const data = { assayTypeAbbreviation: 'HIV' }
      const result = transformAssayAvatar(data)
      expect(result).to.have.property('backgroundColor').eq('orange')
      expect(result).to.have.property('foregroundColor').eq('secondary')
    })
  })

  describe('transformClinicalResponse', () => {
    it('returns the expected object', () => {
      const data = {
        resultWorkflowStatusId: 'someId',
        resultWorkflowStatusChangedOn: '2022-09-01',
      }
      const followUps = [
        { followUpTypeExternalId: 'treatment', externalId: 'tx123', date: '2022-08-01' },
        { followUpTypeExternalId: 'outcome', externalId: 'out123', date: '2022-09-20' },
      ]
      const acknowledgedId = 'someId'

      const result = transformClinicalResponse(data, followUps, acknowledgedId)

      expect(result).to.deep.eq({
        confirmedOn: '2022-09-01',
        outcome: 'out123',
        outcomeOccurred: '2022-09-20',
        recorded: true,
        treatment: 'tx123',
        treatmentStarted: '2022-08-01',
      })
    })
  })

  describe('transformEntryType', () => {
    it('should return TEST_TYPE.SAMPLE when test information is empty', () => {
      const data = []
      const result = transformEntryType(data)
      expect(result).to.deep.eq({ i18nKey: 'sample', text: 'Sample' })
    })

    it('should return TEST_TYPE.RESULT when test information is not empty', () => {
      const data = {
        resultCategory1i18nKey: 'resultCategoryResult',
        resultCategory1Label: 'Result',
        resultCategory1Name: 'Detected',
        resultCategory1Emphasize: 1,
        resultCategory1ValueI18nKey: 'ResultCategoryDetected',
      }
      const result = transformEntryType(data)
      expect(result).to.deep.eq({ i18nKey: 'testResult', text: 'Test Result' })
    })
  })

  describe('transformPatientDataBySchema', () => {
    it('transformPatientDataBySchema should transform patient data based on the provided schema', () => {
      const patientData = {
        name: 'John',
        age: 30,
        address: '123 Main St',
        phone: '555-555-5555',
      }
      const patientDataSchema = {
        name: { title: 'Name', order: 1 },
        age: { title: 'Age', order: 2 },
        address: { title: 'Address', order: 4 },
        phone: { title: 'Phone', order: 3 },
      }
      const expectedOutput = [
        { key: 'name', value: 'John', title: 'Name', order: 1 },
        { key: 'age', value: 30, title: 'Age', order: 2 },
        { key: 'phone', value: '555-555-5555', title: 'Phone', order: 3 },
        { key: 'address', value: '123 Main St', title: 'Address', order: 4 },
      ]
      expect(transformPatientDataBySchema(patientData, patientDataSchema)).to.deep.eq(expectedOutput)
    })
  })

  describe('transformResultText', () => {
    it('returns an empty object when resultData is null', () => {
      expect(transformResultText({ resultData: null })).to.deep.eq({})
    })

    it('returns a transformed object when resultData is valid JSON', () => {
      const data = {
        resultData:
          '{"probes": {"qc1": "YES", "qc2": "No", "qc1Ct": 1, "qc2Ct": 0.007, "probeA": "NEG", "probeB": "POS", "probeC": "NO RESULT", "probeD": "NEG", "probeE": "POS", "probeACt": 12.32, "probeBCt": 11.2, "probeCCt": 12.5, "probeDCt": 0.5, "probeECt": 1.2, "probeSpc": "NO RESULT", "qc1Endpt": 0.1234, "qc2Endpt": 1.22, "probeSpcCt": 5.78, "probeAEndpt": 1.6, "probeBEndpt": 2.33, "probeCEndpt": 457, "probeDEndpt": 12.43, "probeEEndpt": 3.14, "probeSpcEndpt": 8.9018}, "resultText": "MTB Detected|Rif Resistance Detected"}',
      }
      expect(transformResultText(data)).to.deep.eq({
        copies: null,
        log: null,
        resultText: 'MTB Detected|Rif Resistance Detected',
      })
    })
  })

  describe('transformTestInformation', () => {
    it('should return an empty array if given empty data', () => {
      const data = {}
      const result = transformTestInformation(data)
      expect(result).to.deep.eq([])
    })

    it('should return an empty array if all result category names are empty', () => {
      const data = {
        resultCategory1Name: '',
        resultCategory2Name: '',
      }
      const result = transformTestInformation(data)
      expect(result).to.deep.eq([])
    })

    it('should transform test information correctly for one result category', () => {
      const data = {
        resultCategory1i18nKey: 'category1_i18n',
        resultCategory1Label: 'Category 1',
        resultCategory1Name: 'Pass',
        resultCategory1Emphasize: true,
        resultCategory1ValueI18nKey: 'pass_i18n',
      }
      const result = transformTestInformation(data)
      expect(result).to.deep.eq([
        {
          label: 'Category 1',
          labelI18nKey: 'category1_i18n',
          value: 'Pass',
          valueI18nKey: 'pass_i18n',
          severity: 'danger',
        },
      ])
    })

    it('should transform test information correctly for two result categories', () => {
      const data = {
        resultCategory1i18nKey: 'category1_i18n',
        resultCategory1Label: 'Category 1',
        resultCategory1Name: 'Pass',
        resultCategory1Emphasize: true,
        resultCategory1ValueI18nKey: 'pass_i18n',
        resultCategory2i18nKey: 'category2_i18n',
        resultCategory2Label: 'Category 2',
        resultCategory2Name: 'Fail',
        resultCategory2Emphasize: false,
        resultCategory2ValueI18nKey: 'fail_i18n',
      }
      const result = transformTestInformation(data)
      expect(result).to.deep.eq([
        {
          label: 'Category 1',
          labelI18nKey: 'category1_i18n',
          value: 'Pass',
          valueI18nKey: 'pass_i18n',
          severity: 'danger',
        },
        {
          label: 'Category 2',
          labelI18nKey: 'category2_i18n',
          value: 'Fail',
          valueI18nKey: 'fail_i18n',
          severity: 'info',
        },
      ])
    })
  })

  describe('transformTreatmentStatus', function () {
    it('returns an object with expected properties when given valid input', function () {
      const changedOn = subDays(new Date(), 8).toISOString()
      const data = {
        resultTreatmentStatusChangedOn: changedOn,
        resultTreatmentStatusName: 'On Treatment',
        resultTreatmentStatusExternalId: '12345',
        resultTreatmentStatusI18nKey: 'OnTreatment',
        resultCategoryAssay1RequiresTreatment: 1,
        transferStatusLogData: JSON.stringify(null),
      }
      const followUps = [{ id: 1, followUpTypeExternalId: 'treatment', updatedOn: '2022-01-04' }]
      const result = transformTreatmentStatus(data, followUps)
      expect(result).to.deep.eq({
        changedOn,
        name: 'On Treatment',
        externalId: '12345',
        i18nKey: 'OnTreatment',
        visible: true,
        severity: 'success',
        daysInCurrentStatus: 8,
      })
    })
  })

  describe('generateSearchKeys', () => {
    it('correctly transform results', async () => {
      const result = generateSearchKeys(data2997, [])
      expect(result).to.deep.eq(expected2997)
    })
  })

  describe('transformSampleData', function () {
    it('returns a transformed sample data object when given valid input', function () {
      const data = {
        id: 1,
        sampleExternalId: 'SAMPLE01',
        sampleSiteId: 2,
        sampleSiteName: 'Sample Site',
        sampleSiteExternalId: 'sample_site',
        sampleTypeName: 'Sputum',
        sampleTypeI18nKey: 'sampleTypeSputum',
        sampleTypeExternalId: 'Sputum',
        sampleStatus: 'SAMPLE_RECEIVED_AT_LAB',
        sampleCollectedOn: '2023-04-21T07:34:00.000Z',
        sampleUpdatedOn: null,
      }
      const expectedOutput = {
        id: 1,
        externalId: 'SAMPLE01',
        originSite: { id: 2, name: 'Sample Site', externalId: 'sample_site' },
        sampleType: { name: 'Sputum', i18nKey: 'sampleTypeSputum', externalId: 'Sputum' },
        status: {
          id: 'SAMPLE_RECEIVED_AT_LAB',
          backgroundColor: 'info',
          label: 'Received',
          i18nKey: 'received_at_lab',
        },
        collectedOn: '2023-04-21T07:34:00.000Z',
        updatedOn: null,
      }
      const result = transformSampleData(data)
      expect(result).to.deep.eq(expectedOutput)
    })

    it('returns null when given null input', function () {
      const data = null
      const result = transformSampleData(data)
      expect(result).to.eq(null)
    })
  })

  describe('transFormResultResponse', () => {
    it('correctly transform results', async () => {
      const entry22 = transFormResultResponse([data22], [], [], 9)
      const entry477 = transFormResultResponse([data477], followUp477, [], 9)
      const entry5782 = transFormResultResponse([data5782], [], [], 9)
      expect(entry22).to.deep.eq(expected22)
      expect(entry477).to.deep.eq(expected477)
      expect(entry5782).to.deep.eq(expected5782)
    })
  })
})
