const _ = require('lodash')

const { getNotificationHistory } = require('./db')
const { getConstraints } = require('../../auth/constraints')

module.exports = async request => {
  const { auth, query, params } = request
  const { notificationTypeId } = params

  const dataConstraints = await getConstraints(auth.credentials)

  const { getItems, getCount } = await getNotificationHistory(notificationTypeId, dataConstraints, query)

  const [{ total }, data] = await Promise.all([getCount, getItems])

  const items = (data || []).map(item => ({
    ..._.omit(item, ['groupingParam']),
    emailRecipients: item.emailRecipients ? item.emailRecipients.split('|') : null,
    smsRecipients: item.smsRecipients ? item.smsRecipients.split('|') : null,
  }))
  return { ok: true, total, data: items }
}
