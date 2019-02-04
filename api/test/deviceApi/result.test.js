const chai = require('chai')

const { assert } = chai

const {
  getAllResultTags,
  getCountryByDeviceId,
  resolveAutoTagging,
  getExistingTagByPartner,
} = require('../../src/deviceApi/result')

const { query } = require('../../src/db')

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
  before(async () => {
    await query()('ResultTag').del()
    await query()('Tag').del()
  })
  after(async () => {
    await query()('ResultTag').del()
    await query()('Tag').del()
  })
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

  it('it should return a country by deviceId', async () => {
    const knex = query()
    const country = await getCountryByDeviceId(knex, 1)
    assert.equal(country.abbreviation, 'US')
  })

  it('it should save tags for a result', async () => {
    const knex = query()
    const result = await knex('Result')
      .select('*')
      .where('id', 1)
      .first()

    await resolveAutoTagging(knex, result)

    // const tags = await getExistingTagByPartner(knex, result.partnerId)
    // assert(tags.length >= 1)

    const result2 = await knex('Result')
      .select('*')
      .where('id', 2)
      .first()

    await resolveAutoTagging(knex, result2)

    const tags2 = await getExistingTagByPartner(knex, result.partnerId)

    assert.equal(tags2.length, 2)
  })
})
