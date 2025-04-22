const { partner } = require('./fixtures/partnerData')
const upsertTags = require('../common/upsert_tags')

module.exports = require('../utils').seed(async knex => {
  await upsertTags(knex, partner.externalId)

  const siteIds = await knex('Site as s')
    .leftJoin('SiteTag as st', 's.id', 'st.siteId')
    .leftJoin('Tag as t', 'st.tagId', 't.id')
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
  await knex('SiteTag').insert(siteIds.map(siteId => ({ siteId, tagId })))
}, __filename)
