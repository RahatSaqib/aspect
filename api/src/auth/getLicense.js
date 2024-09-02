const { knex } = require('../db')

async function getLicense(request) {
  const {
    query: { licenseId },
  } = request

  const license = await knex('License').where('id', licenseId).first('id', 'createdOn', 'content')

  return { ok: true, data: license }
}

module.exports = {
  getLicense,
}
