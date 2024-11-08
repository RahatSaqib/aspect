const { expect } = require('chai')
const { parseNotes } = require('../../../../src/plugin/partner/Nigeria/customFieldsParser')

describe('parseNotes', () => {
  it('should return the correct patientData', () => {
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
            PatientAge: 20,
            PatientGender: 'Male',
            HivStatus: 'HIV Negative',
            PatientStreet: 'B/KASUWA C/O SHEHU S FADA TBLS CLINIC GUSAU ZAMFARA STATE',
          },
        },
      },
      {
        given: 'Male, 31yrs, RVS (R), Yaring, Alh. Aminu Ibrahim`s Residence Yaring KT LGA, 08032966882.',
        expected: {
          patientData: {
            PatientAge: 31,
            PatientGender: 'Male',
            PatientStreet: 'RVS (R) Yaring Alh Aminu Ibrahim`s Residence Yaring KT LGA 08032966882',
          },
        },
      },
      {
        given: 'F  34  AgegeHiv- P, 4ml',
        expected: {
          patientData: {
            PatientAge: 34,
            PatientGender: 'Female',
            HivStatus: 'HIV Positive',
            PatientStreet: 'Agege 4ml',
          },
        },
      },
      {
        given: 'M 10 HIV NEGATIVE SABON BARKI',
        expected: {
          patientData: {
            PatientAge: 10,
            PatientGender: 'Male',
            HivStatus: 'HIV Negative',
            PatientStreet: 'SABON BARKI',
          },
        },
      },
      {
        given: 'MONIYA TBLC, AGE 17, FEMALE',
        expected: {
          patientData: {
            PatientAge: 17,
            PatientGender: 'Female',
            PatientStreet: 'MONIYA TBLC',
          },
        },
      },
      {
        given: 'Mucoid,2ml\nAge-41\nSex-F\nAddress-Ile Kusi Osuntedo\nFacility-Osuntedo HC\nSpecimen ID-OS7/10/1',
        expected: {
          patientData: {
            PatientStreet: '2ml\n-41\nSex-\nAddress-Ile Kusi Osudo\nFacility-Osudo HC\nSpecimen ID-OS7/10/1',
            PatientGender: 'Female',
          },
        },
      },
      {
        given: 'SALIVARY    SPUTUM      2ML      HIV-NEG      M      40YRS',
        expected: {
          patientData: {
            PatientAge: 40,
            PatientGender: 'Male',
            HivStatus: 'HIV Negative',
            PatientStreet: 'SALIVARY SPUTUM 2ML',
          },
        },
      },
      {
        given:
          'APP MUCOID, VOL 5MLS, AGE 49YRS, SEX MALE, RVS UNKNOWN, FACILITY TOLUWANI CLINIC AND MATERNITY HOME IJEBU IGBO, TEL NO. 09035372094.',
        expected: {
          patientData: {
            PatientAge: 49,
            PatientGender: 'Male',
            PatientStreet:
              'APP VOL 5MLS SEX RVS UNKNOWN FACILITY TOLUWANI CLINIC AND MATERNITY HOME IJEBU IGBO TEL NO 09035372094',
          },
        },
      },
      {
        given: '45YRS,F,ADD- 2 AGBEJE STR.08133413 480, HIV-UNKNOWN,VOL-2MLS,APP- MUCOPURULENT,FACILITY- PHC ITA-OSU',
        expected: {
          patientData: {
            PatientAge: 45,
            HivStatus: 'HIV Unknown',
            PatientStreet: 'FADD- 2 AGBEJE STR08133413 480 VOL-2MLSAPP- MUCOFACILITY- PHC ITA-OSU',
            PatientGender: 'Female',
          },
        },
      },
      {
        given: 'F 79YRS 25, BARKINGON STR QUARRY ROAD ABK HIV? MUCOS AIVARY S.H.I',
        expected: {
          patientData: {
            PatientAge: 79,
            PatientGender: 'Female',
            HivStatus: 'HIV Unknown',
            PatientStreet: '25 BARKINGON STR QUARRY ROAD ABK MUCOS AIVARY SHI',
          },
        },
      },
      {
        given: 'F 35YRS UNGUWAR KUDU KUSA DA IBRAHIM IBRAHIM PRIMARY SCHOOL GAMAWA HIV? DR?',
        expected: {
          patientData: {
            PatientAge: 35,
            PatientGender: 'Female',
            HivStatus: 'HIV Unknown',
            PatientStreet: 'UNGUWAR KUDU KUSA DA IBRAHIM IBRAHIM PRIMARY SCHOOL GAMAWA',
            DrSuspect: 1,
          },
        },
      },
      {
        given: '27YRS F UNGUWAR YAMMA MARANA UDUBO DISTRICT GAMAWA LGA HIV-DR',
        expected: {
          patientData: {
            PatientAge: 27,
            PatientGender: 'Female',
            HivStatus: 'HIV Negative',
            PatientStreet: 'UNGUWAR YAMMA MARANA UDUBO DISTRICT GAMAWA LGA DR',
          },
        },
      },
      {
        given: 'M, 32YRS, ASLG, HIV+, PLHIV, DR?\n199. 5ML, 08103795051, FMC IDI aBA',
        expected: {
          patientData: {
            PatientAge: 32,
            PatientGender: 'Male',
            HivStatus: 'HIV Positive',
            PatientStreet: 'ASLG \n199 5ML 08103795051 FMC IDI aBA',
            DrSuspect: 1,
          },
        },
      },
      {
        given: 'M, 35YRS, ANLG, HIV-. DR?\n243, 5ML, 08031501395, HDC iberekodo',
        expected: {
          patientData: {
            PatientAge: 35,
            PatientGender: 'Male',
            HivStatus: 'HIV Negative',
            PatientStreet: 'ANLG \n243 5ML 08031501395 HDC iberekodo',
            DrSuspect: 1,
          },
        },
      },
      {
        given: 'AGE:40YRS/M, ADDRESS:IGARRA, VOLUME:2MLS, SPUTUM:MUCOID, HIV:NEGATIVE',
        expected: {
          patientData: {
            PatientStreet: ':/ ADDRESS:IGARRA VOLUME:2MLS SPUTUM:',
            PatientAge: 40,
            HivStatus: 'HIV Negative',
            PatientGender: 'Male',
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
