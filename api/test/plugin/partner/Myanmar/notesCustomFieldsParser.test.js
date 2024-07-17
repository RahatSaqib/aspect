const { parseNotes } = require('../../../../src/plugin/partner/Myanmar/notesCustomFieldsParser')
const { expect } = require('chai')

describe('parseNotes', () => {
  it('should return the correct patientData', () => {
    const cases = [
      { given: '63,m,no,hiv-,fu,mdr,pos,', expected: { patientData: { HivStatus: 'Negative', PatientAge: 63, MMTestReason: 'fu', PatientGender: 'M', PreviousTreatmentHistory: 'No Previous Treatment' } } },
      { given: '20,f,no,hiv?,mdr,fu,pos,', expected: { patientData: { HivStatus: 'HIV Unknown', PatientAge: 20, MMTestReason: 'mdr', PatientGender: 'F', PreviousTreatmentHistory: 'No Previous Treatment' } } },
      { given: '78,m,yes,hiv-,mdr,pos,', expected: { patientData: { HivStatus: 'Negative', PatientAge: 78, MMTestReason: 'mdr', PatientGender: 'M', MicroscopyResult: 'Smear Positive', PreviousTreatmentHistory: 'Previously Treated' } } },
    ]
    cases.forEach(({ given, expected }) => {
      const partialResult = parseNotes(given)
      expect(partialResult).to.deep.equal(expected)
    })
  })

  it('should support extra values', () => {
    const given = '63,m,no,hiv-,fu,mdr,pos,extra'
    const expected = { patientData: { HivStatus: 'Negative', PatientAge: 63, MMTestReason: 'fu', PatientGender: 'M', PreviousTreatmentHistory: 'No Previous Treatment' } }
    const partialResult = parseNotes(given)
    expect(partialResult).to.deep.equal(expected)
  })

  it('should skip gibberish values', () => {
    const given = '63,m,no,hiv*,blahblahBadTestReason,mdr,pos'
    const expected = { patientData: { PatientAge: 63, PatientGender: 'M', PreviousTreatmentHistory: 'No Previous Treatment' } }
    const partialResult = parseNotes(given)
    expect(partialResult).to.deep.equal(expected)
  })
})