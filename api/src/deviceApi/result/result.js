const _ = require('lodash')

const getTags = (regExp, field) => {
  const re = new RegExp(regExp, 'g')
  return field && field !== '' ? field.toString().match(re) : []
}

async function resultAutoTagging(knex, result) {
  const country = await getCountryByDeviceId(knex, result.deviceId)

  // taggingResults is array of strings ['']
  const taggingResults = getAllResultTags(country, result)
  // existingTags is array [{ id: number, title: 'string' }]
  const existingTags = await getExistingTagByPartner(knex, result.partnerId, taggingResults, result.id)

  const tagsToBeAdded = _.uniqBy(_.filter(taggingResults, tag => !includesIgnoreCase(existingTags, tag)))

  const tagsToBeUpdated = _.uniqBy(
    _.filter(existingTags, tag =>
      includesIgnoreCase(
        taggingResults.map(title => ({ title })),
        tag.title
      )
    )
  )

  _.map(tagsToBeAdded, async tag => {
    const [tagId] = await knex('Tag').insert({
      title: tag,
      partnerId: result.partnerId,
    })
    await knex('ResultTag').insert({
      tagId,
      resultId: result.id,
    })
  })
  _.map(tagsToBeUpdated, async elem => {
    await knex('ResultTag').insert({
      tagId: elem.id,
      resultId: result.id,
    })
  })
}

function includesIgnoreCase(collection, value) {
  return _.some(collection, item => item.title.toLowerCase() === value.toLowerCase())
}

async function getCountryByDeviceId(knex, deviceId) {
  return knex('Device as d')
    .join('Site as s', 'd.siteId', 's.id')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('d.id', deviceId)
    .first()
}

function getAllResultTags(country, result) {
  let taggingResults = []
  let res = []
  if (country) {
    if (country.tagRegexSampleId && country.tagRegexSampleId !== '') {
      res = getTags(country.tagRegexSampleId, result.sampleId)

      if (res) taggingResults = taggingResults.concat(res)
    }

    if (country.tagRegexNotes && country.tagRegexNotes !== '') {
      res = getTags(country.tagRegexNotes, result.notes)
      if (res) taggingResults = taggingResults.concat(res)
    }
    const patientData = JSON.parse(result.patientData)
    if (patientData && country.tagRegexPatientId && country.tagRegexPatientId !== '') {
      res = getTags(country.tagRegexPatientId, patientData.id)
      if (res) taggingResults = taggingResults.concat(res)
    }
  }
  return _.uniqBy(taggingResults)
}

async function getExistingTagByPartner(knex, partnerId, taggingResults, resultId) {
  return knex('Tag as t')
    .join('ResultTag as rt', 't.id', 'rt.tagId')
    .select('t.id', 't.title')
    .distinct('t.id', 't.title')
    .where('t.partnerId', partnerId)
    .whereNot('rt.resultId', resultId)
    .whereIn('t.title', taggingResults)
}

module.exports = {
  resultAutoTagging,
  getAllResultTags,
}
