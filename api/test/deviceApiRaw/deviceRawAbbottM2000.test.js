const chai = require('chai')
const fs = require('fs')
const path = require('path')
const DefaultAbbottM2000 = require('../../src/deviceApiRaw/dataProcessors/abbottM2000')

const { assert } = chai

describe('Device API Raw Abbott M2000 Data Processor', () => {
  let vlPklPayload = ''
  let abbottStandardInterfaceExample = ''

  before(() => {
    // The example below is an obfuscated copy of a PKL taken from the Abbott M2000 running HIV Viral Load Tests
    vlPklPayload = fs.readFileSync(
      path.join(__dirname, 'abbottM2000VL.pkl'),
      'utf8'
    )
    // The example below is adapted from the Abbott Standard Interface RS-232 Manual
    // https://kb.systemone.id/display/AS/CHAI+LIMS+Import+File+Produced+from+the+CHAI+-+Abbott+M2000+Connector?preview=%2F68357610%2F211490207%2FAbbott+Standard+Interface+Manual.pdf
    abbottStandardInterfaceExample = fs.readFileSync(
      path.join(__dirname, 'abbottStandardInterface.pkl'),
      'utf8'
    )
  })

  it('should be able to identify whether the payload is a PKL from an M2000 connector', async () => {
    const isM2000Payload = await DefaultAbbottM2000.canProcessRequest({
      payload: vlPklPayload,
    })
    assert.isOk(isM2000Payload)
    const isAbbotStandardInterfacePayload = await DefaultAbbottM2000.canProcessRequest(
      { payload: abbottStandardInterfaceExample }
    )
    assert.isOk(isAbbotStandardInterfacePayload)
  })

  it('should be able to parse a PKL file into results', async () => {
    /*
    const m2000DataProcessorViralLoad = new DefaultAbbottM2000({
      payload: vlPklPayload,
    })
    await m2000DataProcessorViralLoad.processRequest()
    */
    const m2000DataProcessorStandardInterfaceExample = new DefaultAbbottM2000({
      payload: abbottStandardInterfaceExample,
    })
    await m2000DataProcessorStandardInterfaceExample.processRequest()
    assert.deepEqual(m2000DataProcessorStandardInterfaceExample.results, [
      {
        message: {
          rawMessage:
            'H|\\^&|||m2000^1.0.0.0^123456789^H1P1O1R1C1Q1L1|||||||P|1|19930330133346\\r\\x0392\\r\\n\nC|1|I|Example Message Comment|G\\r\\x0343\\r\\n\nP|1|||PIDSID13|Patient^Im^A\\And^This^Is^My^Wife||19320122|F|||||Dr.Amesbury||||||||||||ParkClinic\\r\\x033F\\r\\n\nC|1|I|Example Patient Comment|G\\r\\x0343\\r\\n\nO|1|SID13|SID3^A123^5|^^^123^Assay1^UNDILUTED^P|R||20010223081223||||||||||||||||||F\\r\\x03D0\\r\\n\nC|1|I|Example Order Comment|G\\r\\x0343\\r\\n\nR|1|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^F|<1.20|mIU/mL|0.35 TO 4.94|EXP^<||F||||19990715081030|I20100\\r\\x03E2\\r\\n\nR|2|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^I|NEGATIVE|||||F||||19990715081030|I20100\\r\\x0343\\r\\n\nR|3|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^P|9245|RLU||||F||||19990715081030|I20100\\r\\x0343\\r\\n\nC|1|I|Example Result Comment|G\\r\\x0343\\r\\n\nQ|1|^SID12345||^^^ALL||||||||O\\r\\x0343\\r\\n\nL|1\\r\\x033F\\r\\n',
          sender: {
            nameOrId: 'm2000',
            softwareVersion: '1.0.0.0',
            serialNumber: '123456789',
            interfaceVersion: 'H1P1O1R1C1Q1L1',
          },
          typeOfMessage: 'Production',
          versionNo: '1',
          dateAndTime: new Date('1993-03-30T11:33:46.000Z'),
          messageIsComplete: true,
          comments: [
            {
              source: 'Instrument',
              text: 'Example Message Comment',
              type: 'Result Comment',
            },
          ],
          enquiries: [
            {
              specimenId: 'SID12345',
              assayCode: 'ALL',
              statusCode: 'Orders',
            },
          ],
        },
        patient: {
          practicePatientId: '',
          laboratoryPatientId: '',
          patientIdNo3: 'PIDSID13',
          patientName: 'Patient Im A\nAnd This Is My Wife',
          dateOfBirth: new Date('1993-03-30T11:33:46.000Z'),
          gender: 'Female',
          ethnicOrigin: '',
          patientAddress: '',
          patientPhone: '',
          attendingPhysician: 'Dr.Amesbury',
          patientHeight: '',
          patientWeight: '',
          patientDiagnoses: [],
          patientMedications: [],
          patientDiet: '',
          admissionOrDischargeDates: '',
          admissionStatus: '',
          location: 'ParkClinic',
          comments: [
            {
              source: 'Instrument',
              text: 'Example Patient Comment',
              type: 'Result Comment',
            },
          ],
        },
        order: {
          specimen: {
            id: 'SID13',
          },
          instrumentSpecimen: {
            id: 'SID3',
            locationId: 'A123',
            position: '5',
          },
          assay: {
            code: '123',
            name: 'Assay1',
            protocol: 'UNDILUTED',
            testQualifier: 'Primary',
          },
          priority: 'Routine',
          requestTime: null,
          collectionTime: '2001-02-23T06:12:23.000Z',
          collectorId: '',
          actionCode: 'Patient Result',
          reportType: 'Final Result',
          comments: [
            {
              source: 'Instrument',
              text: 'Example Order Comment',
              type: 'Result Comment',
            },
          ],
        },
        result: {
          assay: {
            code: '0021',
            name: 'B-hCG',
            protocol: 'UNDILUTED',
            status: 'Primary',
          },
          consumable: {
            reagentLot: '47331M100',
            reagentSerialNumber: '00788',
            controlLotNumber: '',
          },
          type: 'Final Result',
          text: '<1.20',
          unit: 'mIU/mL',
          referenceRanges: '0.35 TO 4.94',
          abnormalFlags: ['EXP <'],
          status: 'Final Result',
          operators: {},
          completedOn: '1999-07-15T06:10:30.000Z',
          comments: [],
        },
      },
      {
        message: {
          rawMessage:
            'H|\\^&|||m2000^1.0.0.0^123456789^H1P1O1R1C1Q1L1|||||||P|1|19930330133346\\r\\x0392\\r\\n\nC|1|I|Example Message Comment|G\\r\\x0343\\r\\n\nP|1|||PIDSID13|Patient^Im^A\\And^This^Is^My^Wife||19320122|F|||||Dr.Amesbury||||||||||||ParkClinic\\r\\x033F\\r\\n\nC|1|I|Example Patient Comment|G\\r\\x0343\\r\\n\nO|1|SID13|SID3^A123^5|^^^123^Assay1^UNDILUTED^P|R||20010223081223||||||||||||||||||F\\r\\x03D0\\r\\n\nC|1|I|Example Order Comment|G\\r\\x0343\\r\\n\nR|1|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^F|<1.20|mIU/mL|0.35 TO 4.94|EXP^<||F||||19990715081030|I20100\\r\\x03E2\\r\\n\nR|2|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^I|NEGATIVE|||||F||||19990715081030|I20100\\r\\x0343\\r\\n\nR|3|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^P|9245|RLU||||F||||19990715081030|I20100\\r\\x0343\\r\\n\nC|1|I|Example Result Comment|G\\r\\x0343\\r\\n\nQ|1|^SID12345||^^^ALL||||||||O\\r\\x0343\\r\\n\nL|1\\r\\x033F\\r\\n',
          sender: {
            nameOrId: 'm2000',
            softwareVersion: '1.0.0.0',
            serialNumber: '123456789',
            interfaceVersion: 'H1P1O1R1C1Q1L1',
          },
          typeOfMessage: 'Production',
          versionNo: '1',
          dateAndTime: '1993-03-30T11:33:46.000Z',
          messageIsComplete: true,
          comments: [
            {
              source: 'Instrument',
              text: 'Example Message Comment',
              type: 'Result Comment',
            },
          ],
          enquiries: [
            {
              specimenId: 'SID12345',
              assayCode: 'ALL',
              statusCode: 'Orders',
            },
          ],
        },
        patient: {
          practicePatientId: '',
          laboratoryPatientId: '',
          patientIdNo3: 'PIDSID13',
          patientName: 'Patient Im A\nAnd This Is My Wife',
          dateOfBirth: '1932-01-21T22:00:00.000Z',
          gender: 'Female',
          ethnicOrigin: '',
          patientAddress: '',
          patientPhone: '',
          attendingPhysician: 'Dr.Amesbury',
          patientHeight: '',
          patientWeight: '',
          patientDiagnoses: [],
          patientMedications: [],
          patientDiet: '',
          admissionOrDischargeDates: '',
          admissionStatus: '',
          location: 'ParkClinic',
          comments: [
            {
              source: 'Instrument',
              text: 'Example Patient Comment',
              type: 'Result Comment',
            },
          ],
        },
        order: {
          specimen: {
            id: 'SID13',
          },
          instrumentSpecimen: {
            id: 'SID3',
            locationId: 'A123',
            position: '5',
          },
          assay: {
            code: '123',
            name: 'Assay1',
            protocol: 'UNDILUTED',
            testQualifier: 'Primary',
          },
          priority: 'Routine',
          requestTime: null,
          collectionTime: '2001-02-23T06:12:23.000Z',
          collectorId: '',
          actionCode: 'Patient Result',
          reportType: 'Final Result',
          comments: [
            {
              source: 'Instrument',
              text: 'Example Order Comment',
              type: 'Result Comment',
            },
          ],
        },
        result: {
          assay: {
            code: '0021',
            name: 'B-hCG',
            protocol: 'UNDILUTED',
            status: 'Primary',
          },
          consumable: {
            reagentLot: '47331M100',
            reagentSerialNumber: '00788',
            controlLotNumber: '',
          },
          type: 'Interpretation of Final Result',
          text: 'NEGATIVE',
          unit: '',
          referenceRanges: '',
          abnormalFlags: [],
          status: 'Final Result',
          operators: {},
          completedOn: '1999-07-15T06:10:30.000Z',
          comments: [],
        },
      },
      {
        message: {
          rawMessage:
            'H|\\^&|||m2000^1.0.0.0^123456789^H1P1O1R1C1Q1L1|||||||P|1|19930330133346\\r\\x0392\\r\\n\nC|1|I|Example Message Comment|G\\r\\x0343\\r\\n\nP|1|||PIDSID13|Patient^Im^A\\And^This^Is^My^Wife||19320122|F|||||Dr.Amesbury||||||||||||ParkClinic\\r\\x033F\\r\\n\nC|1|I|Example Patient Comment|G\\r\\x0343\\r\\n\nO|1|SID13|SID3^A123^5|^^^123^Assay1^UNDILUTED^P|R||20010223081223||||||||||||||||||F\\r\\x03D0\\r\\n\nC|1|I|Example Order Comment|G\\r\\x0343\\r\\n\nR|1|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^F|<1.20|mIU/mL|0.35 TO 4.94|EXP^<||F||||19990715081030|I20100\\r\\x03E2\\r\\n\nR|2|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^I|NEGATIVE|||||F||||19990715081030|I20100\\r\\x0343\\r\\n\nR|3|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^P|9245|RLU||||F||||19990715081030|I20100\\r\\x0343\\r\\n\nC|1|I|Example Result Comment|G\\r\\x0343\\r\\n\nQ|1|^SID12345||^^^ALL||||||||O\\r\\x0343\\r\\n\nL|1\\r\\x033F\\r\\n',
          sender: {
            nameOrId: 'm2000',
            softwareVersion: '1.0.0.0',
            serialNumber: '123456789',
            interfaceVersion: 'H1P1O1R1C1Q1L1',
          },
          typeOfMessage: 'Production',
          versionNo: '1',
          dateAndTime: '1993-03-30T11:33:46.000Z',
          messageIsComplete: true,
          comments: [
            {
              source: 'Instrument',
              text: 'Example Message Comment',
              type: 'Result Comment',
            },
          ],
          enquiries: [
            {
              specimenId: 'SID12345',
              assayCode: 'ALL',
              statusCode: 'Orders',
            },
          ],
        },
        patient: {
          practicePatientId: '',
          laboratoryPatientId: '',
          patientIdNo3: 'PIDSID13',
          patientName: 'Patient Im A\nAnd This Is My Wife',
          dateOfBirth: '1932-01-21T22:00:00.000Z',
          gender: 'Female',
          ethnicOrigin: '',
          patientAddress: '',
          patientPhone: '',
          attendingPhysician: 'Dr.Amesbury',
          patientHeight: '',
          patientWeight: '',
          patientDiagnoses: [],
          patientMedications: [],
          patientDiet: '',
          admissionOrDischargeDates: '',
          admissionStatus: '',
          location: 'ParkClinic',
          comments: [
            {
              source: 'Instrument',
              text: 'Example Patient Comment',
              type: 'Result Comment',
            },
          ],
        },
        order: {
          specimen: {
            id: 'SID13',
          },
          instrumentSpecimen: {
            id: 'SID3',
            locationId: 'A123',
            position: '5',
          },
          assay: {
            code: '123',
            name: 'Assay1',
            protocol: 'UNDILUTED',
            testQualifier: 'Primary',
          },
          priority: 'Routine',
          requestTime: null,
          collectionTime: '2001-02-23T06:12:23.000Z',
          collectorId: '',
          actionCode: 'Patient Result',
          reportType: 'Final Result',
          comments: [
            {
              source: 'Instrument',
              text: 'Example Order Comment',
              type: 'Result Comment',
            },
          ],
        },
        result: {
          assay: {
            code: '0021',
            name: 'B-hCG',
            protocol: 'UNDILUTED',
            status: 'Primary',
          },
          consumable: {
            reagentLot: '47331M100',
            reagentSerialNumber: '00788',
            controlLotNumber: '',
          },
          type: 'Preliminary Result',
          text: '9245',
          unit: 'RLU',
          referenceRanges: '',
          abnormalFlags: [],
          status: 'Final Result',
          operators: {},
          completedOn: '1999-07-15T06:10:30.000Z',
          comments: [
            {
              source: 'Instrument',
              text: 'Example Result Comment',
              type: 'Result Comment',
            },
          ],
        },
      },
      {
        message: {
          rawMessage:
            'H|\\^&|||m2000^1.0.0.0^123456789^H1P1O1R1C1Q1L1|||||||P|1|19930330133346\\r\\x0392\\r\\n\nP|1\\r\\x033F\\r\\n\nO|1|TSHBIORAD 2|TSHBIORAD 2^A123^2|^^^0241^TSH^UNDILUTED^P|R||||||Q||||||||||||||F\\r\\x03D0\\r\\n\nR|1|^^^0241^TSH^UNDILUTED^P^0607M200^01824^40080^F|4.6011|mIU/mL|4.292500 TO 5.397300|||F||ECB^RY||19990715081030|I20100\\r\\x03E2\\r\\n\nL|1\\r\\x033F\\r\\n',
          sender: {
            nameOrId: 'm2000',
            softwareVersion: '1.0.0.0',
            serialNumber: '123456789',
            interfaceVersion: 'H1P1O1R1C1Q1L1',
          },
          typeOfMessage: 'Production',
          versionNo: '1',
          dateAndTime: '1993-03-30T11:33:46.000Z',
          messageIsComplete: true,
        },
        patient: {
          dateOfBirth: null,
          patientDiagnoses: [],
          patientMedications: [],
        },
        order: {
          specimen: {
            id: 'TSHBIORAD 2',
          },
          instrumentSpecimen: {
            id: 'TSHBIORAD 2',
            locationId: 'A123',
            position: '2',
          },
          assay: {
            code: '0241',
            name: 'TSH',
            protocol: 'UNDILUTED',
            testQualifier: 'Primary',
          },
          priority: 'Routine',
          requestTime: null,
          collectionTime: null,
          collectorId: '',
          actionCode: 'Quality Control Result',
          reportType: 'Final Result',
        },
        result: {
          assay: {
            code: '0241',
            name: 'TSH',
            protocol: 'UNDILUTED',
            status: 'Primary',
          },
          consumable: {
            reagentLot: '0607M200',
            reagentSerialNumber: '01824',
            controlLotNumber: '40080',
          },
          type: 'Final Result',
          text: '4.6011',
          unit: 'mIU/mL',
          referenceRanges: '4.292500 TO 5.397300',
          abnormalFlags: [],
          status: 'Final Result',
          operators: {
            orderOperatorId: 'ECB',
            releaseOperatorId: 'RY',
          },
          completedOn: '1999-07-15T06:10:30.000Z',
          comments: [],
        },
      },
    ])
    // console.log(m2000DataProcessorStandardInterfaceExample.results.length)
  })
})
