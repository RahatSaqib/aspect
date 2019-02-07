const chai = require('chai')

const { assert } = chai

const { getAllResultTags } = require('../../src/deviceApi/result')

const country1 = {
  tagRegexSampleId: '-([A-Z]){3}$',
  tagRegexPatientId: '-([0-9]{3})$',
  tagRegexNotes: 'Aw',
}

const country3 = {
  tagRegexSampleId: '',
  tagRegexPatientId: '',
  tagRegexNotes: '',
}
const result1 = {
  sampleId: 'AQWAQW-AQQ',
  patientData: JSON.stringify({
    id: 'AQWAQW-123',
  }),
  notes: 'AWesome Awesome, Awsome',
}

describe('This test is for results autotagging function', () => {
  it('it should return an array of matching regular expression tags', async () => {
    const tags = getAllResultTags(country1, result1)
    assert.equal(tags.length, 4)
    assert.equal(tags[0], '-AQQ')
    assert.equal(tags[1], 'Aw')
    assert.equal(tags[2], 'Aw')
    assert.equal(tags[3], '-123')

    const tag2 = getAllResultTags(country3, result1)
    assert(tag2.length === 0)
  })
})
