const chai = require('chai')
const Promise = require('bluebird')
const _ = require('lodash')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const { parseDateOrDefault, dateEqual } = require('../../src/shared/date')

const { assert, expect } = chai

describe('Device API Raw Philippines NTRL PMDT Record Data Processor', () => {
  describe('canProcessRequest', () => {
    it('Should be able to recognise a PMDT database record', async () => {
      const PhilippinesNTRLPMDTDataProcessor = require('../../src/deviceApiRaw/dataProcessors/philippinesNtrlPmdt')
      assert.isOk(
        await PhilippinesNTRLPMDTDataProcessor.canProcessRequest({
          payload: {
            database: 'PMDT',
            table: 'NTRL DATABASE',
            TimeStamp: '458014',
            'Serial Number': '00004',
            'Last Name': 'OMELA',
            'First Name': 'Mary Ann',
            'Middle Initial': 'Valle',
            Address: 'Rizal',
            'Referring Health Facility': 'BJMP 4A Regional Infirmary TB DOT',
            'Culture Center': 'NTRL',
            'Cat IV Screening Code': null,
            'MRF Date Requested': '2019-01-02T00:00:00.000Z',
            Age: 41,
            Sex: 'Female',
            'DST Center': 'NTRL',
            'Requesting Physician': 'Dr. Chua',
            'Treatment Schedule': 'Follow up',
            'Month of tx': '7',
            Enrolled: null,
            'Registration Group': 'New',
            'Treatment Category': 'New',
            'Type of Specimen': 'Sputum',
            '(If Others) Specify': null,
            Site: 'Pulmonary',
            'Test Requested Smear': true,
            'Test Requested Culture': true,
            'Test Requested DST': false,
            'Test Requested LPA': false,
            'Test Requested Gx': false,
            'Date transfered to DST': null,
            'Presumptive DS or DR': 'Presumptive DS-TB',
            'Lab No 1': 'N-19-0004',
            'Date Collected 1': '2019-01-02T00:00:00.000Z',
            'Date Collected 2': null,
            'Date Collected 3': null,
            'Type of Collection 1': null,
            'Type of Collection 2': null,
            'Type of Collection 3': null,
            'Volume 1': '3ml',
            'Volume 2': null,
            'Volume 3': null,
            'Consistency 1': 'MS',
            'Consistency 2': null,
            'Consistence 3': null,
            'Prepared by': null,
            'Date Received': '2019-01-04T00:00:00.000Z',
            'Encoded By': 'Mica Ann Cherene L. Culala',
            'Date Encoded': '2019-01-04T00:00:00.000Z',
            'Smear Method': 'Fluorescence Microscopy',
            'Smear Method 2': null,
            'Smear Result 1': '0',
            'Smear Result 2': null,
            'Smear Final Result': 'NEGATIVE FOR Acid Fast Bacilli',
            'Smear Date Released': '2019-01-09T00:00:00.000Z',
            'Smear Only Test Requested': 'DSSM Only',
            'Smear Only Test Requested 2': 'DSSM Only',
            'Smear TAT': null,
            'Smear Lab Tech': 'Krissha Mae P. Marfil, RMT',
            'Smear Encoded by': 'Krissha Mae P. Marfil, RMT',
            'Culture Date Inoculated': null,
            'Culture Med Tech': null,
            'Culture Result Status': null,
            'Culture DST Status': null,
            'Culture Method': 'Solid Culture(Modified Kudoh)',
            'Culture Method 2': null,
            'Culture Result 1': 'No growth after 8 weeks',
            'Culture Grade 1': null,
            'Culture Result 2': null,
            'Culture Grade 2': null,
            'Culture Final Result': 'No growth after 8 weeks',
            'Culture Date Released': '2019-03-07T00:00:00.000Z',
            'Culture Encoded by': 'Krissha Mae P. Marfil, RMT',
            'Culture Lab Tech': 'Krissha Mae P. Marfil, RMT',
            'Culture TAT': null,
            'Culture Lab Manager': 'Ma. Cecilia G. Ama, MD',
            'Culture Remarks 1': null,
            'Culture Remarks 2': null,
            'TAT Culture Remarks': null,
            'DSSM&Culture Releasing Form Med Tech': null,
            'DSSM&Culture Releasing Form Date Released': null,
            'DSSM&Culture Releasing Form Laboratory Manager':
              'Ma. Cecilia G. Ama, MD',
            'DST ID Result': null,
            'DST Date Inoculated': null,
            'DST MT Inoculated': null,
            Streptomycin: null,
            Isoniazid: null,
            Rifampicin: null,
            Ethambutol: null,
            Kanamycin: null,
            Levofloxacin: null,
            Amikacin: null,
            Capreomycin: null,
            Pyrazinamide: null,
            Ofloxacin: null,
            Ciprofloxacin: null,
            'DST Date Read': null,
            'DST MT Read': null,
            'DST Date Released': null,
            'DST Lab Tech': null,
            'DST TAT': null,
            'DST Test Requested': null,
            'DST Laboratory Releasing Form Remarks': null,
            'DST Releasing Form MedTech': null,
            'DST Releasing Form Released Date': null,
            'DST Releasing Form Lab Manager': 'Ma. Cecilia G. Ama, MD',
            'DST Method Used': null,
            'DST Method Used Others': null,
            'DST Workbook Remarks': null,
            'DST Remarks': null,
            'DST Encoded by': null,
            'Gx Processing Date': null,
            'Gx MTB': null,
            'Gx Rifampicin': null,
            'Gx Date Released': null,
            'Gx Examiner': null,
            'Gx TAT': null,
            'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
            'Gx Center': null,
            'Gx Laboratory Releasing Form Remarks': null,
            'LPA Male': false,
            'Gx Remarks': null,
            'TB Case Number': null,
            'LPA Kit Used': null,
            'LPA Kit Others': null,
            'LPA Date Processed': null,
            'LPA MTB Complex': null,
            'LPA Isoniazid Result': null,
            'LPA Rifampicin': null,
            'LPA Isoniazid': null,
            'LPA Rifampicin Result': null,
            'LPA Date Released': null,
            'LPA Ethambutol': null,
            'LPA Examiner': null,
            'LPA Fluoroquinolones': null,
            'LPA Aminoglycosides/ SLI': null,
            'LPA Mycobacterium Tb': null,
            'LPA Lab Manager': 'Noel G. Macalalad, MD',
            'LPA Remarks:': null,
            'LPA Center': null,
            'LPA Performed By': null,
            'LPA Reviewed By': null,
            'LPA Date of Release': null,
            'LPA Remarks': null,
            'LPA TAT': null,
            'Laboratory Releasing Form Remarks': null,
            'Laboratory Releasing Form Gx Remarks': null,
            'Laboratory Releasing Form Smear Remarks': null,
            'Laboratory Registry Remarks': null,
          },
        })
      )

      assert.isOk(
        await PhilippinesNTRLPMDTDataProcessor.canProcessRequest({
          payload: {
            database: 'PMDT',
            table: 'NTRL DATABASE',
            TimeStamp: '458014',
            'Serial Number': '00004',
            'Last Name': 'OMELA',
            'First Name': 'Mary Ann',
            'Middle Initial': 'Valle',
            Address: 'Rizal',
            'Referring Health Facility': 'BJMP 4A Regional Infirmary TB DOT',
            'Culture Center': 'NTRL',
            'Cat IV Screening Code': null,
            'MRF Date Requested': '2019-01-02T00:00:00.000Z',
            Age: 41,
            Sex: 'Female',
            'DST Center': 'NTRL',
            'Requesting Physician': 'Dr. Chua',
            'Treatment Schedule': 'Follow up',
            'Month of tx': '7',
            Enrolled: null,
            'Registration Group': 'New',
            'Treatment Category': 'New',
            'Type of Specimen': 'Sputum',
            '(If Others) Specify': null,
            Site: 'Pulmonary',
            'Test Requested Smear': true,
            'Test Requested Culture': true,
            'Test Requested DST': false,
            'Test Requested LPA': false,
            'Test Requested Gx': false,
            'Date transfered to DST': null,
            'Presumptive DS or DR': 'Presumptive DS-TB',
            'Lab No 1': 'N-19-0004',
            'Date Collected 1': '2019-01-02T00:00:00.000Z',
            'Date Collected 2': null,
            'Date Collected 3': null,
            'Type of Collection 1': null,
            'Type of Collection 2': null,
            'Type of Collection 3': null,
            'Volume 1': '3ml',
            'Volume 2': null,
            'Volume 3': null,
            'Consistency 1': 'MS',
            'Consistency 2': null,
            'Consistence 3': null,
            'Prepared by': null,
            'Date Received': '2019-01-04T00:00:00.000Z',
            'Encoded By': 'Mica Ann Cherene L. Culala',
            'Date Encoded': '2019-01-04T00:00:00.000Z',
            'Smear Method': 'Fluorescence Microscopy',
            'Smear Method 2': null,
            'Smear Result 1': '0',
            'Smear Result 2': null,
            'Smear Final Result': 'NEGATIVE FOR Acid Fast Bacilli',
            'Smear Date Released': '2019-01-09T00:00:00.000Z',
            'Smear Only Test Requested': 'DSSM Only',
            'Smear Only Test Requested 2': 'DSSM Only',
            'Smear TAT': null,
            'Smear Lab Tech': 'Krissha Mae P. Marfil, RMT',
            'Smear Encoded by': 'Krissha Mae P. Marfil, RMT',
            'Culture Date Inoculated': null,
            'Culture Med Tech': null,
            'Culture Result Status': null,
            'Culture DST Status': null,
            'Culture Method': 'Solid Culture(Modified Kudoh)',
            'Culture Method 2': null,
            'Culture Result 1': 'No growth after 8 weeks',
            'Culture Grade 1': null,
            'Culture Result 2': null,
            'Culture Grade 2': null,
            'Culture Final Result': 'No growth after 8 weeks',
            'Culture Date Released': '2019-03-07T00:00:00.000Z',
            'Culture Encoded by': 'Krissha Mae P. Marfil, RMT',
            'Culture Lab Tech': 'Krissha Mae P. Marfil, RMT',
            'Culture TAT': null,
            'Culture Lab Manager': 'Ma. Cecilia G. Ama, MD',
            'Culture Remarks 1': null,
            'Culture Remarks 2': null,
            'TAT Culture Remarks': null,
            'DSSM&Culture Releasing Form Med Tech': null,
            'DSSM&Culture Releasing Form Date Released': null,
            'DSSM&Culture Releasing Form Laboratory Manager':
              'Ma. Cecilia G. Ama, MD',
            'DST ID Result': null,
            'DST Date Inoculated': null,
            'DST MT Inoculated': null,
            Streptomycin: null,
            Isoniazid: null,
            Rifampicin: null,
            Ethambutol: null,
            Kanamycin: null,
            Levofloxacin: null,
            Amikacin: null,
            Capreomycin: null,
            Pyrazinamide: null,
            Ofloxacin: null,
            Ciprofloxacin: null,
            'DST Date Read': null,
            'DST MT Read': null,
            'DST Date Released': null,
            'DST Lab Tech': null,
            'DST TAT': null,
            'DST Test Requested': null,
            'DST Laboratory Releasing Form Remarks': null,
            'DST Releasing Form MedTech': null,
            'DST Releasing Form Released Date': null,
            'DST Releasing Form Lab Manager': 'Ma. Cecilia G. Ama, MD',
            'DST Method Used': null,
            'DST Method Used Others': null,
            'DST Workbook Remarks': null,
            'DST Remarks': null,
            'DST Encoded by': null,
            'Gx Processing Date': null,
            'Gx MTB': null,
            'Gx Rifampicin': null,
            'Gx Date Released': null,
            'Gx Examiner': null,
            'Gx TAT': null,
            'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
            'Gx Center': null,
            'Gx Laboratory Releasing Form Remarks': null,
            'LPA Male': false,
            'Gx Remarks': null,
            'TB Case Number': null,
            'LPA Kit Used': null,
            'LPA Kit Others': null,
            'LPA Date Processed': null,
            'LPA MTB Complex': null,
            'LPA Isoniazid Result': null,
            'LPA Rifampicin': null,
            'LPA Isoniazid': null,
            'LPA Rifampicin Result': null,
            'LPA Date Released': null,
            'LPA Ethambutol': null,
            'LPA Examiner': null,
            'LPA Fluoroquinolones': null,
            'LPA Aminoglycosides/ SLI': null,
            'LPA Mycobacterium Tb': null,
            'LPA Lab Manager': 'Noel G. Macalalad, MD',
            'LPA Remarks:': null,
            'LPA Center': null,
            'LPA Performed By': null,
            'LPA Reviewed By': null,
            'LPA Date of Release': null,
            'LPA Remarks': null,
            'LPA TAT': null,
            'Laboratory Releasing Form Remarks': null,
            'Laboratory Releasing Form Gx Remarks': null,
            'Laboratory Releasing Form Smear Remarks': null,
            'Laboratory Registry Remarks': null,
            'Facility Contact Number': null,
            'Patient Contact Number': null,
            'Date Dispatch': null,
          },
        })
      )

      assert.isNotOk(
        await PhilippinesNTRLPMDTDataProcessor.canProcessRequest({
          payload: {
            database: 'PMDT',
            table: 'NTRL DATABASE',
            TimeStamp: '458014',
            'Serial Number': '00004',
            'Last Name': 'OMELA',
            'First Name': 'Mary Ann',
            'Middle Initial': 'Valle',
            Address: 'Rizal',
            'Referring Health Facility': 'BJMP 4A Regional Infirmary TB DOT',
            'Culture Center': 'NTRL',
            'Cat IV Screening Code': null,
            'MRF Date Requested': '2019-01-02T00:00:00.000Z',
            Age: 41,
            Sex: 'Female',
            'DST Center': 'NTRL',
            'Requesting Physician': 'Dr. Chua',
            'Treatment Schedule': 'Follow up',
            'Month of tx': '7',
            Enrolled: null,
            'Registration Group': 'New',
            'Treatment Category': 'New',
            'Type of Specimen': 'Sputum',
            '(If Others) Specify': null,
            Site: 'Pulmonary',
            'Test Requested Smear': true,
            'Test Requested Culture': true,
            'Test Requested DST': false,
            'Test Requested LPA': false,
            'Test Requested Gx': false,
            'Date transfered to DST': null,
            'Presumptive DS or DR': 'Presumptive DS-TB',
            'Lab No 1': 'N-19-0004',
            'Date Collected 1': '2019-01-02T00:00:00.000Z',
            'Date Collected 2': null,
            'Date Collected 3': null,
            'Type of Collection 1': null,
            'Type of Collection 2': null,
            'Type of Collection 3': null,
            'Volume 1': '3ml',
            'Volume 2': null,
            'Volume 3': null,
            'Consistency 1': 'MS',
            'Consistency 2': null,
            'Consistence 3': null,
            'Prepared by': null,
            'Date Received': '2019-01-04T00:00:00.000Z',
            'Encoded By': 'Mica Ann Cherene L. Culala',
            'Date Encoded': '2019-01-04T00:00:00.000Z',
            'Smear Method': 'Fluorescence Microscopy',
            'Smear Method 2': null,
            'Smear Result 1': '0',
            'Smear Result 2': null,
            'Smear Final Result': 'NEGATIVE FOR Acid Fast Bacilli',
            'Smear Date Released': '2019-01-09T00:00:00.000Z',
            'Smear Only Test Requested': 'DSSM Only',
            'Smear Only Test Requested 2': 'DSSM Only',
            'Smear TAT': null,
            'Smear Lab Tech': 'Krissha Mae P. Marfil, RMT',
            'Smear Encoded by': 'Krissha Mae P. Marfil, RMT',
            'Culture Date Inoculated': null,
            'Culture Med Tech': null,
            'Culture Result Status': null,
            'Culture DST Status': null,
            'Culture Method': 'Solid Culture(Modified Kudoh)',
            'Culture Method 2': null,
            'Culture Result 1': 'No growth after 8 weeks',
            'Culture Grade 1': null,
            'Culture Result 2': null,
            'Culture Grade 2': null,
            'Culture Final Result': 'No growth after 8 weeks',
            'Culture Date Released': '2019-03-07T00:00:00.000Z',
            'Culture Encoded by': 'Krissha Mae P. Marfil, RMT',
            'Culture Lab Tech': 'Krissha Mae P. Marfil, RMT',
            'Culture TAT': null,
            'Culture Lab Manager': 'Ma. Cecilia G. Ama, MD',
            'Culture Remarks 1': null,
            'Culture Remarks 2': null,
            'TAT Culture Remarks': null,
            'DSSM&Culture Releasing Form Med Tech': null,
            'DSSM&Culture Releasing Form Date Released': null,
            'DSSM&Culture Releasing Form Laboratory Manager':
              'Ma. Cecilia G. Ama, MD',
            'DST ID Result': null,
            'DST Date Inoculated': null,
            'DST MT Inoculated': null,
            Streptomycin: null,
            Isoniazid: null,
            Rifampicin: null,
            Ethambutol: null,
            Kanamycin: null,
            Levofloxacin: null,
            Amikacin: null,
            Capreomycin: null,
            Pyrazinamide: null,
            Ofloxacin: null,
            Ciprofloxacin: null,
            'DST Date Read': null,
            'DST MT Read': null,
            'DST Date Released': null,
            'DST Lab Tech': null,
            'DST TAT': null,
            'DST Test Requested': null,
            'DST Laboratory Releasing Form Remarks': null,
            'DST Releasing Form MedTech': null,
            'DST Releasing Form Released Date': null,
            'DST Releasing Form Lab Manager': 'Ma. Cecilia G. Ama, MD',
            'DST Method Used': null,
            'DST Method Used Others': null,
            'DST Workbook Remarks': null,
            'DST Remarks': null,
            'DST Encoded by': null,
            'Gx Processing Date': null,
            'Gx MTB': null,
            'Gx Rifampicin': null,
            'Gx Date Released': null,
            'Gx Examiner': null,
            'Gx TAT': null,
            'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
            'Gx Center': null,
            'Gx Laboratory Releasing Form Remarks': null,
            'LPA Male': false,
            'Gx Remarks': null,
            'TB Case Number': null,
            'LPA Kit Used': null,
            'LPA Kit Others': null,
            'LPA Date Processed': null,
            'LPA MTB Complex': null,
            'LPA Isoniazid Result': null,
            'LPA Rifampicin': null,
            'LPA Isoniazid': null,
            'LPA Rifampicin Result': null,
            'LPA Date Released': null,
            'LPA Ethambutol': null,
            'LPA Examiner': null,
            'LPA Fluoroquinolones': null,
            'LPA Aminoglycosides/ SLI': null,
            'LPA Mycobacterium Tb': null,
            'LPA Lab Manager': 'Noel G. Macalalad, MD',
            'LPA Remarks:': null,
            'LPA Center': null,
            'LPA Performed By': null,
            'LPA Reviewed By': null,
            'LPA Date of Release': null,
            'LPA Remarks': null,
            'LPA TAT': null,
            'Laboratory Releasing Form Remarks': null,
            'Laboratory Releasing Form Gx Remarks': null,
            'Laboratory Releasing Form Smear Remarks': null,
          },
        })
      )
    })
  })

  const utcNow = new Date('2019-09-15T08:09:10.123Z')
  const deviceIpAddress = '10.11.12.13'
  const staticDatabaseData = {
    Assay: {
      assayBdMgitAst: 1,
      assayGenericDst: 2,
      assayBdMgitGnd: 3,
      assayCulture: 4,
      assayLPA: 5,
      assaySmear: 6,
      GxMtbRif: 7,
      GxMtbRifUltra: 8,
    },
    SampleType: {
      Sputum: 9,
      Isolate: 10,
      Other: 11,
      CSF: 12,
      Effusion: 13,
      'Gastric Lavage': 14,
      Pus: 15,
    },
    resultTypeId: 16,
    resultSourceId: 18,
    ResultCategory: {
      PositiveMTB: 19,
      PositiveMOTT: 20,
      Detected: 21,
      Resistant: 22,
      Susceptible: 23,
      Contaminated: 24,
      Invalid: 25,
      NotDetected: 26,
      Missing: 27,
      Positive1: 28,
      Positive2: 29,
      Positive3: 30,
    },
    ResultWorkflowStatus: {
      Processed: 31,
      OK: 32,
      Ordered: 33,
      InProgress: 34,
      Error: 35,
    },
  }
  const databaseRecords = {
    DeviceApiKey: {
      id: 1,
      revoked: false,
      partnerId: 2,
      deviceId: 4,
    },
    Device: {
      id: 4,
      siteId: 5,
      geographyId: 6,
      configurationData: '{}',
      lastSeenOn: new Date(1990, 1, 13, 7, 30),
    },
    Site: {
      id: 7,
      longitude: 8,
      latitude: 9,
      partnerId: 10,
      geographyId: 11,
      externalId: 'NTRL',
    },
  }
  const existingSamples = {
    'PN-19-8442-1': {
      id: 571,
      externalId: 'PN-19-8442',
      collectedOn: new Date(2019, 10, 25, 0, 0),
      sampleTypeId: staticDatabaseData.SampleType.Sputum,
      originSiteId: null,
    },
    'PN-19-8442-2': {
      id: 572,
      externalId: 'PN-19-8442-2',
      collectedOn: new Date(2019, 10, 25, 0, 0),
      sampleTypeId: staticDatabaseData.SampleType.Sputum,
      originSiteId: null,
    },
  }

  describe('processRequest', () => {
    const pmdtRecordPayload8442SmearCultureNegative2Samples = {
      Age: 45,
      Sex: 'Male',
      Site: 'Pulmonary',
      table: 'NTRL DATABASE',
      'Gx MTB': null,
      'Gx TAT': null,
      Address: null,
      'DST TAT': null,
      'LPA TAT': null,
      Amikacin: null,
      Enrolled: null,
      'LPA Male': false,
      'Lab No 1': 'N-19-8080',
      'Volume 1': '3 mL',
      'Volume 2': '1mL',
      'Volume 3': null,
      database: 'PMDT',
      'Gx Center': null,
      Isoniazid: null,
      Kanamycin: null,
      'Last Name': 'RICHARDS',
      Ofloxacin: null,
      'Smear TAT': null,
      TimeStamp: '514007',
      'DST Center': 'NTRL',
      'Encoded By': 'Jerri Reinald A. Coloma',
      Ethambutol: null,
      'First Name': 'James',
      'Gx Remarks': null,
      'LPA Center': null,
      Rifampicin: null,
      Capreomycin: null,
      'Culture TAT': null,
      'DST MT Read': null,
      'DST Remarks': null,
      'Gx Examiner': null,
      'LPA Remarks': null,
      'Month of tx': null,
      'Prepared by': null,
      'DST Lab Tech': null,
      'Date Encoded': '2019-12-04T00:00:00.000Z',
      'LPA Examiner': null,
      'LPA Kit Used': null,
      'LPA Remarks:': null,
      Levofloxacin: null,
      Pyrazinamide: null,
      'Smear Method': 'Fluorescence Microscopy',
      Streptomycin: null,
      Ciprofloxacin: null,
      'Consistence 3': null,
      'Consistency 1': 'MS',
      'Consistency 2': 'MS',
      'DST Date Read': null,
      'DST ID Result': null,
      'Date Received': '2019-12-03T00:00:00.000Z',
      'Gx Rifampicin': null,
      'LPA Isoniazid': null,
      'Serial Number': '8442',
      'Culture Center': 'NTRL',
      'Culture Method': 'Solid Culture(Modified Kudoh)',
      'DST Encoded by': null,
      'LPA Ethambutol': null,
      'LPA Kit Others': null,
      'LPA Rifampicin': null,
      'Middle Initial': null,
      'Smear Lab Tech': 'Kevin Joshua A. Alonzo, RMT',
      'Smear Method 2': null,
      'Smear Result 1': '0',
      'Smear Result 2': '0',
      'TB Case Number': null,
      'Culture Grade 1': null,
      'Culture Grade 2': null,
      'DST Method Used': null,
      'LPA Lab Manager': 'Noel G. Macalalad, MD',
      'LPA MTB Complex': null,
      'LPA Reviewed By': null,
      'Culture Lab Tech': 'Kevin Joshua A. Alonzo, RMT',
      'Culture Med Tech': null,
      'Culture Method 2': null,
      'Culture Result 1': 'No growth after 8 weeks',
      'Culture Result 2': 'No growth after 8 weeks',
      'Date Collected 1': '2019-11-25T00:00:00.000Z',
      'Date Collected 2': '2019-11-25T00:00:00.000Z',
      'Date Collected 3': null,
      'Gx Date Released': null,
      'LPA Performed By': null,
      'Smear Encoded by': 'Kevin Joshua A. Alonzo, RMT',
      'Type of Specimen': 'Sputum',
      'Culture Remarks 1': null,
      'Culture Remarks 2': null,
      'DST Date Released': null,
      'DST MT Inoculated': null,
      'LPA Date Released': null,
      'Test Requested Gx': false,
      'Culture DST Status': null,
      'Culture Encoded by': 'Kevin Joshua A. Alonzo, RMT',
      'DST Test Requested': null,
      'Gx Processing Date': null,
      'LPA Date Processed': null,
      'MRF Date Requested': '2019-11-20T00:00:00.000Z',
      'Registration Group': 'New',
      'Smear Final Result': 'NEGATIVE FOR Acid Fast Bacilli',
      'Test Requested DST': false,
      'Test Requested LPA': false,
      'Treatment Category': 'New',
      'Treatment Schedule': 'DIAGNOSIS',
      '(If Others) Specify': null,
      'Culture Lab Manager': 'Ma. Cecilia G. Ama, MD',
      'DST Date Inoculated': null,
      'LPA Date of Release': null,
      'Smear Date Released': '2019-12-06T00:00:00.000Z',
      'TAT Culture Remarks': null,
      'Culture Final Result': 'No growth after 8 weeks',
      'DST Workbook Remarks': null,
      'LPA Fluoroquinolones': null,
      'LPA Isoniazid Result': null,
      'LPA Mycobacterium Tb': null,
      'Presumptive DS or DR': 'Presumptive DS-TB',
      'Requesting Physician': 'Dr. Cruz',
      'Test Requested Smear': true,
      'Type of Collection 1': null,
      'Type of Collection 2': null,
      'Type of Collection 3': null,
      'Cat IV Screening Code': null,
      'Culture Date Released': '2020-02-03T00:00:00.000Z',
      'Culture Result Status': null,
      'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
      'LPA Rifampicin Result': null,
      'DST Method Used Others': null,
      'Date transfered to DST': null,
      'Test Requested Culture': true,
      'Culture Date Inoculated': null,
      'LPA Aminoglycosides/ SLI': null,
      'Referring Health Facility': 'Baguio General Hospital & Medical Center',
      'Smear Only Test Requested': 'DSSM Only',
      'DST Releasing Form MedTech': null,
      'Laboratory Registry Remarks': null,
      'Smear Only Test Requested 2': 'DSSM Only',
      'DST Releasing Form Lab Manager': 'Ma. Cecilia G. Ama, MD',
      'DST Releasing Form Released Date': null,
      'Laboratory Releasing Form Remarks': null,
      'DSSM&Culture Releasing Form Med Tech': null,
      'Gx Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Gx Remarks': null,
      'DST Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Smear Remarks': null,
      'DSSM&Culture Releasing Form Date Released': null,
      'DSSM&Culture Releasing Form Laboratory Manager':
        'Cristina C. Villarico, RMT',
    }
    const pmdtRecordPayload1855LpaRequestedNoResults1Sample = {
      Age: 60,
      Sex: 'Female',
      Site: 'Pulmonary',
      table: 'NTRL DATABASE',
      'Gx MTB': null,
      'Gx TAT': null,
      Address: 'DAVAO CITY',
      'DST TAT': null,
      'LPA TAT': null,
      Amikacin: null,
      Enrolled: null,
      'LPA Male': false,
      'Lab No 1': 'N-20-1234',
      'Volume 1': '10ML',
      'Volume 2': null,
      'Volume 3': null,
      database: 'PMDT_2020',
      'Gx Center': null,
      Isoniazid: null,
      Kanamycin: null,
      'Last Name': 'CUNNINGHAM',
      Ofloxacin: null,
      'Smear TAT': null,
      TimeStamp: '398162',
      'DST Center': 'NTRL',
      'Encoded By': 'Krissha Mae P. Marfil, RMT',
      Ethambutol: null,
      'First Name': 'Wallace',
      'Gx Remarks': null,
      'LPA Center': null,
      Rifampicin: null,
      Capreomycin: null,
      'Culture TAT': null,
      'DST MT Read': null,
      'DST Remarks': null,
      'Gx Examiner': null,
      'LPA Remarks': null,
      'Month of tx': null,
      'Prepared by': null,
      'DST Lab Tech': null,
      'Date Encoded': '2020-02-14T00:00:00.000Z',
      'LPA Examiner': null,
      'LPA Kit Used': null,
      'LPA Remarks:': null,
      Levofloxacin: null,
      Pyrazinamide: null,
      'Smear Method': null,
      Streptomycin: null,
      Ciprofloxacin: null,
      'Consistence 3': null,
      'Consistency 1': 'P',
      'Consistency 2': null,
      'DST Date Read': null,
      'DST ID Result': null,
      'Date Dispatch': null,
      'Date Received': '2020-02-14T00:00:00.000Z',
      'Gx Rifampicin': null,
      'LPA Isoniazid': null,
      'Serial Number': '1855',
      'Culture Center': 'NTRL',
      'Culture Method': null,
      'DST Encoded by': null,
      'LPA Ethambutol': null,
      'LPA Kit Others': null,
      'LPA Rifampicin': null,
      'Middle Initial': 'A.',
      'Smear Lab Tech': null,
      'Smear Method 2': null,
      'Smear Result 1': null,
      'Smear Result 2': null,
      'TB Case Number': null,
      'Culture Grade 1': null,
      'Culture Grade 2': null,
      'DST Method Used': null,
      'LPA Lab Manager': 'Noel G. Macalalad, MD',
      'LPA MTB Complex': null,
      'LPA Reviewed By': null,
      'Culture Lab Tech': null,
      'Culture Med Tech': null,
      'Culture Method 2': null,
      'Culture Result 1': null,
      'Culture Result 2': null,
      'Date Collected 1': '2020-02-10T00:00:00.000Z',
      'Date Collected 2': null,
      'Date Collected 3': null,
      'Gx Date Released': null,
      'LPA Performed By': null,
      'Smear Encoded by': null,
      'Type of Specimen': 'Sputum',
      'Culture Remarks 1': null,
      'Culture Remarks 2': null,
      'DST Date Released': null,
      'DST MT Inoculated': null,
      'LPA Date Released': null,
      'Test Requested Gx': false,
      'Culture DST Status': null,
      'Culture Encoded by': null,
      'DST Test Requested': null,
      'Gx Processing Date': null,
      'LPA Date Processed': null,
      'MRF Date Requested': '2020-02-10T00:00:00.000Z',
      'Registration Group': 'TAF',
      'Smear Final Result': null,
      'Test Requested DST': false,
      'Test Requested LPA': true,
      'Treatment Category': 'Retreatment',
      'Treatment Schedule': 'BAS',
      '(If Others) Specify': null,
      'Culture Lab Manager': 'Cristina C. Villarico, RMT',
      'DST Date Inoculated': null,
      'LPA Date of Release': null,
      'Smear Date Released': null,
      'TAT Culture Remarks': null,
      'Culture Final Result': null,
      'DST Workbook Remarks': null,
      'LPA Fluoroquinolones': null,
      'LPA Isoniazid Result': null,
      'LPA Mycobacterium Tb': null,
      'Presumptive DS or DR': 'Presumptive DR-TB',
      'Requesting Physician': 'Dr. Cania',
      'Test Requested Smear': false,
      'Type of Collection 1': null,
      'Type of Collection 2': null,
      'Type of Collection 3': null,
      'Cat IV Screening Code': null,
      'Culture Date Released': null,
      'Culture Result Status': null,
      'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
      'LPA Rifampicin Result': null,
      'DST Method Used Others': null,
      'Date transfered to DST': null,
      'Patient Contact Number': null,
      'Test Requested Culture': false,
      'Culture Date Inoculated': null,
      'Facility Contact Number': null,
      'LPA Aminoglycosides/ SLI': null,
      'Referring Health Facility':
        'Southern Philippines Medical Center PMDT TC',
      'Smear Only Test Requested': 'DSSM Only',
      'DST Releasing Form MedTech': null,
      'Laboratory Registry Remarks': null,
      'Smear Only Test Requested 2': 'DSSM Only',
      'DST Releasing Form Lab Manager': 'Cristina C. Villarico, RMT',
      'DST Releasing Form Released Date': null,
      'Laboratory Releasing Form Remarks': null,
      'DSSM&Culture Releasing Form Med Tech': null,
      'Gx Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Gx Remarks': null,
      'DST Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Smear Remarks': null,
      'DSSM&Culture Releasing Form Date Released': null,
      'DSSM&Culture Releasing Form Laboratory Manager':
        'Cristina C. Villarico, RMT',
    }
    const pmdtRecordPayload0494CultureSmearLpaTbPositive2Samples = {
      Age: 28,
      Sex: 'Male',
      Site: 'Pulmonary',
      table: 'NTRL DATABASE',
      'Gx MTB': null,
      'Gx TAT': null,
      Address: 'North Signal',
      'DST TAT': null,
      'LPA TAT': null,
      Amikacin: null,
      Enrolled: null,
      'LPA Male': false,
      'Lab No 1': 'N-20-4321',
      'Volume 1': '10ML',
      'Volume 2': '10ML',
      'Volume 3': null,
      database: 'PMDT_2020',
      'Gx Center': null,
      Isoniazid: null,
      Kanamycin: null,
      'Last Name': 'GOUS',
      Ofloxacin: null,
      'Smear TAT': null,
      TimeStamp: '190105',
      'DST Center': 'NTRL',
      'Encoded By': 'Jenny B.  Lasprilla',
      Ethambutol: null,
      'First Name': 'Herman',
      'Gx Remarks': null,
      'LPA Center': 'NTRL',
      Rifampicin: null,
      Capreomycin: null,
      'Culture TAT': null,
      'DST MT Read': null,
      'DST Remarks': null,
      'Gx Examiner': null,
      'LPA Remarks': null,
      'Month of tx': null,
      'Prepared by': null,
      'DST Lab Tech': null,
      'Date Encoded': '2020-01-21T00:00:00.000Z',
      'LPA Examiner': null,
      'LPA Kit Used': 'Hain MTBDRsl ver 2.0',
      'LPA Remarks:': 'test repeated',
      Levofloxacin: null,
      Pyrazinamide: null,
      'Smear Method': 'Fluorescence Microscopy',
      Streptomycin: null,
      Ciprofloxacin: null,
      'Consistence 3': null,
      'Consistency 1': 'MS',
      'Consistency 2': 'MS',
      'DST Date Read': null,
      'DST ID Result': null,
      'Date Dispatch': null,
      'Date Received': '2020-01-21T00:00:00.000Z',
      'Gx Rifampicin': null,
      'LPA Isoniazid': null,
      'Serial Number': '0494',
      'Culture Center': 'NTRL',
      'Culture Method': 'Liquid Culture(MGIT)',
      'DST Encoded by': null,
      'LPA Ethambutol': null,
      'LPA Kit Others': null,
      'LPA Rifampicin': null,
      'Middle Initial': 'A.',
      'Smear Lab Tech': 'Krissha Mae P. Marfil, RMT',
      'Smear Method 2': null,
      'Smear Result 1': '+3',
      'Smear Result 2': '+22',
      'TB Case Number': null,
      'Culture Grade 1': null,
      'Culture Grade 2': null,
      'DST Method Used': null,
      'LPA Lab Manager': 'Noel G. Macalalad, MD',
      'LPA MTB Complex': 'M. tb Detected',
      'LPA Reviewed By': 'Ma. Cecilia G. Ama, MD',
      'Culture Lab Tech': null,
      'Culture Med Tech': null,
      'Culture Method 2': null,
      'Culture Result 1': null,
      'Culture Result 2': null,
      'Date Collected 1': '2020-01-15T00:00:00.000Z',
      'Date Collected 2': '2020-01-15T00:00:00.000Z',
      'Date Collected 3': null,
      'Gx Date Released': null,
      'LPA Performed By': 'Maria Zahra R. Almadrigo, RMT',
      'Smear Encoded by': 'Krissha Mae P. Marfil, RMT',
      'Type of Specimen': 'Sputum',
      'Culture Remarks 1': null,
      'Culture Remarks 2': null,
      'DST Date Released': null,
      'DST MT Inoculated': null,
      'LPA Date Released': null,
      'Test Requested Gx': false,
      'Culture DST Status': null,
      'Culture Encoded by': null,
      'DST Test Requested': null,
      'Gx Processing Date': null,
      'LPA Date Processed': null,
      'MRF Date Requested': '2020-01-17T00:00:00.000Z',
      'Registration Group': null,
      'Smear Final Result': 'POSITIVE FOR Acid Fast Bacilli',
      'Test Requested DST': false,
      'Test Requested LPA': true,
      'Treatment Category': null,
      'Treatment Schedule': 'BAS',
      '(If Others) Specify': null,
      'Culture Lab Manager': 'Cristina C. Villarico, RMT',
      'DST Date Inoculated': null,
      'LPA Date of Release': '2020-01-29T00:00:00.000Z',
      'Smear Date Released': '2020-01-23T00:00:00.000Z',
      'TAT Culture Remarks': null,
      'Culture Final Result': null,
      'DST Workbook Remarks': null,
      'LPA Fluoroquinolones': 'Resistance Not Detected',
      'LPA Isoniazid Result': null,
      'LPA Mycobacterium Tb': null,
      'Presumptive DS or DR': null,
      'Requesting Physician': 'Dr. Bieren',
      'Test Requested Smear': true,
      'Type of Collection 1': null,
      'Type of Collection 2': null,
      'Type of Collection 3': null,
      'Cat IV Screening Code': null,
      'Culture Date Released': null,
      'Culture Result Status': null,
      'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
      'LPA Rifampicin Result': null,
      'DST Method Used Others': null,
      'Date transfered to DST': null,
      'Patient Contact Number': null,
      'Test Requested Culture': true,
      'Culture Date Inoculated': null,
      'Facility Contact Number': null,
      'LPA Aminoglycosides/ SLI': 'Resistance Not Detected',
      'Referring Health Facility': null,
      'Smear Only Test Requested': 'DSSM Only',
      'DST Releasing Form MedTech': null,
      'Laboratory Registry Remarks': null,
      'Smear Only Test Requested 2': 'DSSM Only',
      'DST Releasing Form Lab Manager': 'Cristina C. Villarico, RMT',
      'DST Releasing Form Released Date': null,
      'Laboratory Releasing Form Remarks': null,
      'DSSM&Culture Releasing Form Med Tech': null,
      'Gx Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Gx Remarks': null,
      'DST Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Smear Remarks': null,
      'DSSM&Culture Releasing Form Date Released': null,
      'DSSM&Culture Releasing Form Laboratory Manager':
        'Cristina C. Villarico, RMT',
    }
    const pmdtRecordPayload0495CultureSmearLpaTbResistant2Samples = {
      Age: 87,
      Sex: 'Male',
      Site: 'Pulmonary',
      table: 'NTRL DATABASE',
      'Gx MTB': null,
      'Gx TAT': null,
      Address: 'North Signal',
      'DST TAT': null,
      'LPA TAT': null,
      Amikacin: null,
      Enrolled: null,
      'LPA Male': false,
      'Lab No 1': 'N-20-4322',
      'Volume 1': '10ML',
      'Volume 2': '10ML',
      'Volume 3': null,
      database: 'PMDT_2020',
      'Gx Center': null,
      Isoniazid: null,
      Kanamycin: null,
      'Last Name': 'Gray',
      Ofloxacin: null,
      'Smear TAT': null,
      TimeStamp: '190115',
      'DST Center': 'NTRL',
      'Encoded By': 'Jenny B.  Lasprilla',
      Ethambutol: null,
      'First Name': 'Benjamin',
      'Gx Remarks': null,
      'LPA Center': 'NTRL',
      Rifampicin: null,
      Capreomycin: null,
      'Culture TAT': null,
      'DST MT Read': null,
      'DST Remarks': null,
      'Gx Examiner': null,
      'LPA Remarks': null,
      'Month of tx': null,
      'Prepared by': null,
      'DST Lab Tech': null,
      'Date Encoded': '2020-01-21T00:00:00.000Z',
      'LPA Examiner': null,
      'LPA Kit Used': 'Hain MTBDRsl ver 2.0',
      'LPA Remarks:': 'test repeated',
      Levofloxacin: null,
      Pyrazinamide: null,
      'Smear Method': 'Fluorescence Microscopy',
      Streptomycin: null,
      Ciprofloxacin: null,
      'Consistence 3': null,
      'Consistency 1': 'MS',
      'Consistency 2': 'MS',
      'DST Date Read': null,
      'DST ID Result': null,
      'Date Dispatch': null,
      'Date Received': '2020-01-21T00:00:00.000Z',
      'Gx Rifampicin': null,
      'LPA Isoniazid': null,
      'Serial Number': '0494',
      'Culture Center': 'NTRL',
      'Culture Method': 'Liquid Culture(MGIT)',
      'DST Encoded by': null,
      'LPA Ethambutol': null,
      'LPA Kit Others': null,
      'LPA Rifampicin': null,
      'Middle Initial': 'A.',
      'Smear Lab Tech': 'Krissha Mae P. Marfil, RMT',
      'Smear Method 2': null,
      'Smear Result 1': null,
      'Smear Result 2': null,
      'TB Case Number': null,
      'Culture Grade 1': null,
      'Culture Grade 2': null,
      'DST Method Used': null,
      'LPA Lab Manager': 'Noel G. Macalalad, MD',
      'LPA MTB Complex': 'M. tb Detected',
      'LPA Reviewed By': 'Ma. Cecilia G. Ama, MD',
      'Culture Lab Tech': null,
      'Culture Med Tech': null,
      'Culture Method 2': null,
      'Culture Result 1': null,
      'Culture Result 2': null,
      'Date Collected 1': '2020-01-15T00:00:00.000Z',
      'Date Collected 2': '2020-01-15T00:00:00.000Z',
      'Date Collected 3': null,
      'Gx Date Released': null,
      'LPA Performed By': 'Maria Zahra R. Almadrigo, RMT',
      'Smear Encoded by': 'Krissha Mae P. Marfil, RMT',
      'Type of Specimen': 'Sputum',
      'Culture Remarks 1': null,
      'Culture Remarks 2': null,
      'DST Date Released': null,
      'DST MT Inoculated': null,
      'LPA Date Released': null,
      'Test Requested Gx': false,
      'Culture DST Status': null,
      'Culture Encoded by': null,
      'DST Test Requested': null,
      'Gx Processing Date': null,
      'LPA Date Processed': null,
      'MRF Date Requested': '2020-01-17T00:00:00.000Z',
      'Registration Group': null,
      'Smear Final Result': 'POSITIVE FOR Acid Fast Bacilli',
      'Test Requested DST': false,
      'Test Requested LPA': true,
      'Treatment Category': null,
      'Treatment Schedule': 'BAS',
      '(If Others) Specify': null,
      'Culture Lab Manager': 'Cristina C. Villarico, RMT',
      'DST Date Inoculated': null,
      'LPA Date of Release': '2020-01-29T00:00:00.000Z',
      'Smear Date Released': '2020-01-23T00:00:00.000Z',
      'TAT Culture Remarks': null,
      'Culture Final Result': null,
      'DST Workbook Remarks': null,
      'LPA Fluoroquinolones': 'Resistance Not Detected',
      'LPA Isoniazid Result': 'Resistance Detected',
      'LPA Mycobacterium Tb': null,
      'Presumptive DS or DR': null,
      'Requesting Physician': 'Dr. Bieren',
      'Test Requested Smear': true,
      'Type of Collection 1': null,
      'Type of Collection 2': null,
      'Type of Collection 3': null,
      'Cat IV Screening Code': null,
      'Culture Date Released': null,
      'Culture Result Status': null,
      'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
      'LPA Rifampicin Result': null,
      'DST Method Used Others': null,
      'Date transfered to DST': null,
      'Patient Contact Number': null,
      'Test Requested Culture': true,
      'Culture Date Inoculated': null,
      'Facility Contact Number': null,
      'LPA Aminoglycosides/ SLI': 'Resistance Not Detected',
      'Referring Health Facility': null,
      'Smear Only Test Requested': 'DSSM Only',
      'DST Releasing Form MedTech': null,
      'Laboratory Registry Remarks': null,
      'Smear Only Test Requested 2': 'DSSM Only',
      'DST Releasing Form Lab Manager': 'Cristina C. Villarico, RMT',
      'DST Releasing Form Released Date': null,
      'Laboratory Releasing Form Remarks': null,
      'DSSM&Culture Releasing Form Med Tech': null,
      'Gx Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Gx Remarks': null,
      'DST Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Smear Remarks': null,
      'DSSM&Culture Releasing Form Date Released': null,
      'DSSM&Culture Releasing Form Laboratory Manager':
        'Cristina C. Villarico, RMT',
    }
    const pmdtRecordPayload0336CultureNoResults1Sample = {
      Age: 40,
      Sex: 'Male',
      Site: 'Pulmonary',
      table: 'NTRL DATABASE',
      'Gx MTB': null,
      'Gx TAT': null,
      Address: 'Aniban, Bacoor City',
      'DST TAT': null,
      'LPA TAT': null,
      Amikacin: null,
      Enrolled: null,
      'LPA Male': false,
      'Lab No 1': 'SLH-19-1616',
      'Volume 1': null,
      'Volume 2': null,
      'Volume 3': null,
      database: 'PMDT_2020',
      'Gx Center': null,
      Isoniazid: null,
      Kanamycin: null,
      'Last Name': 'BAUMGARTNER',
      Ofloxacin: null,
      'Smear TAT': null,
      TimeStamp: '70062',
      'DST Center': 'NTRL',
      'Encoded By': 'Jenny B.  Lasprilla',
      Ethambutol: null,
      'First Name': 'Darlene',
      'Gx Remarks': null,
      'LPA Center': null,
      Rifampicin: null,
      Capreomycin: null,
      'Culture TAT': null,
      'DST MT Read': null,
      'DST Remarks': null,
      'Gx Examiner': null,
      'LPA Remarks': null,
      'Month of tx': null,
      'Prepared by': null,
      'DST Lab Tech': null,
      'Date Encoded': '2020-01-17T00:00:00.000Z',
      'LPA Examiner': null,
      'LPA Kit Used': null,
      'LPA Remarks:': null,
      Levofloxacin: null,
      Pyrazinamide: null,
      'Smear Method': null,
      Streptomycin: null,
      Ciprofloxacin: null,
      'Consistence 3': null,
      'Consistency 1': null,
      'Consistency 2': null,
      'DST Date Read': null,
      'DST ID Result': null,
      'Date Dispatch': null,
      'Date Received': '2020-01-17T00:00:00.000Z',
      'Gx Rifampicin': null,
      'LPA Isoniazid': null,
      'Serial Number': '0336',
      'Culture Center': 'SLH',
      'Culture Method': 'Solid Culture(Modified Kudoh)',
      'DST Encoded by': null,
      'LPA Ethambutol': null,
      'LPA Kit Others': null,
      'LPA Rifampicin': null,
      'Middle Initial': 'B.',
      'Smear Lab Tech': null,
      'Smear Method 2': null,
      'Smear Result 1': null,
      'Smear Result 2': null,
      'TB Case Number': '179-19-0018',
      'Culture Grade 1': null,
      'Culture Grade 2': null,
      'DST Method Used': null,
      'LPA Lab Manager': 'Noel G. Macalalad, MD',
      'LPA MTB Complex': null,
      'LPA Reviewed By': null,
      'Culture Lab Tech': null,
      'Culture Med Tech': null,
      'Culture Method 2': null,
      'Culture Result 1': null,
      'Culture Result 2': null,
      'Date Collected 1': '2019-06-17T00:00:00.000Z',
      'Date Collected 2': '2019-06-17T00:00:00.000Z',
      'Date Collected 3': null,
      'Gx Date Released': null,
      'LPA Performed By': null,
      'Smear Encoded by': null,
      'Type of Specimen': 'Isolates',
      'Culture Remarks 1': null,
      'Culture Remarks 2': null,
      'DST Date Released': null,
      'DST MT Inoculated': null,
      'LPA Date Released': null,
      'Test Requested Gx': false,
      'Culture DST Status': null,
      'Culture Encoded by': null,
      'DST Test Requested': null,
      'Gx Processing Date': null,
      'LPA Date Processed': null,
      'MRF Date Requested': '2019-10-05T00:00:00.000Z',
      'Registration Group': 'New',
      'Smear Final Result': null,
      'Test Requested DST': true,
      'Test Requested LPA': false,
      'Treatment Category': 'New',
      'Treatment Schedule': 'BAS',
      '(If Others) Specify': null,
      'Culture Lab Manager': 'Cristina C. Villarico, RMT',
      'DST Date Inoculated': null,
      'LPA Date of Release': null,
      'Smear Date Released': null,
      'TAT Culture Remarks': null,
      'Culture Final Result': null,
      'DST Workbook Remarks': null,
      'LPA Fluoroquinolones': null,
      'LPA Isoniazid Result': null,
      'LPA Mycobacterium Tb': null,
      'Presumptive DS or DR': 'Presumptive DR-TB',
      'Requesting Physician': 'Dr. Mamaril',
      'Test Requested Smear': true,
      'Type of Collection 1': null,
      'Type of Collection 2': null,
      'Type of Collection 3': null,
      'Cat IV Screening Code': null,
      'Culture Date Released': null,
      'Culture Result Status': null,
      'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
      'LPA Rifampicin Result': null,
      'DST Method Used Others': null,
      'Date transfered to DST': null,
      'Patient Contact Number': null,
      'Test Requested Culture': true,
      'Culture Date Inoculated': null,
      'Facility Contact Number': null,
      'LPA Aminoglycosides/ SLI': null,
      'Referring Health Facility': 'Unknown health facility',
      'Smear Only Test Requested': 'DSSM Only',
      'DST Releasing Form MedTech': null,
      'Laboratory Registry Remarks': null,
      'Smear Only Test Requested 2': 'DSSM Only',
      'DST Releasing Form Lab Manager': 'Cristina C. Villarico, RMT',
      'DST Releasing Form Released Date': null,
      'Laboratory Releasing Form Remarks': null,
      'DSSM&Culture Releasing Form Med Tech': null,
      'Gx Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Gx Remarks': null,
      'DST Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Smear Remarks': null,
      'DSSM&Culture Releasing Form Date Released': null,
      'DSSM&Culture Releasing Form Laboratory Manager':
        'Cristina C. Villarico, RMT',
    }
    const pmdtRecordPayload0350CultureNoResults3Samples = {
      Age: 43,
      Sex: 'Male',
      Site: 'Pulmonary',
      table: 'NTRL DATABASE',
      'Gx MTB': null,
      'Gx TAT': null,
      Address: 'Santa Cruz, Laguna',
      'DST TAT': null,
      'LPA TAT': null,
      Amikacin: null,
      Enrolled: null,
      'LPA Male': false,
      'Lab No 1': 'SLH-19-9999',
      'Volume 1': null,
      'Volume 2': null,
      'Volume 3': null,
      database: 'PMDT_2020',
      'Gx Center': null,
      Isoniazid: null,
      Kanamycin: null,
      'Last Name': 'POTGIETER',
      Ofloxacin: null,
      'Smear TAT': null,
      TimeStamp: '74066',
      'DST Center': 'NTRL',
      'Encoded By': 'Jenny B.  Lasprilla',
      Ethambutol: null,
      'First Name': 'Emma',
      'Gx Remarks': null,
      'LPA Center': null,
      Rifampicin: null,
      Capreomycin: null,
      'Culture TAT': null,
      'DST MT Read': null,
      'DST Remarks': null,
      'Gx Examiner': null,
      'LPA Remarks': null,
      'Month of tx': null,
      'Prepared by': null,
      'DST Lab Tech': null,
      'Date Encoded': '2020-01-20T00:00:00.000Z',
      'LPA Examiner': null,
      'LPA Kit Used': null,
      'LPA Remarks:': null,
      Levofloxacin: null,
      Pyrazinamide: null,
      'Smear Method': null,
      Streptomycin: null,
      Ciprofloxacin: null,
      'Consistence 3': 'Mucopurulent',
      'Consistency 1': null,
      'Consistency 2': null,
      'DST Date Read': null,
      'DST ID Result': null,
      'Date Dispatch': null,
      'Date Received': '2020-01-17T00:00:00.000Z',
      'Gx Rifampicin': null,
      'LPA Isoniazid': null,
      'Serial Number': '0350',
      'Culture Center': 'SLH',
      'Culture Method': 'Solid Culture(Modified Kudoh)',
      'DST Encoded by': null,
      'LPA Ethambutol': null,
      'LPA Kit Others': null,
      'LPA Rifampicin': null,
      'Middle Initial': 'A.',
      'Smear Lab Tech': null,
      'Smear Method 2': null,
      'Smear Result 1': null,
      'Smear Result 2': null,
      'TB Case Number': '77-19-0011',
      'Culture Grade 1': null,
      'Culture Grade 2': null,
      'DST Method Used': null,
      'LPA Lab Manager': 'Noel G. Macalalad, MD',
      'LPA MTB Complex': null,
      'LPA Reviewed By': null,
      'Culture Lab Tech': null,
      'Culture Med Tech': null,
      'Culture Method 2': null,
      'Culture Result 1': null,
      'Culture Result 2': null,
      'Date Collected 1': '2019-06-23T00:00:00.000Z',
      'Date Collected 2': '2019-06-23T00:00:00.000Z',
      'Date Collected 3': null,
      'Gx Date Released': null,
      'LPA Performed By': null,
      'Smear Encoded by': null,
      'Type of Specimen': 'Isolates',
      'Culture Remarks 1': null,
      'Culture Remarks 2': null,
      'DST Date Released': null,
      'DST MT Inoculated': null,
      'LPA Date Released': null,
      'Test Requested Gx': false,
      'Culture DST Status': null,
      'Culture Encoded by': null,
      'DST Test Requested': null,
      'Gx Processing Date': null,
      'LPA Date Processed': null,
      'MRF Date Requested': '2019-06-24T00:00:00.000Z',
      'Registration Group': 'RELAPSE',
      'Smear Final Result': null,
      'Test Requested DST': true,
      'Test Requested LPA': false,
      'Treatment Category': 'Retreatment',
      'Treatment Schedule': 'BAS',
      '(If Others) Specify': null,
      'Culture Lab Manager': 'Cristina C. Villarico, RMT',
      'DST Date Inoculated': null,
      'LPA Date of Release': null,
      'Smear Date Released': null,
      'TAT Culture Remarks': null,
      'Culture Final Result': null,
      'DST Workbook Remarks': null,
      'LPA Fluoroquinolones': null,
      'LPA Isoniazid Result': null,
      'LPA Mycobacterium Tb': null,
      'Presumptive DS or DR': 'Presumptive DR-TB',
      'Requesting Physician': null,
      'Test Requested Smear': true,
      'Type of Collection 1': null,
      'Type of Collection 2': null,
      'Type of Collection 3': null,
      'Cat IV Screening Code': null,
      'Culture Date Released': null,
      'Culture Result Status': null,
      'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
      'LPA Rifampicin Result': null,
      'DST Method Used Others': null,
      'Date transfered to DST': null,
      'Patient Contact Number': null,
      'Test Requested Culture': true,
      'Culture Date Inoculated': null,
      'Facility Contact Number': null,
      'LPA Aminoglycosides/ SLI': null,
      'Referring Health Facility': 'Pagsanjan Rural Health Unit',
      'Smear Only Test Requested': 'DSSM Only',
      'DST Releasing Form MedTech': null,
      'Laboratory Registry Remarks': null,
      'Smear Only Test Requested 2': 'DSSM Only',
      'DST Releasing Form Lab Manager': 'Cristina C. Villarico, RMT',
      'DST Releasing Form Released Date': null,
      'Laboratory Releasing Form Remarks': null,
      'DSSM&Culture Releasing Form Med Tech': null,
      'Gx Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Gx Remarks': null,
      'DST Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Smear Remarks': null,
      'DSSM&Culture Releasing Form Date Released': null,
      'DSSM&Culture Releasing Form Laboratory Manager':
        'Cristina C. Villarico, RMT',
    }
    const pmdtRecordPayload0014SmearCultureMGITDstSusceptible2Samples = {
      database: 'PMDT_2020',
      table: 'NTRL DATABASE',
      TimeStamp: '262002',
      'Serial Number': '0014',
      'Last Name': 'MITCHEL',
      'First Name': 'LEE',
      'Middle Initial': 'M.',
      Address: 'Bacoor Cavite',
      'Referring Health Facility':
        'Some unknown health facility with a really really really really looooooong name',
      'Culture Center': 'NTRL',
      'Cat IV Screening Code': null,
      'MRF Date Requested': '2020-01-06T00:00:00.000Z',
      Age: 33,
      Sex: 'Male',
      'DST Center': 'NTRL',
      'Requesting Physician': 'Dr. Veto',
      'Treatment Schedule': 'BAS',
      'Month of tx': null,
      Enrolled: null,
      'Registration Group': 'PTOU',
      'Treatment Category': 'Retreatment',
      'Type of Specimen': null,
      '(If Others) Specify': null,
      Site: 'Pulmonary',
      'Test Requested Smear': true,
      'Test Requested Culture': true,
      'Test Requested DST': false,
      'Test Requested LPA': false,
      'Test Requested Gx': false,
      'Date transfered to DST': null,
      'Presumptive DS or DR': null,
      'Lab No 1': 'N-20-0014',
      'Date Collected 1': '2020-01-05T00:00:00.000Z',
      'Date Collected 2': '2020-01-05T00:00:00.000Z',
      'Date Collected 3': null,
      'Type of Collection 1': null,
      'Type of Collection 2': null,
      'Type of Collection 3': null,
      'Volume 1': '3ML',
      'Volume 2': '3ML',
      'Volume 3': null,
      'Consistency 1': 'MP',
      'Consistency 2': 'MP',
      'Consistence 3': null,
      'Prepared by': null,
      'Date Received': '2020-01-08T00:00:00.000Z',
      'Encoded By': 'JENNY BRIONES',
      'Date Encoded': '2020-01-08T00:00:00.000Z',
      'Smear Method': 'Fluorescence Microscopy',
      'Smear Method 2': null,
      'Smear Result 1': '2+',
      'Smear Result 2': '1+',
      'Smear Final Result': 'POSITIVE FOR Acid Fast Bacilli',
      'Smear Date Released': '2020-01-14T00:00:00.000Z',
      'Smear Only Test Requested': 'DSSM Only',
      'Smear Only Test Requested 2': 'DSSM Only',
      'Smear TAT': null,
      'Smear Lab Tech': 'Kevin Joshua A. Alonzo, RMT',
      'Smear Encoded by': 'Kevin Joshua A. Alonzo, RMT',
      'Culture Date Inoculated': null,
      'Culture Med Tech': null,
      'Culture Result Status': null,
      'Culture DST Status': null,
      'Culture Method': 'Liquid Culture(MGIT)',
      'Culture Method 2': null,
      'Culture Result 1': 'M. tuberculosis',
      'Culture Grade 1': null,
      'Culture Result 2': 'M. tuberculosis',
      'Culture Grade 2': null,
      'Culture Final Result': 'M. tuberculosis',
      'Culture Date Released': '2020-02-05T00:00:00.000Z',
      'Culture Encoded by': 'Krissha Mae P. Marfil, RMT',
      'Culture Lab Tech': 'Krissha Mae P. Marfil, RMT',
      'Culture TAT': null,
      'Culture Lab Manager': 'Ma. Cecilia G. Ama, MD',
      'Culture Remarks 1': null,
      'Culture Remarks 2': null,
      'TAT Culture Remarks': null,
      'DSSM&Culture Releasing Form Med Tech': null,
      'DSSM&Culture Releasing Form Date Released': null,
      'DSSM&Culture Releasing Form Laboratory Manager':
        'Cristina C. Villarico, RMT',
      'DST ID Result': null,
      'DST Date Inoculated': null,
      'DST MT Inoculated': null,
      Streptomycin: 'SUSCEPTIBLE',
      Isoniazid: 'SUSCEPTIBLE',
      Rifampicin: 'SUSCEPTIBLE',
      Ethambutol: 'SUSCEPTIBLE',
      Kanamycin: null,
      Levofloxacin: null,
      Amikacin: null,
      Capreomycin: null,
      Pyrazinamide: 'SUSCEPTIBLE',
      Ofloxacin: null,
      Ciprofloxacin: null,
      'DST Date Read': null,
      'DST MT Read': null,
      'DST Date Released': '2020-02-05T00:00:00.000Z',
      'DST Lab Tech': 'Roeus Vincent Arjay G. Reyes, RMT',
      'DST TAT': null,
      'DST Test Requested': 'FLD DST',
      'DST Laboratory Releasing Form Remarks': null,
      'DST Releasing Form MedTech': null,
      'DST Releasing Form Released Date': null,
      'DST Releasing Form Lab Manager': 'Ma. Cecilia G. Ama, MD',
      'DST Method Used': 'Liquid Culture (MGIT 960)',
      'DST Method Used Others': null,
      'DST Workbook Remarks': null,
      'DST Remarks': null,
      'DST Encoded by': 'Krissha Mae P. Marfil, RMT',
      'Gx Processing Date': null,
      'Gx MTB': null,
      'Gx Rifampicin': null,
      'Gx Date Released': null,
      'Gx Examiner': null,
      'Gx TAT': null,
      'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
      'Gx Center': null,
      'Gx Laboratory Releasing Form Remarks': null,
      'LPA Male': false,
      'Gx Remarks': null,
      'TB Case Number': null,
      'LPA Kit Used': null,
      'LPA Kit Others': null,
      'LPA Date Processed': null,
      'LPA MTB Complex': null,
      'LPA Isoniazid Result': null,
      'LPA Rifampicin': null,
      'LPA Isoniazid': null,
      'LPA Rifampicin Result': null,
      'LPA Date Released': null,
      'LPA Ethambutol': null,
      'LPA Examiner': null,
      'LPA Fluoroquinolones': null,
      'LPA Aminoglycosides/ SLI': null,
      'LPA Mycobacterium Tb': null,
      'LPA Lab Manager': 'Noel G. Macalalad, MD',
      'LPA Remarks:': null,
      'LPA Center': null,
      'LPA Performed By': null,
      'LPA Reviewed By': null,
      'LPA Date of Release': null,
      'LPA Remarks': null,
      'LPA TAT': null,
      'Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Gx Remarks': null,
      'Laboratory Releasing Form Smear Remarks': null,
      'Laboratory Registry Remarks': null,
      'Facility Contact Number': null,
      'Patient Contact Number': null,
      'Date Dispatch': null,
    }
    const pmdtRecordPayload0015SmearCultureMGITDstContaminated2Samples = {
      database: 'PMDT_2020',
      table: 'NTRL DATABASE',
      TimeStamp: '262003',
      'Serial Number': '0015',
      'Last Name': null,
      'First Name': null,
      'Middle Initial': null,
      Address: 'Bacoor Cavite',
      'Referring Health Facility': 'antipolo city health office',
      'Culture Center': 'NTRL',
      'Cat IV Screening Code': null,
      'MRF Date Requested': '2020-01-30T00:00:00.000Z',
      Age: 1,
      Sex: 'Female',
      'DST Center': 'NTRL',
      'Requesting Physician': 'Dr. Veto',
      'Treatment Schedule': 'BAS',
      'Month of tx': null,
      Enrolled: null,
      'Registration Group': 'PTOU',
      'Treatment Category': 'Retreatment',
      'Type of Specimen': null,
      '(If Others) Specify': null,
      Site: 'Pulmonary',
      'Test Requested Smear': true,
      'Test Requested Culture': true,
      'Test Requested DST': false,
      'Test Requested LPA': false,
      'Test Requested Gx': false,
      'Date transfered to DST': null,
      'Presumptive DS or DR': null,
      'Lab No 1': 'N-20-0014',
      'Date Collected 1': '2020-01-05T00:00:00.000Z',
      'Date Collected 2': '2020-01-05T00:00:00.000Z',
      'Date Collected 3': null,
      'Type of Collection 1': null,
      'Type of Collection 2': null,
      'Type of Collection 3': null,
      'Volume 1': '3ML',
      'Volume 2': '3ML',
      'Volume 3': null,
      'Consistency 1': 'MP',
      'Consistency 2': 'MP',
      'Consistence 3': null,
      'Prepared by': null,
      'Date Received': '2020-01-08T00:00:00.000Z',
      'Encoded By': 'JENNY BRIONES',
      'Date Encoded': '2020-01-08T00:00:00.000Z',
      'Smear Method': 'Fluorescence Microscopy',
      'Smear Method 2': null,
      'Smear Result 1': '2+',
      'Smear Result 2': '1+',
      'Smear Final Result': 'POSITIVE FOR Acid Fast Bacilli',
      'Smear Date Released': '2020-01-14T00:00:00.000Z',
      'Smear Only Test Requested': 'DSSM Only',
      'Smear Only Test Requested 2': 'DSSM Only',
      'Smear TAT': null,
      'Smear Lab Tech': 'Kevin Joshua A. Alonzo, RMT',
      'Smear Encoded by': 'Kevin Joshua A. Alonzo, RMT',
      'Culture Date Inoculated': null,
      'Culture Med Tech': null,
      'Culture Result Status': null,
      'Culture DST Status': null,
      'Culture Method': 'Liquid Culture(MGIT)',
      'Culture Method 2': null,
      'Culture Result 1': 'M. tuberculosis',
      'Culture Grade 1': null,
      'Culture Result 2': 'M. tuberculosis',
      'Culture Grade 2': null,
      'Culture Final Result': 'M. tuberculosis',
      'Culture Date Released': '2020-02-05T00:00:00.000Z',
      'Culture Encoded by': 'Krissha Mae P. Marfil, RMT',
      'Culture Lab Tech': 'Krissha Mae P. Marfil, RMT',
      'Culture TAT': null,
      'Culture Lab Manager': 'Ma. Cecilia G. Ama, MD',
      'Culture Remarks 1': null,
      'Culture Remarks 2': null,
      'TAT Culture Remarks': null,
      'DSSM&Culture Releasing Form Med Tech': null,
      'DSSM&Culture Releasing Form Date Released': null,
      'DSSM&Culture Releasing Form Laboratory Manager':
        'Cristina C. Villarico, RMT',
      'DST ID Result': null,
      'DST Date Inoculated': null,
      'DST MT Inoculated': null,
      Streptomycin: 'CONTAMINATED',
      Isoniazid: 'SUSCEPTIBLE',
      Rifampicin: 'SUSCEPTIBLE',
      Ethambutol: 'SUSCEPTIBLE',
      Kanamycin: null,
      Levofloxacin: null,
      Amikacin: null,
      Capreomycin: null,
      Pyrazinamide: 'SUSCEPTIBLE',
      Ofloxacin: null,
      Ciprofloxacin: null,
      'DST Date Read': null,
      'DST MT Read': null,
      'DST Date Released': '2020-02-05T00:00:00.000Z',
      'DST Lab Tech': 'Roeus Vincent Arjay G. Reyes, RMT',
      'DST TAT': null,
      'DST Test Requested': 'FLD DST',
      'DST Laboratory Releasing Form Remarks': null,
      'DST Releasing Form MedTech': null,
      'DST Releasing Form Released Date': null,
      'DST Releasing Form Lab Manager': 'Ma. Cecilia G. Ama, MD',
      'DST Method Used': 'Liquid Culture (MGIT 960)',
      'DST Method Used Others': null,
      'DST Workbook Remarks': null,
      'DST Remarks': null,
      'DST Encoded by': 'Krissha Mae P. Marfil, RMT',
      'Gx Processing Date': null,
      'Gx MTB': null,
      'Gx Rifampicin': null,
      'Gx Date Released': null,
      'Gx Examiner': null,
      'Gx TAT': null,
      'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
      'Gx Center': null,
      'Gx Laboratory Releasing Form Remarks': null,
      'LPA Male': false,
      'Gx Remarks': null,
      'TB Case Number': null,
      'LPA Kit Used': null,
      'LPA Kit Others': null,
      'LPA Date Processed': null,
      'LPA MTB Complex': null,
      'LPA Isoniazid Result': null,
      'LPA Rifampicin': null,
      'LPA Isoniazid': null,
      'LPA Rifampicin Result': null,
      'LPA Date Released': null,
      'LPA Ethambutol': null,
      'LPA Examiner': null,
      'LPA Fluoroquinolones': null,
      'LPA Aminoglycosides/ SLI': null,
      'LPA Mycobacterium Tb': null,
      'LPA Lab Manager': 'Noel G. Macalalad, MD',
      'LPA Remarks:': null,
      'LPA Center': null,
      'LPA Performed By': null,
      'LPA Reviewed By': null,
      'LPA Date of Release': null,
      'LPA Remarks': null,
      'LPA TAT': null,
      'Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Gx Remarks': null,
      'Laboratory Releasing Form Smear Remarks': null,
      'Laboratory Registry Remarks': null,
      'Facility Contact Number': null,
      'Patient Contact Number': null,
      'Date Dispatch': null,
    }
    const pmdtRecordPayload0016SmearCultureMGITDstResistant2Samples = {
      database: 'PMDT_2020',
      table: 'NTRL DATABASE',
      TimeStamp: '262004',
      'Serial Number': '0016',
      'Last Name': null,
      'First Name': null,
      'Middle Initial': null,
      Address: 'Bacoor Cavite',
      'Referring Health Facility': null,
      'Culture Center': 'NTRL',
      'Cat IV Screening Code': null,
      'MRF Date Requested': '2020-01-30T00:00:00.000Z',
      Age: 1,
      Sex: 'Female',
      'DST Center': 'NTRL',
      'Requesting Physician': 'Dr. Veto',
      'Treatment Schedule': 'BAS',
      'Month of tx': null,
      Enrolled: null,
      'Registration Group': 'PTOU',
      'Treatment Category': 'Retreatment',
      'Type of Specimen': null,
      '(If Others) Specify': null,
      Site: 'Pulmonary',
      'Test Requested Smear': true,
      'Test Requested Culture': true,
      'Test Requested DST': false,
      'Test Requested LPA': false,
      'Test Requested Gx': false,
      'Date transfered to DST': null,
      'Presumptive DS or DR': null,
      'Lab No 1': null,
      'Date Collected 1': '2020-01-05T00:00:00.000Z',
      'Date Collected 2': '2020-01-05T00:00:00.000Z',
      'Date Collected 3': null,
      'Type of Collection 1': null,
      'Type of Collection 2': null,
      'Type of Collection 3': null,
      'Volume 1': '3ML',
      'Volume 2': '3ML',
      'Volume 3': null,
      'Consistency 1': 'MP',
      'Consistency 2': 'MP',
      'Consistence 3': null,
      'Prepared by': null,
      'Date Received': '2020-01-08T00:00:00.000Z',
      'Encoded By': 'JENNY BRIONES',
      'Date Encoded': '2020-01-08T00:00:00.000Z',
      'Smear Method': 'Fluorescence Microscopy',
      'Smear Method 2': null,
      'Smear Result 1': '2+',
      'Smear Result 2': '1+',
      'Smear Final Result': 'POSITIVE FOR Acid Fast Bacilli',
      'Smear Date Released': '2020-01-14T00:00:00.000Z',
      'Smear Only Test Requested': 'DSSM Only',
      'Smear Only Test Requested 2': 'DSSM Only',
      'Smear TAT': null,
      'Smear Lab Tech': 'Kevin Joshua A. Alonzo, RMT',
      'Smear Encoded by': 'Kevin Joshua A. Alonzo, RMT',
      'Culture Date Inoculated': null,
      'Culture Med Tech': null,
      'Culture Result Status': null,
      'Culture DST Status': null,
      'Culture Method': 'Liquid Culture(MGIT)',
      'Culture Method 2': null,
      'Culture Result 1': 'M. tuberculosis',
      'Culture Grade 1': null,
      'Culture Result 2': 'M. tuberculosis',
      'Culture Grade 2': null,
      'Culture Final Result': null,
      'Culture Date Released': '2020-02-05T00:00:00.000Z',
      'Culture Encoded by': 'Krissha Mae P. Marfil, RMT',
      'Culture Lab Tech': 'Krissha Mae P. Marfil, RMT',
      'Culture TAT': null,
      'Culture Lab Manager': 'Ma. Cecilia G. Ama, MD',
      'Culture Remarks 1': null,
      'Culture Remarks 2': null,
      'TAT Culture Remarks': null,
      'DSSM&Culture Releasing Form Med Tech': null,
      'DSSM&Culture Releasing Form Date Released': null,
      'DSSM&Culture Releasing Form Laboratory Manager':
        'Cristina C. Villarico, RMT',
      'DST ID Result': null,
      'DST Date Inoculated': null,
      'DST MT Inoculated': null,
      Streptomycin: 'SUSCEPTIBLE',
      Isoniazid: 'RESISTANT',
      Rifampicin: 'SUSCEPTIBLE',
      Ethambutol: 'SUSCEPTIBLE',
      Kanamycin: null,
      Levofloxacin: null,
      Amikacin: null,
      Capreomycin: 'RESISTANT',
      Pyrazinamide: 'SUSCEPTIBLE',
      Ofloxacin: null,
      Ciprofloxacin: null,
      'DST Date Read': null,
      'DST MT Read': null,
      'DST Date Released': '2020-02-05T00:00:00.000Z',
      'DST Lab Tech': 'Roeus Vincent Arjay G. Reyes, RMT',
      'DST TAT': null,
      'DST Test Requested': 'FLD DST',
      'DST Laboratory Releasing Form Remarks': null,
      'DST Releasing Form MedTech': null,
      'DST Releasing Form Released Date': null,
      'DST Releasing Form Lab Manager': 'Ma. Cecilia G. Ama, MD',
      'DST Method Used': 'Liquid Culture (MGIT 960)',
      'DST Method Used Others': null,
      'DST Workbook Remarks': null,
      'DST Remarks': null,
      'DST Encoded by': 'Krissha Mae P. Marfil, RMT',
      'Gx Processing Date': null,
      'Gx MTB': null,
      'Gx Rifampicin': null,
      'Gx Date Released': null,
      'Gx Examiner': null,
      'Gx TAT': null,
      'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
      'Gx Center': null,
      'Gx Laboratory Releasing Form Remarks': null,
      'LPA Male': false,
      'Gx Remarks': null,
      'TB Case Number': null,
      'LPA Kit Used': null,
      'LPA Kit Others': null,
      'LPA Date Processed': null,
      'LPA MTB Complex': null,
      'LPA Isoniazid Result': null,
      'LPA Rifampicin': null,
      'LPA Isoniazid': null,
      'LPA Rifampicin Result': null,
      'LPA Date Released': null,
      'LPA Ethambutol': null,
      'LPA Examiner': null,
      'LPA Fluoroquinolones': null,
      'LPA Aminoglycosides/ SLI': null,
      'LPA Mycobacterium Tb': null,
      'LPA Lab Manager': 'Noel G. Macalalad, MD',
      'LPA Remarks:': null,
      'LPA Center': null,
      'LPA Performed By': null,
      'LPA Reviewed By': null,
      'LPA Date of Release': null,
      'LPA Remarks': null,
      'LPA TAT': null,
      'Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Gx Remarks': null,
      'Laboratory Releasing Form Smear Remarks': null,
      'Laboratory Registry Remarks': null,
      'Facility Contact Number': null,
      'Patient Contact Number': null,
      'Date Dispatch': null,
    }
    const pmdtRecordPayload0017SmearCultureMGITDstResistant2Samples = {
      database: 'PMDT_2020',
      table: 'NTRL DATABASE',
      TimeStamp: '262005',
      'Serial Number': '0017',
      'Last Name': null,
      'First Name': 'Jane',
      'Middle Initial': null,
      Address: 'Bacoor Cavite',
      'Referring Health Facility': null,
      'Culture Center': 'NTRL',
      'Cat IV Screening Code': null,
      'MRF Date Requested': '2020-01-30T00:00:00.000Z',
      Age: 1,
      Sex: null,
      'DST Center': 'NTRL',
      'Requesting Physician': 'Dr. Veto',
      'Treatment Schedule': 'BAS',
      'Month of tx': null,
      Enrolled: null,
      'Registration Group': 'PTOU',
      'Treatment Category': 'Retreatment',
      'Type of Specimen': null,
      '(If Others) Specify': null,
      Site: 'Pulmonary',
      'Test Requested Smear': true,
      'Test Requested Culture': true,
      'Test Requested DST': false,
      'Test Requested LPA': false,
      'Test Requested Gx': false,
      'Date transfered to DST': null,
      'Presumptive DS or DR': null,
      'Lab No 1': null,
      'Date Collected 1': '2020-01-05T00:00:00.000Z',
      'Date Collected 2': '2020-01-05T00:00:00.000Z',
      'Date Collected 3': null,
      'Type of Collection 1': null,
      'Type of Collection 2': null,
      'Type of Collection 3': null,
      'Volume 1': '3ML',
      'Volume 2': '3ML',
      'Volume 3': null,
      'Consistency 1': 'MP',
      'Consistency 2': 'MP',
      'Consistence 3': null,
      'Prepared by': null,
      'Date Received': '2020-01-08T00:00:00.000Z',
      'Encoded By': 'JENNY BRIONES',
      'Date Encoded': '2020-01-08T00:00:00.000Z',
      'Smear Method': 'Fluorescence Microscopy',
      'Smear Method 2': null,
      'Smear Result 1': '2+',
      'Smear Result 2': '1+',
      'Smear Final Result': 'POSITIVE FOR Acid Fast Bacilli',
      'Smear Date Released': '2020-01-14T00:00:00.000Z',
      'Smear Only Test Requested': 'DSSM Only',
      'Smear Only Test Requested 2': 'DSSM Only',
      'Smear TAT': null,
      'Smear Lab Tech': 'Kevin Joshua A. Alonzo, RMT',
      'Smear Encoded by': 'Kevin Joshua A. Alonzo, RMT',
      'Culture Date Inoculated': null,
      'Culture Med Tech': null,
      'Culture Result Status': null,
      'Culture DST Status': null,
      'Culture Method': null,
      'Culture Method 2': null,
      'Culture Result 1': null,
      'Culture Grade 1': null,
      'Culture Result 2': 'M. tuberculosis',
      'Culture Grade 2': null,
      'Culture Final Result': null,
      'Culture Date Released': '2020-02-05T00:00:00.000Z',
      'Culture Encoded by': 'Krissha Mae P. Marfil, RMT',
      'Culture Lab Tech': null,
      'Culture TAT': null,
      'Culture Lab Manager': 'Ma. Cecilia G. Ama, MD',
      'Culture Remarks 1': null,
      'Culture Remarks 2': null,
      'TAT Culture Remarks': null,
      'DSSM&Culture Releasing Form Med Tech': null,
      'DSSM&Culture Releasing Form Date Released': null,
      'DSSM&Culture Releasing Form Laboratory Manager':
        'Cristina C. Villarico, RMT',
      'DST ID Result': null,
      'DST Date Inoculated': null,
      'DST MT Inoculated': null,
      Streptomycin: 'NOT DONE',
      Isoniazid: 'NOT DONE',
      Rifampicin: 'NOT DONE',
      Ethambutol: 'NOT DONE',
      Kanamycin: 'NON VIABLE',
      Levofloxacin: null,
      Amikacin: null,
      Capreomycin: 'NOT DONE',
      Pyrazinamide: 'NOT DONE',
      Ofloxacin: null,
      Ciprofloxacin: null,
      'DST Date Read': null,
      'DST MT Read': null,
      'DST Date Released': '2020-02-05T00:00:00.000Z',
      'DST Lab Tech': 'Roeus Vincent Arjay G. Reyes, RMT',
      'DST TAT': null,
      'DST Test Requested': 'FLD DST',
      'DST Laboratory Releasing Form Remarks': null,
      'DST Releasing Form MedTech': null,
      'DST Releasing Form Released Date': null,
      'DST Releasing Form Lab Manager': 'Ma. Cecilia G. Ama, MD',
      'DST Method Used': 'Liquid Culture (MGIT 960)',
      'DST Method Used Others': null,
      'DST Workbook Remarks': null,
      'DST Remarks': null,
      'DST Encoded by': 'Krissha Mae P. Marfil, RMT',
      'Gx Processing Date': null,
      'Gx MTB': null,
      'Gx Rifampicin': null,
      'Gx Date Released': null,
      'Gx Examiner': null,
      'Gx TAT': null,
      'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
      'Gx Center': null,
      'Gx Laboratory Releasing Form Remarks': null,
      'LPA Male': false,
      'Gx Remarks': null,
      'TB Case Number': null,
      'LPA Kit Used': null,
      'LPA Kit Others': null,
      'LPA Date Processed': null,
      'LPA MTB Complex': null,
      'LPA Isoniazid Result': null,
      'LPA Rifampicin': null,
      'LPA Isoniazid': null,
      'LPA Rifampicin Result': null,
      'LPA Date Released': null,
      'LPA Ethambutol': null,
      'LPA Examiner': null,
      'LPA Fluoroquinolones': null,
      'LPA Aminoglycosides/ SLI': null,
      'LPA Mycobacterium Tb': null,
      'LPA Lab Manager': 'Noel G. Macalalad, MD',
      'LPA Remarks:': null,
      'LPA Center': null,
      'LPA Performed By': null,
      'LPA Reviewed By': null,
      'LPA Date of Release': null,
      'LPA Remarks': null,
      'LPA TAT': null,
      'Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Gx Remarks': null,
      'Laboratory Releasing Form Smear Remarks': null,
      'Laboratory Registry Remarks': null,
      'Facility Contact Number': null,
      'Patient Contact Number': null,
      'Date Dispatch': null,
    }
    const pmdtRecordPayload03694GxPositiveResistant1Sample = {
      database: 'PMDT',
      table: 'NTRL DATABASE',
      TimeStamp: '59575',
      'Serial Number': '03694',
      'Last Name': 'Olerowahu',
      'First Name': 'Gondo',
      'Middle Initial': null,
      Address: null,
      'Referring Health Facility': 'Chung Hua Hosp.',
      'Culture Center': 'NTRL',
      'Cat IV Screening Code': null,
      'MRF Date Requested': '2019-06-07T00:00:00.000Z',
      Age: 31,
      Sex: 'Male',
      'DST Center': 'NTRL',
      'Requesting Physician': null,
      'Treatment Schedule': null,
      'Month of tx': null,
      Enrolled: null,
      'Registration Group': 'New',
      'Treatment Category': 'New',
      'Type of Specimen': 'Others',
      '(If Others) Specify': 'ABCESS',
      Site: 'Extrapulmonary',
      'Test Requested Smear': false,
      'Test Requested Culture': false,
      'Test Requested DST': false,
      'Test Requested LPA': false,
      'Test Requested Gx': true,
      'Date transfered to DST': null,
      'Presumptive DS or DR': null,
      'Lab No 1': 'N-19-3694',
      'Date Collected 1': '2019-06-07T00:00:00.000Z',
      'Date Collected 2': null,
      'Date Collected 3': null,
      'Type of Collection 1': null,
      'Type of Collection 2': null,
      'Type of Collection 3': null,
      'Volume 1': '3ML',
      'Volume 2': null,
      'Volume 3': null,
      'Consistency 1': null,
      'Consistency 2': null,
      'Consistence 3': null,
      'Prepared by': null,
      'Date Received': '2019-06-17T00:00:00.000Z',
      'Encoded By': 'Jenny B.  Lasprilla',
      'Date Encoded': '2019-06-17T00:00:00.000Z',
      'Smear Method': null,
      'Smear Method 2': null,
      'Smear Result 1': null,
      'Smear Result 2': null,
      'Smear Final Result': null,
      'Smear Date Released': null,
      'Smear Only Test Requested': 'DSSM Only',
      'Smear Only Test Requested 2': 'DSSM Only',
      'Smear TAT': null,
      'Smear Lab Tech': null,
      'Smear Encoded by': null,
      'Culture Date Inoculated': null,
      'Culture Med Tech': null,
      'Culture Result Status': null,
      'Culture DST Status': null,
      'Culture Method': null,
      'Culture Method 2': null,
      'Culture Result 1': null,
      'Culture Grade 1': null,
      'Culture Result 2': null,
      'Culture Grade 2': null,
      'Culture Final Result': null,
      'Culture Date Released': null,
      'Culture Encoded by': null,
      'Culture Lab Tech': null,
      'Culture TAT': null,
      'Culture Lab Manager': 'Ma. Cecilia G. Ama, MD',
      'Culture Remarks 1': null,
      'Culture Remarks 2': null,
      'TAT Culture Remarks': null,
      'DSSM&Culture Releasing Form Med Tech': null,
      'DSSM&Culture Releasing Form Date Released': null,
      'DSSM&Culture Releasing Form Laboratory Manager':
        'Ma. Cecilia G. Ama, MD',
      'DST ID Result': null,
      'DST Date Inoculated': null,
      'DST MT Inoculated': null,
      Streptomycin: null,
      Isoniazid: null,
      Rifampicin: null,
      Ethambutol: null,
      Kanamycin: null,
      Levofloxacin: null,
      Amikacin: null,
      Capreomycin: null,
      Pyrazinamide: null,
      Ofloxacin: null,
      Ciprofloxacin: null,
      'DST Date Read': null,
      'DST MT Read': null,
      'DST Date Released': null,
      'DST Lab Tech': null,
      'DST TAT': null,
      'DST Test Requested': null,
      'DST Laboratory Releasing Form Remarks': null,
      'DST Releasing Form MedTech': null,
      'DST Releasing Form Released Date': null,
      'DST Releasing Form Lab Manager': 'Ma. Cecilia G. Ama, MD',
      'DST Method Used': null,
      'DST Method Used Others': null,
      'DST Workbook Remarks': null,
      'DST Remarks': null,
      'DST Encoded by': null,
      'Gx Processing Date': '2019-06-19T00:00:00.000Z',
      'Gx MTB': 'POSITIVE',
      'Gx Rifampicin': 'RESISTANT',
      'Gx Date Released': '2019-06-20T00:00:00.000Z',
      'Gx Examiner': 'Kevin Joshua A. Alonzo, RMT',
      'Gx TAT': null,
      'Gx Laboratory Manager': 'Noel G. Macalalad, MD',
      'Gx Center': null,
      'Gx Laboratory Releasing Form Remarks': null,
      'LPA Male': false,
      'Gx Remarks': null,
      'TB Case Number': null,
      'LPA Kit Used': null,
      'LPA Kit Others': null,
      'LPA Date Processed': null,
      'LPA MTB Complex': null,
      'LPA Isoniazid Result': null,
      'LPA Rifampicin': null,
      'LPA Isoniazid': null,
      'LPA Rifampicin Result': null,
      'LPA Date Released': null,
      'LPA Ethambutol': null,
      'LPA Examiner': null,
      'LPA Fluoroquinolones': null,
      'LPA Aminoglycosides/ SLI': null,
      'LPA Mycobacterium Tb': null,
      'LPA Lab Manager': 'Noel G. Macalalad, MD',
      'LPA Remarks:': null,
      'LPA Center': null,
      'LPA Performed By': null,
      'LPA Reviewed By': null,
      'LPA Date of Release': null,
      'LPA Remarks': null,
      'LPA TAT': null,
      'Laboratory Releasing Form Remarks': null,
      'Laboratory Releasing Form Gx Remarks': null,
      'Laboratory Releasing Form Smear Remarks': null,
      'Laboratory Registry Remarks': null,
    }
    const pmdtRecordPayloads = [
      pmdtRecordPayload8442SmearCultureNegative2Samples,
      pmdtRecordPayload1855LpaRequestedNoResults1Sample,
      pmdtRecordPayload0494CultureSmearLpaTbPositive2Samples,
      pmdtRecordPayload0495CultureSmearLpaTbResistant2Samples,
      pmdtRecordPayload0336CultureNoResults1Sample,
      pmdtRecordPayload0350CultureNoResults3Samples,
      pmdtRecordPayload0014SmearCultureMGITDstSusceptible2Samples,
      pmdtRecordPayload0015SmearCultureMGITDstContaminated2Samples,
      pmdtRecordPayload0016SmearCultureMGITDstResistant2Samples,
      pmdtRecordPayload0017SmearCultureMGITDstResistant2Samples,
      pmdtRecordPayload03694GxPositiveResistant1Sample,
    ]

    const existingSample = existingSamples['PN-19-8442-1']
    const existingResultRecords = [
      {
        id: 10,
        assayId: staticDatabaseData.Assay.assayGenericDst,
        resultData: JSON.stringify({
          encodedResult: {
            readBy: null,
            labTech: null,
            remarks: null,
            amikacin: null,
            dateRead: null,
            idResult: 'No growth after 8 weeks',
            encodedBy: null,
            isoniazid: null,
            kanamycin: null,
            ethambutol: null,
            methodUsed: null,
            reviewedBy: 'Ma. Cecilia G. Ama, MD',
            rifampicin: null,
            capreomycin: null,
            dateReleased: null,
            inoculatedBy: null,
            levofloxacin: null,
            pyrazinamide: null,
            streptomycin: null,
            testRequested: null,
            dateInoculated: null,
            otherMethodUsed: null,
          },
        }),
        externalId: '20200302_DST_PN-19-8442-1',
        senderOperator: 'bryan',
        endedOn: '2019-08-25T14:53:11.000Z',
        patientData: '{}',
        sampleId: existingSample.id,
        updatedOn: '2019-09-15T08:09:10.123Z',
        resultCategory1: staticDatabaseData.ResultCategory.Missing,
        errorCode: 'OPEN',
        notes: '',
        createdOn: '2019-09-14T08:09:10.123Z',
      },
      {
        id: 11,
        assayId: staticDatabaseData.Assay.assayCulture,
        resultData: JSON.stringify({
          encodedResult: {
            readBy: null,
            labTech: null,
            remarks: null,
            amikacin: null,
            dateRead: null,
            idResult: 'No growth after 8 weeks',
            encodedBy: null,
            isoniazid: null,
            kanamycin: null,
            ethambutol: null,
            methodUsed: null,
            reviewedBy: 'Ma. Cecilia G. Ama, MD',
            rifampicin: null,
            capreomycin: null,
            dateReleased: null,
            inoculatedBy: null,
            levofloxacin: null,
            pyrazinamide: null,
            streptomycin: null,
            testRequested: null,
            dateInoculated: null,
            otherMethodUsed: null,
          },
        }),
        externalId: '20200203_CULTURE_PN-19-8442-1',
        senderOperator: 'bryan',
        endedOn: '2019-08-25T14:53:11.000Z',
        patientData: '{}',
        sampleId: existingSample.id,
        updatedOn: '2019-09-15T08:09:10.123Z',
        resultCategory1: staticDatabaseData.ResultCategory.Missing,
        errorCode: 'OPEN',
        notes: '',
        createdOn: '2019-09-14T08:09:10.123Z',
      },
    ]

    function mockOutPhilippinesNTRLPMDTDataProcessor(
      updateSpy,
      insertSpy,
      existingSamplesInDatabase = existingSamples
    ) {
      const buildKnexSpy = (updateSpy, insertSpy) => table => {
        const knex = {
          insert: async (...insertParams) => {
            insertSpy(table, ...insertParams)
            return Promise.resolve([insertSpy.callCount])
          },
        }
        const where = (...whereParams) => {
          const finalCall = {
            first: async (...firstParams) => {
              if (
                table === 'Result' &&
                _.some(existingResultRecords, {
                  externalId: _.get(whereParams, '1'),
                })
              ) {
                return Promise.resolve(
                  _.find(existingResultRecords, {
                    externalId: _.get(whereParams, '1'),
                  })
                )
              }
              if (
                table === 'Sample' &&
                existingSamplesInDatabase[_.get(whereParams, '1')]
              ) {
                return Promise.resolve(
                  existingSamplesInDatabase[_.get(whereParams, '1')]
                )
              }
              if (
                table === 'Device as d' &&
                whereParams[0] === 'd.id' &&
                whereParams[1] === databaseRecords.DeviceApiKey.deviceId &&
                _.every(
                  [
                    's.*',
                    'd.name as deviceName',
                    'd.defaultReportableSiteId as deviceDefaultReportableSiteId',
                  ],
                  selectArg => firstParams.includes(selectArg)
                )
              ) {
                return Promise.resolve(databaseRecords.Site)
              }
              if (
                table === 'DeviceApiKey' &&
                whereParams[0] === 'token' &&
                whereParams[1] === 'bad-token'
              ) {
                return Promise.resolve({})
              }
              if (
                table === 'Site' &&
                whereParams[0] === 'externalId' &&
                (whereParams[1] === null ||
                  whereParams[1] ===
                    'Some unknown health facility with a really really really really looooooong name' ||
                  whereParams[1] === 'Unknown health facility')
              ) {
                return Promise.resolve()
              }
              if (
                table === 'Site' &&
                whereParams[0] === 'externalId' &&
                whereParams[1] === 'IVA - ANTIPOLO CHO'
              ) {
                return Promise.resolve({
                  id: 12,
                  longitude: 13,
                  latitude: 14,
                  partnerId: 15,
                  geographyId: 16,
                  externalId: 'IVA - ANTIPOLO CHO',
                })
              }
              return Promise.resolve(databaseRecords[table])
            },
            update: async (...updateParams) => {
              updateSpy(table, ...updateParams)
              return Promise.resolve()
            },
          }
          const whereChain = () => finalCall
          finalCall.andWhere = whereChain
          finalCall.orWhere = whereChain
          finalCall.whereNull = whereChain
          finalCall.whereIn = whereChain
          return finalCall
        }
        knex.where = where
        const join = () => knex
        knex.join = join
        knex.leftJoin = join
        return knex
      }
      const resolveWith = returnValue => async () =>
        Promise.resolve(returnValue)
      return proxyquire(
        '../../src/deviceApiRaw/dataProcessors/philippinesNtrlPmdt',
        {
          '../../db': {
            transact: async transaction =>
              transaction(buildKnexSpy(updateSpy, insertSpy)),
          },
          '../../shared/date': {
            parseDateOrDefault,
            getUtcTime: () => utcNow,
            dateEqual,
          },
          '../../shared/dictionary': {
            assayToId: async assayExternalId =>
              Promise.resolve(staticDatabaseData.Assay[assayExternalId]),
            allAssayToId: resolveWith(staticDatabaseData.Assay),
            sampleTypeToId: async sampleTypeExternalId =>
              Promise.resolve(
                staticDatabaseData.SampleType[sampleTypeExternalId]
              ),
            allSampleTypeToId: resolveWith(staticDatabaseData.SampleType),
            resultTypeToId: resolveWith(staticDatabaseData.resultTypeId),
            resultSourceToId: resolveWith(staticDatabaseData.resultSourceId),
            allResultCategoryToId: resolveWith(
              staticDatabaseData.ResultCategory
            ),
            allResultWorkflowStatusToId: resolveWith(
              staticDatabaseData.ResultWorkflowStatus
            ),
          },
          '../../shared/request': {
            getRemoteAddress: () => deviceIpAddress,
          },
        }
      )
    }

    function setupPhilippinesNTRLPMDTDataProcessorWithSpies(
      deviceApiKeyToken,
      payload,
      existingSamplesInDatabase
    ) {
      const updateSpy = sinon.spy()
      const insertSpy = sinon.spy()
      const PhilippinesNTRLPMDTDataProcessor = mockOutPhilippinesNTRLPMDTDataProcessor(
        updateSpy,
        insertSpy,
        existingSamplesInDatabase
      )
      const philippinesNTRLPMDT = new PhilippinesNTRLPMDTDataProcessor(
        {
          auth: { credentials: { token: deviceApiKeyToken } },
          plugins: { rawPayload: 'the raw message' },
          payload,
        },
        { dispatch: () => {} }
      )
      return {
        updateSpy,
        insertSpy,
        philippinesNTRLPMDT,
      }
    }

    function getNtrlLabRequestIdFromPayload(payload) {
      const labRequestIdPrefix =
        payload.database === 'PMDT'
          ? 'PN-19-'
          : `PN-${payload.database.substr(payload.database.length - 2)}-`
      return `${labRequestIdPrefix}${payload['Serial Number']}`
    }

    function generatePatientDataFromPMDTPayload(payload) {
      let patientNameId = payload['Last Name'] || ''
      if (payload['First Name']) {
        if (patientNameId) {
          patientNameId += ', '
        }
        patientNameId += payload['First Name']
      }
      if (patientNameId && payload['Middle Initial']) {
        patientNameId += ` ${payload['Middle Initial']}`
      }
      const ntrlLabRequestId = getNtrlLabRequestIdFromPayload(payload)
      return {
        id:
          payload['TB Case Number'] ||
          patientNameId ||
          payload['Lab No 1'] ||
          ntrlLabRequestId,
        serialNumber: payload['Serial Number'],
        mrfDateRequested: payload['MRF Date Requested'],
        referringHealthFacility: payload['Referring Health Facility'],
        requestingPhysician: payload['Requesting Physician'],
        facilityContactNumber: payload['Facility Contact Number'],
        lastName: payload['Last Name'],
        firstName: payload['First Name'],
        middleInitialOrName: payload['Middle Initial'],
        age: payload.Age,
        sex: payload.Sex,
        address: payload.Address,
        phone: payload['Patient Contact Number'],
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
        labNo1: payload['Lab No 1'],
        tbCaseNumber: payload['TB Case Number'],
        dateCollected1: payload['Date Collected 1'],
        dateCollected2: payload['Date Collected 2'],
        dateCollected3: payload['Date Collected 3'],
        dateDispatched: payload['Date Dispatch'],
        volume1: payload['Volume 1'],
        volume2: payload['Volume 2'],
        volume3: payload['Volume 3'],
        consistency1: payload['Consistency 1'],
        consistency2: payload['Consistency 3'],
        consistency3: payload['Consistency 4'],
        encodedBy: payload['Encoded By'],
        dateEncoded: payload['Date Encoded'],
        healthCareSystem: 'PMDT',
      }
    }

    function getSamplesFromPMDTPayload(payload) {
      const sampleTypeMapping = {
        Sputum: 'Sputum',
        Isolates: 'Isolate',
        Others: 'Other',
      }
      const sampleTypeId =
        staticDatabaseData.SampleType[
          sampleTypeMapping[payload['Type of Specimen']] || 'Other'
        ]
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
      const ntrlLabRequestId = getNtrlLabRequestIdFromPayload(payload)
      return _.range(1, numberOfSamples + 1).map(sampleNumber => {
        const sample = {
          externalId:
            numberOfSamples > 1
              ? `${ntrlLabRequestId}-${sampleNumber}`
              : `${ntrlLabRequestId}`,
          collectedOn: payload[`Date Collected ${sampleNumber}`],
          sampleTypeId,
        }
        return sample
      })
    }

    it('should throw a bad request when the device API key cannot be reconciled with a device', async () => {
      const {
        philippinesNTRLPMDT,
      } = setupPhilippinesNTRLPMDTDataProcessorWithSpies('bad-token', {})
      await expect(philippinesNTRLPMDT.processRequest()).to.be.rejectedWith(
        'Invalid device API key: Cannot determine which device this came from'
      )
    })

    it('should update device lastSeenOn & updatedOn', async () => {
      await Promise.each(pmdtRecordPayloads, async pmdtRecordPayload => {
        const {
          updateSpy,
          philippinesNTRLPMDT,
        } = setupPhilippinesNTRLPMDTDataProcessorWithSpies(
          'some device API key',
          pmdtRecordPayload
        )
        await philippinesNTRLPMDT.processRequest()
        const response = await philippinesNTRLPMDT.getResponse()
        assert.equal(response.deviceId, databaseRecords.Device.id)
        const updateDeviceCalls = updateSpy
          .getCalls()
          .filter(updateCall => updateCall.args[0] === 'Device')
        expect(updateDeviceCalls).to.have.lengthOf(1)
        const actualDeviceUpdates = updateDeviceCalls[0].args[1]
        expect(actualDeviceUpdates).to.containSubset({
          lastSeenOn: utcNow,
          updatedOn: utcNow,
        })
      })
    })

    it('should update existing samples', async () => {
      const {
        insertSpy,
        updateSpy,
        philippinesNTRLPMDT: existingSampleProcessor,
      } = setupPhilippinesNTRLPMDTDataProcessorWithSpies(
        'some device API key',
        pmdtRecordPayload8442SmearCultureNegative2Samples
      )
      await existingSampleProcessor.processRequest()
      const insertSampleCalls = insertSpy
        .getCalls()
        .filter(insertCall => insertCall.args[0] === 'Sample')
      const updateSampleCalls = updateSpy
        .getCalls()
        .filter(updateCall => updateCall.args[0] === 'Sample')
      expect(insertSampleCalls).to.have.lengthOf(0)
      expect(updateSampleCalls).to.have.lengthOf(2)
      expect(updateSampleCalls[0].args[1].collectedOn.toISOString()).to.equal(
        '2019-11-25T00:00:00.000Z'
      )
      expect(updateSampleCalls[1].args[1].collectedOn.toISOString()).to.equal(
        '2019-11-25T00:00:00.000Z'
      )
    })

    it('should insert new samples', async () => {
      const payload = JSON.parse(
        JSON.stringify(pmdtRecordPayload0494CultureSmearLpaTbPositive2Samples)
      )
      const {
        insertSpy,
        updateSpy,
        philippinesNTRLPMDT: newSampleProcessor,
      } = setupPhilippinesNTRLPMDTDataProcessorWithSpies(
        'some device API key',
        payload
      )
      await newSampleProcessor.processRequest()
      const insertSampleCalls = insertSpy
        .getCalls()
        .filter(insertCall => insertCall.args[0] === 'Sample')
      const updateSampleCalls = updateSpy
        .getCalls()
        .filter(updateCall => updateCall.args[0] === 'Sample')
      expect(insertSampleCalls).to.have.lengthOf(2)
      expect(updateSampleCalls).to.have.lengthOf(0)
      expect(insertSampleCalls[0].args[1].collectedOn.toISOString()).to.equal(
        '2020-01-15T00:00:00.000Z'
      )
      expect(insertSampleCalls[1].args[1].collectedOn.toISOString()).to.equal(
        '2020-01-15T00:00:00.000Z'
      )
    })

    it('should insert MGIT DST result when DST values are in the record and the DST method used contains the word MGIT', async () => {
      const payload = JSON.parse(
        JSON.stringify(
          pmdtRecordPayload0014SmearCultureMGITDstSusceptible2Samples
        )
      )
      const {
        insertSpy,
        philippinesNTRLPMDT: dstResultProcessor,
      } = setupPhilippinesNTRLPMDTDataProcessorWithSpies(
        'some device API key',
        pmdtRecordPayload0014SmearCultureMGITDstSusceptible2Samples
      )
      await dstResultProcessor.processRequest()
      const insertResultCalls = insertSpy
        .getCalls()
        .filter(insertCall => insertCall.args[0] === 'Result')
      const dstResults = insertResultCalls
        .map(insert => insert.lastArg)
        .filter(
          resultInsert =>
            resultInsert.assayId === staticDatabaseData.Assay.assayBdMgitAst
        )
      expect(dstResults).to.have.lengthOf(1)
      const dstResult = {
        ...dstResults[0],
        patientData: JSON.parse(dstResults[0].patientData),
        resultData: JSON.parse(dstResults[0].resultData),
        startedOn: dstResults[0].startedOn.toISOString(),
        endedOn: dstResults[0].endedOn.toISOString(),
      }
      const sampleExternalId = getSamplesFromPMDTPayload(payload)[0].externalId
      expect(dstResult).to.containSubset({
        partnerId: databaseRecords.Site.partnerId,
        geographyId: databaseRecords.Site.geographyId,
        siteId: databaseRecords.Site.id,
        deviceId: databaseRecords.DeviceApiKey.deviceId,
        longitude: databaseRecords.Site.longitude,
        latitude: databaseRecords.Site.latitude,
        resultSourceId: staticDatabaseData.resultSourceId,
        resultTypeId: staticDatabaseData.resultTypeId,
        resultCategory1: staticDatabaseData.ResultCategory.PositiveMTB,
        resultCategory2: staticDatabaseData.ResultCategory.Susceptible,
        patientData: generatePatientDataFromPMDTPayload(payload),
        externalId: `${databaseRecords.Site.externalId}_${sampleExternalId}_DST`,
        assayId: staticDatabaseData.Assay.assayBdMgitAst,
        startedOn:
          payload['Date transfered to DST'] ||
          payload['DST Date Read'] ||
          payload['DST Date Released'],
        endedOn:
          payload['DST TAT'] ||
          payload['DST Date Read'] ||
          payload['DST Date Released'],
        resultData: {
          encodedResult: {
            testRequested: payload['DST Test Requested'],
            dateInoculated: payload['DST Date Inoculated'],
            inoculatedBy: payload['DST MT Inoculated'],
            idResult:
              payload['DST ID Result'] || payload['Culture Final Result'], // There is a mis-mapping in the NTRL database that uses the Culture Final Result in the DST result encoding form
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
            dateTransferredToDst: payload['Date transfered to DST'],
            dstTat: payload['DST TAT'],
            dateRead: payload['DST Date Read'],
            dateReleased: payload['DST Date Released'],
            readBy: payload['DST MT Read'],
            labTech: payload['DST Lab Tech'],
            encodedBy: payload['DST Encoded by'],
            reviewedBy: payload['DST Releasing Form Lab Manager'],
          },
        },
        senderOperator: payload['DST Lab Tech'],
        reportableSiteId: databaseRecords.Site.id,
      })
    })

    it('should insert Culture results when Culture values are in the record', async () => {
      const payload = JSON.parse(
        JSON.stringify(
          pmdtRecordPayload0014SmearCultureMGITDstSusceptible2Samples
        )
      )
      const {
        insertSpy,
        philippinesNTRLPMDT: cultureResultProcessor,
      } = setupPhilippinesNTRLPMDTDataProcessorWithSpies(
        'some device API key',
        pmdtRecordPayload0014SmearCultureMGITDstSusceptible2Samples
      )
      await cultureResultProcessor.processRequest()
      const insertResultCalls = insertSpy
        .getCalls()
        .filter(insertCall => insertCall.args[0] === 'Result')
      const cultureResults = insertResultCalls
        .map(insert => insert.lastArg)
        .filter(
          resultInsert =>
            resultInsert.assayId === staticDatabaseData.Assay.assayBdMgitGnd
        )
      expect(cultureResults).to.have.lengthOf(2)
      const cultureResult1 = {
        ...cultureResults[0],
        patientData: JSON.parse(cultureResults[0].patientData),
        resultData: JSON.parse(cultureResults[0].resultData),
        startedOn: cultureResults[0].startedOn.toISOString(),
        endedOn: cultureResults[0].endedOn.toISOString(),
      }
      const sample1ExternalId = getSamplesFromPMDTPayload(payload)[0].externalId
      expect(cultureResult1).to.containSubset({
        partnerId: databaseRecords.Site.partnerId,
        geographyId: databaseRecords.Site.geographyId,
        siteId: databaseRecords.Site.id,
        deviceId: databaseRecords.DeviceApiKey.deviceId,
        longitude: databaseRecords.Site.longitude,
        latitude: databaseRecords.Site.latitude,
        resultSourceId: staticDatabaseData.resultSourceId,
        resultTypeId: staticDatabaseData.resultTypeId,
        resultCategory1: staticDatabaseData.ResultCategory.PositiveMTB,
        resultCategory2: staticDatabaseData.ResultCategory.PositiveMTB,
        patientData: generatePatientDataFromPMDTPayload(payload),
        externalId: `${databaseRecords.Site.externalId}_${sample1ExternalId}_CULTURE`,
        assayId: staticDatabaseData.Assay.assayBdMgitGnd,
        startedOn: payload['Culture Date Released'],
        endedOn: payload['Culture Date Released'],
        resultData: {
          encodedResult: {
            dateInoculated: payload['Culture Date Inoculated'],
            medTech: payload['Culture Med Tech'],
            resultStatus: payload['Culture Result Status'],
            dstStatus: payload['Culture DST Status'],
            methodUsed1: payload['Culture Method'],
            result1: payload['Culture Result 1'],
            grade1: payload['Culture Grade 1'],
            result2: payload['Culture Result 2'],
            grade2: payload['Culture Grade 2'],
            finalResult: payload['Culture Final Result'],
            remarks: payload['Culture Remarks 1'],
            dateReleased: payload['Culture Date Released'],
            encodedBy: payload['Culture Encoded by'],
            labTech: payload['Culture Lab Tech'],
          },
        },
        senderOperator:
          payload['Culture Med Tech'] ||
          payload['Culture Lab Tech'] ||
          payload['Culture Encoded by'],
        reportableSiteId: databaseRecords.Site.id,
      })
      const cultureResult2 = {
        ...cultureResults[1],
        patientData: JSON.parse(cultureResults[1].patientData),
        resultData: JSON.parse(cultureResults[1].resultData),
        startedOn: cultureResults[1].startedOn.toISOString(),
        endedOn: cultureResults[1].endedOn.toISOString(),
      }
      const sample2ExternalId = getSamplesFromPMDTPayload(payload)[1].externalId
      expect(cultureResult2).to.containSubset({
        partnerId: databaseRecords.Site.partnerId,
        geographyId: databaseRecords.Site.geographyId,
        siteId: databaseRecords.Site.id,
        deviceId: databaseRecords.DeviceApiKey.deviceId,
        longitude: databaseRecords.Site.longitude,
        latitude: databaseRecords.Site.latitude,
        resultSourceId: staticDatabaseData.resultSourceId,
        resultTypeId: staticDatabaseData.resultTypeId,
        resultCategory1: staticDatabaseData.ResultCategory.PositiveMTB,
        resultCategory2: staticDatabaseData.ResultCategory.PositiveMTB,
        patientData: generatePatientDataFromPMDTPayload(payload),
        externalId: `${databaseRecords.Site.externalId}_${sample2ExternalId}_CULTURE`,
        assayId: staticDatabaseData.Assay.assayBdMgitGnd,
        startedOn: payload['Culture Date Released'],
        endedOn: payload['Culture Date Released'],
        resultData: {
          encodedResult: {
            dateInoculated: payload['Culture Date Inoculated'],
            medTech: payload['Culture Med Tech'],
            resultStatus: payload['Culture Result Status'],
            dstStatus: payload['Culture DST Status'],
            methodUsed1: payload['Culture Method'],
            result1: payload['Culture Result 1'],
            grade1: payload['Culture Grade 1'],
            result2: payload['Culture Result 2'],
            grade2: payload['Culture Grade 2'],
            finalResult: payload['Culture Final Result'],
            remarks: payload['Culture Remarks 1'],
            dateReleased: payload['Culture Date Released'],
            encodedBy: payload['Culture Encoded by'],
            labTech: payload['Culture Lab Tech'],
          },
        },
        senderOperator:
          payload['Culture Med Tech'] ||
          payload['Culture Lab Tech'] ||
          payload['Culture Encoded by'],
        reportableSiteId: databaseRecords.Site.id,
      })
    })

    it('should insert a LPA result when LPA values are in the record', async () => {
      const payload = JSON.parse(
        JSON.stringify(pmdtRecordPayload0494CultureSmearLpaTbPositive2Samples)
      )
      const {
        insertSpy,
        philippinesNTRLPMDT: lpaResultProcessor,
      } = setupPhilippinesNTRLPMDTDataProcessorWithSpies(
        'some device API key',
        pmdtRecordPayload0494CultureSmearLpaTbPositive2Samples
      )
      await lpaResultProcessor.processRequest()
      const insertResultCalls = insertSpy
        .getCalls()
        .filter(insertCall => insertCall.args[0] === 'Result')
      const lpaResults = insertResultCalls
        .map(insert => insert.lastArg)
        .filter(
          resultInsert =>
            resultInsert.assayId === staticDatabaseData.Assay.assayLPA
        )
      expect(lpaResults).to.have.lengthOf(1)
      const lpaResult = {
        ...lpaResults[0],
        patientData: JSON.parse(lpaResults[0].patientData),
        resultData: JSON.parse(lpaResults[0].resultData),
        startedOn: lpaResults[0].startedOn.toISOString(),
        endedOn: lpaResults[0].endedOn.toISOString(),
      }
      const sampleExternalId = getSamplesFromPMDTPayload(payload)[0].externalId
      expect(lpaResult).to.containSubset({
        partnerId: databaseRecords.Site.partnerId,
        geographyId: databaseRecords.Site.geographyId,
        siteId: databaseRecords.Site.id,
        deviceId: databaseRecords.DeviceApiKey.deviceId,
        longitude: databaseRecords.Site.longitude,
        latitude: databaseRecords.Site.latitude,
        resultSourceId: staticDatabaseData.resultSourceId,
        resultTypeId: staticDatabaseData.resultTypeId,
        resultCategory1: staticDatabaseData.ResultCategory.Detected,
        resultCategory2: staticDatabaseData.ResultCategory.Susceptible,
        patientData: generatePatientDataFromPMDTPayload(payload),
        externalId: `${databaseRecords.Site.externalId}_${sampleExternalId}_LPA`,
        assayId: staticDatabaseData.Assay.assayLPA,
        startedOn: payload['LPA Date of Release'],
        endedOn: payload['LPA Date of Release'],
        resultData: {
          encodedResult: {
            center: payload['LPA Center'],
            lpaKit: payload['LPA Kit Used'],
            lpaKitOther: payload['LPA Kit Others'],
            mtbComplex: payload['LPA MTB Complex'],
            rifampicin: payload['LPA Rifampicin Result'],
            isoniazid: payload['LPA Isoniazid Result'],
            ethambutol: payload['LPA Ethambutol'],
            fluoroquinolones: payload['LPA Fluoroquinolones'],
            aminoglycoside: payload['LPA Aminoglycosides/ SLI'],
            remarks: payload['LPA Remarks:'],
            dateReleased: payload['LPA Date of Release'],
            performedBy: payload['LPA Performed By'],
            reviewedBy: payload['LPA Reviewed By'],
          },
        },
        senderOperator: payload['LPA Performed By'],
        reportableSiteId: databaseRecords.Site.id,
      })
    })

    it('should insert Smear results when Smear values are in the record', async () => {
      const payload = JSON.parse(
        JSON.stringify(
          pmdtRecordPayload0014SmearCultureMGITDstSusceptible2Samples
        )
      )
      const {
        insertSpy,
        philippinesNTRLPMDT: smearResultProcessor,
      } = setupPhilippinesNTRLPMDTDataProcessorWithSpies(
        'some device API key',
        pmdtRecordPayload0014SmearCultureMGITDstSusceptible2Samples
      )
      await smearResultProcessor.processRequest()
      const insertResultCalls = insertSpy
        .getCalls()
        .filter(insertCall => insertCall.args[0] === 'Result')
      const smearResults = insertResultCalls
        .map(insert => insert.lastArg)
        .filter(
          resultInsert =>
            resultInsert.assayId === staticDatabaseData.Assay.assaySmear
        )
      expect(smearResults).to.have.lengthOf(2)
      const smearResult1 = {
        ...smearResults[0],
        patientData: JSON.parse(smearResults[0].patientData),
        resultData: JSON.parse(smearResults[0].resultData),
        startedOn: smearResults[0].startedOn.toISOString(),
        endedOn: smearResults[0].endedOn.toISOString(),
      }
      const sample1ExternalId = getSamplesFromPMDTPayload(payload)[0].externalId
      expect(smearResult1).to.containSubset({
        partnerId: databaseRecords.Site.partnerId,
        geographyId: databaseRecords.Site.geographyId,
        siteId: databaseRecords.Site.id,
        deviceId: databaseRecords.DeviceApiKey.deviceId,
        longitude: databaseRecords.Site.longitude,
        latitude: databaseRecords.Site.latitude,
        resultSourceId: staticDatabaseData.resultSourceId,
        resultTypeId: staticDatabaseData.resultTypeId,
        resultCategory1: staticDatabaseData.ResultCategory.Positive2,
        resultCategory2: staticDatabaseData.ResultCategory.Detected,
        patientData: generatePatientDataFromPMDTPayload(payload),
        externalId: `${databaseRecords.Site.externalId}_${sample1ExternalId}_SMEAR`,
        assayId: staticDatabaseData.Assay.assaySmear,
        startedOn: payload['Smear Date Released'],
        endedOn: payload['Smear Date Released'],
        resultData: {
          encodedResult: {
            smearMethod: payload['Smear Method'],
            smearResult1: payload['Smear Result 1'],
            smearResult2: payload['Smear Result 2'],
            finalResult: payload['Smear Final Result'],
            dateReleased: payload['Smear Date Released'],
            encodedBy: payload['Smear Encoded by'],
            laboratoryTechnician: payload['Smear Lab Tech'],
          },
        },
        senderOperator: payload['Smear Lab Tech'],
        reportableSiteId: databaseRecords.Site.id,
      })
      const smearResult2 = {
        ...smearResults[1],
        patientData: JSON.parse(smearResults[1].patientData),
        resultData: JSON.parse(smearResults[1].resultData),
        startedOn: smearResults[1].startedOn.toISOString(),
        endedOn: smearResults[1].endedOn.toISOString(),
      }
      const sample2ExternalId = getSamplesFromPMDTPayload(payload)[1].externalId
      expect(smearResult2).to.containSubset({
        partnerId: databaseRecords.Site.partnerId,
        geographyId: databaseRecords.Site.geographyId,
        siteId: databaseRecords.Site.id,
        deviceId: databaseRecords.DeviceApiKey.deviceId,
        longitude: databaseRecords.Site.longitude,
        latitude: databaseRecords.Site.latitude,
        resultSourceId: staticDatabaseData.resultSourceId,
        resultTypeId: staticDatabaseData.resultTypeId,
        resultCategory1: staticDatabaseData.ResultCategory.Positive1,
        resultCategory2: staticDatabaseData.ResultCategory.Detected,
        patientData: generatePatientDataFromPMDTPayload(payload),
        externalId: `${databaseRecords.Site.externalId}_${sample2ExternalId}_SMEAR`,
        assayId: staticDatabaseData.Assay.assaySmear,
        startedOn: payload['Smear Date Released'],
        endedOn: payload['Smear Date Released'],
        resultData: {
          encodedResult: {
            smearMethod: payload['Smear Method'],
            smearResult1: payload['Smear Result 1'],
            smearResult2: payload['Smear Result 2'],
            finalResult: payload['Smear Final Result'],
            dateReleased: payload['Smear Date Released'],
            encodedBy: payload['Smear Encoded by'],
            laboratoryTechnician: payload['Smear Lab Tech'],
          },
        },
        senderOperator: payload['Smear Lab Tech'],
        reportableSiteId: databaseRecords.Site.id,
      })
    })

    it('should insert a GeneXpert result when GeneXpert values are in the record', async () => {
      const payload = JSON.parse(
        JSON.stringify(pmdtRecordPayload03694GxPositiveResistant1Sample)
      )
      const {
        insertSpy,
        philippinesNTRLPMDT: geneXpertResultProcessor,
      } = setupPhilippinesNTRLPMDTDataProcessorWithSpies(
        'some device API key',
        pmdtRecordPayload03694GxPositiveResistant1Sample
      )
      await geneXpertResultProcessor.processRequest()
      const insertResultCalls = insertSpy
        .getCalls()
        .filter(insertCall => insertCall.args[0] === 'Result')
      const gxResults = insertResultCalls
        .map(insert => insert.lastArg)
        .filter(
          resultInsert =>
            resultInsert.assayId === staticDatabaseData.Assay.GxMtbRif
        )
      expect(gxResults).to.have.lengthOf(1)
      const gxResult = {
        ...gxResults[0],
        patientData: JSON.parse(gxResults[0].patientData),
        resultData: JSON.parse(gxResults[0].resultData),
        startedOn: gxResults[0].startedOn.toISOString(),
        endedOn: gxResults[0].endedOn.toISOString(),
      }
      const sampleExternalId = getSamplesFromPMDTPayload(payload)[0].externalId
      expect(gxResult).to.containSubset({
        partnerId: databaseRecords.Site.partnerId,
        geographyId: databaseRecords.Site.geographyId,
        siteId: databaseRecords.Site.id,
        deviceId: databaseRecords.DeviceApiKey.deviceId,
        longitude: databaseRecords.Site.longitude,
        latitude: databaseRecords.Site.latitude,
        resultSourceId: staticDatabaseData.resultSourceId,
        resultTypeId: staticDatabaseData.resultTypeId,
        resultCategory1: staticDatabaseData.ResultCategory.Detected,
        resultCategory2: staticDatabaseData.ResultCategory.Detected,
        patientData: generatePatientDataFromPMDTPayload(payload),
        externalId: `${databaseRecords.Site.externalId}_${sampleExternalId}_GX`,
        assayId: staticDatabaseData.Assay.GxMtbRif,
        startedOn: payload['Gx Processing Date'],
        endedOn: payload['Gx Processing Date'],
        resultData: {
          encodedResult: {
            center: payload['Gx Center'],
            processingDate: payload['Gx Processing Date'],
            mtb: payload['Gx MTB'],
            rifampicin: payload['Gx Rifampicin'],
            remarks: payload['Gx Remarks'],
            dateReleased: payload['Gx Date Released'],
            examiner: payload['Gx Examiner'],
            labManager: payload['Gx Laboratory Manager'],
          },
        },
        senderOperator: payload['Gx Examiner'],
        reportableSiteId: databaseRecords.Site.id,
      })
    })

    it('should create a single sample when only one sample has been captured', async () => {
      const payload = JSON.parse(
        JSON.stringify(pmdtRecordPayload1855LpaRequestedNoResults1Sample)
      )
      const {
        insertSpy,
        philippinesNTRLPMDT: singleSampleResultProcessor,
      } = setupPhilippinesNTRLPMDTDataProcessorWithSpies(
        'some device API key',
        pmdtRecordPayload1855LpaRequestedNoResults1Sample
      )
      await singleSampleResultProcessor.processRequest()
      const insertedSamples = insertSpy
        .getCalls()
        .filter(insertCall => insertCall.args[0] === 'Sample')
        .map(insert => insert.lastArg)
      expect(insertedSamples).to.have.lengthOf(1)
      const insertedSample = {
        ...insertedSamples[0],
        collectedOn: insertedSamples[0].collectedOn.toISOString(),
      }
      const sampleDetailsInPayload = getSamplesFromPMDTPayload(payload)[0]
      expect(insertedSample).to.containSubset(sampleDetailsInPayload)
      expect(insertedSample.externalId).to.match(/PN-\d{2}-\d{4,5}/)
    })

    it('should not create/update any results when there are no results', async () => {
      const payload = JSON.parse(
        JSON.stringify(pmdtRecordPayload1855LpaRequestedNoResults1Sample)
      )
      const {
        updateSpy,
        insertSpy,
        philippinesNTRLPMDT: noResultsProcessor,
      } = setupPhilippinesNTRLPMDTDataProcessorWithSpies(
        'some device API key',
        payload
      )
      await noResultsProcessor.processRequest()
      const insertedResults = insertSpy
        .getCalls()
        .filter(insertCall => insertCall.args[0] === 'Result')
        .map(insert => insert.lastArg)
      expect(insertedResults).to.have.lengthOf(0)
      const updatedResults = updateSpy
        .getCalls()
        .filter(updateCall => updateCall.args[0] === 'Result')
        .map(update => update.lastArg)
      expect(updatedResults).to.have.lengthOf(0)
    })

    it("should update the initial single sample external ID with a suffix of '-1' when 2nd sample details are added after initial upload", async () => {
      const pmdtRecordPayload1855LpaRequestedNoResults2Samples = {
        ...pmdtRecordPayload1855LpaRequestedNoResults1Sample,
        'Date Collected 2':
          pmdtRecordPayload1855LpaRequestedNoResults1Sample['Date Collected 1'],
      }
      const payload = JSON.parse(
        JSON.stringify(pmdtRecordPayload1855LpaRequestedNoResults2Samples)
      )
      const sampleDetailsInInitialPayload = getSamplesFromPMDTPayload(
        pmdtRecordPayload1855LpaRequestedNoResults1Sample
      )[0]
      const existingSamplesAfterInitialUpload = JSON.parse(
        JSON.stringify(existingSamples)
      )
      existingSamplesAfterInitialUpload[
        sampleDetailsInInitialPayload.externalId
      ] = sampleDetailsInInitialPayload
      const {
        updateSpy,
        insertSpy,
        philippinesNTRLPMDT: updateSampleResultProcessor,
      } = setupPhilippinesNTRLPMDTDataProcessorWithSpies(
        'some device API key',
        payload,
        existingSamplesAfterInitialUpload
      )
      await updateSampleResultProcessor.processRequest()
      const updatedSamples = updateSpy
        .getCalls()
        .filter(updateCall => updateCall.args[0] === 'Sample')
        .map(update => update.lastArg)
      expect(updatedSamples).to.have.lengthOf(1)
      expect(updatedSamples[0].externalId).to.match(/PN-\d{2}-\d{4,5}-1/)
      const insertedSamples = insertSpy
        .getCalls()
        .filter(insertCall => insertCall.args[0] === 'Sample')
        .map(insert => insert.lastArg)
      expect(insertedSamples).to.have.lengthOf(1)
      expect(insertedSamples[0].externalId).to.match(/PN-\d{2}-\d{4,5}-2/)
    })

    it("should update the a sample's origin site ID when it becomes known", async () => {
      const payload = JSON.parse(
        JSON.stringify(pmdtRecordPayload8442SmearCultureNegative2Samples)
      )
      const sampleDetailsInInitialPayload = JSON.parse(
        JSON.stringify(
          getSamplesFromPMDTPayload(
            pmdtRecordPayload8442SmearCultureNegative2Samples
          )
        )
      )
      const existingSamplesAfterInitialUpload = JSON.parse(
        JSON.stringify(existingSamples)
      )
      existingSamplesAfterInitialUpload[
        sampleDetailsInInitialPayload[0].externalId
      ] = {
        ...sampleDetailsInInitialPayload[0],
        originSiteId: 123,
      }
      existingSamplesAfterInitialUpload[
        sampleDetailsInInitialPayload[1].externalId
      ] = {
        ...sampleDetailsInInitialPayload[1],
        originSiteId: databaseRecords.Site.id,
      }
      const {
        updateSpy,
        insertSpy,
        philippinesNTRLPMDT: updateSampleResultProcessor,
      } = setupPhilippinesNTRLPMDTDataProcessorWithSpies(
        'some device API key',
        payload,
        existingSamplesAfterInitialUpload
      )
      await updateSampleResultProcessor.processRequest()
      const updatedSamples = updateSpy
        .getCalls()
        .filter(updateCall => updateCall.args[0] === 'Sample')
        .map(update => update.lastArg)
      expect(updatedSamples).to.have.lengthOf(1)
      expect(updatedSamples[0]).to.containSubset({
        externalId: sampleDetailsInInitialPayload[0].externalId,
        originSiteId: databaseRecords.Site.id,
      })
      const insertedSamples = insertSpy
        .getCalls()
        .filter(insertCall => insertCall.args[0] === 'Sample')
        .map(insert => insert.lastArg)
      expect(insertedSamples).to.have.lengthOf(0)
    })

    it("should not update or insert samples if they haven't changed", async () => {
      const payload = JSON.parse(
        JSON.stringify(pmdtRecordPayload8442SmearCultureNegative2Samples)
      )
      const sampleDetailsInInitialPayload = JSON.parse(
        JSON.stringify(
          getSamplesFromPMDTPayload(
            pmdtRecordPayload8442SmearCultureNegative2Samples
          )
        )
      )
      const existingSamplesAfterInitialUpload = JSON.parse(
        JSON.stringify(existingSamples)
      )
      existingSamplesAfterInitialUpload[
        sampleDetailsInInitialPayload[0].externalId
      ] = {
        ...sampleDetailsInInitialPayload[0],
        originSiteId: databaseRecords.Site.id,
      }
      existingSamplesAfterInitialUpload[
        sampleDetailsInInitialPayload[1].externalId
      ] = {
        ...sampleDetailsInInitialPayload[1],
        originSiteId: databaseRecords.Site.id,
      }
      const {
        updateSpy,
        insertSpy,
        philippinesNTRLPMDT: updateSampleResultProcessor,
      } = setupPhilippinesNTRLPMDTDataProcessorWithSpies(
        'some device API key',
        payload,
        existingSamplesAfterInitialUpload
      )
      await updateSampleResultProcessor.processRequest()
      const updatedSamples = updateSpy
        .getCalls()
        .filter(updateCall => updateCall.args[0] === 'Sample')
        .map(update => update.lastArg)
      expect(updatedSamples).to.have.lengthOf(0)
      const insertedSamples = insertSpy
        .getCalls()
        .filter(insertCall => insertCall.args[0] === 'Sample')
        .map(insert => insert.lastArg)
      expect(insertedSamples).to.have.lengthOf(0)
    })
  })
})
