const { expect } = require('chai')
const { parseNotes, parsePatientId } = require('../../../../src/plugin/partner/Nigeria/customFieldsParser')

describe('parseNotes', () => {
  it.only('should return the correct patientData', () => {
    const cases = [
      {
        given:
          'Operation terminated Error 2037: The cartridge integrity test failed at valve position 1390. The pressure change of 0.6 PSI did not exceed the requirement of 4.0 PSI. The pressure increased from 2.7 PSI to 3.3 PSI during the test',
        expected: {
          patientData: {},
        },
      },
      {
        given: 'MALE, 20YRS, HIV=NEG, FROM B/KASUWA, C/O SHEHU S. FADA, TBLS CLINIC, GUSAU, ZAMFARA STATE',
        expected: {
          patientData: {
            PatientAgeYears: 20,
            PatientGender: 1,
            HivStatus: 0,
            City: 'B/KASUWA C/O SHEHU S FADA TBLS CLINIC GUSAU ZAMFARA STATE',
          },
        },
      },
      {
        given: 'Male, 31yrs, RVS (R), Yaring, Alh. Aminu Ibrahim`s Residence Yaring KT LGA, 08032966882.',
        expected: {
          patientData: {
            PatientAgeYears: 31,
            PatientGender: 1,
            City: 'RVS (R) Yaring Alh Aminu Ibrahim`s Residence Yaring KT LGA 08032966882',
          },
        },
      },
      {
        given: 'F  34  AgegeHiv- P, 4ml',
        expected: {
          patientData: {
            PatientAgeYears: 34,
            PatientGender: 0,
            HivStatus: 1,
            City: 'Agege 4ml',
          },
        },
      },
      {
        given: 'M 10 HIV NEGATIVE SABON BARKI',
        expected: {
          patientData: {
            PatientAgeYears: 10,
            PatientGender: 1,
            HivStatus: 0,
            City: 'SABON BARKI',
          },
        },
      },
      {
        given: 'MONIYA TBLC, AGE 17, FEMALE',
        expected: {
          patientData: {
            PatientAgeYears: 17,
            PatientGender: 0,
            City: 'MONIYA TBLC',
          },
        },
      },
    ]
    cases.forEach(({ given, expected }) => {
      const partialResult = parseNotes(given)
      expect(partialResult).to.deep.equal(expected)
    })
  })
})
