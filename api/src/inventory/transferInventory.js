const Boom = require('@hapi/boom')
const { transferInventory } = require('./common/logic')
const { getSite } = require('../site/service')
const { getConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')

module.exports = async function (request) {
  const {
    auth,
    plugins: { messageContext },
    payload,
  } = request
  const { fromSiteId, toSiteId } = payload

  // Get from/to sites and return error if lack of permissions
  const dataConstraints = await getConstraints(auth.credentials)
  const toSite = await getSite(toSiteId, dataConstraints)
  if (!toSite) {
    return Boom.forbidden('You are not permitted to transfer inventory to this site')
  }
  const fromSite = await getSite(fromSiteId, dataConstraints)
  if (!fromSite) {
    return Boom.forbidden('You are not permitted to transfer inventory from this site')
  }

  const { partnerId, userId } = await getUser(auth.credentials.name)

  const res = await transferInventory({ payload, partnerId, userId, messageContext })
  if (Boom.isBoom(res)) return res
  return {
    ok: true,
    data: res, // see corresponding handler func for details about it's response
  }
}
