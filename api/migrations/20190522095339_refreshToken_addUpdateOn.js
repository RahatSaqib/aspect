module.exports = require('../src/db').migration(up, down)
const Promise = require('bluebird')

async function up(knex) {
  await knex.schema.alterTable('RefreshToken', refreshToken => {
    refreshToken.dateTime('updatedOn')
  })

  const rt = await knex('RefreshToken as r').select('r.expires', 'r.createdOn', 'r.clientType')

  await Promise.each(rt, token => {
    const updatedOn = setUpdatedOn(token.expires, token.createdOn, token.clientType)
    return knex('RefreshToken as r')
      .update({
        updatedOn,
      })
      .where('r.createdOn', token.createdOn)
  })

  function setUpdatedOn(expires, created, type = 'web') {
    const validity = type === 'web' ? 7 : 30
    const timeDiff = Math.ceil((expires.getTime() - created.getTime()) / 86400000)
    return timeDiff > validity ? new Date(expires.getTime() - validity * 86400000) : null
  }
}

async function down(knex) {
  await knex.schema.alterTable('RefreshToken', refreshToken => {
    refreshToken.dropColumn('updatedOn')
  })
}
