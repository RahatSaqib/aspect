const { getNotification } = require('./common/db')

module.exports = async request => {
  const { params } = request
  const { id } = params

  return { ok: true, data: await getNotification(id) }
}
