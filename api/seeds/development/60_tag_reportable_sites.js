const Promise = require('bluebird')
const partnerData = require('./fixtures/partnerVariables')
const upsertTags = require('../common/20210712_tag_reportable_sites')

module.exports = require('../utils').seed(async knex => {
  const { partnerName } = partnerData
  await upsertTags(knex, partnerName)

  const siteIds = await knex('Site as s')
    .innerJoin('SiteTag as st', 's.id', 'st.siteId')
    .innerJoin('Tag as t', 'st.tagId', 't.id')
    .whereRaw(
      `(
        t.title     LIKE ? or
        t.title     LIKE ? or
        s.name        LIKE ? or
        s.externalId  LIKE ?
      )`,
      ['%clinic%', '%dots%', '%clinic%', '%clinic%']
    )
    .pluck('s.id')
    .distinct()
  const { id: tagId } = await knex('Tag').where('title', 'Reportable Site').first()

  // Set the 'Reportable Site' tag to reportable sites
  await Promise.each(siteIds, async siteId => knex('SiteTag').insert({ siteId, tagId }))
}, __filename)
