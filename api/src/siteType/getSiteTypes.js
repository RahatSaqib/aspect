const { getSiteTypes } = require('./common/db')

module.exports = async function () {
  const siteTypes = await getSiteTypes()

  return { ok: true, data: siteTypes }
}
