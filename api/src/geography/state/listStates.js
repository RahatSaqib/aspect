const { getConstraints, addConstraints } = require('../../auth/constraints')
const { knex, sortPageParams, filterParams } = require('../../db')

const getAssociatedDeviceApiKeyCount = dataConstraints =>
  knex(`DeviceApiKey as t`)
    .join('Geography as g', 't.geographyId', 'g.id')
    .leftJoin('Site as si', 't.siteId', 'si.id')
    .leftJoin('Device as d', 't.deviceId', 'd.id')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      geography: 'g',
      site: 'si',
    })
    .where('stateId', knex.ref('s.id'))
    .count()
    .clone()

const getAssociatedDataCount = table =>
  knex(`${table} as t`)
    .join('Geography as g', 't.geographyId', 'g.id')
    .where('stateId', knex.ref('s.id'))
    .count()
    .clone()

async function listStates({ auth, query }) {
  const dataConstraints = await getConstraints(auth.credentials)

  const stateQuery = knex('Geography as g')
    .join('Country as c', 'g.countryId', 'c.id')
    .join('State as s', 'g.stateId', 's.id')
    .modify(filterParams, query, {
      stateId: 's.id',
    })
    .modify(addConstraints, dataConstraints, { country: 'c', state: 's' })
    .whereNull('lgaId')

  const getItems = stateQuery
    .clone()
    .modify(sortPageParams, query, 'name', { name: 's.name' })
    .select({
      id: 's.id',
      name: 's.name',
      abbreviation: 's.abbreviation',
      siteCount: getAssociatedDataCount('Site').where('t.disabled', 0),
      issueCount: getAssociatedDataCount('Issue'),
      deviceApiKeyCount: getAssociatedDeviceApiKeyCount(dataConstraints),
      personCount: getAssociatedDataCount('Person'),
      jobContextCount: getAssociatedDataCount('JobContext'),
      lgaCount: knex('Lga as l').join('Geography as g', 'l.id', 'g.lgaId').where('g.stateId', knex.ref('s.id')).count(),
      notificationCount: knex('NotificationType as nt')
        .where(knex.raw('nt.filterCondition ->> "$.deviceLevelId"'), 'state')
        .whereRaw(`${knex.ref('s.id')} MEMBER OF(nt.filterCondition ->> "$.areaItems[*].value")`)
        .count(),
    })

  const isDeletionDisabled = i =>
    i.siteCount > 0 ||
    i.issueCount > 0 ||
    i.deviceApiKeyCount > 0 ||
    i.personCount > 0 ||
    i.jobContextCount > 0 ||
    i.lgaCount > 0 ||
    i.notificationCount > 0

  const getCount = stateQuery.clone().count('s.id as count').first()
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { ok: true, total, length: data.length, data: data.map(i => ({ ...i, cannotDelete: isDeletionDisabled(i) })) }
}

module.exports = { listStates }
