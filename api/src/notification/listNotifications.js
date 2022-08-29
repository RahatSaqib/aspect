const { getListNotifications } = require('./common/db')

module.exports = async function listNotifications(request) {
  const { query, auth } = request
  return getListNotifications(query, auth.credentials)
}
