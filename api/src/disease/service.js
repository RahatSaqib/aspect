const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

async function listDiseases(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const diseases = await knex('Disease as dis')
    .modify(addConstraints, dataConstraints, {
      disease: 'dis',
    })
    .select('dis.*')

  const result = {
    ok: true,
    total: diseases.length,
    length: diseases.length,
    data: diseases,
  }
  return result
}

module.exports = {
  listDiseases,
}
