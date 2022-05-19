const { expect } = require('chai')
const { startOfToday, addDays } = require('date-fns')
const {
  createGxConnectTestContext,
} = require('../deviceApi/geneXpert/gxconnect_utils')
const server = require('../utils/testUtils')

const { waitForIdle } = require('../utils/mqUtils')

const {
  factFillCustomFieldsCompletionStats,
} = require('../../src/fact/customFieldsCompletionStatsService')
const { knex } = require('../../src/db')

let context
/**
 * this test is dependant on completionWeight and payloadDestinationPath on CustomFieldsTB.json
 */
describe('CustomFieldsCompletionStatsService', async function () {
  before(async () => {
    context = createGxConnectTestContext(server, {
      countryCode: 'US',
      adminUsername: 'admin',
      adminPassword: 'test07',
      deviceName: 'Tamagotchi',
      macAddress: 'MAC00000000FAKE',
      hostId: 'TAMA-001',
      deviceSerialNumber: 'Tamagochi-PC-001',
    })
    await context.beforeRegisterAndSetDevice()

    await waitForIdle()

    patientDataSeed.map(async (pd, index) => {
      await context.createResultForThisDevice({
        resultDetails: {
          ...{
            startedOn: patientDataDates[index],
            endedOn: patientDataDates[index],
            patientData: pd,
          },
        },
      })
    })
  })

  afterEach(async () => {
    await knex.raw('truncate table FactCustomFieldCompletion')
    await context.cleanUp()
  })

  it('Must save stats data', async () => {
    const statsCount = await factFillCustomFieldsCompletionStats(
      addDays(startOfToday(), -21),
      addDays(startOfToday(), -14)
    )
    const stats = await knex('FactCustomFieldCompletion as f')
      .select(
        'f.recordCount',
        'f.date',
        'f.completionRate',
        `f.completionByField`
      )
      .orderBy('f.date')
    expect(statsCount).to.be.equal(3, 'a record per date')

    expect(stats[0].recordCount).to.be.equal(2)
    expect(stats[1].recordCount).to.be.equal(1)
    expect(stats[2].recordCount).to.be.equal(2)

    expect(stats[0].completionRate).to.be.equal(0.67)
    expect(stats[1].completionRate).to.be.equal(1)
    expect(stats[2].completionRate).to.be.equal(0.83)

    const fieldStats = stats.map(s => JSON.parse(s.completionByField))

    expect(+fieldStats[0].age.weighting).to.be.equal(0.16667)
    expect(+fieldStats[0].age.completed).to.be.equal(1)
    expect(+fieldStats[1].age.weighting).to.be.equal(0.33333)
    expect(+fieldStats[1].age.completed).to.be.equal(1)
    expect(+fieldStats[2].age.weighting).to.be.equal(0.33333)
    expect(+fieldStats[2].age.completed).to.be.equal(2)

    expect(+fieldStats[0].gender.weighting).to.be.equal(0.33333)
    expect(+fieldStats[0].gender.completed).to.be.equal(2)
    expect(+fieldStats[1].gender.weighting).to.be.equal(0.33333)
    expect(+fieldStats[1].gender.completed).to.be.equal(1)
    expect(+fieldStats[2].gender.weighting).to.be.equal(0.33333)
    expect(+fieldStats[2].gender.completed).to.be.equal(2)

    expect(+fieldStats[0].ReferringFacility.weighting).to.be.equal(0.16667)
    expect(+fieldStats[0].ReferringFacility.completed).to.be.equal(1)
    expect(+fieldStats[1].ReferringFacility.weighting).to.be.equal(0.33333)
    expect(+fieldStats[1].ReferringFacility.completed).to.be.equal(1)
    expect(+fieldStats[2].ReferringFacility.weighting).to.be.equal(0.16667)
    expect(+fieldStats[2].ReferringFacility.completed).to.be.equal(1)
  })

  const patientDataDates = [
    // 3 different days
    addDays(startOfToday(), -20),
    addDays(startOfToday(), -20),
    addDays(startOfToday(), -18),
    addDays(startOfToday(), -15),
    addDays(startOfToday(), -15),
  ]

  const patientDataSeed = [
    {
      id: '',
      name: 'Sarmin Akter',
      phone: '01316208782',
      gender: 'Female',
      street: '52 Khata Gandaria',
      address: '52 Khata Gandaria\r\n',
      surname: '',
      HIVStatus: 'Unknown',
      PatientAge: '32',
      SampleType: 'Pulmonary',
      PatientName: 'Sarmin Akter',
      PatientPhone: '01316208782',
      PatientGender: 'Female',
      PatientStreet: '52 Khata Gandaria',
      TypeOfPatient: 'Presumptive TB',
      PatientHistory: null,
      ReferringFacility: 'Dholaikhal icddrb',
      PatientRetreatment: null,
      TBRegistrationNumberCurrent: null,
      TBRegistrationNumberPrevious: null,
    },
    {
      id: '208220300528-1',
      age: 45,
      name: 'Md Shaheb Ali',
      phone: '01922544221',
      gender: 'Male',
      street: 'H-6, R-11, B-H, Mirpur-1',
      address: 'H-6, R-11, B-H, Mirpur-1\r\n',
      surname: '',
      HIVStatus: 'Unknown',
      SampleType: 'Pulmonary',
      PatientPhone: '01922544221',
      TypeOfPatient: 'Others - Pulmonary, clinically diagnosed',
    },
    {
      id: '',
      age: 45,
      name: 'Anjali Sarker',
      phone: '01724572692',
      gender: 'Female',
      street: 'Mosori Rupgong',
      address: 'Mosori Rupgong\r\n',
      surname: '',
      HIVStatus: 'Unknown',
      PatientAge: '45',
      SampleType: 'Pulmonary',
      PatientName: 'Anjali Sarker',
      PatientPhone: '01724572692',
      PatientGender: 'Female',
      PatientStreet: 'Mosori Rupgong',
      TypeOfPatient: 'Presumptive TB',
      PatientHistory: null,
      ReferringFacility: 'Dholaikhal icddrb',
      PatientRetreatment: null,
      TBRegistrationNumberCurrent: null,
      TBRegistrationNumberPrevious: null,
    },
    {
      id: '',
      age: 7,
      name: 'Nusrat Akter',
      phone: '01735760591',
      gender: 'Female',
      street: 'B Baria Naraingong',
      address: 'B Baria Naraingong\r\n',
      surname: '',
      HIVStatus: 'Unknown',
      PatientAge: '07',
      SampleType: 'Pulmonary',
      PatientName: 'Nusrat Akter',
      PatientPhone: '01735760591',
      PatientGender: 'Female',
      PatientStreet: 'B Baria Naraingong',
      TypeOfPatient: 'Presumptive TB',
      PatientHistory: null,
      ReferringFacility: 'Dholaikhal icddrb',
      PatientRetreatment: null,
      TBRegistrationNumberCurrent: null,
      TBRegistrationNumberPrevious: null,
    },
    {
      id: '208220300527-3',
      age: 27,
      name: 'Md Rubel',
      phone: '01702339259',
      gender: 'Male',
      street: 'H-8, Line-14, B-B, Mirpur-11',
      address: 'H-8, Line-14, B-B, Mirpur-11\r\n',
      surname: '',
      HIVStatus: 'Unknown',
      SampleType: 'Pulmonary',
      PatientPhone: '01702339259',
      TypeOfPatient: 'Presumptive TB',
    },
  ]
})
