const _ = require('lodash')

async function onGxAlertAuthenticated({
  gxUser: { tags = [] },
  partnerId,
  personId,
  knex,
}) {
  if (_.some(tags, tag => tag.indexOf('EID+') > -1)) {
    const eidPositiveTagForPerson = await knex('Tag as t')
      .leftJoin('PersonTag as pt', function() {
        this.on('t.id', 'pt.tagId').andOn('pt.personId', knex.raw(personId))
      })
      .where({
        't.title': 'EID+',
        't.partnerId': partnerId,
      })
      .first('t.id', 'pt.personId')
    if (!eidPositiveTagForPerson.personId) {
      await knex('PersonTag').insert({
        personId,
        tagId: eidPositiveTagForPerson.id,
      })
    }
  }
  if (_.some(tags, tag => tag.indexOf('VL>50') > -1)) {
    const hivVlPositiveTagForPerson = await knex('Tag as t')
      .leftJoin('PersonTag as pt', function() {
        this.on('t.id', 'pt.tagId').andOn('pt.personId', knex.raw(personId))
      })
      .where({
        't.title': 'HIV-VL>50',
        't.partnerId': partnerId,
      })
      .first('t.id', 'pt.personId')
    if (!hivVlPositiveTagForPerson.personId) {
      await knex('PersonTag').insert({
        personId,
        tagId: hivVlPositiveTagForPerson.id,
      })
    }
  }
}

module.exports = onGxAlertAuthenticated
