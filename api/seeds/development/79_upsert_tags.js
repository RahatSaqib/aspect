async function seed(knex) {
  await knex('Tag').insert({ title: 'PMDT', partnerId: '1' }).onConflict('title').ignore()

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

  const { id: tagId } = await knex('Tag').where('title', 'PMDT').first()

  // Set the 'PMDT' tag to reportable sites
  await knex('SiteTag').insert(siteIds.map(siteId => ({ siteId, tagId })))
}

module.exports = require('../utils').seed(seed, __filename)
