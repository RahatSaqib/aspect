const { expect } = require('chai')
const { subDays, differenceInDays } = require('date-fns')
const {
  data347,
  expected347,
  data450,
  data558,
  followUp558,
  expected450,
  followUp450,
  searchKeys450,
  xdrTestData,
  xdrExpectedResult,
} = require('./data')
const { TRANSFERRED, FOLLOW_UP_TYPES } = require('../../../../src/mobileApi/entries/common/consts')
const { extractFromDataById } = require('../../../../src/mobileApi/entries/result/common/helpers/extractFromDataById')
const { buildHistoryTimeline } = require('../../../../src/mobileApi/entries/result/common/helpers/buildHistoryTimeline')
const { generateSeverity } = require('../../../../src/mobileApi/entries/result/common/helpers/generateSeverity')
const { getFollowUpByType } = require('../../../../src/mobileApi/entries/result/common/helpers/getFollowUpByType')
const { transformAssayAvatar } = require('../../../../src/mobileApi/entries/result/common/helpers/transformAssayAvatar')
const { transformEntryType } = require('../../../../src/mobileApi/entries/result/common/helpers/transformEntryType')
const { generateSearchKeys } = require('../../../../src/mobileApi/entries/result/common/helpers/generateSearchKeys')
const { transformSampleData } = require('../../../../src/mobileApi/entries/result/common/helpers/transformSample')
const {
  transformTreatmentStatus,
} = require('../../../../src/mobileApi/entries/result/common/helpers/transformTreatmentStatus')
const {
  transformResultResponse,
} = require('../../../../src/mobileApi/entries/result/common/helpers/transformResultResponse')
const {
  transformTestInformation,
} = require('../../../../src/mobileApi/entries/result/common/helpers/transformTestInformation')
const {
  transformPatientDataBySchema,
} = require('../../../../src/mobileApi/entries/result/common/helpers/transformPatientDataBySchema')
const {
  transformClinicalResponse,
} = require('../../../../src/mobileApi/entries/result/common/helpers/transformClinicalResponse')
const {
  generateTransferStatus,
} = require('../../../../src/mobileApi/entries/result/common/helpers/generateTransferStatus')
const {
  getResultUpdatedOnDate,
} = require('../../../../src/mobileApi/entries/result/common/helpers/getTrueUpdatedOnDates')

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
    it('should build a correct timeline', async () => {
      const data = {
        id: 123,
        sampleCollectedOn: '2023-05-01T00:00:00Z',
        sampleSiteName: 'Lab1',
        resultSampleId: 456,
        sampleTypeExternalId: 'SampleType1',
        laboratorySiteName: 'ReportLab1',
        reportableSiteName: 'ReportClinic1',
        testDate: '2023-05-02T00:00:00Z',
        transferredBy: 'testuser',
        transferredOn: '2023-05-02T00:00:00Z',
        sampleClinicianName: 'test clinician',
        sampleExternalId: '123',
        patientData: '{"id": "PATIENT-1"}',
        transferSiteName: 'TransferClinic',
        transferOriginSiteName: 'originSiteClinic',
        transferComment: 'test comment',
        transferPreviousReportableSiteId: 261,
        transferReportableSiteId: 436,
        transferSiteId: 261,
      }

      const followUps = [
        {
          id: 789,
          resultId: 123,
          followUpName: 'FollowUp1',
          date: '2023-05-03T00:00:00Z',
          followUpTypeName: 'sample follow up type',
          clinicianName: 'test clinician',
        },
      ]

      const expectedOutput = [
        {
          id: 789,
          resultId: 123,
          event: 'followUpCreated',
          name: 'FollowUp1',
          siteName: 'ReportClinic1',
          type: 'sample follow up type',
          updatedOn: '2023-05-03T00:00:00Z',
          clinicianName: 'test clinician',
          reason: undefined,
        },
        {
          id: 123,
          resultId: 123,
          event: 'transferEvent',
          name: 'Transferred Away',
          siteName: 'TransferClinic',
          updatedOn: '2023-05-02T00:00:00Z',
          comment: 'test comment',
          transferredBy: 'testuser',
          originSiteName: 'originSiteClinic',
        },
        {
          id: 456,
          resultId: 123,
          event: 'sampleTested',
          name: 'SampleType1',
          siteName: 'ReportLab1',
          updatedOn: '2023-05-02T00:00:00Z',
          patientId: 'PATIENT-1',
          sampleId: '123',
        },
        {
          id: 456,
          resultId: 123,
          event: 'sampleCollected',
          name: 'SampleType1',
          siteName: 'Lab1',
          updatedOn: '2023-05-01T00:00:00Z',
          clinicianName: 'test clinician',
          sampleId: '123',
        },
      ]

      const result = await buildHistoryTimeline(data, followUps)
      expect(result).to.deep.eq(expectedOutput)
    })

    it('should handle null/undefined values correctly', async () => {
      const data = { id: 123 }
      const followUps = []
      const expectedOutput = []

      const result = await buildHistoryTimeline(data, followUps)
      expect(result).to.eql(expectedOutput)
    })
  })

  describe('getResultUpdatedOnDate', () => {
    const data = {
      updatedOn: '2022-01-01',
      sampleCollectedOn: '2022-01-05',
    }

    it('returns correct date for the provided input data', () => {
      const followUps = [{ updatedOn: '2022-01-03' }, { updatedOn: '2022-01-06' }]
      const result = getResultUpdatedOnDate(data, followUps)
      expect(result).to.eq('2022-01-06')
    })

    it('returns correct date if no followUps are provided', () => {
      const followUps = []
      const result = getResultUpdatedOnDate(data, followUps)
      expect(result).to.eq('2022-01-05')
    })
  })

  describe('generateSeverity', () => {
    it('should return "info" if daysDiff is less than or equal to 16', () => {
      const data = { testDate: subDays(new Date(), 10) }
      const followUps = []
      const result = generateSeverity(data, followUps)
      expect(result).to.eq('info')
    })
    it('should return "success" if on treatment', () => {
      const data = { testDate: '2022-01-01' }
      const followUps = [{ id: 1, followUpTypeExternalId: 'treatment', updatedOn: '2022-01-04' }]
      const result = generateSeverity(data, followUps)
      expect(result).to.eq('success')
    })

    it('should return "warning" if daysDiff is greater than 16', () => {
      const data = { testDate: subDays(new Date(), 18) }
      const followUps = []
      const result = generateSeverity(data, followUps)
      expect(result).to.eq('warning')
    })

    it('should return "danger" if daysDiff is greater than 32', () => {
      const data = { testDate: subDays(new Date(), 34) }
      const followUps = []
      const result = generateSeverity(data, followUps)
      expect(result).to.eq('danger')
    })
  })

  describe('generateTransferStatus', () => {
    it('should generate the correct transfer data.transferStatusLogData is nil', () => {
      const data = {}
      const result = generateTransferStatus(data)
      expect(result.canBeTransferred).to.eq(true)
    })

    it('should generate TRANSFERRED.AWAY when siteId equals previousReportableSiteId and not reportableSiteId', () => {
      const data = {
        id: 123,
        transferredBy: 'user1',
        transferredOn: '2023-01-01T00:00:00Z',
        reportableSiteExternalId: 'SiteId1',
        reportableSiteName: 'SiteName1',
        transferPreviousReportableSiteId: 1,
        transferReportableSiteId: 2,
        transferSiteId: 1,
      }

      const expectedOutput = {
        canBeTransferred: false,
        previousReportableSiteId: 1,
        reportableSiteId: 2,
        resultId: 123,
        siteId: 1,
        comment: undefined,
        siteExternalId: 'SiteId1',
        siteName: 'SiteName1',
        transferStatus: TRANSFERRED.AWAY,
        transferredBy: 'user1',
        transferredOn: '2023-01-01T00:00:00Z',
      }

      const result = generateTransferStatus(data)
      expect(result).to.eql(expectedOutput)
    })

    it('should generate TRANSFERRED.HERE when siteId equals reportableSiteId and not previousReportableSiteId', () => {
      const labSiteId = 1
      const initialClinicSiteId = 2
      const transferToClinicSiteId = 3
      const userSiteIds = [labSiteId, initialClinicSiteId, transferToClinicSiteId]
      const data = {
        id: 123,
        transferredBy: 'user1',
        transferredOn: '2023-01-01T00:00:00Z',
        reportableSiteExternalId: 'SiteId1',
        reportableSiteName: 'SiteName1',
        transferPreviousReportableSiteId: initialClinicSiteId,
        transferReportableSiteId: transferToClinicSiteId,
        transferSiteId: labSiteId,
      }

      const expectedOutput = {
        canBeTransferred: true,
        previousReportableSiteId: initialClinicSiteId,
        reportableSiteId: transferToClinicSiteId,
        resultId: 123,
        siteId: initialClinicSiteId,
        comment: undefined,
        siteExternalId: 'SiteId1',
        siteName: 'SiteName1',
        transferStatus: TRANSFERRED.HERE,
        transferredBy: 'user1',
        transferredOn: '2023-01-01T00:00:00Z',
      }

      const result = generateTransferStatus(data, userSiteIds)
      expect(result).to.eql(expectedOutput)
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
    it('should transform clinical response correctly when the treatment and outcome are present', () => {
      const data = {
        id: 123,
      }

      const followUps = [
        {
          type: FOLLOW_UP_TYPES.TREATMENT,
          followUpTypeExternalId: 'treatment',
          updatedOn: '2023-02-01T00:00:00Z',
        },
        {
          type: FOLLOW_UP_TYPES.OUTCOME,
          followUpTypeExternalId: 'outcome',
          updatedOn: '2023-03-01T00:00:00Z',
        },
      ]

      const expectedOutput = {
        resultId: 123,
        outcomeOccurred: '2023-03-01T00:00:00Z',
        treatmentStarted: '2023-02-01T00:00:00Z',
        recorded: false,
      }
      const acknowledgement = {
        resultId: 123,
        acknowledgedOn: '2023-01-01T00:00:00Z',
      }
      const result = transformClinicalResponse(data, followUps, acknowledgement)
      expect(result).to.eql(expectedOutput)
    })

    it('should return object when result treatment and outcome are not present', () => {
      const data = {
        id: 123,
      }

      const followUps = []

      const expectedOutput = {
        resultId: 123,
        recorded: false,
      }

      const result = transformClinicalResponse(data, followUps)
      expect(result).to.eql(expectedOutput)
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
        id: 123,
        resultCategory1i18nKey: 'key1',
        resultCategory1Label: 'label1',
        resultCategory1Name: 'name1',
        resultCategory1Emphasize: true,
        resultCategory1ValueI18nKey: 'valueKey1',
      }

      const expectedOutput = [
        {
          resultId: 123,
          label: 'label1',
          labelI18nKey: 'key1',
          value: 'name1',
          valueI18nKey: 'valueKey1',
          severity: 'danger',
        },
      ]

      const result = transformTestInformation(data)
      expect(result).to.eql(expectedOutput)
    })

    it('should transform test information correctly for two result categories', () => {
      const data = {
        id: 123,
        resultCategory1i18nKey: 'key1',
        resultCategory1Label: 'label1',
        resultCategory1Name: 'name1',
        resultCategory1Emphasize: true,
        resultCategory1ValueI18nKey: 'valueKey1',
        resultCategory2i18nKey: 'key2',
        resultCategory2Label: 'label2',
        resultCategory2Name: 'name2',
        resultCategory2Emphasize: false,
        resultCategory2ValueI18nKey: 'valueKey2',
      }

      const expectedOutput = [
        {
          resultId: 123,
          label: 'label1',
          labelI18nKey: 'key1',
          value: 'name1',
          valueI18nKey: 'valueKey1',
          severity: 'danger',
        },
        {
          resultId: 123,
          label: 'label2',
          labelI18nKey: 'key2',
          value: 'name2',
          valueI18nKey: 'valueKey2',
          severity: 'info',
        },
      ]

      const result = transformTestInformation(data)
      expect(result).to.eql(expectedOutput)
    })
  })

  describe('transformTreatmentStatus', () => {
    it('should transform treatment status correctly', () => {
      const changedOn = '2023-05-10T19:25:56.000Z'
      const expectedOutput = {
        changedOn,
        resultId: 558,
        name: 'On Treatment',
        externalId: 'OnTreatment',
        i18nKey: 'ResultTreatmentStatusOnTreatment',
        visible: true,
        severity: 'success',
        daysInCurrentStatus: differenceInDays(new Date(), new Date(changedOn)),
      }

      const result = transformTreatmentStatus(data558, followUp558)
      expect(result).to.deep.equal(expectedOutput)
    })
  })

  describe('generateSearchKeys', () => {
    it('correctly transform results', async () => {
      const result = generateSearchKeys(data450, '84-687-3493')
      expect(result).to.deep.eq(searchKeys450)
    })
  })

  describe('transformSampleData', () => {
    it('returns a transformed sample data object when given valid input', () => {
      const data = {
        id: 1,
        sampleId: 2,
        sampleExternalId: 'SAMPLE01',
        sampleSiteId: 2,
        sampleSiteName: 'Sample Site',
        sampleSiteStateName: 'Sample State',
        sampleSiteExternalId: 'sample_site',
        sampleTypeName: 'Sputum',
        sampleTypeI18nKey: 'sampleTypeSputum',
        sampleTypeExternalId: 'Sputum',
        sampleStatus: 'SAMPLE_RECEIVED_AT_LAB',
        sampleCollectedOn: '2023-04-21T07:34:00.000Z',
        sampleUpdatedOn: null,
      }
      const expectedOutput = {
        id: 2,
        externalId: 'SAMPLE01',
        originSite: { id: 2, name: 'Sample Site', externalId: 'sample_site', stateName: 'Sample State' },
        sampleType: { name: 'Sputum', i18nKey: 'sampleTypeSputum', externalId: 'Sputum' },
        status: {
          id: 'SAMPLE_RECEIVED_AT_LAB',
          backgroundColor: 'info',
          label: 'Received',
          i18nKey: 'received_at_lab',
        },
        clinicianName: null,
        collectedOn: '2023-04-21T07:34:00.000Z',
        updatedOn: null,
      }
      const result = transformSampleData(data)
      expect(result).to.deep.eq(expectedOutput)
    })

    it('returns null when given null input', () => {
      const data = null
      const result = transformSampleData(data)
      expect(result).to.eq(null)
    })
  })

  describe('transformResultResponse', () => {
    it('correctly transform results', async () => {
      const entry347 = transformResultResponse([data347], [])
      const entry450 = transformResultResponse([data450], followUp450)
      const xdrEntry = transformResultResponse([xdrTestData], [])

      expect(entry347).to.deep.eq(expected347)
      expect(entry450).to.deep.eq(expected450)

      expect(xdrEntry).to.deep.eq(xdrExpectedResult)
    })

    it('should return requiresFollowUp for followUpStatus', async () => {
      const requiresFollowUpEntry = transformResultResponse(
        [{ ...data347, resultCategoryAssay1RequiresTreatment: 1 }],
        []
      )

      const clonedExpected = expected347[0]
      const requiresFollowUpExpectedResult = {
        ...clonedExpected,
        requiresFollowUp: true,
        resultRequiresTreatment: true,
        searchSchema: {
          ...clonedExpected.searchSchema,
          filterMeta: {
            ...clonedExpected.searchSchema.filterMeta,
            followUpStatus: 'requiresFollowUp',
            requiresFollowUp: true,
          },
        },
      }
      expect(requiresFollowUpEntry).to.deep.eq([requiresFollowUpExpectedResult])
    })

    it('should return noFollowUpPossible for followUpStatus', async () => {
      const noFollowUpPossibleEntry = transformResultResponse(
        [{ ...data347, resultTreatmentStatusExternalId: 'NotPossible' }],
        []
      )

      const clonedExpected = expected347[0]
      const noFollowUpPossibleEntryExpectedResult = {
        ...clonedExpected,
        noFollowUpPossible: true,
        searchSchema: {
          ...clonedExpected.searchSchema,
          filterMeta: {
            ...clonedExpected.searchSchema.filterMeta,
            followUpStatus: 'noFollowUpPossible',
            treatmentStatus: 'NotPossible',
            hasFollowUp: false,
            noFollowUpPossible: true,
            requiresFollowUp: false,
          },
        },
        treatmentStatus: {
          ...clonedExpected.treatmentStatus,
          externalId: 'NotPossible',
        },
      }
      expect(noFollowUpPossibleEntry).to.deep.eq([noFollowUpPossibleEntryExpectedResult])
    })
  })
})
