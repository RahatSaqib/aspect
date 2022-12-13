const { getNotification } = require('./common/db')

module.exports = async request => {
  const { params } = request
  const { id } = params

  const data = await getNotification(id)

  return { ok: true, data }
}
