const { expect } = require('chai')
const { parseNotes, parsePatientId } = require('../../../../src/plugin/partner/Myanmar/customFieldsParser')

describe('parseNotes', () => {
  it('should return the correct patientData', () => {
    const cases = [
      {
        given: '63,m,no,hiv-,fu,mdr,nd,',
        expected: {
          patientData: {
            HivStatus: 'Negative',
            PatientAge: 63,
            MMTestReason: 'fu,mdr',
            PatientGender: 'Male',
            MicroscopyResult: 'Not Done',
            PreviousTreatmentHistory: 'No Previous Treatment',
          },
        },
      },
      {
        given: '20,f,no,hiv?,mdr,fu,neg,',
        expected: {
          patientData: {
            HivStatus: 'HIV Unknown',
            PatientAge: 20,
            MMTestReason: 'mdr,fu',
            PatientGender: 'Female',
            MicroscopyResult: 'Smear Negative',
            PreviousTreatmentHistory: 'No Previous Treatment',
          },
        },
      },
      {
        given: '78,m,yes,hiv-,mdr,pos,',
        expected: {
          patientData: {
            HivStatus: 'Negative',
            PatientAge: 78,
            MMTestReason: 'mdr',
            PatientGender: 'Male',
            MicroscopyResult: 'Smear Positive',
            PreviousTreatmentHistory: 'Previously Treated',
          },
        },
      },
    ]
    cases.forEach(({ given, expected }) => {
      const partialResult = parseNotes(given)
      expect(partialResult).to.deep.equal(expected)
    })
  })

  it('should support edge case (observation between () for previous treatment and parenthesis in specimen)', () => {
    const given = '21,F,Yes(relapse),HIV?,Dx,Neg,(CSF),'
    const expected = {
      patientData: {
        HivStatus: 'HIV Unknown',
        PatientAge: 21,
        MMTestReason: 'dx',
        PatientGender: 'Female',
        SampleType: 'CSF',
        PreviousTreatmentHistory: 'Previously Treated',
        MicroscopyResult: 'Smear Negative',
      },
    }
    const partialResult = parseNotes(given)
    expect(partialResult).to.deep.equal(expected)
  })

  it('should skip gibberish values', () => {
    const given = '63,m,no,blahblah--BadHIV,fu,mdr,pos'
    const expected = {
      patientData: {
        PatientAge: 63,
        PatientGender: 'Male',
        PreviousTreatmentHistory: 'No Previous Treatment',
        MMTestReason: 'fu,mdr', // The reasons don't support non-exact matches, as we need to limit the lookup to the first comma to prevent match false positives at the end of the text (like in the name the users use to put at the end)
        MicroscopyResult: 'Smear Positive',
      },
    }
    const partialResult = parseNotes(given)
    expect(partialResult).to.deep.equal(expected)
  })

  it('should accept double reason values, and concatenate them with ","', () => {
    const given = '63,m,no,hiv-,fu,mdr,pos'
    const expected = {
      patientData: {
        HivStatus: 'Negative',
        PatientAge: 63,
        PatientGender: 'Male',
        PreviousTreatmentHistory: 'No Previous Treatment',
        MMTestReason: 'fu,mdr',
        MicroscopyResult: 'Smear Positive',
      },
    }
    const partialResult = parseNotes(given)
    expect(partialResult).to.deep.equal(expected)
  })

  it('should accept values without separator', () => {
    const given = '63,m,no,hiv-fu,mdr,pos'
    const expected = {
      patientData: {
        HivStatus: 'Negative',
        PatientAge: 63,
        PatientGender: 'Male',
        PreviousTreatmentHistory: 'No Previous Treatment',
        MMTestReason: 'fu,mdr',
        MicroscopyResult: 'Smear Positive',
      },
    }
    const partialResult = parseNotes(given)
    expect(partialResult).to.deep.equal(expected)
  })
})

describe('parsePatientId', () => {
  it('should parse a normal case without spaces', () => {
    const given = 'Ni Ni Win,Ahlone'
    const expected = {
      patientData: {
        id: 'Ni Ni Win',
        PatientTownship: 'Ahlone',
      },
    }
    const partialResult = parsePatientId(given)
    expect(partialResult).to.deep.equal(expected)
  })

  it('should parse a normal case with spaces', () => {
    const given = 'Ni Ni Win , Ahlone'
    const expected = {
      patientData: {
        id: 'Ni Ni Win',
        PatientTownship: 'Ahlone',
      },
    }
    const partialResult = parsePatientId(given)
    expect(partialResult).to.deep.equal(expected)
  })

  it('should parse a normal case with other symbols', () => {
    const given = 'Hla Oo,Phoe Htaung(HKH-000200)'
    const expected = {
      patientData: {
        id: 'Hla Oo',
        PatientTownship: 'Phoe Htaung(HKH-000200)',
      },
    }
    const partialResult = parsePatientId(given)
    expect(partialResult).to.deep.equal(expected)
  })

  it('should parse an inconsistent case like GxAlert does', () => {
    const given = 'Moe Thandar Oo , (Daw) , 51 , F'
    const expected = {
      patientData: {
        id: 'Moe Thandar Oo',
        PatientTownship: '(Daw) , 51 , F',
      },
    }
    const partialResult = parsePatientId(given)
    expect(partialResult).to.deep.equal(expected)
  })
})
