const { getConstraints, addConstraints } = require('../auth/constraints')
const { getPeopleBase } = require('../shared/utilsPerson')

async function availableContacts(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const data = await getPeopleBase()
    .modify(addConstraints, dataConstraints, { geography: 'g' })
    .groupBy('p.id')
    .select('p.name', 'p.id')
  return { ok: true, data }
}

module.exports = {
  availableContacts,
}
