const supertest = require('supertest')
const chai = require('chai')
const { knex } = require('../../src/db')
const { getUtcTime } = require('../../src/shared/date')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { waitAsyncComplete } = require('../utils/generatorFunctionUtils')
const { deviceApiRawStatusToId } = require('../../src/shared/dictionary')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

describe('Device API Raw routes for Senaite LIMS', () => {
  const deviceApiRawPath = '/device/raw'
  const validApiKeyToken = randomToken()
  let senaiteLimsDeviceId
  before(async () => {
    const now = getUtcTime()
    const { id: userId } = await knex('User').first('id')
    const senaiteLimsDeviceType = await knex
      .from('DeviceType')
      .where('externalId', 'SenaiteLims')
      .first()
    const partner = await knex
      .from('Partner')
      .where('name', 'Partner One')
      .first()
    const geography = await knex
      .from('Country as c')
      .join('Geography as g', 'g.countryId', 'c.id')
      .where('c.abbreviation', 'US')
      .andWhere('g.stateId', null)
      .andWhere('g.lgaId', null)
      .first('g.*')
    const approvedDeviceStatus = await knex
      .from('DeviceStatus')
      .where('token', 'approved')
      .first()
    const deviceCapacity = await knex('DeviceCapacity')
      .where({ deviceTypeId: senaiteLimsDeviceType.id })
      .where({ partnerId: partner.id })
      .where({ defaultForDeviceType: 1 })
      .first('id')
    ;[senaiteLimsDeviceId] = await knex('Device').insert({
      partnerId: partner.id,
      geographyId: geography.id,
      deviceTypeId: senaiteLimsDeviceType.id,
      deviceCapacityId: deviceCapacity ? deviceCapacity.id : null,
      deviceStatusId: approvedDeviceStatus.id,
      name: 'Some Senaite LIMS',
      shortName: 'Senaite LIMS',
      configurationData: '{}',
      putInService: now,
      lastSeenOn: now,
      createdOn: now,
      updatedOn: now,
    })
    await knex('DeviceApiKey').insert({
      token: validApiKeyToken,
      deviceId: senaiteLimsDeviceId,
      revoked: false,
      createdOn: now,
      createdBy: userId,
      updatedOn: now,
      updatedBy: userId,
    })
  })

  after(async () => {
    await waitAsyncComplete()
    const { id: deviceApiKeyId, deviceId, siteId } = await knex(
      'DeviceApiKey as dak'
    )
      .leftJoin('Device as d', 'dak.deviceId', 'd.id')
      .where('dak.token', validApiKeyToken)
      .first('dak.id', 'dak.deviceId', 'd.siteId')
    const resultIds = await knex('Result')
      .where('deviceId', deviceId)
      .pluck('id')
      .union(function() {
        this.from('ResultGeneratedResult as rgr')
          .innerJoin('Result as r', 'rgr.sourceResultId', 'r.id')
          .where('r.deviceId', deviceId)
          .pluck('generatedResultId as id')
      })
    const opIds = await knex('DeviceOperation')
      .where('deviceId', deviceId)
      .map(op => op.id)
    const issueIds = await knex('Issue')
      .where('deviceId', deviceId)
      .pluck('id')
    await knex('DeviceStatusLog')
      .where('deviceId', deviceId)
      .delete()
    await knex('DeviceLog')
      .where('deviceId', deviceId)
      .orWhereIn('resultId', resultIds)
      .delete()
    await knex('DeviceOperation')
      .whereIn('id', opIds)
      .delete()
    await knex('FactDeviceFlag')
      .where('deviceId', deviceId)
      .delete()
    await knex('DeviceSiteHistory')
      .where('deviceId', deviceId)
      .delete()
    await knex('FactResultsDevice')
      .where('deviceId', deviceId)
      .delete()
    await knex('FactResultsDeviceByAssay')
      .where('deviceId', deviceId)
      .delete()
    await knex('FactResultsDeviceByCategory1')
      .where('deviceId', deviceId)
      .delete()
    await knex('FactResultsDeviceByCategory1And2')
      .where('deviceId', deviceId)
      .delete()
    await knex('DeviceApiRaw')
      .where({ deviceApiKeyId })
      .delete()
    await knex('DeviceApiKey')
      .where('token', validApiKeyToken)
      .orWhere('deviceId', deviceId)
      .delete()
    await knex('Device')
      .where('id', deviceId)
      .delete()
    const inventoryItemIds = await knex('InventoryItem as ii')
      .where('ii.siteId', siteId)
      .distinct('ii.id')
      .pluck('ii.id')
    await knex('InventoryLog')
      .whereIn('inventoryItemId', inventoryItemIds)
      .delete()
    await knex('InventoryItem')
      .whereIn('id', inventoryItemIds)
      .delete()
    await knex('IssueEvent')
      .whereIn('issueId', issueIds)
      .orWhere(function() {
        if (resultIds != null && resultIds.length > 0) {
          this.whereRaw(
            `JSON_EXTRACT(data, "$.resultId") IN (${resultIds.join(',')})`
          )
        }
      })
      .delete()
    await knex('InventoryLog')
      .whereIn('resultId', resultIds)
      .delete()
    await knex('ResultQualityControlLog')
      .whereIn('resultId', resultIds)
      .delete()
    await knex('ResultWorkflowLog')
      .whereIn('resultId', resultIds)
      .delete()
    await knex('ResultGeneratedResult')
      .whereIn('sourceResultId', resultIds)
      .orWhereIn('generatedResultId', resultIds)
      .delete()
    await knex('ResultTag')
      .whereIn('sourceResultId', resultIds)
      .delete()
    await knex('Result')
      .whereIn('id', resultIds)
      .delete()
    await knex('Sample')
      .where('originSiteId', siteId)
      .delete()
    await knex('Site')
      .where('id', siteId)
      .delete()
  })

  it('should save the request in DeviceApiRaw and respond with the record ID', async () => {
    const payload = {
      AdHoc: false,
      Analyses: [],
      AnalysisServicesSettings: [],
      Attachment: [],
      Batch: null,
      BatchID: '',
      BatchURL: '',
      CCContact: [],
      CCEmails: '',
      ChildAnalysisRequest: null,
      Client: 'Mashame Rural Health Centre',
      ClientOrderNumber: '',
      ClientPatientID: '9ad22c9388fc4dd9a79d72aaf4dc4795',
      ClientReference: '',
      ClientSampleID: 'PETER  MURIMA',
      ClientTitle: 'Mashame Rural Health Centre',
      ClientUID: 'df486b928b1e48e7bfe023f4a5dd6d47',
      ClientURL: '/clients/client17-396',
      Client_uid: 'df486b928b1e48e7bfe023f4a5dd6d47',
      Composite: false,
      Contact: '<Contact at contact-799>',
      ContactEmail: '',
      ContactFullName: 'Sister in charge Gokwe North',
      ContactUID: '0f045f3ad9dd4862a2d2b10955645372',
      ContactUsername: '',
      Creator: 'zhekit',
      CreatorEmail: 'zhekit@nmrl.org.zw',
      CreatorFullName: 'zhekit',
      DatePublished: null,
      DatePublishedViewer: '',
      DateReceived: '2018/11/01 12:49:2.808860 GMT+2',
      DateSampled: '2018/09/20 00:00:00 GMT+0',
      DefaultContainerType: null,
      Digest: '',
      Doctor: null,
      EnvironmentalConditions: '',
      Invoice: null,
      InvoiceExclude: false,
      Invoiced: false,
      MemberDiscount: '0.00',
      PanicEmailAlertToClientSent: false,
      ParentAnalysisRequest: null,
      Patient: 'PETER  MURIMA',
      Patient_uid: '9ad22c9388fc4dd9a79d72aaf4dc4795',
      PreparationWorkflow: '',
      Printed: '',
      Priority: '3',
      Profile: null,
      Profiles: ['Viral Load DBS'],
      ProfilesTitle: ['Viral Load DBS'],
      ProfilesTitleStr: 'Viral Load DBS',
      ProfilesUID: ['83da9086598a4fefa46b3f307a979cb4'],
      ProfilesURL: ['/bika_setup/bika_analysisprofiles/analysisprofile-7'],
      Profiles_uid: ['83da9086598a4fefa46b3f307a979cb4'],
      PublicationSpecification: null,
      ReceivedBy: 'zhekit',
      RejectionReasons: [],
      Remarks: '',
      ResultsInterpretation: '',
      ResultsInterpretationDepts: [],
      ResultsRange: [
        {
          keyword: 'dysenteriaeType7',
          max: '',
          min: '',
          uid: '33bf09e5aa4442e2897dd5d1ce45a485',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'PolyC3',
          max: '',
          min: '',
          uid: 'fa2d49d444ec4794a7e6d9c646794e47',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Isoniazid',
          max: '',
          min: '',
          uid: '707928a7a57944baab902885b4d334f6',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Indole',
          max: '',
          min: '',
          uid: 'e3205904010a417b9378b596f501c1d6',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'RHE1',
          max: '',
          min: '',
          uid: 'd8d1e7f62457418ba366121311fb8322',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'BloodAgar',
          max: '',
          min: '',
          uid: 'a85f52695bb440f0a71a2ab9391c5695',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'RHE3',
          max: '',
          min: '',
          uid: '047865070492433594774c728d3a12ab',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'RHE2',
          max: '',
          min: '',
          uid: '7030d20d26af4864a4bd5a1e0ef23a45',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'RHE5',
          max: '',
          min: '',
          uid: '98ffabc5a69241f68a9a6ec2dac08820',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'RHE4',
          max: '',
          min: '',
          uid: '8cd907dedf1d4b25907ab3cb13430474',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'RHE7',
          max: '',
          min: '',
          uid: '1f4b3987c0e245809e124c165d48863e',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'RHE6',
          max: '',
          min: '',
          uid: '9611848665a8444296dc19ce7d218fc3',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'MGITGrowthControl',
          max: '',
          min: '',
          uid: 'b6bc96b7dc0946088b8fad2262412695',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Ethambutol',
          max: '',
          min: '',
          uid: '2de6011a1d8f40a199e6cedcfe3e0557',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'AmpicilinDiameter',
          max: '',
          min: '',
          uid: '4c4ddef4ae6d42d69bf5ac9146c61eb0',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Motility',
          max: '',
          min: '',
          uid: 'e7a161e0e497418384ecd1e52bcabe60',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'EasyQdirector',
          max: '',
          min: '',
          uid: '6d405c68e93743bab9588d0621637c45',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Rifambicin',
          max: '',
          min: '',
          uid: 'a122164169944a96b63ffa6d3bb3370a',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'HIV06ml',
          max: '',
          min: '',
          uid: 'ab91ec2f3202449b8e8f7f6b1398c58b',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'MGITRESULT',
          max: '',
          min: '',
          uid: '37497dacd4ea408aaf95f8b1404fd3f7',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'MicroscopyPosCulture',
          max: '',
          min: '',
          uid: 'f78a9237269a4d9b904404519bc2b6a5',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Abbott',
          max: '',
          min: '',
          uid: '5ac69b08e46041cda2311b65b81fee87',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'FlexneriType5',
          max: '',
          min: '',
          uid: '7ea35330f14e45a796771f3f13b4bc67',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'PolyvalentBType1',
          max: '',
          min: '',
          uid: '1868a9f758c7484194681684f16e3c26',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'BactCulture',
          max: '',
          min: '',
          uid: 'e5b2a42f3288454ebe3451f0a09e983d',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'ShigellaBoydii',
          max: '',
          min: '',
          uid: 'b87d7c2c2ba34942b50b9f5e98288904',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'FlexneriTypeX',
          max: '',
          min: '',
          uid: 'd9b3de173cbf4e3193d3f7dd33c8f4d4',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'FlexneriTypeY',
          max: '',
          min: '',
          uid: 'd0523c89998b4b18962bd60aeeb90c6b',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'PolyC2',
          max: '',
          min: '',
          uid: '4a21360d99654eabba8db3cc7f7c9e2d',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'BactSmearMicrocopy',
          max: '',
          min: '',
          uid: 'd3f9de0872084a50b26f97b9f9f6eb43',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Oxidase',
          max: '',
          min: '',
          uid: '5b9b5e7b8ddd4b488e48604ef14fa6ec',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'dysenteriaeType5',
          max: '',
          min: '',
          uid: '561cb50e8fe2497aafe734323f34eea8',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Injectables',
          max: '',
          min: '',
          uid: 'd2ffd77f2220425cb4277991673e4ce0',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Phase2',
          max: '',
          min: '',
          uid: 'c12c329720374abea5c53312b6455e7f',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'ClinicalNotes',
          max: '',
          min: '',
          uid: 'e1b560ff8b4d44feb8c148f6ffb97d6a',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Ampicilin',
          max: '',
          min: '',
          uid: '9ee75bf9954c417badc514f0a62a75ed',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Fluoroquinolones',
          max: '',
          min: '',
          uid: '363c168f228a419494bb97d18c35d83d',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'SampleVolume',
          max: '',
          min: '',
          uid: 'f06f0c6f05834ac4b088e440c481b4dc',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'LineProbeAssay2',
          max: '',
          min: '',
          uid: '70cb484482224ed9824c5ac9f9bc3362',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'GeneXpert',
          max: '',
          min: '',
          uid: '6c967828e9e94614911434ea351021e6',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'SDBioline',
          max: '',
          min: '',
          uid: '6b4e856e46754d5bb74950642e5cb589',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'EasyqDirector',
          max: '',
          min: '',
          uid: 'd93d07e2f9f5468b9571bc3389e4ac40',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'FlexneriType6',
          max: '',
          min: '',
          uid: '49d8e3e4a12b4b9e864cbdfd6297bf55',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'MonovalentO9',
          max: '',
          min: '',
          uid: 'ed4459a182bc47ef88337026a21f7497',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'FlexneriType4',
          max: '',
          min: '',
          uid: '64e4b10e581443b5adb8f624fd4cff7f',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Streptomycin',
          max: '',
          min: '',
          uid: '8b7e4b6c661c4864ad785efbe0e25a61',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'FlexneriType2',
          max: '',
          min: '',
          uid: '6a61bb52c9f24bc8ab312d4570cc7683',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Citrate',
          max: '',
          min: '',
          uid: 'd8b63216496a4608935f3839477be113',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'dysenteriaeType2',
          max: '',
          min: '',
          uid: '34af411adf1441309985c10c0343c45c',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Polyc1',
          max: '',
          min: '',
          uid: '82446ed0765f458f9b4cfd205fc2cc26',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'dysenteriaeType6',
          max: '',
          min: '',
          uid: '1b3db9f659bf4413b306583094dc655a',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'SalmonelaPolyH',
          max: '',
          min: '',
          uid: 'a06102a1b205454ca46f32e0b0e38fb7',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'dysenteriaeType4',
          max: '',
          min: '',
          uid: 'c15e7a0d2a4d4ea2b3c79ab2cd3fc923',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'dysenteriaeType3',
          max: '',
          min: '',
          uid: 'dfe1274792394b029b6284cf963cb723',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'SalmonelaPolyO',
          max: '',
          min: '',
          uid: '77b128577259450f82eb1f50913bdd5d',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'dysenteriaeType1',
          max: '',
          min: '',
          uid: '044dca9469a04fa1847ef59081f987c6',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'TBCulture',
          max: '',
          min: '',
          uid: '8efc879a62534eca87f189334ff57edb',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'LineProbeAssay',
          max: '',
          min: '',
          uid: '3fabb2d9f73e46548bc000942852dbcb',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'Cipro',
          max: '',
          min: '',
          uid: '42c43daaabd240c682ca615441e5094c',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'TBIntepretation',
          max: '',
          min: '',
          uid: '336a73af8ec744ddb92bf5ddc08a5653',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'flexneriType3',
          max: '',
          min: '',
          uid: '1f0834863de347d99d237b46e49fd868',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'CiproDiameter',
          max: '',
          min: '',
          uid: '4b621c9f68ed49e9a0dc503484db5b4c',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'ShigellaSonnei',
          max: '',
          min: '',
          uid: '767c8c52fbc642e9a657c1fad1399238',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'SmearMicroscopy',
          max: '',
          min: '',
          uid: '1cc10f8290a248198e768dc4aaaee28c',
          warn_max: '',
          warn_min: '',
        },
        {
          keyword: 'SampleAppearance',
          max: '',
          min: '',
          uid: '266c45a39c5041feb8728677d4e0359b',
          warn_max: '',
          warn_min: '',
        },
      ],
      Sample: '<Sample at AS18-02004>',
      SampleCondition: null,
      SampleID: 'AS18-02004',
      SamplePoint: null,
      SamplePointTitle: '',
      SamplePointUID: '',
      SampleType: '<SampleType at sampletype-15>',
      SampleTypeTitle: 'ASPIRATE',
      SampleTypeUID: '15ff9902f57043e8be5b501f93e1ee0c',
      SampleUID: '6e2480e76ecf425bb6caed5bd6946342',
      SampleURL: '/clients/client17-396/AS18-02004',
      Sampler: '',
      SamplerEmail: 'zhekit@nmrl.org.zw',
      SamplerFullName: '',
      SamplingDate: null,
      SamplingDeviation: null,
      SamplingRound: null,
      SamplingRoundUID: '',
      ScheduledSamplingSampler: '',
      Specification: null,
      StorageLocation: null,
      StorageLocationUID: '',
      SubGroup: null,
      Template: null,
      TemplateTitle: '',
      TemplateUID: '',
      TemplateURL: '',
      UID: '9f8f236c11344838b4a17ed4e41f122c',
      allowDiscussion: null,
      allowedRolesAndUsers: [
        'LabManager',
        'Publisher',
        'Preserver',
        'SamplingCoordinator',
        'user:zhekit',
        'Verifier',
        'Manager',
        'Client',
        'LabClerk',
        'Sampler',
        'user:admin',
        'Analyst',
        'RegulatoryInspector',
      ],
      assigned_state: 'unassigned',
      contributors: [],
      creation_date: '2018/11/01 12:48:59.605354 GMT+2',
      creators: ['zhekit'],
      description: '',
      effectiveDate: null,
      expirationDate: null,
      getBatchUID: null,
      getClientSampleID: 'PETER  MURIMA',
      getClientTitle: 'Mashame Rural Health Centre',
      getClientUID: 'df486b928b1e48e7bfe023f4a5dd6d47',
      getDatePublished: null,
      getDateVerified: null,
      getDepartmentUIDs: ['9ca57f79f27d4925a5fb2d4750784c11'],
      getDistrict: 'Gokwe North',
      getDoctorTitle: '',
      getDoctorUID: '',
      getId: 'AS18-02004-R01',
      getPatientID: 'P18-58190',
      getPatientTitle: 'PETER  MURIMA',
      getPatientUID: '9ad22c9388fc4dd9a79d72aaf4dc4795',
      getPrinted: '0',
      getPrioritySortkey: '3.2018-11-01T12:48:59+02:00',
      getProvince: 'Midlands Province',
      getSampleID: 'AS18-02004',
      getSampleUID: '6e2480e76ecf425bb6caed5bd6946342',
      getSampler: '',
      getSamplingDate: null,
      id: 'AS18-02004-R01',
      language: 'en',
      location: '',
      modification_date: '2018/11/12 10:13:26.564489 GMT+2',
      path: '/senaite/clients/client17-396/AS18-02004-R01',
      portal_type: 'AnalysisRequest',
      review_state: 'sample_received',
      rights: '',
      subject: [],
      title: '',
      transitions: [
        {
          id: 'reinstate',
          title: 'reinstate_transition_title',
        },
        {
          id: 'reject',
          title: 'reject_transition_title',
        },
      ],
    }
    const response = await server
      .post(deviceApiRawPath)
      .set('Authorization', `Bearer ${validApiKeyToken}`)
      .send(payload)
    assert.equal(response.statusCode, 200)
    const deviceApiRawRecord = await knex('DeviceApiRaw')
      .where({ id: response.body })
      .first()
    expect(JSON.parse(deviceApiRawRecord.rawData).payload).to.deep.equal(
      payload
    )
  })

  it('should process the request data using the correct data processor', async () => {
    const payload = 'Some unexpected payload'
    const response = await server
      .post(deviceApiRawPath)
      .set('Authorization', `Bearer ${validApiKeyToken}`)
      .set('Content-type', 'text/plain')
      .send(payload)
    assert.equal(response.statusCode, 200)
    const deviceApiRawRecord = await knex('DeviceApiRaw')
      .where({ id: response.body })
      .first()
    assert.equal(deviceApiRawRecord.dataProcessor, 'DefaultSenaiteLIMS')
    const processedStatusId = await deviceApiRawStatusToId('Processed')
    expect(deviceApiRawRecord.deviceApiRawStatusId).to.equal(processedStatusId)
  })
})
