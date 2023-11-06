const _ = require('lodash')

const { getAllNotificationHistory } = require('./db')
const { getConstraints } = require('../../auth/constraints')

const getAllHistory = async request => {
  const { auth, query } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const { getCount, getItems } = await getAllNotificationHistory(dataConstraints, query)

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const items = (data || []).map(item => ({
    ..._.omit(item, ['groupingParam']),
    data: JSON.parse(item.data),
  }))
  return { ok: true, total, data: items }
}

module.exports = { getAllHistory }
