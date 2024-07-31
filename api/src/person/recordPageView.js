const Boom = require('@hapi/boom')
const { getConstraints } = require('../auth/constraints')
const { knex } = require('../db')

async function recordPageView(request) {
  const { auth } = request
  const { person } = await getConstraints(auth.credentials)
  const today = new Date().toISOString().split('T')[0]
  try {
    await knex.transaction(async trx => {
      const updatedRows = await trx('UserPageViews')
        .where({ personId: person.id, timeframe: today })
        .increment('count', 1)
      if (updatedRows === 0) {
        await trx('UserPageViews').insert({
          personId: person.id,
          timeframe: today,
          count: 1,
        })
      }
    })
  } catch (error) {
    return Boom.badRequest('Error incrementing page view')
  }

  return { ok: true }
}

module.exports = {
  recordPageView,
}
