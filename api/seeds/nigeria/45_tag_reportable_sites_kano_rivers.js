module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const _ = require('lodash')
const trainingSites = require('./fixtures/trainingSites')

async function seed(knex) {
  const { id: reportableSiteTagId } = await knex('Tag').where('title', 'Reportable Site').first('id')

  const sitesWithTag = await knex('SiteTag').where('tagId', reportableSiteTagId).whereNotNull('siteId').select('siteId')

  // get training sites in rivers that don't have the tag yet
  const trainingSitesKano = await knex('Site as s')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('State as st', 'g.stateId', 'st.id')
    .where('st.name', 'Kano')
    .whereIn(
      's.name',
      _.map(
        _.filter(trainingSites, s => s.state === 'Kano'),
        'site'
      )
    )
    .whereNotIn('s.id', _.map(sitesWithTag, 'siteId'))
    .select('s.id')

  await Promise.each(trainingSitesKano, async site =>
    knex('SiteTag').insert({
      siteId: site.id,
      tagId: reportableSiteTagId,
    })
  )

  // get training sites in kano that don't have the tag yet
  const trainingSitesRivers = await knex('Site as s')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('State as st', 'g.stateId', 'st.id')
    .where('st.name', 'Rivers')
    .whereIn(
      's.name',
      _.map(
        _.filter(trainingSites, s => s.state === 'Rivers'),
        'site'
      )
    )
    .whereNotIn('s.id', _.map(sitesWithTag, 'siteId'))
    .select('s.id')

  await Promise.each(trainingSitesRivers, async site =>
    knex('SiteTag').insert({
      siteId: site.id,
      tagId: reportableSiteTagId,
    })
  )
}
